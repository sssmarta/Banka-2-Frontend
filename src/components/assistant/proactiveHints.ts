/**
 * Per-page proaktivni hint koji se prikazuje iznad FAB-a 5s pri navigaciji
 * na novu stranicu. Klik = otvori panel sa pre-popunjenim prompt-om.
 *
 * Reference: plan v3.3 §8 (PROAKTIVNI HINT).
 */

const STATIC_HINTS: Record<string, string> = {
  '/orders/new': 'Pitaj me o tipovima ordera',
  '/loans/apply': 'Pitaj me o razlici fiksne i varijabilne kamate',
  '/otc': 'Pitaj me kako radi OTC trgovina',
  '/otc/offers': 'Pitaj me sta znace boje ponuda',
  '/funds': 'Pitaj me sta je investicioni fond',
  '/portfolio': 'Pitaj me sta su moje pozicije',
  '/payments/new': 'Pitaj me sta je sifra placanja',
  '/cards': 'Pitaj me razliku Visa i Mastercard',
  '/exchange': 'Pitaj me kako se racuna kurs',
  '/employee/tax': 'Pitaj me kako se racuna porez na dobit',
  '/employee/orders': 'Pitaj me kako odobravam order',
};

const DYNAMIC_HINTS: Array<[RegExp, string]> = [
  [/^\/securities\/\d+$/, 'Pitaj me sta znaci ova hartija'],
  [/^\/funds\/\d+$/, 'Pitaj me kako se racuna profit ovog fonda'],
];

export function hintForRoute(route: string): string | null {
  if (STATIC_HINTS[route]) return STATIC_HINTS[route];
  for (const [pattern, hint] of DYNAMIC_HINTS) {
    if (pattern.test(route)) return hint;
  }
  return null;
}
