import { useNavigate } from 'react-router-dom';
import { ServerCrash, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthPageLayout from '@/components/layout/AuthPageLayout';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <AuthPageLayout>
      <div className="mx-auto w-full max-w-lg animate-fade-up text-center">
        <Card className="shadow-2xl shadow-indigo-500/5">
          <CardContent className="space-y-6 py-12 px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/30">
              <ServerCrash className="h-8 w-8 text-amber-500" />
            </div>

            <div className="space-y-2">
              <p className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent sm:text-7xl">
                500
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Došlo je do greške na serveru
              </h1>
              <p className="text-muted-foreground">
                Trenutno nismo u mogućnosti da obradimo vaš zahtev.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <ul className="space-y-2 text-sm text-muted-foreground text-left">
                <li>• Pokušajte ponovo za par minuta.</li>
                <li>• Ako se problem ponavlja, kontaktirajte podršku.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Pokušaj ponovo
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" />
                Nazad na početnu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  );
}
