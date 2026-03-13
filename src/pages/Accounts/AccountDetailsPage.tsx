// TODO [FE2-03a] @Jovan - Detaljan prikaz racuna - licni
//
// Ova stranica prikazuje detalje jednog racuna (tekuci ili devizni).
// - useParams() za accountId iz URL-a
// - accountService.getById(id) za fetch racuna
// - transactionService.getAll({ accountNumber }) za poslednjih N transakcija
// - Prikaz: naziv, broj, tip, podvrsta (accountSubtype), valuta, stanje, raspolozivo stanje,
//   rezervisana sredstva, dnevni/mesecni limit, dnevna/mesecna potrosnja, status, datum kreiranja
// - Lista poslednjih transakcija za ovaj racun
// - Dugme za promenu naziva racuna (accountService.updateName, schema: accountRenameSchema)
// - Dugme za promenu limita (accountService.changeLimit, schema: accountLimitSchema)
//   => modal sa dnevni limit i mesecni limit, zahteva verifikaciju (VerificationModal)

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { transactionService } from '@/services/transactionService';
import type { Account, Transaction } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function statusClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'BLOCKED') return 'bg-red-100 text-red-700';
  return 'bg-muted text-muted-foreground';
}

function formatAccountNumber(accountNumber: string): string {
  if (accountNumber.length !== 18) return accountNumber;
  return `${accountNumber.slice(0, 3)}-${accountNumber.slice(3, 7)}-${accountNumber.slice(7, 16)}-${accountNumber.slice(16)}`;
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('sr-RS');
}

export default function AccountDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameValue, setRenameValue] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingLimits, setIsSavingLimits] = useState(false);

  useEffect(() => {
    const accountId = Number(id);
    if (!accountId || Number.isNaN(accountId)) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const accountData = await accountService.getById(accountId);
        setAccount(accountData);
        setRenameValue(accountData.name || '');
        setDailyLimit(String(accountData.dailyLimit));
        setMonthlyLimit(String(accountData.monthlyLimit));

        const transactionsResponse = await transactionService.getAll({
          accountNumber: accountData.accountNumber,
          page: 0,
          limit: 10,
        });
        setTransactions(transactionsResponse.content);
      } catch {
        toast.error('Neuspešno učitavanje detalja računa.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const dailyProgress = useMemo(() => {
    if (!account || account.dailyLimit <= 0) return 0;
    return Math.min(100, (account.dailySpending / account.dailyLimit) * 100);
  }, [account]);

  const monthlyProgress = useMemo(() => {
    if (!account || account.monthlyLimit <= 0) return 0;
    return Math.min(100, (account.monthlySpending / account.monthlyLimit) * 100);
  }, [account]);

  const saveName = async () => {
    if (!account) return;
    const newName = renameValue.trim();
    if (!newName) {
      toast.error('Naziv računa ne sme biti prazan.');
      return;
    }

    setIsSavingName(true);
    try {
      const updated = await accountService.updateName(account.id, newName);
      setAccount(updated);
      toast.success('Naziv računa je uspešno promenjen.');
    } catch {
      toast.error('Promena naziva nije uspela.');
    } finally {
      setIsSavingName(false);
    }
  };

  const saveLimits = async () => {
    if (!account) return;
    const parsedDaily = Number(dailyLimit);
    const parsedMonthly = Number(monthlyLimit);
    if (Number.isNaN(parsedDaily) || Number.isNaN(parsedMonthly) || parsedDaily < 0 || parsedMonthly < 0) {
      toast.error('Limiti moraju biti nenegativni brojevi.');
      return;
    }

    setIsSavingLimits(true);
    try {
      await accountService.changeLimit(account.id, {
        dailyLimit: parsedDaily,
        monthlyLimit: parsedMonthly,
      });
      setAccount({ ...account, dailyLimit: parsedDaily, monthlyLimit: parsedMonthly });
      toast.success('Limiti su uspešno sačuvani.');
    } catch {
      toast.error('Promena limita nije uspela.');
    } finally {
      setIsSavingLimits(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {loading || !account ? (
        <p className="text-muted-foreground">Učitavanje detalja računa...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{account.name || 'Detalji računa'}</h1>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass(account.status)}`}>{account.status}</span>
            <span className="px-2 py-1 rounded text-xs bg-muted">{account.accountType}</span>
          </div>
          <p className="text-muted-foreground">{formatAccountNumber(account.accountNumber)}</p>

          <Card>
            <CardHeader>
              <CardTitle>Stanje računa</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
              <p>Stanje: <span className="font-medium">{formatAmount(account.balance)} {account.currency}</span></p>
              <p>Raspoloživo: <span className="font-medium">{formatAmount(account.availableBalance)} {account.currency}</span></p>
              <p>Rezervisano: <span className="font-medium">{formatAmount(account.reservedBalance)} {account.currency}</span></p>
              <p>Podvrsta: <span className="font-medium">{account.accountSubtype || '-'}</span></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limiti i potrošnja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p>Dnevni limit / potrošnja: {formatAmount(account.dailyLimit)} / {formatAmount(account.dailySpending)} {account.currency}</p>
                <progress className="w-full h-2" max={100} value={dailyProgress} />
              </div>
              <div>
                <p>Mesečni limit / potrošnja: {formatAmount(account.monthlyLimit)} / {formatAmount(account.monthlySpending)} {account.currency}</p>
                <progress className="w-full h-2" max={100} value={monthlyProgress} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Novi dnevni limit</Label>
                  <Input id="dailyLimit" type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyLimit">Novi mesečni limit</Label>
                  <Input id="monthlyLimit" type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
                </div>
              </div>
              <Button onClick={saveLimits} disabled={isSavingLimits}>
                {isSavingLimits ? 'Čuvanje...' : 'Sačuvaj limite'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Akcije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Novi naziv računa" />
                <Button onClick={saveName} disabled={isSavingName}>{isSavingName ? 'Čuvanje...' : 'Promeni naziv'}</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/payments/new?from=${account.accountNumber}`)}>
                  Novo plaćanje
                </Button>
                <Button variant="outline" onClick={() => navigate(`/transfers?from=${account.accountNumber}`)}>
                  Prenos
                </Button>
                <Button variant="outline" onClick={() => navigate(`/payments/history?account=${account.accountNumber}`)}>
                  Vidi sve transakcije
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Poslednje transakcije</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground">Nema transakcija za ovaj račun.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Datum</th>
                        <th className="text-left py-2">Opis</th>
                        <th className="text-left py-2">Primalac/pošiljalac</th>
                        <th className="text-left py-2">Iznos</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => {
                        const counterparty =
                          transaction.fromAccountNumber === account.accountNumber
                            ? transaction.toAccountNumber
                            : transaction.fromAccountNumber;
                        return (
                          <tr key={transaction.id} className="border-b">
                            <td className="py-2">{formatDateTime(transaction.createdAt)}</td>
                            <td className="py-2">{transaction.description || transaction.paymentPurpose}</td>
                            <td className="py-2">{counterparty}</td>
                            <td className="py-2">{formatAmount(transaction.amount)} {transaction.currency}</td>
                            <td className="py-2">{transaction.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

