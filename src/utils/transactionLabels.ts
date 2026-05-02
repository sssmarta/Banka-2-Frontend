/**
 * Mape za transaction (placanje) status — labela + Badge variant.
 * Bila duplirana izmedju AccountListPage / AccountDetailsPage /
 * BusinessAccountDetailsPage / HomePage (HomePage je radio inline ternary).
 */

type BadgeVariant = 'warning' | 'success' | 'destructive' | 'secondary';

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Na cekanju',
  COMPLETED: 'Zavrsena',
  REJECTED: 'Odbijena',
  CANCELLED: 'Otkazana',
};

export const TRANSACTION_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
};

/**
 * Mape za account status — labela + Badge variant.
 * Bila duplirana u AccountListPage / AccountDetailsPage.
 */

type AccountBadgeVariant = 'success' | 'destructive' | 'secondary';

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktivan',
  BLOCKED: 'Blokiran',
  INACTIVE: 'Neaktivan',
};

export const ACCOUNT_STATUS_BADGE_VARIANT: Record<string, AccountBadgeVariant> = {
  ACTIVE: 'success',
  BLOCKED: 'destructive',
  INACTIVE: 'secondary',
};
