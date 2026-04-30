/**
 * Mapa rute → human-readable naziv koji se salje u PageContextDto.pageName
 * (BE PromptRegistry koristi tacnu rutu za fragment; ovo je samo za prikaz
 * u USER CONTEXT BLOCK-u i u FE quick prompts subtitle-u).
 *
 * Reference: Info o predmetu/LLM_Asistent_Plan.txt v3.3 §9.3.
 */

const STATIC_NAMES: Record<string, string> = {
  '/': 'Pocetna',
  '/home': 'Pocetna',
  '/dashboard': 'Pocetna',
  '/login': 'Prijava',
  '/forgot-password': 'Zaboravljena lozinka',
  '/reset-password': 'Resetovanje lozinke',
  '/activate-account': 'Aktivacija naloga',
  '/accounts': 'Moji racuni',
  '/payments/new': 'Novo placanje',
  '/payments/history': 'Pregled placanja',
  '/payments/recipients': 'Primaoci placanja',
  '/transfers': 'Transferi',
  '/transfers/new': 'Novi transfer',
  '/transfers/history': 'Istorija transfera',
  '/exchange': 'Menjacnica',
  '/cards': 'Kartice',
  '/loans': 'Krediti',
  '/loans/apply': 'Zahtev za kredit',
  '/margin-accounts': 'Marzni racuni',
  '/admin/employees': 'Upravljanje zaposlenima',
  '/admin/employees/new': 'Novi zaposleni',
  '/employee/dashboard': 'Supervizor dashboard',
  '/employee/accounts': 'Upravljanje racunima',
  '/employee/accounts/new': 'Kreiraj racun',
  '/employee/cards': 'Upravljanje karticama',
  '/employee/card-requests': 'Zahtevi za kartice',
  '/employee/account-requests': 'Zahtevi za racune',
  '/employee/clients': 'Upravljanje klijentima',
  '/employee/loan-requests': 'Zahtevi za kredite',
  '/employee/loans': 'Spisak kredita',
  '/employee/orders': 'Pregled ordera',
  '/employee/actuaries': 'Upravljanje aktuarima',
  '/employee/tax': 'Porez tracking',
  '/employee/exchanges': 'Berze',
  '/employee/profit-bank': 'Profit Banke',
  '/securities': 'Hartije od vrednosti',
  '/orders/new': 'Kreiraj nalog',
  '/orders/my': 'Moji nalozi',
  '/portfolio': 'Moj portfolio',
  '/otc': 'OTC trgovina',
  '/otc/offers': 'OTC ponude i ugovori',
  '/funds': 'Investicioni fondovi',
  '/funds/create': 'Kreiraj fond',
  '/403': 'Pristup odbijen',
  '/500': 'Greska servera',
};

const DYNAMIC_PATTERNS: Array<[RegExp, string]> = [
  [/^\/accounts\/\d+$/, 'Detalji racuna'],
  [/^\/accounts\/\d+\/business$/, 'Detalji poslovnog racuna'],
  [/^\/admin\/employees\/\d+$/, 'Edit zaposlenog'],
  [/^\/employee\/accounts\/\d+\/cards$/, 'Kartice racuna'],
  [/^\/employee\/clients\/\d+$/, 'Detalji klijenta'],
  [/^\/securities\/\d+$/, 'Detalji hartije'],
  [/^\/funds\/\d+$/, 'Detalji fonda'],
];

export function pageNameForRoute(route: string): string {
  if (STATIC_NAMES[route]) return STATIC_NAMES[route];
  for (const [pattern, name] of DYNAMIC_PATTERNS) {
    if (pattern.test(route)) return name;
  }
  return 'Stranica';
}
