import type { LoanStatus, LoanType } from '@/types/celina2';

/**
 * Mape za status kredita + Badge variant + tip kredita. Bili duplirani u
 * 3 fajla: LoanListPage (klijent view), AllLoansPage (admin view),
 * LoanRequestsPage (zahtevi). Svaki je imao if/else lance umesto Record-a.
 */

type BadgeVariant = 'warning' | 'success' | 'info' | 'destructive' | 'secondary';

export const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Na cekanju',
  APPROVED: 'Odobren',
  ACTIVE: 'Aktivan',
  REJECTED: 'Odbijen',
  LATE: 'Kasnjenje',
  PAID: 'Otplacen',
  PAID_OFF: 'Prevremeno otplacen',
  CLOSED: 'Zatvoren',
};

export const LOAN_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  ACTIVE: 'success',
  REJECTED: 'destructive',
  LATE: 'destructive',
  PAID: 'secondary',
  PAID_OFF: 'secondary',
  CLOSED: 'secondary',
};

/** Boja leve granice u list/card prikazu kredita po statusu. */
export const LOAN_STATUS_ROW_BORDER: Record<string, string> = {
  ACTIVE: 'border-l-emerald-500',
  PENDING: 'border-l-amber-500',
  APPROVED: 'border-l-blue-500',
  REJECTED: 'border-l-red-500',
  LATE: 'border-l-red-500',
  PAID: 'border-l-gray-400',
  PAID_OFF: 'border-l-gray-400',
  CLOSED: 'border-l-gray-300',
};

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  GOTOVINSKI: 'Gotovinski',
  STAMBENI: 'Stambeni',
  AUTO: 'Auto',
  REFINANSIRAJUCI: 'Refinansirajuci',
  STUDENTSKI: 'Studentski',
};

export function getLoanStatusBadgeVariant(status: LoanStatus): BadgeVariant {
  return LOAN_STATUS_BADGE_VARIANT[status] ?? 'secondary';
}

export function getLoanStatusLabel(status: LoanStatus): string {
  return LOAN_STATUS_LABELS[status] ?? status;
}
