// FE2-05/08a: Prenos izmedju racuna sa confirm step-om i provizijom

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { currencyService } from '@/services/currencyService';
import { transactionService } from '@/services/transactionService';
import type { Account } from '@/types/celina2';
import { transferSchema, type TransferFormData } from '@/utils/validationSchemas.celina2';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, ArrowRight, Wallet, ArrowDown, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import VerificationModal from '@/components/shared/VerificationModal';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toLocaleString('sr-RS', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : (0).toFixed(decimals);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  ) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
}

function AccountCard({ account, label, className = '' }: { account: Account | undefined; label: string; className?: string }) {
  if (!account) {
    return (
      <div className={`rounded-2xl border-2 border-dashed border-muted p-6 text-center ${className}`}>
        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted mb-3">
          <Wallet className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">Izaberite racun</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border bg-card p-6 shadow-sm ${className}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm font-mono text-muted-foreground">{account.accountNumber}</p>
      <p className="text-sm text-muted-foreground mt-1">{account.name || account.accountType}</p>
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-muted-foreground">Raspolozivo</p>
        <p className="text-xl font-bold font-mono tabular-nums text-foreground">
          {formatAmount(account.availableBalance)}
          <span className="text-sm text-muted-foreground ml-2">{account.currency}</span>
        </p>
      </div>
    </div>
  );
}

export default function TransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedFrom = searchParams.get('from') || '';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmStep, setShowConfirmStep] = useState(false);
  const [submittedData, setSubmittedData] = useState<TransferFormData | null>(null);

  const [showVerification, setShowVerification] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);

  const [exchangePreview, setExchangePreview] = useState<{
    rate: number;
    convertedAmount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountNumber: preselectedFrom,
      toAccountNumber: '',
      amount: 0,
    },
  });

  useEffect(() => {
    let mounted = true;

    const loadAccounts = async () => {
      setIsLoading(true);

      try {
        const data = await accountService.getMyAccounts();

        if (!mounted) return;

        const safeAccounts = asArray<Account>(data);
        setAccounts(safeAccounts);

        if (safeAccounts.length === 0) {
          toast.error('Nemate dostupnih racuna za prenos.');
          return;
        }

        const hasPreselected = safeAccounts.some(
          (account) => account.accountNumber === preselectedFrom
        );

        const initialFrom =
          preselectedFrom && hasPreselected ? preselectedFrom : safeAccounts[0].accountNumber;

        reset({
          fromAccountNumber: initialFrom,
          toAccountNumber: '',
          amount: 0,
        });
      } catch (error) {
        if (!mounted) return;

        toast.error(getErrorMessage(error, 'Neuspesno ucitavanje racuna.'));
        setAccounts([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAccounts();

    return () => {
      mounted = false;
    };
  }, [preselectedFrom, reset]);

  const fromAccount = watch('fromAccountNumber');
  const toAccount = watch('toAccountNumber');
  const amount = watch('amount') || 0;

  const safeAccounts = useMemo(() => asArray<Account>(accounts), [accounts]);

  const fromAccountData = useMemo(
    () => safeAccounts.find((account) => account.accountNumber === fromAccount),
    [safeAccounts, fromAccount]
  );

  const toAccountOptions = useMemo(
    () => safeAccounts.filter((account) => account.accountNumber !== fromAccount),
    [safeAccounts, fromAccount]
  );

  const toAccountData = useMemo(
    () => toAccountOptions.find((account) => account.accountNumber === toAccount),
    [toAccountOptions, toAccount]
  );

  useEffect(() => {
    if (toAccount && toAccount === fromAccount) {
      setValue('toAccountNumber', '');
    }
  }, [fromAccount, toAccount, setValue]);

  useEffect(() => {
    let cancelled = false;

    if (!fromAccountData || !toAccountData || !amount || amount <= 0) {
      setExchangePreview(null);
      return;
    }

    if (fromAccountData.currency === toAccountData.currency) {
      setExchangePreview(null);
      return;
    }

    const loadRate = async () => {
      try {
        const result = await currencyService.convert({
          fromCurrency: fromAccountData.currency,
          toCurrency: toAccountData.currency,
          amount,
        });

        if (cancelled) return;

        setExchangePreview({
          rate: result.exchangeRate,
          convertedAmount: result.convertedAmount,
        });
      } catch {
        if (cancelled) return;
        setExchangePreview(null);
      }
    };

    loadRate();

    return () => {
      cancelled = true;
    };
  }, [amount, fromAccountData, toAccountData]);

  const insufficientFunds = useMemo(() => {
    if (!fromAccountData) return false;
    return amount > 0 && Number(fromAccountData.availableBalance ?? 0) < Number(amount);
  }, [fromAccountData, amount]);

  const commission = useMemo(() => {
    if (!amount || amount <= 0) return 0;
    if (fromAccountData?.currency === toAccountData?.currency) return 0;
    return amount * 0.005;
  }, [amount, fromAccountData, toAccountData]);

  const totalDebit = useMemo(() => {
    return amount > 0 ? amount + commission : 0;
  }, [amount, commission]);

  const isFx = fromAccountData && toAccountData && fromAccountData.currency !== toAccountData.currency;

  const onSubmit = async (data: TransferFormData) => {
    if (!fromAccountData) {
      toast.error('Izaberite racun posiljaoca.');
      return;
    }

    if (!toAccountData) {
      toast.error('Izaberite racun primaoca.');
      return;
    }

    if (data.fromAccountNumber === data.toAccountNumber) {
      toast.error('Racun posiljaoca i primaoca ne mogu biti isti.');
      return;
    }

    if (Number(data.amount) <= 0) {
      toast.error('Iznos mora biti veci od nule.');
      return;
    }

    if (insufficientFunds) {
      toast.error('Nemate dovoljno raspolozivih sredstava na izabranom racunu.');
      return;
    }

    setSubmittedData(data);
    setShowConfirmStep(true);
  };

  const handleConfirmTransfer = async () => {
    if (!submittedData) return;

    setIsSubmitting(true);

    try {
      const result = await transactionService.createTransfer({
        fromAccountNumber: submittedData.fromAccountNumber,
        toAccountNumber: submittedData.toAccountNumber,
        amount: Number(submittedData.amount),
      });

      const txId = (result as unknown as { id?: number })?.id;
      if (txId) {
        setPendingTransactionId(txId);
        setShowVerification(true);
        toast.info('Prenos je kreiran. Potrebna je verifikacija.');
      } else {
        setShowConfirmStep(false);
        toast.success('Prenos je uspesno izvrsen!');
        navigate('/accounts');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Kreiranje prenosa nije uspelo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prenos izmedju racuna</h1>
          <p className="text-sm text-muted-foreground">Prenesite sredstva izmedju vasih racuna brzo i sigurno.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 rounded-2xl bg-muted animate-pulse" />
            <div className="h-40 rounded-2xl bg-muted animate-pulse" />
          </div>
          <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          <div className="h-14 rounded-2xl bg-muted animate-pulse" />
        </div>
      ) : safeAccounts.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Wallet className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nema dostupnih racuna</h3>
              <p className="mt-1 text-sm text-muted-foreground">Nemate dostupnih racuna za prenos.</p>
            </div>
          </CardContent>
        </Card>
      ) : showConfirmStep && submittedData && fromAccountData && toAccountData ? (
        /* Confirmation step */
        <div className="space-y-6">
          {/* Visual flow: FROM -> TO */}
          <div className="grid gap-4 md:grid-cols-2 relative">
            <AccountCard account={fromAccountData} label="Sa racuna" className="border-red-200 dark:border-red-900/50" />
            <AccountCard account={toAccountData} label="Na racun" className="border-emerald-200 dark:border-emerald-900/50" />
            {/* Arrow between */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg z-10">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div className="md:hidden flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg">
                <ArrowDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Transfer summary */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-600/10" />
            <CardContent className="relative pt-8 pb-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Iznos prenosa</p>
                <p className="text-4xl font-bold font-mono tabular-nums">
                  {formatAmount(submittedData.amount)}
                  <span className="text-xl text-slate-400 ml-3">{fromAccountData.currency}</span>
                </p>
              </div>

              {exchangePreview && (
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm text-slate-300">
                      1 {fromAccountData.currency} = {formatAmount(exchangePreview.rate, 4)} {toAccountData.currency}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 text-center">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Konvertovano</p>
                      <p className="font-mono tabular-nums font-semibold text-emerald-400">{formatAmount(exchangePreview.convertedAmount)} {toAccountData.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Provizija (0.5%)</p>
                      <p className="font-mono tabular-nums font-semibold text-orange-400">{formatAmount(commission)} {fromAccountData.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Ukupno zaducenje</p>
                      <p className="font-mono tabular-nums font-semibold">{formatAmount(totalDebit)} {fromAccountData.currency}</p>
                    </div>
                  </div>
                </div>
              )}

              {!exchangePreview && (
                <div className="text-center pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm">Prenos bez konverzije - ista valuta</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmStep(false)}
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl text-base"
            >
              Nazad
            </Button>
            <Button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl text-base bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all duration-200"
            >
              {isSubmitting ? 'Kreiranje...' : (
                <span className="flex items-center gap-2">
                  Potvrdi transfer
                  <CheckCircle2 className="h-5 w-5" />
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Form step */
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Visual account cards */}
          <div className="grid gap-4 md:grid-cols-2 relative">
            <AccountCard account={fromAccountData} label="Sa racuna" />
            <AccountCard account={toAccountData} label="Na racun" />
            {/* Arrow between */}
            {fromAccountData && toAccountData && (
              <>
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg z-10 animate-pulse">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="md:hidden flex justify-center -mt-2 -mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg animate-pulse">
                    <ArrowDown className="h-5 w-5" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Account selectors */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromAccount">Racun posiljaoca</Label>
              <select
                id="fromAccount"
                title="Racun posiljaoca"
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                {...register('fromAccountNumber')}
                disabled={isSubmitting}
              >
                <option value="">Izaberite racun</option>
                {safeAccounts.map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    {account.accountNumber} | {formatAmount(account.availableBalance)} {account.currency}
                  </option>
                ))}
              </select>
              {errors.fromAccountNumber && (
                <p className="text-sm text-destructive">{errors.fromAccountNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAccount">Racun primaoca</Label>
              <select
                id="toAccount"
                title="Racun primaoca"
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                {...register('toAccountNumber')}
                disabled={isSubmitting}
              >
                <option value="">Izaberite racun</option>
                {toAccountOptions.map((account) => (
                  <option key={account.id} value={account.accountNumber}>
                    {account.accountNumber} | {formatAmount(account.availableBalance)} {account.currency}
                  </option>
                ))}
              </select>
              {errors.toAccountNumber && (
                <p className="text-sm text-destructive">{errors.toAccountNumber.message}</p>
              )}
            </div>
          </div>

          {/* Amount - large centered input */}
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Iznos prenosa</p>
                <div className="flex items-center justify-center gap-3">
                  <input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-48 text-center text-3xl font-bold font-mono bg-transparent border-0 border-b-2 border-input focus:border-indigo-500 focus:outline-none transition-colors py-2"
                    {...register('amount', { valueAsNumber: true })}
                    disabled={isSubmitting}
                    placeholder="0.00"
                  />
                  <span className="text-xl text-muted-foreground font-medium">
                    {fromAccountData?.currency || 'RSD'}
                  </span>
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
                {insufficientFunds && (
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">Nemate dovoljno raspolozivih sredstava.</p>
                  </div>
                )}
                {fromAccountData && (
                  <p className="text-xs text-muted-foreground">
                    Raspolozivo: <span className="font-mono tabular-nums">{formatAmount(fromAccountData.availableBalance)} {fromAccountData.currency}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FX Preview */}
          {isFx && exchangePreview && fromAccountData && toAccountData && (
            <Card className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                    <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-base">Konverzija valuta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4 py-2">
                  <span className="text-lg font-bold font-mono">1 {fromAccountData.currency}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">{formatAmount(exchangePreview.rate, 4)} {toAccountData.currency}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-background p-3 text-center">
                    <p className="text-xs text-muted-foreground">Konvertovano</p>
                    <p className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{formatAmount(exchangePreview.convertedAmount)} {toAccountData.currency}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 text-center">
                    <p className="text-xs text-muted-foreground">Provizija (0.5%)</p>
                    <p className="font-mono tabular-nums font-semibold text-orange-600 dark:text-orange-400">{formatAmount(commission)} {fromAccountData.currency}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 text-center">
                    <p className="text-xs text-muted-foreground">Ukupno zaducenje</p>
                    <p className="font-mono tabular-nums font-bold">{formatAmount(totalDebit)} {fromAccountData.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Same-currency info */}
          {fromAccountData && toAccountData && fromAccountData.currency === toAccountData.currency && amount > 0 && (
            <div className="rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Prenos bez konverzije</span>
              </div>
              <p className="text-2xl font-bold font-mono tabular-nums mt-2">{formatAmount(amount)} {fromAccountData.currency}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full h-14 rounded-2xl text-base bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
          >
            {isSubmitting ? 'Kreiranje...' : (
              <span className="flex items-center gap-2">
                Nastavi na potvrdu
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
        </form>
      )}

      <VerificationModal
        transactionId={pendingTransactionId}
        isOpen={showVerification}
        onClose={() => {
          setShowVerification(false);
          setPendingTransactionId(null);
        }}
        onSuccess={() => {
          setShowVerification(false);
          setPendingTransactionId(null);
          setShowConfirmStep(false);
          toast.success('Prenos je uspesno verifikovan!');
          navigate('/accounts');
        }}
      />
    </div>
  );
}
