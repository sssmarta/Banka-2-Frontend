import { useNavigate } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldX className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-6xl font-bold tracking-tight text-primary sm:text-7xl">403</p>
            <CardTitle className="text-2xl sm:text-3xl">Nemate dozvolu za pristup</CardTitle>
            <CardDescription className="text-base">
              Nemate potrebna prava da pristupite ovoj stranici.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Nemate potrebne permisije za ovu stranicu.</li>
              <li>• Kontaktirajte administratora ako mislite da je greška.</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Nazad na početnu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}