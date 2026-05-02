import type { OtcInterbankContractStatus } from '@/types/celina4';

/**
 * Mape za OTC contract status (intra-bank + inter-bank, isti enum-set
 * ACTIVE/EXERCISED/EXPIRED) — Badge label i variant. Bili duplirani u
 * OtcOffersAndContractsPage i OtcInterBankContractsTab.
 */

type BadgeVariant = 'success' | 'secondary' | 'warning' | 'destructive';

export const OTC_CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktivan',
  EXERCISED: 'Iskoriscen',
  EXPIRED: 'Istekao',
};

export const OTC_CONTRACT_STATUS_BADGE_VARIANT: Record<OtcInterbankContractStatus, BadgeVariant> = {
  ACTIVE: 'success',
  EXERCISED: 'secondary',
  EXPIRED: 'warning',
};
