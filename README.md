# Banka 2025 - Frontend

Admin portal za upravljanje zaposlenima u bankarskom sistemu.

## Tehnologije

- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **Tailwind CSS 3.4** + shadcn/ui komponente (Radix UI)
- **React Router DOM v7** (routing)
- **React Hook Form v7** + **Zod** (forme i validacija)
- **Axios** (HTTP klijent sa JWT interceptorima)

## Pokretanje projekta

```bash
# 1. Instaliraj zavisnosti
npm install

# 2. Kreiraj .env fajl (kopiraj iz primera)
cp .env.example .env

# 3. Pokreni development server
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:5173`

## Environment varijable

| Varijabla | Opis | Default |
|-----------|------|---------|
| `VITE_API_URL` | Base URL za backend API | `http://localhost:8080/api` |

## Struktura projekta

```
src/
├── components/
│   ├── layout/          # MainLayout, Navbar, ProtectedRoute
│   └── ui/              # shadcn/ui reusable komponente
├── context/             # AuthContext, ThemeContext
├── pages/
│   ├── Login/           # Login stranica
│   ├── Dashboard/       # Početna stranica
│   ├── Admin/           # Lista, kreiranje, edit zaposlenih
│   ├── ActivateAccount/ # Aktivacija naloga
│   ├── ForgotPassword/  # Zahtev za reset lozinke
│   └── ResetPassword/   # Reset lozinke
├── services/            # API pozivi (auth, employee)
├── types/               # TypeScript tipovi
└── utils/               # Validacione šeme, helper-i
```

## Build

```bash
npm run build
```

Build output se generiše u `dist/` folderu.

## Linting

```bash
npm run lint
```
