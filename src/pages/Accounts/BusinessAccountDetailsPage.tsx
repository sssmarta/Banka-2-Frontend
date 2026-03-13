// TODO [FE2-03a] @Jovan - Racuni: Detalji poslovnog racuna (osnovni prikaz)
//
// Ova stranica prikazuje detalje poslovnog racuna sa dodatnim info o firmi.
// - useParams() za accountId iz URL-a
// - accountService.getById(id) + accountService.getBusinessDetails(id)
// - Sve sto ima AccountDetailsPage PLUS:
//   - Naziv firme (companyName)
//   - Maticni broj (registrationNumber)
//   - PIB (taxId)
//   - Sifra delatnosti (activityCode)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { transactionService } from '@/services/transactionService';
import type { Account, BusinessAccount, Transaction } from '@/types/celina2';

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('sr-RS');
}

export default function BusinessAccountDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);

  useEffect(() => {
    const accountId = Number(id);
    if (!accountId || Number.isNaN(accountId)) {
      setIsLoadingBusiness(false);
      return;
    }

    const loadBusinessDetails = async () => {
      setIsLoadingBusiness(true);
      try {
        const [accountDetails, details] = await Promise.all([
          accountService.getById(accountId),
          accountService.getBusinessDetails(accountId),
        ]);
        setAccount(accountDetails);
        setBusinessDetails(details);

        const recentTransactions = await transactionService.getAll({
          accountNumber: accountDetails.accountNumber,
          page: 0,
          limit: 10,
        });
        setTransactions(recentTransactions.content);
      } catch {
        toast.error('Neuspešno učitavanje informacija o firmi.');
      } finally {
        setIsLoadingBusiness(false);
      }
    };

    loadBusinessDetails();
  }, [id]);

  // TODO [FE2-03a] @Jovan - Fetch racun i business detalje
  // accountService.getById(Number(id))
  // accountService.getBusinessDetails(Number(id))
  // transactionService.getAll({ accountNumber: account.accountNumber, limit: 10 })

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* TODO [FE2-03a] @Jovan - Header sa info o racunu (isto kao AccountDetailsPage)
          - Naziv racuna, broj, tip=POSLOVNI badge, status badge */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">{account?.name || 'Poslovni račun'}</h1>
        <p className="text-muted-foreground">ID: {id}</p>
        {account && (
          <p className="text-muted-foreground">
            {account.accountNumber} | {account.status}
          </p>
        )}
      </div>

      {/* TODO [FE2-03a] @Jovan - Kartica sa stanjem (isto kao AccountDetailsPage) */}
      <section>
        {!account ? (
          <p className="text-muted-foreground">Učitavanje stanja...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 text-sm border rounded-md p-4 bg-card">
            <p>
              Stanje: <span className="font-medium">{formatAmount(account.balance)} {account.currency}</span>
            </p>
            <p>
              Raspoloživo: <span className="font-medium">{formatAmount(account.availableBalance)} {account.currency}</span>
            </p>
            <p>
              Rezervisano: <span className="font-medium">{formatAmount(account.reservedBalance)} {account.currency}</span>
            </p>
            <p>
              Podvrsta: <span className="font-medium">{account.accountSubtype || '-'}</span>
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Informacije o firmi</h2>
        {isLoadingBusiness ? (
          <p className="text-muted-foreground">Učitavanje podataka firme...</p>
        ) : !businessDetails?.firm ? (
          <p className="text-muted-foreground">Podaci o firmi nisu dostupni.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 text-sm border rounded-md p-4 bg-card">
            <p>
              Naziv firme: <span className="font-medium">{businessDetails.firm.companyName}</span>
            </p>
            <p>
              Matični broj: <span className="font-medium">{businessDetails.firm.registrationNumber}</span>
            </p>
            <p>
              PIB: <span className="font-medium">{businessDetails.firm.taxId}</span>
            </p>
            <p>
              Šifra delatnosti: <span className="font-medium">{businessDetails.firm.activityCode}</span>
            </p>
          </div>
        )}
      </section>

      {/* TODO [FE2-03a] @Jovan - Akcije i transakcije (isto kao AccountDetailsPage) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Poslednje transakcije</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground">Nema transakcija za ovaj račun.</p>
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b">
                    <td className="py-2">{formatDateTime(tx.createdAt)}</td>
                    <td className="py-2">{tx.description || tx.paymentPurpose}</td>
                    <td className="py-2">{formatAmount(tx.amount)} {tx.currency}</td>
                    <td className="py-2">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}



