// TODO [FE2-10a] @Marta - Kartice: Lista kartica korisnika
// TODO [FE2-10b] @Marta - Kartice: Akcije (blokiranje, deblokiranje, deaktivacija, limit)
//
// Ova stranica prikazuje sve kartice ulogovanog korisnika.
// - cardService.getMyCards() za fetch
// - Kartice prikazati vizuelno (card-like UI sa brojem, tipom, statusom)
// - Akcije: blokiraj, deblokiraj, deaktiviraj, promeni limit
// - Maskiran broj kartice (**** **** **** 1234)
// - Zahtev za novu karticu: cardService.create({ accountNumber, cardType })
//   => email verifikacija (cardService.requestCardVerification)
// - Tipovi kartica: VISA, MASTERCARD, DINACARD, AMERICAN_EXPRESS
// - Za poslovni racun: kartica se pravi za ovlasceno lice (AuthorizedPerson)
//   => cardService.getAuthorizedPersons(accountNumber) za dropdown
// - Max kartice: 2 po licnom racunu, 1 po ovlascenom licu za poslovni
// - Spec: "Kartice" iz Celine 2
// - Luhn validacija za prikaz (16 cifara)

import { useEffect, useState } from 'react';
import { toast } from '@/lib/notify';
import { cardService } from '@/services/cardService';
import type { Card } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function maskCardNumber(number: string): string {
  const last4 = number.slice(-4);
  return `**** **** **** ${last4}`;
}

function statusClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
  if (status === 'BLOCKED') return 'bg-yellow-100 text-yellow-700';
  if (status === 'DEACTIVATED') return 'bg-muted text-muted-foreground';
  return 'bg-muted text-muted-foreground';
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

export default function CardListPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingCardId, setProcessingCardId] = useState<number | null>(null);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await cardService.getMyCards();
      setCards(asArray<Card>(data));
    } catch {
      toast.error('Neuspešno učitavanje kartica.');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const runCardAction = async (cardId: number, action: 'block' | 'unblock' | 'deactivate' | 'limit') => {
    setProcessingCardId(cardId);
    try {
      if (action === 'block') {
        await cardService.block(cardId);
      } else if (action === 'unblock') {
        await cardService.unblock(cardId);
      } else if (action === 'deactivate') {
        const confirmed = window.confirm('Da li ste sigurni da želite deaktivaciju kartice?');
        if (!confirmed) {
          setProcessingCardId(null);
          return;
        }
        await cardService.deactivate(cardId);
      } else {
        const newLimitRaw = window.prompt('Unesite novi limit kartice:');
        if (!newLimitRaw) {
          setProcessingCardId(null);
          return;
        }
        const parsedLimit = Number(newLimitRaw);
        if (Number.isNaN(parsedLimit) || parsedLimit < 0) {
          toast.error('Limit mora biti nenegativan broj.');
          setProcessingCardId(null);
          return;
        }
        await cardService.changeLimit(cardId, parsedLimit);
      }

      await loadCards();
      toast.success('Akcija uspešno izvršena.');
    } catch {
      toast.error('Akcija nije uspela.');
    } finally {
      setProcessingCardId(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Moje kartice</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Učitavanje kartica...</p>
        ) : asArray<Card>(cards).length === 0 ? (
          <p className="text-muted-foreground col-span-full">Nemate aktivnih kartica.</p>
        ) : (
          asArray<Card>(cards).map((card) => (
            <UICard key={card.id} className={`${card.cardType === 'VISA' ? 'border-blue-400' : card.cardType === 'MASTERCARD' ? 'border-red-400' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{card.cardType}</span>
                  <span className={`px-2 py-1 rounded text-xs ${statusClass(card.status)}`}>{card.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-mono text-lg tracking-widest">{maskCardNumber(card.cardNumber)}</p>
                <p>Vlasnik: <span className="font-medium">{card.holderName}</span></p>
                <p>Istek: <span className="font-medium">{formatDate(card.expirationDate)}</span></p>
                <p>Račun: <span className="font-medium">{card.accountNumber}</span></p>
                <p>Limit: <span className="font-medium">{formatAmount(card.limit)}</span></p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {card.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={() => runCardAction(card.id, 'block')} disabled={processingCardId === card.id}>
                      Blokiraj
                    </Button>
                  )}
                  {card.status === 'BLOCKED' && (
                    <Button variant="outline" size="sm" onClick={() => runCardAction(card.id, 'unblock')} disabled={processingCardId === card.id}>
                      Deblokiraj
                    </Button>
                  )}
                  {card.status !== 'DEACTIVATED' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => runCardAction(card.id, 'limit')} disabled={processingCardId === card.id}>
                        Promeni limit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => runCardAction(card.id, 'deactivate')} disabled={processingCardId === card.id}>
                        Deaktiviraj
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </UICard>
          ))
        )}
      </div>
    </div>
  );
}

