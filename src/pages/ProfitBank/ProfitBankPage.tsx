import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Landmark, TrendingUp, Users, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import profitBankService from '@/services/profitBankService';
import investmentFundService from '@/services/investmentFundService';
import FundInvestDialog from '@/pages/Funds/FundInvestDialog';
import FundWithdrawDialog from '@/pages/Funds/FundWithdrawDialog';
import { useAuth } from '@/context/AuthContext';
import type { ActuaryProfit, ClientFundPosition } from '@/types/celina4';
import { formatAmount, getErrorMessage } from '@/utils/formatters';
import { toast } from '@/lib/notify';

/**
 * P6 — Spec Celina 4 (Nova) §4393-4645: Portal "Profit Banke" za supervizore.
 *
 * Dva taba:
 *  1. Profit aktuara: ime, prezime, pozicija, profit u RSD, broj ordera
 *  2. Pozicije u fondovima: fondovi u kojima banka ima udele
 *
 * Backend mora vratiti supervizorske podatke; ako nije implementirano,
 * vraca 501/empty array — ovde renderujemo "Banka nema pozicije" stanje.
 */
type DialogState =
  | { mode: 'invest'; fundId: number; fundName: string; minimumContribution: number }
  | { mode: 'withdraw'; fundId: number; fundName: string; position: ClientFundPosition }
  | null;

export default function ProfitBankPage() {
  const { isSupervisor } = useAuth();
  const [tab, setTab] = useState<'actuaries' | 'positions'>('actuaries');
  const [actuaries, setActuaries] = useState<ActuaryProfit[]>([]);
  const [bankPositions, setBankPositions] = useState<ClientFundPosition[]>([]);
  const [loadingActuaries, setLoadingActuaries] = useState(true);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [minByFundId, setMinByFundId] = useState<Record<number, number>>({});
  const [dialog, setDialog] = useState<DialogState>(null);

  const reloadBankPositions = async () => {
    setLoadingPositions(true);
    try {
      const data = await profitBankService.listBankFundPositions();
      setBankPositions(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Greska pri ucitavanju pozicija banke'));
    } finally {
      setLoadingPositions(false);
    }
  };

  useEffect(() => {
    if (!isSupervisor) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await profitBankService.listActuaryPerformance();
        if (!cancelled) setActuaries(data);
      } catch (err: unknown) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Greska pri ucitavanju profita aktuara'));
      } finally {
        if (!cancelled) setLoadingActuaries(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isSupervisor]);

  useEffect(() => {
    if (!isSupervisor) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await profitBankService.listBankFundPositions();
        if (!cancelled) setBankPositions(data);
      } catch (err: unknown) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Greska pri ucitavanju pozicija banke'));
      } finally {
        if (!cancelled) setLoadingPositions(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isSupervisor]);

  // Spec Celina 4 (Nova) §4585-4628: Uplata/Povlacenje akcije po fondu.
  // Da bismo mogli da otvorimo FundInvestDialog za bilo koji fond u kome banka
  // ima poziciju, povlacimo `minimumContribution` iz `/funds` liste.
  useEffect(() => {
    if (!isSupervisor) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await investmentFundService.list();
        if (cancelled) return;
        const map: Record<number, number> = {};
        for (const f of list) {
          map[f.id] = f.minimumContribution;
        }
        setMinByFundId(map);
      } catch {
        // best-effort — bez minimuma, dialog ce koristiti 0 kao default i BE ce vracati 400 ako ne valja.
      }
    })();
    return () => { cancelled = true; };
  }, [isSupervisor]);

  if (!isSupervisor) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profit Banke</h1>
          <p className="text-sm text-muted-foreground">
            Pregled profita aktuara i bankinih pozicija u investicionim fondovima (RSD).
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'actuaries' | 'positions')}>
        <TabsList>
          <TabsTrigger value="actuaries">
            <Users className="mr-2 h-4 w-4" /> Profit aktuara
          </TabsTrigger>
          <TabsTrigger value="positions">
            <TrendingUp className="mr-2 h-4 w-4" /> Pozicije u fondovima
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actuaries" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit aktuara (RSD)</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActuaries ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded bg-muted/50" />
                  ))}
                </div>
              ) : actuaries.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nema podataka o profitu aktuara.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aktuar</TableHead>
                      <TableHead>Pozicija</TableHead>
                      <TableHead className="text-right">Broj ordera</TableHead>
                      <TableHead className="text-right">Profit (RSD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actuaries.map((a) => (
                      <TableRow key={a.employeeId}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>
                          <Badge variant={a.position === 'SUPERVISOR' ? 'success' : 'secondary'}>
                            {a.position === 'SUPERVISOR' ? 'Supervizor' : 'Agent'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{a.ordersDone}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(a.totalProfitRsd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bankine pozicije u fondovima</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPositions ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded bg-muted/50" />
                  ))}
                </div>
              ) : bankPositions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Banka trenutno nema pozicije u fondovima. Backend cesto vraca prazan list dok
                  flow uplata banke u fondove nije dovrsen (P9).
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fond</TableHead>
                      <TableHead className="text-right">Ulozeno (RSD)</TableHead>
                      <TableHead className="text-right">Trenutna vrednost (RSD)</TableHead>
                      <TableHead className="text-right">% fonda</TableHead>
                      <TableHead className="text-right">Profit (RSD)</TableHead>
                      <TableHead className="text-right">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankPositions.map((p) => {
                      const profit = (p.currentValue ?? 0) - (p.totalInvested ?? 0);
                      const fundName = p.fundName ?? `Fond #${p.fundId}`;
                      const minContribution = minByFundId[p.fundId] ?? 0;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{fundName}</TableCell>
                          <TableCell className="text-right font-mono">{formatAmount(p.totalInvested ?? 0)}</TableCell>
                          <TableCell className="text-right font-mono">{formatAmount(p.currentValue ?? 0)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {p.percentOfFund != null ? `${p.percentOfFund.toFixed(2)}%` : '—'}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatAmount(profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDialog({
                                    mode: 'invest',
                                    fundId: p.fundId,
                                    fundName,
                                    minimumContribution: minContribution,
                                  })
                                }
                              >
                                <ArrowDownToLine className="mr-1 h-3.5 w-3.5" />
                                Uplati u ime banke
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={(p.currentValue ?? 0) <= 0}
                                onClick={() =>
                                  setDialog({
                                    mode: 'withdraw',
                                    fundId: p.fundId,
                                    fundName,
                                    position: p,
                                  })
                                }
                              >
                                <ArrowUpFromLine className="mr-1 h-3.5 w-3.5" />
                                Povuci u ime banke
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dialog?.mode === 'invest' && (
        <FundInvestDialog
          open
          fundId={dialog.fundId}
          fundName={dialog.fundName}
          minimumContribution={dialog.minimumContribution}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            void reloadBankPositions();
          }}
        />
      )}

      {dialog?.mode === 'withdraw' && (
        <FundWithdrawDialog
          open
          fundId={dialog.fundId}
          fundName={dialog.fundName}
          myPosition={dialog.position}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            void reloadBankPositions();
          }}
        />
      )}
    </div>
  );
}
