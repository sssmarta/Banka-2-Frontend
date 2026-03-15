import { useNavigate } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthPageLayout from '@/components/layout/AuthPageLayout';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <AuthPageLayout>
      <div className="mx-auto w-full max-w-lg animate-fade-up text-center">
        <Card className="shadow-2xl shadow-indigo-500/5">
          <CardContent className="space-y-6 py-12 px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
              <ShieldX className="h-8 w-8 text-red-500" />
            </div>

            <div className="space-y-2">
              <p className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent sm:text-7xl">
                403
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Nemate dozvolu za pristup
              </h1>
              <p className="text-muted-foreground">
                Nemate potrebna prava da pristupite ovoj stranici.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <ul className="space-y-2 text-sm text-muted-foreground text-left">
                <li>• Nemate potrebne permisije za ovu stranicu.</li>
                <li>• Kontaktirajte administratora ako mislite da je greška.</li>
              </ul>
            </div>

            <Button
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Nazad na početnu
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  );
}
