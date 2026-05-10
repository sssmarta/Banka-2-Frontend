import { Fragment, useEffect, useMemo, useState } from 'react';
import { Check, Handshake, Reply, X } from 'lucide-react';
import { toast } from '@/lib/notify';
import { useAuth } from '@/context/AuthContext';
import otcService from '@/services/otcService';
import { accountService } from '@/services/accountService';
import type { OtcOffer, CounterOtcOfferRequest } from '@/types/celina3';
import type { Account } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { asArray, formatAmount, getErrorMessage, getPreferredAccount } from '@/utils/formatters';
import { computeOfferDeviation } from './otcOfferUtils';
import OtcSourceFilterChip, { type OtcSource } from '@/components/otc/OtcSourceFilterChip';
import OtcSubHero from '@/components/otc/OtcSubHero';
import OtcInterBankOffersTab from './OtcInterBankOffersTab';

export default function OtcNegotiationsPage() {
  const { user, isAdmin, isAgent, isSupervisor } = useAuth();
  const isEmployee = isAdmin || isAgent || isSupervisor;
  const [source, setSource] = useState<OtcSource>('all');
  const [offers, setOffers] = useState<OtcOffer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);
  const [openedOfferId, setOpenedOfferId] = useState<number | null>(null);
  const [counterFormByOfferId, setCounterFormByOfferId] = useState<Record<number, CounterOtcOfferRequest>>({});

  const reloadOffers = async () => {
    setLoading(true);
    try {
      const data = await otcService.listMyActiveOffers();
      setOffers(data ?? []);
    } catch {
      toast.error('Neuspesno ucitavanje ponuda.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadOffers();
    (async () => {
      try {
        const list = isEmployee
          ? asArray<Account>(await accountService.getBankAccounts())
          : asArray<Account>(await accountService.getMyAccounts());
        setAccounts(list.filter((a) => a.status === 'ACTIVE'));
      } catch {
        setAccounts([]);
      }
    })();
  }, [isEmployee]);

  const activeOffers = useMemo(
    () => offers.filter((o) => o.status === 'ACTIVE'),
    [offers],
  );

  const handleAccept = async (offer: OtcOffer) => {
    setBusyOfferId(offer.id);
    try {
      // Fix iz vece-2: ako trenutni korisnik nije kupac (npr seller koji prihvata
      // counter-offer), ne saljemo accountId — BE auto-resolve buyer-ov racun.
      const currentIsBuyer = user?.id === offer.buyerId;
      let buyerAccountId: number | undefined;
      if (currentIsBuyer) {
        const preferred = getPreferredAccount(accounts, offer.listingCurrency);
        if (!preferred) {
          toast.error('Nemate nijedan aktivan racun za placanje premije.');
          setBusyOfferId(null);
          return;
        }
        buyerAccountId = preferred.id;
      }
      await otcService.acceptOffer(offer.id, buyerAccountId);
      toast.success('Ponuda je prihvacena, opcioni ugovor je sklopljen.');
      await reloadOffers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Prihvatanje ponude nije uspelo.'));
    } finally {
      setBusyOfferId(null);
    }
  };

  const handleDecline = async (offer: OtcOffer) => {
    if (!window.confirm('Sigurno zelite da otkazete ovaj pregovor?')) return;
    setBusyOfferId(offer.id);
    try {
      await otcService.declineOffer(offer.id);
      toast.success('Pregovor je otkazan.');
      await reloadOffers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Otkazivanje nije uspelo.'));
    } finally {
      setBusyOfferId(null);
    }
  };

  const openCounterForm = (offer: OtcOffer) => {
    setOpenedOfferId(offer.id);
    setCounterFormByOfferId((prev) => ({
      ...prev,
      [offer.id]: {
        quantity: offer.quantity,
        pricePerStock: offer.pricePerStock,
        premium: offer.premium,
        settlementDate: offer.settlementDate,
      },
    }));
  };

  const handleCounter = async (offer: OtcOffer) => {
    const form = counterFormByOfferId[offer.id];
    if (!form) { toast.error('Popunite sve vrednosti kontraponude.'); return; }
    setBusyOfferId(offer.id);
    try {
      await otcService.counterOffer(offer.id, form);
      toast.success('Kontraponuda je poslata drugoj strani.');
      setOpenedOfferId(null);
      await reloadOffers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Slanje kontraponude nije uspelo.'));
    } finally {
      setBusyOfferId(null);
    }
  };

  const updateCounterForm = (offerId: number, field: keyof CounterOtcOfferRequest, value: string) => {
    setCounterFormByOfferId((prev) => {
      const current = prev[offerId] ?? { quantity: 1, pricePerStock: 0, premium: 0, settlementDate: '' };
      const numeric = field !== 'settlementDate' ? Number(value) : value;
      return { ...prev, [offerId]: { ...current, [field]: numeric } };
    });
  };

  const myTurnCount = activeOffers.filter((o) => o.myTurn).length;
  const asBuyerCount = activeOffers.filter((o) => user?.id === o.buyerId).length;
  const asSellerCount = activeOffers.filter((o) => user?.id === o.sellerId).length;

  return (
    <div className="container mx-auto py-6 space-y-6 animate-fade-up">
      <OtcSubHero
        icon={Handshake}
        title="Moji pregovori"
        description="Aktivne OTC ponude u kojima si kupac ili prodavac. Tvoj red znaci da druga strana ceka tvoj odgovor."
        gradientFrom="from-emerald-500"
        gradientTo="to-teal-600"
        kpis={source === 'inter' ? undefined : [
          { label: 'Aktivnih', value: String(activeOffers.length) },
          { label: 'Tvoj red', value: String(myTurnCount), tone: myTurnCount > 0 ? 'warning' : 'default' },
          { label: 'Kao kupac', value: String(asBuyerCount) },
          { label: 'Kao prodavac', value: String(asSellerCount) },
        ]}
      />

      <OtcSourceFilterChip value={source} onChange={setSource} />

      {source === 'inter' ? (
        <OtcInterBankOffersTab />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Moji aktivni pregovori (intra-bank)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded bg-muted/50" />
                ))}
              </div>
            ) : activeOffers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Trenutno nemate aktivnih pregovora. Idite na <strong>Pretrazi</strong> da pokrenete nov pregovor.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hartija</TableHead>
                    <TableHead>Kupac / Prodavac</TableHead>
                    <TableHead>Kolicina</TableHead>
                    <TableHead>Cena / Premija</TableHead>
                    <TableHead>Dospece</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOffers.map((offer) => {
                    const deviation = computeOfferDeviation(offer.pricePerStock, offer.currentPrice);
                    return (
                    <Fragment key={offer.id}>
                      <TableRow className={deviation?.rowClass}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{offer.listingTicker}</span>
                            <span className="text-xs text-muted-foreground">{offer.listingName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span>Kupac: {offer.buyerName}</span>
                              {user?.id === offer.buyerId && (
                                <Badge variant="info" className="text-[10px] px-1 py-0 h-4">VI</Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1.5">
                              <span>Prodavac: {offer.sellerName}</span>
                              {user?.id === offer.sellerId && (
                                <Badge variant="info" className="text-[10px] px-1 py-0 h-4">VI</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{offer.quantity}</TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>{formatAmount(offer.pricePerStock)} / {offer.listingCurrency}</span>
                            {deviation && (
                              <Badge variant="outline" className={`text-[10px] font-semibold ${deviation.badgeClass}`}>
                                {deviation.label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            Prem: {formatAmount(offer.premium)} {offer.listingCurrency}
                          </div>
                        </TableCell>
                        <TableCell>{offer.settlementDate}</TableCell>
                        <TableCell>
                          {offer.myTurn ? (
                            <Badge variant="warning">Moj red</Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              title={`Ceka da ${offer.waitingOnUserId === offer.buyerId ? offer.buyerName : offer.sellerName} odgovori`}
                            >
                              Ceka {offer.waitingOnUserId === offer.buyerId ? 'kupca' : 'prodavca'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            {offer.myTurn && (
                              <Button
                                size="sm" variant="default"
                                disabled={busyOfferId === offer.id}
                                onClick={() => handleAccept(offer)}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Prihvati
                              </Button>
                            )}
                            {offer.myTurn && (
                              <Button
                                size="sm" variant="outline"
                                disabled={busyOfferId === offer.id}
                                onClick={() =>
                                  openedOfferId === offer.id ? setOpenedOfferId(null) : openCounterForm(offer)
                                }
                              >
                                <Reply className="h-3.5 w-3.5 mr-1" />
                                Kontraponuda
                              </Button>
                            )}
                            <Button
                              size="sm" variant="ghost"
                              disabled={busyOfferId === offer.id}
                              onClick={() => handleDecline(offer)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Otkazi
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {openedOfferId === offer.id && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={7}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-2">
                              <div className="space-y-1">
                                <Label htmlFor={`cq-${offer.id}`}>Kolicina</Label>
                                <Input
                                  id={`cq-${offer.id}`} type="number" min={1}
                                  value={String(counterFormByOfferId[offer.id]?.quantity ?? offer.quantity)}
                                  onChange={(e) => updateCounterForm(offer.id, 'quantity', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`cp-${offer.id}`}>Cena ({offer.listingCurrency})</Label>
                                <Input
                                  id={`cp-${offer.id}`} type="number" step="0.01"
                                  value={String(counterFormByOfferId[offer.id]?.pricePerStock ?? offer.pricePerStock)}
                                  onChange={(e) => updateCounterForm(offer.id, 'pricePerStock', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`cpm-${offer.id}`}>Premija</Label>
                                <Input
                                  id={`cpm-${offer.id}`} type="number" step="0.01"
                                  value={String(counterFormByOfferId[offer.id]?.premium ?? offer.premium)}
                                  onChange={(e) => updateCounterForm(offer.id, 'premium', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`csd-${offer.id}`}>Dospece</Label>
                                <Input
                                  id={`csd-${offer.id}`} type="date"
                                  value={String(counterFormByOfferId[offer.id]?.settlementDate ?? offer.settlementDate)}
                                  onChange={(e) => updateCounterForm(offer.id, 'settlementDate', e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2 md:col-span-4">
                                <Button variant="ghost" size="sm" onClick={() => setOpenedOfferId(null)}>
                                  Odustani
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={busyOfferId === offer.id}
                                  onClick={() => handleCounter(offer)}
                                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                                >
                                  Posalji kontraponudu
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
