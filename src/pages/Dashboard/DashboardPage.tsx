// =============================================================================
// TODO [FE-09] MARTA ŠULJAGIĆ — Poboljšanje DashboardPage
// =============================================================================
// Trenutno Dashboard prikazuje samo kartice za admin operacije.
// Za neadmin korisnika stranica je praktično PRAZNA.
// ZADATAK:
//   1. Welcome section sa imenom korisnika (već postoji — OK)
//   2. Dodati kartice za pretragu zaposlenih (ako korisnik ima permisiju)
//   3. Opciono: prikaz broja zaposlenih, broja aktivnih/neaktivnih
//   4. Opciono: vest dana, quick actions, statistike
// NAPOMENA: Ovo je kreativniji task — eksperimentiši sa dizajnom!
// Pogledaj postojeće Card, CardHeader, CardTitle komponente u components/ui/
// Koristi AI Agent Mode za pomoć!
// + Napiši E2E test koji proverava da Dashboard prikazuje kartice.
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  adminOnly?: boolean;
}

const cards: DashboardCard[] = [
  {
    title: 'Lista zaposlenih',
    description: 'Pregledajte, pretražite i upravljajte zaposlenima.',
    icon: <Users className="h-10 w-10" />,
    path: '/admin/employees',
    adminOnly: true,
  },
  {
    title: 'Novi zaposleni',
    description: 'Kreirajte nalog za novog zaposlenog.',
    icon: <UserPlus className="h-10 w-10" />,
    path: '/admin/employees/new',
    adminOnly: true,
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const visibleCards = cards.filter((card) => {
    if (card.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Landmark className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dobrodošli, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Banka 2025 — Interni portal
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Card
            key={card.path}
            className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
            onClick={() => navigate(card.path)}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto text-primary mb-2">{card.icon}</div>
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription>{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
