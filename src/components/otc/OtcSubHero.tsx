import { type LucideIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface OtcSubHeroProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Tailwind class npr "from-indigo-500" */
  gradientFrom: string;
  /** Tailwind class npr "to-violet-600" */
  gradientTo: string;
  /** Optional KPI chips ispod naslova (kratki sazetak iz stanja na strani). */
  kpis?: Array<{ label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }>;
  /** Opcionalni action node na desnoj strani (npr. dugme za refresh). */
  action?: React.ReactNode;
}

const KPI_TONE: Record<NonNullable<NonNullable<OtcSubHeroProps['kpis']>[number]['tone']>, string> = {
  default: 'bg-white/15 border-white/10',
  success: 'bg-emerald-400/25 border-emerald-300/30',
  warning: 'bg-amber-400/25 border-amber-300/30',
  danger: 'bg-rose-400/25 border-rose-300/30',
};

export default function OtcSubHero({
  icon: Icon,
  title,
  description,
  gradientFrom,
  gradientTo,
  kpis,
  action,
}: OtcSubHeroProps) {
  const navigate = useNavigate();
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/20`}>
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 -mb-16 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/otc')}
            className="-ml-2 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> OTC hub
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-0.5 text-sm text-white/80 max-w-xl">{description}</p>
              )}
            </div>
          </div>
          {kpis && kpis.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {kpis.map((kpi, idx) => (
                <div
                  key={`${kpi.label}-${idx}`}
                  className={`rounded-xl backdrop-blur-sm border px-3 py-1.5 ${KPI_TONE[kpi.tone ?? 'default']}`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{kpi.label}</div>
                  <div className="text-sm font-bold font-mono tabular-nums">{kpi.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
