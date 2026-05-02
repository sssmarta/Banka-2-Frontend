import { OrderType } from '@/types/celina3';

/**
 * Provizija banke na klijentske ordere prema spec Celina 3:
 * - Market/Stop: `min(14% * price, $7)`
 * - Limit/Stop-Limit: `min(24% * price, $12)`
 * Zaposleni / aktuari trguju sa bankinih racuna pa nema neto provizije
 * (`isEmployee=true` vraca 0). Bila duplirana u CreateOrderPage i MyOrdersPage
 * pa ekstrahovana ovde kao jedan izvor istine.
 */
export function getOrderCommission(
  orderType: OrderType,
  approximatePrice: number,
  isEmployee: boolean = false,
): number {
  if (isEmployee || approximatePrice <= 0) return 0;
  const usesLimitPricing =
    orderType === OrderType.LIMIT || orderType === OrderType.STOP_LIMIT;
  const rate = usesLimitPricing ? 0.24 : 0.14;
  const cap = usesLimitPricing ? 12 : 7;
  return Math.min(approximatePrice * rate, cap);
}
