// TODO [FE2-14a] @Jovan - Employee portal: Pregled svih racuna (admin/employee)
//
// Ova stranica je dostupna samo zaposlenima.
// Prikazuje sve racune u sistemu sa filterima i pretragom.
// - accountService.getAll(filters) sa paginacijom
// - Filteri: po emailu vlasnika, tipu racuna, statusu
// - Akcije: promena statusa racuna (activate/block/deactivate)
// - Link na detalje racuna
// - Link na CreateAccountPage za novi racun
// - Spec: "Portal racuna" iz Celine 2 (employee section)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import type { Account, AccountStatus, AccountType } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function statusClass(status: AccountStatus): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'BLOCKED') return 'bg-red-100 text-red-700';
  return 'bg-muted text-muted-foreground';
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

export default function AccountsPortalPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType | 'ALL'>('ALL');
  const [status, setStatus] = useState<AccountStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountService.getAll({
        ownerEmail: ownerEmail || undefined,
        accountType: accountType === 'ALL' ? undefined : accountType,
        status: status === 'ALL' ? undefined : status,
        page,
        limit: 10,
      });
      setAccounts(asArray<Account>(response.content));
      setTotalPages(Math.max(1, response.totalPages));
    } catch {
      toast.error('Neuspešno učitavanje računa.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [ownerEmail, accountType, status, page]);

  useEffect(() => {
    setPage(0);
  }, [ownerEmail, accountType, status]);

  const changeStatus = async (accountId: number, nextStatus: AccountStatus) => {
    try {
      await accountService.changeStatus(accountId, nextStatus);
      toast.success('Status računa je ažuriran.');
      await loadAccounts();
    } catch {
      toast.error('Promena statusa nije uspela.');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portal računa</h1>
        <Button onClick={() => navigate('/employee/accounts/new')}>Kreiraj račun</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filteri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Email vlasnika"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
          <select
            title="Tip računa"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType | 'ALL')}
          >
            <option value="ALL">Svi tipovi</option>
            <option value="TEKUCI">Tekući</option>
            <option value="DEVIZNI">Devizni</option>
            <option value="POSLOVNI">Poslovni</option>
          </select>
          <select
            title="Status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as AccountStatus | 'ALL')}
          >
            <option value="ALL">Svi statusi</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Učitavanje računa...</p>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Vlasnik</th>
                  <th className="text-left py-2">Broj računa</th>
                  <th className="text-left py-2">Tip</th>
                  <th className="text-left py-2">Valuta</th>
                  <th className="text-left py-2">Stanje</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {asArray<Account>(accounts).map((account) => (
                  <tr key={account.id} className="border-b">
                    <td className="py-2">{account.ownerName}</td>
                    <td className="py-2">{account.accountNumber}</td>
                    <td className="py-2">{account.accountType}</td>
                    <td className="py-2">{account.currency}</td>
                    <td className="py-2">{formatAmount(account.balance)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass(account.status)}`}>{account.status}</span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {account.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(account.id, 'BLOCKED')}>
                            Blokiraj
                          </Button>
                        )}
                        {account.status === 'BLOCKED' && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(account.id, 'ACTIVE')}>
                            Aktiviraj
                          </Button>
                        )}
                        {account.status !== 'INACTIVE' && (
                          <Button size="sm" variant="destructive" onClick={() => changeStatus(account.id, 'INACTIVE')}>
                            Deaktiviraj
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(account.accountType === 'POSLOVNI' ? `/accounts/${account.id}/business` : `/accounts/${account.id}`)}
                        >
                          Detalji
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Prethodna
              </Button>
              <span className="text-sm text-muted-foreground">Strana {page + 1} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Sledeća
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

