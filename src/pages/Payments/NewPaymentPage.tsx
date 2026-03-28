//
// Ova stranica sadrzi formu za kreiranje novog platnog naloga.
// - react-hook-form + zodResolver(newPaymentSchema)
// - Polja: racun posiljaoca (dropdown mojih racuna), racun primaoca, ime primaoca,
//   iznos, sifra placanja, svrha placanja, model, poziv na broj, referentni broj
// - Mogucnost biranja primaoca iz liste sacuvanih (paymentRecipientService.getAll)
// - Nakon submit => transactionService.createPayment()
// - Otvara VerificationModal za OTP potvrdu
// - Spec: "Novi platni nalog" stranica iz Celine 2

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { paymentRecipientService } from '@/services/paymentRecipientService';
import { transactionService } from '@/services/transactionService';
import type { Account, PaymentRecipient } from '@/types/celina2';
import { newPaymentSchema, type NewPaymentFormData } from '@/utils/validationSchemas.celina2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VerificationModal from '@/components/shared/VerificationModal';
import { SendHorizonal, Wallet, ArrowRight, CheckCircle2, CreditCard, User, FileText } from 'lucide-react';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toLocaleString('sr-RS', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : (0).toFixed(decimals);
}

export default function NewPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAccount = searchParams.get('from') || '';
  const preselectedToAccount = searchParams.get('to') || '';
  const preselectedRecipient = searchParams.get('recipient') || '';
  const preselectedAmount = searchParams.get('amount') || '';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<NewPaymentFormData>({
    resolver: zodResolver(newPaymentSchema),
    mode: 'onChange',
    defaultValues: {
      fromAccountNumber: preselectedAccount,
      toAccountNumber: preselectedToAccount,
      amount: preselectedAmount ? Number(preselectedAmount) : 0,
      recipientName: preselectedRecipient,
      paymentCode: '289',
      paymentPurpose: '',
      model: '',
      callNumber: '',
      referenceNumber: '',
    },
  });

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [myAccounts, savedRecipients] = await Promise.all([
          accountService.getMyAccounts(),
          paymentRecipientService.getAll(),
        ]);

        if (!mounted) return;
        const safeAccounts = asArray<Account>(myAccounts);
        const safeRecipients = asArray<PaymentRecipient>(savedRecipients);

        setAccounts(safeAccounts);
        setRecipients(safeRecipients);

        if (!preselectedAccount && safeAccounts.length > 0) {
          setValue('fromAccountNumber', safeAccounts[0].accountNumber);
        }
      } catch {
        if (!mounted) return;
        toast.error('Neuspesno ucitavanje racuna ili primalaca.');
        setAccounts([]);
        setRecipients([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [preselectedAccount, setValue]);

  const selectedRecipientAccount = watch('toAccountNumber');

  useEffect(() => {
    if (!selectedRecipientAccount) return;
    const selectedRecipient = asArray<PaymentRecipient>(recipients).find((r) => r.accountNumber === selectedRecipientAccount);
    if (selectedRecipient) {
      setValue('recipientName', selectedRecipient.name, { shouldValidate: true });
    }
  }, [recipients, selectedRecipientAccount, setValue]);

  const accountLookup = useMemo(() => {
    const map = new Map<string, Account>();
    asArray<Account>(accounts).forEach((account) => map.set(account.accountNumber, account));
    return map;
  }, [accounts]);

  const onSubmit = async (data: NewPaymentFormData) => {
    setIsSubmitting(true);
    try {
      const result = await transactionService.createPayment({
        fromAccountNumber: data.fromAccountNumber,
        toAccountNumber: data.toAccountNumber,
        amount: data.amount,
        recipientName: data.recipientName,
        paymentCode: data.paymentCode,
        paymentPurpose: data.paymentPurpose,
        model: data.model || undefined,
        callNumber: data.callNumber || undefined,
        referenceNumber: data.referenceNumber || undefined,
      });

      setPendingTransactionId(result.id);
      setShowVerification(true);
      toast.info('Placanje je kreirano. Potrebna je verifikacija.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Kreiranje placanja nije uspelo.';
      toast.error(msg);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFrom = watch('fromAccountNumber');
  const watchedAmount = watch('amount');
  const watchedRecipientName = watch('recipientName');
  const watchedToAccount = watch('toAccountNumber');
  const watchedPurpose = watch('paymentPurpose');
  const fromAccountData = accountLookup.get(selectedFrom);
  const fromAccountCurrency = fromAccountData?.currency;

  // Live preview card
  const previewCard = (
    <Card className="rounded-2xl border-0 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-2xl sticky top-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-600/10" />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-300">Pregled naloga</CardTitle>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-500 ${isValid && watchedAmount > 0 ? 'bg-emerald-500 scale-100' : 'bg-slate-700 scale-90'}`}>
            <CheckCircle2 className={`h-5 w-5 transition-all duration-500 ${isValid && watchedAmount > 0 ? 'text-white' : 'text-slate-500'}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6 pb-8">
        {/* From account */}
        <div className="space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Od racuna</p>
          <p className="text-sm font-mono text-slate-200">{selectedFrom || '---'}</p>
          {fromAccountData && (
            <p className="text-xs text-slate-400">
              Stanje: <span className="font-mono text-emerald-400">{formatAmount(fromAccountData.availableBalance)} {fromAccountData.currency}</span>
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
            <ArrowRight className="h-4 w-4 text-indigo-400" />
          </div>
        </div>

        {/* To account */}
        <div className="space-y-1">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Za primaoca</p>
          <p className="text-sm font-semibold text-slate-200">{watchedRecipientName || '---'}</p>
          <p className="text-sm font-mono text-slate-400">{watchedToAccount || '---'}</p>
        </div>

        {/* Amount */}
        <div className="space-y-1 pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Iznos</p>
          <p className="text-3xl font-bold font-mono tabular-nums tracking-tight">
            {watchedAmount > 0 ? formatAmount(watchedAmount) : '0,00'}
            <span className="text-lg text-slate-400 ml-2">{fromAccountCurrency || 'RSD'}</span>
          </p>
        </div>

        {/* Purpose */}
        {watchedPurpose && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Svrha</p>
            <p className="text-sm text-slate-300 line-clamp-2">{watchedPurpose}</p>
          </div>
        )}

        {/* Total */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Ukupno</span>
            <span className="text-xl font-bold font-mono tabular-nums">
              {watchedAmount > 0 ? formatAmount(watchedAmount) : '0,00'} {fromAccountCurrency || 'RSD'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <SendHorizonal className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novi platni nalog</h1>
          <p className="text-sm text-muted-foreground">Popunite podatke za kreiranje novog platnog naloga.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            {[1,2,3].map(i => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="pt-6 space-y-4">
                  <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
                  <div className="h-12 w-full rounded-xl bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Left column: Form */}
            <div className="lg:col-span-3 space-y-6">

              {/* Section 1: From Account */}
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                      <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-base">Od racuna</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromAccount">Racun platioca</Label>
                    <select
                      id="fromAccount"
                      title="Racun platioca"
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      {...register('fromAccountNumber')}
                    >
                      <option value="">Izaberite racun</option>
                      {asArray<Account>(accounts).map((account) => (
                        <option key={account.id} value={account.accountNumber}>
                          {account.name || account.accountType} | {account.accountNumber} | {formatAmount(account.availableBalance)}{' '}
                          {account.currency}
                        </option>
                      ))}
                    </select>
                    {errors.fromAccountNumber && (
                      <p className="text-sm text-destructive">{errors.fromAccountNumber.message}</p>
                    )}
                  </div>
                  {fromAccountData && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                          <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Raspolozivo stanje</p>
                          <p className="font-bold text-lg font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                            {formatAmount(fromAccountData.availableBalance)} {fromAccountData.currency}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Section 2: Recipient */}
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
                      <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-base">Primalac</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="savedRecipient">Sacuvani primalac (opciono)</Label>
                    <select
                      id="savedRecipient"
                      title="Sacuvani primalac"
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      onChange={(e) => {
                        const accountNumber = e.target.value;
                        if (!accountNumber) return;
                        setValue('toAccountNumber', accountNumber, { shouldValidate: true });
                      }}
                    >
                      <option value="">Bez sablona</option>
                      {asArray<PaymentRecipient>(recipients).map((recipient) => (
                        <option key={recipient.id} value={recipient.accountNumber}>
                          {recipient.name} | {recipient.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="toAccount">Racun primaoca</Label>
                      <Input id="toAccount" {...register('toAccountNumber')} placeholder="18 cifara" className="h-12 rounded-xl" />
                      {errors.toAccountNumber && (
                        <p className="text-sm text-destructive">{errors.toAccountNumber.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Naziv primaoca</Label>
                      <Input id="recipientName" {...register('recipientName')} placeholder="Naziv primaoca" className="h-12 rounded-xl" />
                      {errors.recipientName && <p className="text-sm text-destructive">{errors.recipientName.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Payment Details */}
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                      <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-base">Detalji placanja</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Iznos</Label>
                      <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="h-12 rounded-xl text-lg font-mono" />
                      {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentCode">Sifra placanja</Label>
                      <Input id="paymentCode" {...register('paymentCode')} placeholder="289" className="h-12 rounded-xl" />
                      {errors.paymentCode && <p className="text-sm text-destructive">{errors.paymentCode.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Svrha placanja</Label>
                    <textarea
                      id="purpose"
                      className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      {...register('paymentPurpose')}
                      placeholder="Unesite svrhu placanja"
                    />
                    {errors.paymentPurpose && <p className="text-sm text-destructive">{errors.paymentPurpose.message}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input id="model" {...register('model')} placeholder="npr. 97" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="callNumber">Poziv na broj</Label>
                      <Input id="callNumber" {...register('callNumber')} placeholder="Opcionalno" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Referentni broj</Label>
                      <Input id="referenceNumber" {...register('referenceNumber')} placeholder="Opcionalno" className="h-12 rounded-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl text-base bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:shadow-none disabled:scale-100"
              >
                {isSubmitting ? (
                  'Kreiranje...'
                ) : (
                  <span className="flex items-center gap-2">
                    Nastavi na verifikaciju
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </div>

            {/* Right column: Live Preview */}
            <div className="lg:col-span-2">
              {previewCard}
            </div>
          </div>
        </form>
      )}

      <VerificationModal
        transactionId={pendingTransactionId}
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={async () => {
          setShowVerification(false);
          const toAcc = watch('toAccountNumber');
          const recipName = watch('recipientName') || 'Novi primalac';
          if (toAcc && !recipients.some(r => r.accountNumber === toAcc)) {
            try {
              await paymentRecipientService.create({ name: recipName, accountNumber: toAcc });
              toast.success('Primalac sacuvan u sablone.');
            } catch { /* ignore */ }
          }
          navigate('/payments/history');
        }}
      />
    </div>
  );
}
