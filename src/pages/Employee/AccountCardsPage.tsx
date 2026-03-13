// TODO [FE2-14b] @Jovan - Employee portal: Pregled kartica po racunu
// TODO [FE2-14b] @Jovan - Employee portal: Upravljanje karticama (block/unblock/deactivate)
//
// Ova stranica je dostupna samo zaposlenima.
// Omogucava pregled i upravljanje karticama za odredjeni racun.
// - Pretraga po broju racuna ili email-u vlasnika
// - cardService.getByAccount(accountNumber) za fetch
// - Akcije: blokiranje, deblokiranje, deaktivacija kartica
// - Kreiranje nove kartice za racun
// - Spec: "Portal kartica" iz Celine 2 (employee section)
// TODO [FE2-14b] @Jovan - Podrzati otvoranje preko rute /employee/accounts/:id/cards (prepopunjen accountId)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { cardService } from '@/services/cardService';
import type { Account, CardType, Card as BankCard } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function maskCardNumber(number: string): string {
  return `**** **** **** ${number.slice(-4)}`;
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('sr-RS');
}

export default function AccountCardsPage() {
  const { id } = useParams<{ id: string }>();
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    const loadById = async () => {
      if (!id) return;
      const accountId = Number(id);
      if (!accountId || Number.isNaN(accountId)) return;
      try {
        const accountData = await accountService.getById(accountId);
        setAccountNumber(accountData.accountNumber);
        setAccount(accountData);
      } catch {
        toast.error('Neuspešno učitavanje računa iz rute.');
      }
    };

    loadById();
  }, [id]);

  const searchCards = async () => {
    if (!accountNumber) {
      toast.error('Unesite broj računa.');
      return;
    }

    setLoading(true);
    try {
      const [accountData, cardsData] = await Promise.all([
        accountService.getByAccountNumber(accountNumber),
        cardService.getByAccount(accountNumber),
      ]);
      setAccount(accountData);
      setCards(cardsData);
    } catch {
      toast.error('Pretraga kartica nije uspela.');
      setCards([]);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (cardId: number, action: 'block' | 'unblock' | 'deactivate') => {
    setProcessingId(cardId);
    try {
      if (action === 'block') await cardService.block(cardId);
      if (action === 'unblock') await cardService.unblock(cardId);
      if (action === 'deactivate') await cardService.deactivate(cardId);
      await searchCards();
    } catch {
      toast.error('Akcija nad karticom nije uspela.');
    } finally {
      setProcessingId(null);
    }
  };

  const createNewCard = async () => {
    if (!accountNumber) {
      toast.error('Prvo izaberite račun.');
      return;
    }

    const cardTypeRaw = window.prompt('Unesite tip kartice: VISA, MASTERCARD, DINACARD, AMERICAN_EXPRESS');
    if (!cardTypeRaw) return;
    const cardType = cardTypeRaw.toUpperCase() as CardType;
    if (!['VISA', 'MASTERCARD', 'DINACARD', 'AMERICAN_EXPRESS'].includes(cardType)) {
      toast.error('Neispravan tip kartice.');
      return;
    }

    try {
      const created = await cardService.create({ accountNumber, cardType });
      await cardService.requestCardVerification(created.id);
      toast.success('Kartica kreirana. Poslat je zahtev za verifikaciju.');
      await searchCards();
    } catch {
      toast.error('Kreiranje kartice nije uspelo.');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Portal kartica</h1>

      <section>
        <Card>
          <CardContent className="pt-6 flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Broj računa (18 cifara)"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <Button onClick={searchCards} disabled={loading}>{loading ? 'Pretraga...' : 'Pretraži'}</Button>
            <Button variant="outline" onClick={createNewCard}>Kreiraj novu karticu</Button>
          </CardContent>
        </Card>

        {account && (
          <p className="text-sm text-muted-foreground mt-2">
            Račun: {account.accountNumber} | Vlasnik: {account.ownerName} | Status: {account.status}
          </p>
        )}
      </section>

      <section>
        {!loading && cards.length === 0 ? (
          <p className="text-muted-foreground">Nema kartica za ovaj račun.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <Card key={card.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{card.cardType}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-mono">{maskCardNumber(card.cardNumber)}</p>
                  <p>Status: <span className="font-medium">{card.status}</span></p>
                  <p>Limit: <span className="font-medium">{formatAmount(card.limit)}</span></p>
                  <p>Istek: <span className="font-medium">{formatDate(card.expirationDate)}</span></p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {card.status === 'ACTIVE' && (
                      <Button variant="outline" size="sm" onClick={() => runAction(card.id, 'block')} disabled={processingId === card.id}>
                        Blokiraj
                      </Button>
                    )}
                    {card.status === 'BLOCKED' && (
                      <Button variant="outline" size="sm" onClick={() => runAction(card.id, 'unblock')} disabled={processingId === card.id}>
                        Deblokiraj
                      </Button>
                    )}
                    {card.status !== 'DEACTIVATED' && (
                      <Button variant="destructive" size="sm" onClick={() => runAction(card.id, 'deactivate')} disabled={processingId === card.id}>
                        Deaktiviraj
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

