import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface OtcHubCardProps {
  icon: LucideIcon;
  title: string;
  /** Tailwind class npr "from-indigo-500" */
  gradientFrom: string;
  /** Tailwind class npr "to-violet-600" */
  gradientTo: string;
  primaryStat: string;
  primaryStatLabel: string;
  secondaryStat?: string;
  warningBadge?: boolean;
  warningBadgeText?: string;
  loading?: boolean;
  onClick: () => void;
  dataTestId: string;
}

export default function OtcHubCard({
  icon: Icon,
  title,
  gradientFrom,
  gradientTo,
  primaryStat,
  primaryStatLabel,
  secondaryStat,
  warningBadge,
  warningBadgeText,
  loading,
  onClick,
  dataTestId,
}: OtcHubCardProps) {
  if (loading) {
    return (
      <Card className="h-44 animate-pulse bg-muted/50" data-testid={`${dataTestId}-loading`} />
    );
  }
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="h-44 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5"
      data-testid={dataTestId}
    >
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-md shadow-indigo-500/20`}
          >
            <Icon className="h-5 w-5" />
          </div>
          {warningBadge && warningBadgeText && (
            <Badge variant="warning" className="text-[10px]">
              <span aria-hidden="true">⚠️</span>
              <span className="ml-1">{warningBadgeText}</span>
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{primaryStat}</span>
            <span className="text-xs text-muted-foreground">{primaryStatLabel}</span>
          </div>
          {secondaryStat && (
            <p className="mt-1 text-xs text-muted-foreground">{secondaryStat}</p>
          )}
        </div>
        <div className="flex items-center justify-end text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Otvori <ArrowRight className="ml-1 h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  );
}
