// FE2-14b: Employee portal - upravljanje karticama po racunu

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Search,
  Plus,
  CreditCard as CreditCardIcon,
  ShieldCheck,
  ShieldOff,
  ShieldX,
} from 'lucide-react';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { cardService } from '@/services/cardService';
import type { Account, CardType, Card as BankCard } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const cardStatusLabels: Record<string, string> = {
  ACTIVE: 'Aktivna',
  BLOCKED: 'Blokirana',
  DEACTIVATED: 'Deaktivirana',
};

const cardStatusVariant: Record<string, 'success' | 'destructive' | 'secondary'> = {
  ACTIVE: 'success',
  BLOCKED: 'destructive',
  DEACTIVATED: 'secondary',
};

const cardTypeLabels: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  DINACARD: 'DinaCard',
  AMERICAN_EXPRESS: 'American Express',
};

function maskCardNumber(number: string): string {
  return `**** **** **** ${number.slice(-4)}`;
}

function formatBalance(amount: number, currency: string): string {
  return `${amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatAccountNumber(accountNumber: string): string {
  if (accountNumber.length !== 18) return accountNumber;
  return `${accountNumber.slice(0, 3)}-${accountNumber.slice(3, 16)}-${accountNumber.slice(16)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AccountCardsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [accountNumber, setAccountNumber] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardType, setNewCardType] = useState<CardType | ''>('');
  const [isCreating, setIsCreating] = useState(false);

  // Load account and cards from route param
  useEffect(() => {
    const loadById = async () => {
      if (!id) return;
      const accountId = Number(id);
      if (!accountId || Number.isNaN(accountId)) return;
      setLoading(true);
      try {
        const accountData = await accountService.getById(accountId);
        setAccountNumber(accountData.accountNumber);
        setAccount(accountData);
        const cardsData = await cardService.getByAccount(accountData.accountNumber);
        setCards(Array.isArray(cardsData) ? cardsData : []);
      } catch {
        toast.error('Greska pri ucitavanju racuna.');
      } finally {
        setLoading(false);
      }
    };
    loadById();
  }, [id]);

  const searchCards = useCallback(async () => {
    if (!accountNumber) {
      toast.error('Unesite broj racuna.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [accountData, cardsData] = await Promise.all([
        accountService.getByAccountNumber(accountNumber),
        cardService.getByAccount(accountNumber),
      ]);
      setAccount(accountData);
      setCards(Array.isArray(cardsData) ? cardsData : []);
    } catch {
      setError('Pretraga kartica nije uspela.');
      setCards([]);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [accountNumber]);

  const runAction = async (cardId: number, action: 'block' | 'unblock' | 'deactivate') => {
    setProcessingId(cardId);
    try {
      if (action === 'block') await cardService.block(cardId);
      if (action === 'unblock') await cardService.unblock(cardId);
      if (action === 'deactivate') await cardService.deactivate(cardId);
      toast.success('Status kartice je azuriran.');
      await searchCards();
    } catch {
      toast.error('Akcija nad karticom nije uspela.');
    } finally {
      setProcessingId(null);
    }
  };

  const createNewCard = async () => {
    if (!accountNumber || !newCardType) {
      toast.error('Izaberite tip kartice.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await cardService.create({ accountNumber, cardType: newCardType as CardType });
      await cardService.requestCardVerification(created.id);
      toast.success('Kartica kreirana. Poslat je zahtev za verifikaciju.');
      setShowCreateCard(false);
      setNewCardType('');
      await searchCards();
    } catch {
      toast.error('Kreiranje kartice nije uspelo.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/employee/accounts')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Nazad na portal racuna
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Portal kartica</h1>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[250px] space-y-1">
            <label className="text-xs text-muted-foreground">Broj racuna</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Unesite broj racuna (18 cifara)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === 'Enter' && searchCards()}
              />
            </div>
          </div>
          <Button onClick={searchCards} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Pretrazi
          </Button>
          <Button variant="outline" onClick={() => setShowCreateCard(!showCreateCard)}>
            <Plus className="mr-2 h-4 w-4" /> Nova kartica
          </Button>
        </div>

        {/* Account info */}
        {account && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Racun: <strong>{formatAccountNumber(account.accountNumber)}</strong></span>
            <span>Vlasnik: <strong>{account.ownerName}</strong></span>
            <Badge variant={account.status === 'ACTIVE' ? 'success' : account.status === 'BLOCKED' ? 'destructive' : 'secondary'}>
              {account.status === 'ACTIVE' ? 'Aktivan' : account.status === 'BLOCKED' ? 'Blokiran' : 'Neaktivan'}
            </Badge>
          </div>
        )}
      </Card>

      {/* Create card form */}
      {showCreateCard && account && (
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tip kartice</label>
              <Select value={newCardType} onValueChange={(val) => setNewCardType(val as CardType)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Izaberite tip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VISA">Visa</SelectItem>
                  <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                  <SelectItem value="DINACARD">DinaCard</SelectItem>
                  <SelectItem value="AMERICAN_EXPRESS">American Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createNewCard} disabled={isCreating || !newCardType}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Kreiraj karticu
            </Button>
            <Button variant="ghost" onClick={() => { setShowCreateCard(false); setNewCardType(''); }}>
              Otkazi
            </Button>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !account ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CreditCardIcon className="h-12 w-12 mb-3 opacity-30" />
          <p>Pretrazite racun da biste videli kartice</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CreditCardIcon className="h-12 w-12 mb-3 opacity-30" />
          <p>Nema kartica za ovaj racun</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Broj kartice</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Vlasnik</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Istek</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono">{maskCardNumber(card.cardNumber)}</TableCell>
                  <TableCell>
                    <Badge variant="info">{cardTypeLabels[card.cardType] || card.cardType}</Badge>
                  </TableCell>
                  <TableCell>{card.holderName}</TableCell>
                  <TableCell className="font-medium">
                    {formatBalance(card.limit, account.currency)}
                  </TableCell>
                  <TableCell>{formatDate(card.expirationDate)}</TableCell>
                  <TableCell>
                    <Badge variant={cardStatusVariant[card.status]}>
                      {cardStatusLabels[card.status] || card.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {card.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAction(card.id, 'block')}
                          disabled={processingId === card.id}
                          title="Blokiraj"
                        >
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      )}
                      {card.status === 'BLOCKED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAction(card.id, 'unblock')}
                          disabled={processingId === card.id}
                          title="Deblokiraj"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {card.status !== 'DEACTIVATED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => runAction(card.id, 'deactivate')}
                          disabled={processingId === card.id}
                          title="Deaktiviraj"
                        >
                          <ShieldX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
