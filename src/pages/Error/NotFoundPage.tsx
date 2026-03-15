import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthPageLayout from '@/components/layout/AuthPageLayout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AuthPageLayout>
      <div className="mx-auto w-full max-w-lg animate-fade-up text-center">
        <Card className="shadow-2xl shadow-indigo-500/5">
          <CardContent className="space-y-6 py-12 px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/30">
              <FileQuestion className="h-8 w-8 text-orange-500" />
            </div>

            <div className="space-y-2">
              <p className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent sm:text-7xl">
                404
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Stranica nije pronađena
              </h1>
              <p className="text-muted-foreground">
                Stranica koju pokušavate da otvorite ne postoji ili je premeštena.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <ul className="space-y-2 text-sm text-muted-foreground text-left">
                <li>• Proverite da li ste ispravno uneli adresu.</li>
                <li>• Možda je stranica premeštena ili obrisana.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold"
                onClick={() => navigate('/')}
              >
                <Home className="mr-2 h-4 w-4" />
                Nazad na početnu
              </Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                <LogIn className="mr-2 h-4 w-4" />
                Prijavi se
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  );
}
