import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Handshake } from 'lucide-react';
import otcService from '@/services/otcService';
import type { OtcListing } from '@/types/celina3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/utils/formatters';

export default function OtcMyPublicPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<OtcListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await otcService.listMyPublicListings();
        if (!cancelled) setListings(data ?? []);
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/otc')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Hub
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Moje javne akcije</h1>
          <p className="text-sm text-muted-foreground">
            Akcije koje ste stavili u javni rezim — drugi korisnici ih vide u "Pretrazi" tabu i mogu da
            vam posalju OTC ponudu. Da povecate / smanjite / uklonite javnu kolicinu, idite na{' '}
            <strong>Portfolio → kolona "Akcije"</strong>.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
            Moje javne akcije ({listings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-muted/50" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Handshake className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">Nemate javnih akcija</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Postavite broj akcija u javni rezim na Portfolio stranici, pa ce se ovde prikazati lista.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/portfolio')}>
                Otvori Portfolio
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hartija</TableHead>
                  <TableHead>Trenutna cena</TableHead>
                  <TableHead>Javno (raspolozivo / ukupno)</TableHead>
                  <TableHead className="text-right">Akcija</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.portfolioId} data-testid={`my-listing-${listing.listingId}`}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{listing.listingTicker}</span>
                        <span className="text-xs text-muted-foreground">{listing.listingName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatAmount(listing.currentPrice)} {listing.listingCurrency}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" className="font-mono">
                        {listing.availablePublicQuantity} / {listing.publicQuantity}
                      </Badge>
                      {listing.availablePublicQuantity < listing.publicQuantity && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {listing.publicQuantity - listing.availablePublicQuantity} u aktivnim ugovorima
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => navigate('/portfolio')}
                        title="Otvori Portfolio za izmenu javne kolicine"
                      >
                        Izmeni
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
