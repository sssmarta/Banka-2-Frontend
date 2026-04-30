/**
 * Per-page quick prompts za Arbitro empty state.
 * Reference: plan v3.3 §9.6.
 */

const STATIC_PROMPTS: Record<string, string[]> = {
  '/home': ['Sta sve mogu ovde?', 'Kako otvorim novi racun?', 'Pomozi mi sa placanjem', 'Sta je BELIBOR?'],
  '/dashboard': ['Sta sve mogu ovde?', 'Kako otvorim novi racun?', 'Pomozi mi sa placanjem'],
  '/accounts': ['Sta je raspolozivo stanje?', 'Kako menjam limit?', 'Razlika tekuci/devizni?'],
  '/payments/new': ['Sta je sifra placanja?', 'Sta je poziv na broj?', 'Razlika placanje/transfer?', 'Koliko ce trajati?'],
  '/payments/history': ['Kako filtriram placanja?', 'Sta znaci status U Obradi?'],
  '/transfers': ['Kolika je provizija?', 'Kako se racuna kurs?'],
  '/exchange': ['Koje valute podrzavate?', 'Kako se racuna kurs?'],
  '/cards': ['Kako da blokiram karticu?', 'Mogu li vise kartica?'],
  '/loans': ['Razlika fiksna/varijabilna kamata?', 'Sta je marza banke?'],
  '/loans/apply': ['Razlika fiksna/varijabilna kamata?', 'Sta je marza banke?', 'Koliki je period otplate stambenog?'],
  '/securities': ['Sta je LIVE/SIMULIRANI?', 'Kako kupujem hartiju?', 'Razlika akcije/futures/opcije?'],
  '/orders/new': ['Razlika Market/Limit/Stop?', 'Sta je AON?', 'Sta je margin?', 'Pretrazi short selling na Wikipediji'],
  '/orders/my': ['Kako otkazem order?', 'Sta znaci Pending?', 'Sta je After Hours?'],
  '/employee/orders': ['Kako odobravam order?', 'Sta znaci remaining portions?'],
  '/portfolio': ['Sta su moji holding-i?', 'Kako prodajem hartiju?', 'Sta je javni rezim?', 'Koliko sam zaradio?'],
  '/otc': ['Kako radi OTC?', 'Sta je premium?', 'Sta je strike?'],
  '/otc/offers': ['Kako prihvatam ponudu?', 'Sta znace boje?', 'Sta je SAGA?'],
  '/funds': ['Sta je investicioni fond?', 'Kako ulazem?', 'Razlika fond/akcije?'],
  '/funds/create': ['Sta je menadzer fonda?', 'Sta je minimalni ulog?'],
  '/employee/profit-bank': ['Sta su pozicije banke?', 'Kako se racuna profit?'],
  '/employee/actuaries': ['Sta je limit?', 'Kako reset usedLimit?'],
  '/employee/tax': ['Kako se racuna porez?', 'Kad se naplacuje?'],
  '/employee/exchanges': ['Sta radi test mode?', 'Kako se ukljucuje?'],
};

const DYNAMIC_PROMPTS: Array<[RegExp, string[]]> = [
  [/^\/accounts\/\d+$/, ['Sta je raspolozivo stanje?', 'Kako menjam limit?']],
  [/^\/securities\/\d+$/, ['Sta znaci grafikon?', 'Kako kupujem ovu hartiju?', 'Sta je strike price?']],
  [/^\/funds\/\d+$/, ['Sta su pozicije fonda?', 'Kako se racuna profit?']],
  [/^\/admin\/employees\/\d+$/, ['Koje permisije postoje?', 'Sta je supervizor?']],
];

export function quickPromptsForRoute(route: string): string[] {
  if (STATIC_PROMPTS[route]) return STATIC_PROMPTS[route];
  for (const [pattern, prompts] of DYNAMIC_PROMPTS) {
    if (pattern.test(route)) return prompts;
  }
  return ['Sta sve mogu ovde?', 'Pomozi mi'];
}
