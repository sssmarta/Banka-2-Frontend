// TODO [FE2-05a] @Elena - Prenosi: Forma za prenos izmedju racuna
// TODO [FE2-05b] @Elena - Prenosi: Verifikacija prenosa
// TODO [FE2-08a] @Antonije - Transferi: Kreiranje transfera
// TODO [FE2-08b] @Antonije - Transferi: Istorija i prikaz kursa/provizije
//
// Ova stranica omogucava prenos sredstava izmedju sopstvenih racuna.
// - Forma: izaberi racun posiljaoca, izaberi racun primaoca, iznos
// - Ako su valute razlicite => prikazati kurs i konvertovani iznos
// - react-hook-form + zodResolver(transferSchema)
// - Nakon submit => transactionService.createTransfer()
// - Verifikacija putem VerificationModal
// - Spec: "Interni transfer" iz Celine 2

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VerificationModal from '@/components/shared/VerificationModal';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

export default function TransferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFrom = searchParams.get('from') || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [exchangePreview, setExchangePreview] = useState<{ rate: number; convertedAmount: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
        if (!preselectedFrom && safeAccounts.length > 0) {
          setValue('fromAccountNumber', safeAccounts[0].accountNumber);
        }
      } catch {
        if (!mounted) return;
        toast.error('Neuspešno učitavanje računa.');
        setAccounts([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadAccounts();
    return () => {
      mounted = false;
    };
  }, [preselectedFrom, setValue]);

  const fromAccount = watch('fromAccountNumber');
  const toAccount = watch('toAccountNumber');
  const amount = watch('amount') || 0;

  const safeAccounts = useMemo(() => asArray<Account>(accounts), [accounts]);

  const fromAccountData = useMemo(
    () => safeAccounts.find((account) => account.accountNumber === fromAccount),
    [safeAccounts, fromAccount]
  );
  const toAccountData = useMemo(
    () => safeAccounts.find((account) => account.accountNumber === toAccount),
    [safeAccounts, toAccount]
  );

  const toAccountOptions = useMemo(
    () => safeAccounts.filter((account) => account.accountNumber !== fromAccount),
    [safeAccounts, fromAccount]
  );

  useEffect(() => {
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
        const rate = await currencyService.getRate(fromAccountData.currency, toAccountData.currency);
        setExchangePreview({
          rate: rate.middleRate,
          convertedAmount: amount * rate.middleRate,
        });
      } catch {
        setExchangePreview(null);
      }
    };

    loadRate();
  }, [amount, fromAccountData, toAccountData]);

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);
    try {
      const transfer = await transactionService.createTransfer(data);
      setPendingTransactionId(transfer.id);
      setShowVerification(true);
      toast.info('Prenos je kreiran. Potrebna je verifikacija.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Kreiranje prenosa nije uspelo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Prenos između računa</h1>

      <Card>
        <CardHeader>
          <CardTitle>Novi prenos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Učitavanje računa...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="fromAccount">Račun pošiljaoca</Label>
                <select
                  id="fromAccount"
                  title="Račun pošiljaoca"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('fromAccountNumber')}
                >
                  <option value="">Izaberite račun</option>
                  {safeAccounts.map((account) => (
                    <option key={account.id} value={account.accountNumber}>
                      {account.accountNumber} | {formatAmount(account.availableBalance)} {account.currency}
                    </option>
                  ))}
                </select>
                {errors.fromAccountNumber && <p className="text-sm text-destructive">{errors.fromAccountNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toAccount">Račun primaoca</Label>
                <select
                  id="toAccount"
                  title="Račun primaoca"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('toAccountNumber')}
                >
                  <option value="">Izaberite račun</option>
                  {toAccountOptions.map((account) => (
                    <option key={account.id} value={account.accountNumber}>
                      {account.accountNumber} | {formatAmount(account.availableBalance)} {account.currency}
                    </option>
                  ))}
                </select>
                {errors.toAccountNumber && <p className="text-sm text-destructive">{errors.toAccountNumber.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Iznos</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>

              {exchangePreview && fromAccountData && toAccountData && (
                <div className="rounded-md border p-3 text-sm space-y-1">
                  <p>
                    Kurs: 1 {fromAccountData.currency} = {formatAmount(exchangePreview.rate, 4)} {toAccountData.currency}
                  </p>
                  <p>
                    Konvertovani iznos: {formatAmount(exchangePreview.convertedAmount)} {toAccountData.currency}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Kreiranje...' : 'Nastavi na verifikaciju'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <VerificationModal
        transactionId={pendingTransactionId}
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={() => {
          setShowVerification(false);
          navigate('/accounts');
        }}
      />
    </div>
  );
}

