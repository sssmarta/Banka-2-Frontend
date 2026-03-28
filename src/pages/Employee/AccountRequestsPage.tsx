import { useEffect, useState, useMemo } from 'react';
import { toast } from '@/lib/notify';
import { Building2, Check, X as XIcon, Inbox, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';

interface AccountReq {
  id: number;
  accountType: string;
  currency: string;
  initialDeposit: number;
  createCard: boolean;
  clientEmail: string;
  clientName: string;
  status: string;
  createdAt: string;
  processedBy?: string;
}

const typeLabels: Record<string, string> = {
  CHECKING: 'Tekuci', FOREIGN: 'Devizni', BUSINESS: 'Poslovni',
};

const typeColors: Record<string, string> = {
  CHECKING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  FOREIGN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  BUSINESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const statusBorderColors: Record<string, string> = {
  PENDING: 'border-l-amber-500',
  APPROVED: 'border-l-emerald-500',
  REJECTED: 'border-l-red-500',
};

export default function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/requests?page=0&limit=50');
      const data = res.data;
      setRequests(Array.isArray(data?.content) ? data.content : []);
    } catch {
      toast.error('Neuspesno ucitavanje zahteva.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      if (action === 'approve') {
        await api.patch(`/accounts/requests/${id}/approve`);
        toast.success('Zahtev odobren, racun kreiran.');
      } else {
        const reason = window.prompt('Razlog odbijanja (opciono):');
        await api.patch(`/accounts/requests/${id}/reject`, { reason });
        toast.success('Zahtev odbijen.');
      }
      await load();
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || 'Akcija nije uspela.');
    } finally {
      setProcessing(null);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  }), [requests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zahtevi za racune</h1>
          <p className="text-sm text-muted-foreground">Pregledajte i odobrite zahteve klijenata za otvaranje racuna.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Ukupno', value: stats.total, icon: Building2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
          { label: 'Na cekanju', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
          { label: 'Odobreni', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
          { label: 'Odbijeni', value: stats.rejected, icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold font-mono">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nema zahteva za prikaz</h3>
              <p className="mt-1 text-sm text-muted-foreground">Trenutno nema zahteva za otvaranje racuna.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {requests.map(req => (
            <Card
              key={req.id}
              className={`rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 ${statusBorderColors[req.status] || 'border-l-gray-300 dark:border-l-gray-600'} overflow-hidden`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Client info + status */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-base">{req.clientName}</p>
                    <p className="text-sm text-muted-foreground">{req.clientEmail}</p>
                  </div>
                  <Badge variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'destructive' : 'warning'}>
                    {req.status === 'PENDING' ? 'Na cekanju' : req.status === 'APPROVED' ? 'Odobreno' : 'Odbijeno'}
                  </Badge>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Tip racuna</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${typeColors[req.accountType] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {typeLabels[req.accountType] || req.accountType}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Valuta</p>
                    <p className="font-mono font-medium">{req.currency}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Depozit</p>
                    <p className="font-mono font-medium tabular-nums">{Number(req.initialDeposit || 0).toLocaleString('sr-RS')}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Kartica</p>
                    <p className="font-medium">{req.createCard ? 'Da' : 'Ne'}</p>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground">
                  {new Date(req.createdAt).toLocaleString('sr-RS')}
                </p>

                {/* Actions */}
                {req.status === 'PENDING' ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={processing === req.id}
                      onClick={() => handleAction(req.id, 'approve')}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-sm hover:shadow-md transition-all h-9"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Odobri
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processing === req.id}
                      onClick={() => handleAction(req.id, 'reject')}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 h-9"
                    >
                      <XIcon className="h-3.5 w-3.5 mr-1.5" /> Odbij
                    </Button>
                  </div>
                ) : req.processedBy ? (
                  <p className="text-xs text-muted-foreground pt-1">Obradio: {req.processedBy}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
