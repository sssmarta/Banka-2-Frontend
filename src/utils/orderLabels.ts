import { ListingType, OrderDirection, OrderStatus, OrderType } from '@/types/celina3';

export const LISTING_TYPE_LABELS: Record<string, string> = {
  [ListingType.STOCK]: 'Akcija',
  [ListingType.FUTURES]: 'Futures',
  [ListingType.FOREX]: 'Forex',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.MARKET]: 'Market',
  [OrderType.LIMIT]: 'Limit',
  [OrderType.STOP]: 'Stop',
  [OrderType.STOP_LIMIT]: 'Stop-Limit',
};

export const ORDER_DIRECTION_LABELS: Record<OrderDirection, string> = {
  [OrderDirection.BUY]: 'Kupovina',
  [OrderDirection.SELL]: 'Prodaja',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Na cekanju',
  [OrderStatus.APPROVED]: 'Odobren',
  [OrderStatus.DECLINED]: 'Odbijen',
  [OrderStatus.DONE]: 'Zavrsen',
};

type BadgeVariant = 'warning' | 'success' | 'destructive' | 'secondary';

export const ORDER_STATUS_BADGE_VARIANT: Record<OrderStatus, BadgeVariant> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.APPROVED]: 'success',
  [OrderStatus.DECLINED]: 'destructive',
  [OrderStatus.DONE]: 'secondary',
};
