import { useNavigate } from 'react-router-dom';
import { ServerCrash, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ServerCrash className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <p className="text-6xl font-bold tracking-tight text-primary sm:text-7xl">500</p>
            <CardTitle className="text-2xl sm:text-3xl">Došlo je do greške na serveru</CardTitle>
            <CardDescription className="text-base">
              Trenutno nismo u mogućnosti da obradimo vaš zahtev.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Pokušajte ponovo za par minuta.</li>
              <li>• Ako se problem ponavlja, kontaktirajte podršku.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.reload()}>
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
  );
}