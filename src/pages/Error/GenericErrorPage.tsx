import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function GenericErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <AlertTriangle className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">Nešto je pošlo naopako</CardTitle>
            <CardDescription className="text-base">
              Došlo je do neočekivane greške. Pokušajte ponovo ili se vratite na početnu stranicu.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => window.location.reload()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Pokušaj ponovo
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Nazad na početnu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}