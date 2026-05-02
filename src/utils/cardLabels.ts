/**
 * Mape za status kartice + Badge variant + tip kartice. Bili duplirani izmedju
 * CardListPage (inline funkcije) i AccountCardsPage (Record-i).
 *
 * Gradijenti za karticu se NE deli ovde — CardListPage koristi dramaticnije
 * via->slate-900 verzije za Liquid Glass dizajn 3D-tilted card-a, dok
 * AccountCardsPage koristi lakse dvo-stop gradijente za listu. Razlicit visual
 * intent.
 */

type CardBadgeVariant = 'success' | 'warning' | 'secondary';

export const CARD_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktivna',
  BLOCKED: 'Blokirana',
  DEACTIVATED: 'Deaktivirana',
};

export const CARD_STATUS_BADGE_VARIANT: Record<string, CardBadgeVariant> = {
  ACTIVE: 'success',
  BLOCKED: 'warning',
  DEACTIVATED: 'secondary',
};

/** Boja tackice/dot indikatora pored statusa kartice u listama. */
export const CARD_STATUS_DOTS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  BLOCKED: 'bg-red-500',
  DEACTIVATED: 'bg-gray-400 dark:bg-gray-500',
};

export const CARD_TYPE_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  DINACARD: 'DinaCard',
  AMERICAN_EXPRESS: 'American Express',
};
