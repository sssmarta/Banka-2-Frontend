// TODO [FE2-02a] @Jovan - Racuni: Lista svih racuna korisnika
// TODO [FE2-02b] @Jovan - Racuni: Lista transakcija za selektovani racun
//
// Ova stranica prikazuje sve racune ulogovanog korisnika.
// - accountService.getMyAccounts() za fetch
// - Kartice/tabela sa: naziv, broj racuna, tip (tekuci/devizni/poslovni), valuta, stanje, status
// - Klik na racun vodi na AccountDetailsPage (ili BusinessAccountDetailsPage za poslovni)
// - Filtriranje po tipu racuna (tabs ili dropdown)
// - Badge za status racuna (active/blocked/inactive)

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { transactionService } from '@/services/transactionService';
import type { Account, Transaction } from '@/types/celina2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

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

export default function AccountListPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ALL' | 'TEKUCI' | 'DEVIZNI' | 'POSLOVNI'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      try {
        const data = await accountService.getMyAccounts();
        const safeAccounts = asArray<Account>(data);
        setAccounts(safeAccounts);
        if (safeAccounts.length > 0) setSelectedAccount(safeAccounts[0]);
        else setSelectedAccount(null);
      } catch {
        toast.error('Neuspešno učitavanje računa.');
        setAccounts([]);
        setSelectedAccount(null);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  useEffect(() => {
    if (!selectedAccount?.accountNumber) {
      setTransactions([]);
      return;
    }

    const loadTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const response = await transactionService.getAll({
          accountNumber: selectedAccount.accountNumber,
          page: 0,
          limit: 5,
        });
        const txSource = (response as { content?: unknown } | undefined)?.content ?? response;
        setTransactions(asArray<Transaction>(txSource));
      } catch {
        toast.error('Neuspešno učitavanje transakcija.');
        setTransactions([]);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, [selectedAccount]);

  const filteredAccounts = useMemo(() => {
    const safeAccounts = asArray<Account>(accounts);
    if (selectedType === 'ALL') return safeAccounts;
    return safeAccounts.filter((account) => account.accountType === selectedType);
  }, [accounts, selectedType]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moji računi</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={`px-3 py-2 text-sm rounded border ${selectedType === 'ALL' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setSelectedType('ALL')}>
          Svi
        </button>
        <button className={`px-3 py-2 text-sm rounded border ${selectedType === 'TEKUCI' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setSelectedType('TEKUCI')}>
          Tekući
        </button>
        <button className={`px-3 py-2 text-sm rounded border ${selectedType === 'DEVIZNI' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setSelectedType('DEVIZNI')}>
          Devizni
        </button>
        <button className={`px-3 py-2 text-sm rounded border ${selectedType === 'POSLOVNI' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setSelectedType('POSLOVNI')}>
          Poslovni
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Učitavanje računa...</p>
        ) : filteredAccounts.length === 0 ? (
          <p className="text-muted-foreground col-span-full">Nema računa za izabrani filter.</p>
        ) : (
          filteredAccounts.map((account) => (
            <Card
              key={account.id}
              className="cursor-pointer hover:border-primary/60 transition-colors"
              onClick={() => {
                setSelectedAccount(account);
                if (account.accountType === 'POSLOVNI') {
                  navigate(`/accounts/${account.id}/business`);
                } else {
                  navigate(`/accounts/${account.id}`);
                }
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{account.name || `${account.accountType} račun`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{formatAccountNumber(account.accountNumber)}</p>
                <p>Tip: <span className="font-medium">{account.accountType}</span></p>
                <p>Stanje: <span className="font-medium">{formatAmount(account.balance)} {account.currency}</span></p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass(account.status)}`}>
                  {account.status}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Poslednje transakcije {selectedAccount ? `(${selectedAccount.accountNumber})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <p className="text-muted-foreground">Učitavanje transakcija...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground">Nema transakcija za izabrani račun.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Datum</th>
                    <th className="text-left py-2">Opis</th>
                    <th className="text-left py-2">Iznos</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-2">{formatDateTime(transaction.createdAt)}</td>
                      <td className="py-2">{transaction.description || transaction.paymentPurpose}</td>
                      <td className="py-2">{formatAmount(transaction.amount)} {transaction.currency}</td>
                      <td className="py-2">{transaction.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

