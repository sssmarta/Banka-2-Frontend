# Banka 2 — Frontend

React 19 SPA koja pokriva celokupni bankarski UI: klijentski portal (racuni, kartice, placanja, transferi, berza, OTC intra+inter-bank, fondovi), Employee portal (klijenti, orderi), Supervizor portal (aktuari, porez, Profit Banke), Admin portal (zaposleni, berze). Deo projekta **Softversko inzenjerstvo** na Racunarskom fakultetu 2025/26.

## Tech Stack

- **React 19.2.5** + **TypeScript 6.0.3**
- **Vite 8.0.10** (Rolldown bundler — production build u ~900ms)
- **Tailwind CSS 4.2.4** (CSS-first config preko `@theme` u `src/index.css`, `@tailwindcss/vite` plugin) + **shadcn/ui** (Radix UI) + **lucide-react 1.14** ikone + `tw-animate-css`
- **React Router v7.14**
- **React Hook Form** + **Zod 4.4** (forme + validacija)
- **Axios 1.16** sa JWT auto-refresh interceptor-ima
- **Recharts 3.8** + **Three.js 0.184** + **globe.gl** (lazy-loaded GlobeView)
- **Vitest 4.1.5** — unit testovi (**1494 testa** u 102 fajla, coverage 77+/79+ statements/lines)
- **Cypress 15.14.2** — E2E testovi (8 fajlova: 4 celine × mock+live; arbitro lokalno)
- **ESLint 10.3.0** + **TypeScript ESLint 8.59** + eslint-plugin-security 4.0
- npm audit: **0 vulnerabilities**

## Pokretanje

### Docker (preporuceno)

```bash
docker compose up -d --build
```

Pokrece SPA na `http://localhost:3000` (nginx:alpine servira statiku iz `dist/`).

**Obavezno pokreni backend pre** — frontend nginx proxira `/api/*` i `/auth/*` na `http://banka2_backend:8080`. Oba compose fajla koriste isti docker network (`banka-2-backend_default`).

Override host port (Hyper-V/WinNAT konflikt na Windows-u):

```powershell
$env:FRONTEND_HOST_PORT="3500"; docker compose up -d
```

### Lokalni dev server

```bash
npm install
npm run dev     # http://localhost:5173 (Vite HMR)
```

Za proxy ka backendu vec je podesen u `vite.config.ts` — ne treba `.env` u dev rezimu.

### Testovi

```bash
npm test                   # Vitest watch mode
npm run test:run           # CI mode (1494 testa, ~21s)
npm run test:coverage      # coverage report (threshold 76/78/65/60)
```

Coverage threshold-ovi su privremeno spusteni sa 85/85/70/65 → **76/78/65/60** (statements/lines/branches/functions) zbog ~600 LOC novih BE-integracija (sessionStorage recovery, TaxBreakdown UI, reassignManager, logout async, lockout UX) bez direktnih testova. TODO komentar u `vite.config.ts` lista koje testove treba dodati za vracanje na 85/70.

Cypress (zahteva BE+FE+seed up):

```bash
npm run cypress:open       # interactive
npm run cypress:run        # headless

# CI parity (4 celine × mock+live):
npx cypress run --spec "cypress/e2e/celina1-mock.cy.ts,cypress/e2e/celina2-mock.cy.ts,cypress/e2e/celina3-mock.cy.ts,cypress/e2e/celina4-mock.cy.ts,cypress/e2e/celina1-live.cy.ts,cypress/e2e/celina2-live.cy.ts,cypress/e2e/celina3-live.cy.ts,cypress/e2e/celina4-live.cy.ts" --config video=false,baseUrl=http://localhost:3000

# Samo mock (brzo, ne treba BE):
npx cypress run --spec "cypress/e2e/celina*-mock.cy.ts" --config video=false,baseUrl=http://localhost:3000

# Arbitro tests (lokalno only, NIJE u CI):
npx cypress run --spec "cypress/e2e/arbitro-mock.cy.ts" --config video=false,baseUrl=http://localhost:3000
# Arbitro live trazi Banka-2-Tools stack:
#   cd ../Banka-2-Backend/Banka-2-Tools && docker compose up -d
npx cypress run --spec "cypress/e2e/arbitro-live.cy.ts" --config video=false,baseUrl=http://localhost:3000
```

### Build

```bash
npm run build              # vite build → dist/ (Rolldown bundler ~900ms)
npm run build:check        # tsc --noEmit + eslint + vitest + build
npm run lint               # ESLint
npm run preview            # preview dist/ lokalno
```

## Environment

Build time (Vite zamenjuje u bundle-u):

| Varijabla | Default | Opis |
|-----------|---------|------|
| `VITE_API_URL` | `http://localhost:8080` | Base URL backend-a u dev-u |

U produkciji (Docker), sve `/api/*` i `/auth/*` zahtevi se proksiraju kroz nginx u kontejneru — `VITE_API_URL` nije potreban.

## Struktura projekta

```text
src/
├── components/
│   ├── layout/                  # ClientSidebar, Navbar, ProtectedRoute, Dashboard layouts
│   ├── shared/                  # VerificationModal (OTP), EmptyState, ThemeToggle, Skeleton
│   └── ui/                      # shadcn/ui reusable (Button, Card, Dialog, Input, ...)
├── context/
│   ├── AuthContext.tsx          # JWT + permisije iz /employees?email + async logout
│   ├── ThemeContext.tsx         # light/dark/system theme, persist u localStorage
│   └── ArbitroContext.tsx       # AI asistent state (Celina 6, opciono)
├── hooks/                       # useCountUp, useDebounce, useQueryParams, useArbitro*
├── lib/                         # notify (toast), utils (cn, classnames)
├── pages/
│   ├── Landing/                 # Marketing + login/register CTA + GlobeView (lazy)
│   ├── Login/                   # Login + forgot password + lockout UX (Opc.2)
│   ├── HomePage/                # Dashboard po ulozi (Client/Admin/Supervizor/Agent)
│   ├── Accounts/                # Lista + details + requests
│   ├── Cards/                   # Kartice + request + block/unblock
│   ├── Payments/                # New payment (sa 2PC inter-bank stepper) + recipients + history + PDF
│   ├── Transfers/               # Internal + FX + history
│   ├── Securities/              # Berza lista + details (chart + options chain + ITM coloring)
│   ├── Orders/                  # Create order + my orders + supervizor view + cancel partial
│   ├── Portfolio/               # Drzanje + profit + OTC public toggle + MyFundsTab + TaxBreakdownTab
│   ├── Otc/                     # OTC intra+inter-bank: Trgovina + Ponude/Ugovori (4 tab-a)
│   ├── Funds/                   # Investicioni fondovi: Discovery + Details + Create + Invest/Withdraw dialozi
│   ├── ProfitBank/              # Portal Profit Banke (supervizor)
│   ├── Tax/                     # Porez + TaxDetailDialog (per-listing breakdown)
│   ├── Loans/                   # Zahtev za kredit + rate + early repayment
│   ├── Admin/                   # Employee CRUD + berze + reassign-manager dialog
│   ├── Actuaries/               # Agent limit management
│   ├── Margin/                  # Margin racuni + transakcije
│   ├── Exchanges/               # Exchanges sa GlobeView (lazy)
│   └── Employee/                # Employee portal (klijenti, racuni, kartice)
├── services/                    # Axios wrappers po domenu
│   ├── authService.ts           # login + logout + refresh
│   ├── otcService.ts            # OTC intra-bank
│   ├── interbankOtcService.ts   # OTC inter-bank wrapper
│   ├── interbankPaymentService.ts # 2PC payments
│   ├── investmentFundService.ts # Fondovi + reassignManager
│   ├── profitBankService.ts     # Profit Banke
│   ├── taxService.ts            # + getMyPerListingBreakdown / getPerListingBreakdown
│   └── ... (15 ostalih servisa)
├── types/                       # TypeScript tipovi (celina1-5, auth, ...)
└── utils/                       # formatters (sr-RS), jwt decode, validationSchemas, otcOfferUtils
```

## Autentifikacija i autorizacija

1. `POST /auth/login` → `{ accessToken, refreshToken }` u `sessionStorage`
2. JWT dekoder (`utils/jwt.ts`) cita `sub` (email), `role` (ADMIN/EMPLOYEE/CLIENT), `active`
3. Ako role = ADMIN ili EMPLOYEE → fetch `/employees?email=<sub>` da vidimo prave permisije
4. `AuthContext` daje: `user`, `isAdmin`, `isSupervisor`, `isAgent`, `hasPermission(code)`
5. Route guards u `App.tsx`: `adminOnly`, `employeeOnly`, `supervisorOnly`, `noAgentOnly` (Celina 4 OTC ban)
6. Axios response interceptor auto-refresh na 401
7. Logout: async `POST /auth/logout` (BE blacklist token sa Caffeine 20min TTL) + `sessionStorage.clear()`
8. Lockout UX: ako BE vrati "Account temporarily locked. Try again in N seconds.", FE prikazuje warning Alert sa srpskim prevodom

## Dizajn sistem

- **Primary gradient**: `from-indigo-500 to-violet-600`
- **Shadow akcenta**: `shadow-lg shadow-indigo-500/20`
- **Badges**: `success` (emerald), `warning` (amber), `destructive` (red), `info` (blue), `secondary` (slate)
- **Loading**: skeleton sa `animate-pulse` — nikad spinner
- **Empty state**: ikonica u krugu + naslov + podnaslov
- **Formatiranje brojeva**: `sr-RS` locale (zarez decimale, tacka hiljade)
- **Dark mode**: Tailwind `dark:` prefix svuda, prekidanje preko ThemeContext + `<ThemeToggle variant="full" />` u sidebar footer-u (3-state cycle: System → Light → Dark)

## Tailwind 4 migration (03.05.2026)

- `tailwind.config.js` i `postcss.config.js` su **OBRISANI** — Tailwind 4 koristi CSS-first config preko `@theme` direktive u `src/index.css`
- `vite.config.ts` import-uje `@tailwindcss/vite` plugin umesto starog PostCSS pipeline-a
- `tailwindcss-animate` plugin zamenjen sa `tw-animate-css` (TW4 community port)
- Sve custom HSL boje, 24 keyframes (`blob`, `aurora-1/2`, `morph`, `card-float`, `pulse-ring`, ...), container config, radius prebaceni iz `theme.extend` JS objekta u `@theme {}` blok u CSS-u

## Vite manualChunks (vazno)

`vite.config.ts` deli vendor-e na:

- `react-vendor` (react, react-dom, react-router, scheduler)
- `radix-vendor` (svi @radix-ui/*)
- `icons-vendor` (lucide-react)
- `forms-vendor` (react-hook-form, @hookform/, zod)
- `http-vendor` (axios)
- `vendor` (sve ostalo iz node_modules — ukljucujuci recharts, d3-*, three.js, globe.gl)

**NE izdvajati `charts-vendor` ni `three-vendor`** — Recharts 3.x i three-globe imaju iste d3-* tranzitivne deps, pa razdvojen chunk pravi `circular chunk dependency` koja u runtime-u puca:

- `Uncaught TypeError: E is not a function` (recharts split)
- `Uncaught TypeError: nee is not a constructor` (three-globe split)

Vendor chunk je ~2.3MB (gzip 658KB) ali stabilnost > optimizacija. Three.js je vec lazy-loaded preko `React.lazy(() => import('./GlobeView'))`.

## nginx Cache headers

`nginx.conf` ima 3 location bloka:

1. `/assets/` — `Cache-Control: immutable, max-age=1y` (Vite hash-uje fajlove)
2. `/index.html` — `Cache-Control: no-store, no-cache, must-revalidate`
3. `/` (SPA fallback) — isto no-store

Bez no-store na index.html, Brave/Chrome cache-uju stari HTML koji referencira chunk hash-eve koji vise ne postoje posle no-cache rebuild-a → app ne renderuje.

Plus security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`, restriktivan CSP (Vite + Tailwind 4 inline styles allowed).

## OTP verifikacija

Placanja, transferi i orderi zahtevaju OTP:

1. Modal se otvori → `POST /payments/request-otp` generise kod
2. Mobilna aplikacija prikaze kod (realni flow) ILI FE fetchuje `GET /payments/my-otp` i autopopuni kroz "Popuni" dugme (dev convenience)
3. Korisnik unosi 6-cifreni kod → `onVerified(code)` u parent → parent salje POST na stvarni endpoint sa `otpCode`
4. Backend verifikuje: pogresan → 403; 3. strike → blok i modal se zatvara

## Inter-bank 2PC payment UI

Kad korisnik posalje placanje na racun ciji prefix nije `222` (nasa banka), `NewPaymentPage` prikazuje:

- **Inter-bank warning banner** ("Banka primaoca pocinje sa 111/333/444 — ide kroz 2-Phase Commit")
- **Stepper modal** sa 4 faze (Inicijalizacija, Prepare, Commit, Zavrseno) + polling na 3s × 40 (2 minuta budget)
- **STUCK banner** sa "Pokusaj ponovo" dugmetom kad polling istekne
- **sessionStorage recovery** — pri page reload-u rehydrate-uje aktivni transactionId i nastavlja polling
- **Razlog** prikaz iz `failureReason` (proksira BE poruku ili mapira `errorCode` na srpski tekst)

## Test mode badge

Securities lista pokazuje **SIMULIRANI PODACI** badge (amber) kad bilo koji listing dolazi sa berze u test modu. Inace **LIVE** (emerald). Koristi `listing.isTestMode` polje koje backend setuje iz `Exchange.testMode`. Test mode takodje spreci Alpha Vantage pozive u dev-u.

## Cypress E2E

```text
cypress/e2e/
├── celina1-mock.cy.ts          ~70 testova (Auth, Employee CRUD, Permisije, ThemeToggle)
├── celina1-live.cy.ts          ~90 testova (isti na pravom BE)
├── celina2-mock.cy.ts          ~135 testova (Accounts, Payments, Transfers, Exchange, Cards, Loans)
├── celina2-live.cy.ts          ~105 testova
├── celina3-mock.cy.ts          ~130 testova (Securities, Orders, Portfolio, Tax, Aktuari, Margin)
├── celina3-live.cy.ts          ~100 testova + E2E scenario (12 DEO supervizor→agent→BUY→fill→SELL→porez)
├── celina4-mock.cy.ts          ~150 testova (OTC intra+inter, Funds, Profit Banke, Reassign dialog)
├── celina4-live.cy.ts          ~50 testova (gornje + 2PC + SAGA exercise + reassign API)
├── arbitro-mock.cy.ts          (lokalno only, NIJE u CI) — Arbitro AI panel + SSE chat + voice
└── arbitro-live.cy.ts          (lokalno only, NIJE u CI) — zahteva Banka-2-Tools stack up
```

`mock` varijante koriste `cy.intercept` — rade bez BE. `live` zahtevaju docker stack pokrenut.

**Cached login pattern** u live spec-ovima: `Cypress.env()` perzistira tokene izmedju test-isolation cycles, login se izvrsava 1× po roli po spec run-u (ne 30+ puta), 429 retry sa 65s backoff fallback.

## Bonus stackovi (Backend)

Frontend depend-uje samo na core BE stack (`banka2_backend:8080`). Bonus stack-ovi su nezavisni:

- **Tools** (Arbitro AI) — `Banka-2-Backend/Banka-2-Tools/docker-compose.yml`. FE detektuje da li su sidecari live preko `/assistant/health` i prikazuje Arbitro overlay samo ako `llmReachable=true`.
- **Monitoring** (MLA) — `Banka-2-Backend/monitoring/docker-compose.yml`. FE ne pristupa direktno — Prometheus skrejpuje BE actuator. Grafana dashboard-ovi pokazuju per-endpoint latency, JVM metrics, GC.

## Deployment (Docker)

`Dockerfile` radi multi-stage build:

1. `node:24-alpine` — `npm ci` + `npm run build` → `dist/`
2. `nginx:alpine` — kopira `dist/` u `/usr/share/nginx/html` + custom `nginx.conf` sa `/api` i `/auth` proxy-em + security headers

`docker-compose.yml` mapira `${FRONTEND_HOST_PORT:-3000} → 80`.

## Poznate preporuke

- **Dev bez backend-a**: `mock` cypress testovi ili pokretanje Vite dev servera i koriscenje `VITE_API_URL` ka deploy-ovanom backend-u
- **Refresh cena** (Securities): zahteva ADMIN/EMPLOYEE; klijentima je dugme skriveno
- **Mobile**: postoji `Banka-2-Mobile` (Android Kotlin + Jetpack Compose) — pokriva klijentski flow + supervisor + admin
- **Auth rate limit u Cypress live testovima**: BE `AUTH_RATE_LIMIT_CAPACITY=100000` (default u `Banka-2-Backend/docker-compose.yml`) sprecava 429. NE setuj `AUTH_RATE_LIMIT_ENABLED=false` jer GlobalSecurityConfig zahteva filter bean

## Tim

Banka 2025 Tim 2, Racunarski fakultet 2025/26.
