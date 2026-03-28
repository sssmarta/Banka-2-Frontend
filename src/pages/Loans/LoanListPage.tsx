//
// Ova stranica prikazuje kredite ulogovanog korisnika.
// - creditService.getMyLoans() za fetch
// - Lista: tip kredita, iznos, mesecna rata, preostali dug, status
// - Klik na kredit => expand/modal sa detaljima i ratama
// - creditService.getInstallments(loanId) za rate
// - Link na LoanApplicationPage za novi zahtev
// - Spec: "Krediti" iz Celine 2

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Inbox, ChevronDown, ChevronUp, ArrowRight, TrendingUp, CalendarDays, Banknote, Clock } from 'lucide-react';
import { toast } from '@/lib/notify';
import { creditService } from '@/services/creditService';
import type { Installment, Loan } from '@/types/celina2';
import { asArray, formatAmount, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


function statusBadgeVariant(status: Loan['status']): 'success' | 'warning' | 'info' | 'destructive' | 'secondary' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'APPROVED') return 'info';
  if (status === 'REJECTED') return 'destructive';
  if (status === 'LATE') return 'destructive';
  if (status === 'PAID' || status === 'PAID_OFF') return 'secondary';
  return 'secondary';
}

function statusLabel(status: Loan['status']): string {
  if (status === 'ACTIVE') return 'Aktivan';
  if (status === 'PENDING') return 'Na cekanju';
  if (status === 'APPROVED') return 'Odobren';
  if (status === 'REJECTED') return 'Odbijen';
  if (status === 'PAID') return 'Otplacen';
  if (status === 'PAID_OFF') return 'Prevremeno otplacen';
  if (status === 'LATE') return 'Kasnjenje';
  if (status === 'CLOSED') return 'Zatvoren';
  return status;
}


/* Circular progress ring */
function ProgressRing({ value, size = 120, strokeWidth = 8, color = 'indigo' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (value / 100) * circumference;
  const colorMap: Record<string, string> = {
    indigo: 'stroke-indigo-500',
    emerald: 'stroke-emerald-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500',
  };
  const strokeColor = value >= 100 ? 'stroke-emerald-500' : (colorMap[color] || 'stroke-indigo-500');

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={strokeWidth}
        className="stroke-muted/30"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
        className={`${strokeColor} transition-all duration-1000 ease-out`}
        strokeDasharray={circumference}
        strokeDashoffset={strokeOffset}
      />
    </svg>
  );
}

export default function LoanListPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [processingEarlyRepayment, setProcessingEarlyRepayment] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await creditService.getMyLoans();
        const sorted = asArray<Loan>(data).sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
        setLoans(sorted);
      } catch {
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedLoan) {
      setInstallments([]);
      return;
    }

    const loadInstallments = async () => {
      setLoadingInstallments(true);
      try {
        const data = await creditService.getInstallments(selectedLoan.id);
        setInstallments(asArray<Installment>(data));
      } catch {
        toast.error('Neuspesno ucitavanje rata.');
        setInstallments([]);
      } finally {
        setLoadingInstallments(false);
      }
    };

    loadInstallments();
  }, [selectedLoan]);

  const paidInstallments = useMemo(
    () => asArray<Installment>(installments).filter((installment) => installment.paid).length,
    [installments]
  );

  const progress = useMemo(() => {
    if (!selectedLoan || selectedLoan.amount <= 0) return 0;
    const paidPart = selectedLoan.amount - selectedLoan.remainingDebt;
    return Math.max(0, Math.min(100, (paidPart / selectedLoan.amount) * 100));
  }, [selectedLoan]);

  const safeLoans = asArray<Loan>(loans);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moji krediti</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pregled svih vasih kredita i detalja otplate</p>
          </div>
        </div>
      </div>

      {/* CTA card */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 p-6 text-white cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 group"
        onClick={() => navigate('/loans/apply')}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Potreban vam je kredit?</h2>
            <p className="text-white/80 mt-1 text-sm">Podnesite zahtev brzo i jednostavno, uz pregled kamatne stope u realnom vremenu.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 font-semibold group-hover:bg-white/30 transition-colors">
            Zahtev za kredit
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-60 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : safeLoans.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg text-muted-foreground">Trenutno nema kredita</p>
              <p className="text-sm text-muted-foreground mt-1">Podnesite zahtev za kredit klikom na dugme iznad.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6">
          {safeLoans.map((loan, index) => {
            const isSelected = selectedLoan?.id === loan.id;
            const loanProgress = Math.max(0, Math.min(100, ((loan.amount - loan.remainingDebt) / loan.amount) * 100 || 0));
            return (
              <Card
                key={loan.id}
                className="rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 overflow-hidden"
                style={{ animation: `fadeUp 0.5s ease-out ${index * 0.08}s both` }}
              >
                <CardContent className="p-0">
                  {/* Hero section with circular progress */}
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Circular progress */}
                    <div className="relative flex-shrink-0">
                      <ProgressRing value={loanProgress} size={100} strokeWidth={7} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold tabular-nums">{loanProgress.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">otplaceno</span>
                      </div>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{loan.loanType} kredit</h3>
                        <Badge variant={statusBadgeVariant(loan.status)}>
                          {statusLabel(loan.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Banknote className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Iznos</p>
                            <p className="text-sm font-bold">{formatAmount(loan.amount)} {loan.currency}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mesecna rata</p>
                            <p className="text-sm font-bold">{formatAmount(loan.monthlyPayment)} {loan.currency}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Preostali dug</p>
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatAmount(loan.remainingDebt)} {loan.currency}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Period</p>
                            <p className="text-sm font-bold">{loan.repaymentPeriod} meseci</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expand button */}
                  <div className="px-6 pb-4">
                    <Button
                      variant="outline"
                      className="w-full hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
                      onClick={() => setSelectedLoan(isSelected ? null : loan)}
                    >
                      {isSelected ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                      {isSelected ? 'Sakrij detalje' : 'Prikazi detalje'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* Selected loan details + timeline */}
      {selectedLoan && (
        <Card className="rounded-2xl overflow-hidden" style={{ animation: 'fadeUp 0.4s ease-out' }}>
          <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
              <CardTitle>Detalji kredita #{selectedLoan.loanNumber || selectedLoan.id}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Stats row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Nominalna stopa', value: `${formatAmount(selectedLoan.nominalRate)}%`, icon: TrendingUp, color: 'indigo' },
                { label: 'Efektivna stopa', value: `${formatAmount(selectedLoan.effectiveRate)}%`, icon: TrendingUp, color: 'violet' },
                { label: 'Pocetak', value: formatDate(selectedLoan.startDate), icon: CalendarDays, color: 'emerald' },
                { label: 'Kraj', value: formatDate(selectedLoan.endDate), icon: CalendarDays, color: 'orange' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`h-4 w-4 text-${item.color}-500`} />
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</p>
                  </div>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Progress ring centered */}
            <div className="flex justify-center">
              <div className="relative">
                <ProgressRing value={progress} size={140} strokeWidth={10} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums">{progress.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground">otplaceno</span>
                </div>
              </div>
            </div>

            {/* Installment timeline */}
            {loadingInstallments ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-4 w-4 rounded-full bg-muted" />
                    <div className="h-4 flex-1 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : asArray<Installment>(installments).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Nema dostupnih rata</p>
                <p className="text-sm text-muted-foreground mt-1">Rate ce biti prikazane nakon aktivacije kredita.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Plan otplate</h3>
                <div className="max-h-[420px] overflow-y-auto pr-2 space-y-0">
                  {asArray<Installment>(installments).map((installment, index) => {
                    const isLast = index === installments.length - 1;
                    const dotColor = installment.paid
                      ? 'bg-emerald-500 shadow-emerald-500/30'
                      : 'bg-muted-foreground/30';
                    const lineColor = installment.paid
                      ? 'bg-emerald-500/30'
                      : 'bg-muted/50';

                    return (
                      <div key={installment.id} className="flex gap-4 group">
                        {/* Timeline column */}
                        <div className="flex flex-col items-center">
                          <div className={`h-4 w-4 rounded-full ${dotColor} shadow-md flex-shrink-0 transition-all group-hover:scale-125`} />
                          {!isLast && <div className={`w-0.5 flex-1 ${lineColor} min-h-[40px]`} />}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pb-4 -mt-0.5 rounded-xl px-4 py-3 mb-1 transition-colors ${installment.paid ? 'bg-emerald-500/5' : 'hover:bg-muted/30'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground w-8">#{index + 1}</span>
                              <div>
                                <p className="font-semibold text-sm tabular-nums">{formatAmount(installment.amount)} {installment.currency}</p>
                                <p className="text-xs text-muted-foreground">
                                  Glavnica: {formatAmount(installment.principalAmount)} | Kamata: {formatAmount(installment.interestAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{formatDate(installment.expectedDueDate)}</span>
                              <div className={`h-2 w-2 rounded-full ${installment.paid ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Placeno rata: <span className="font-bold text-foreground">{paidInstallments}</span> / {asArray<Installment>(installments).length}
              </p>
              {(selectedLoan.status === 'ACTIVE' || selectedLoan.status === 'LATE') && selectedLoan.remainingDebt > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={processingEarlyRepayment}
                  className="hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Da li ste sigurni da zelite prevremenu otplatu kredita?\nPreostali dug: ${formatAmount(selectedLoan.remainingDebt)} ${selectedLoan.currency}`
                    );
                    if (!confirmed) return;
                    setProcessingEarlyRepayment(true);
                    try {
                      await creditService.earlyRepayment(selectedLoan.id);
                      toast.success('Zahtev za prevremenu otplatu je uspesno podnet.');
                      const data = await creditService.getMyLoans();
                      setLoans(asArray<Loan>(data).sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)));
                      setSelectedLoan(null);
                    } catch {
                      toast.error('Prevremena otplata nije uspela.');
                    } finally {
                      setProcessingEarlyRepayment(false);
                    }
                  }}
                >
                  {processingEarlyRepayment ? 'Obrada...' : 'Prevremena otplata'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
