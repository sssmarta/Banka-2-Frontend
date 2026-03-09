import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import {
  activateAccountSchema,
  type ActivateAccountFormData,
} from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength';

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ActivateAccountFormData>({
    resolver: zodResolver(activateAccountSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password', '');
  const strength = getPasswordStrength(passwordValue);
  const strengthInfo = getStrengthInfo(strength);

  const onSubmit = async (data: ActivateAccountFormData) => {
    if (!token) {
      setServerError('Nevažeći link za aktivaciju. Kontaktirajte administratora.');
      return;
    }
    setServerError('');
    setIsSubmitting(true);
    try {
      await authService.activateAccount({ token, password: data.password });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(
        error.response?.data?.message ||
          'Greška pri aktivaciji naloga. Link je možda istekao.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
        <Card className="w-full max-w-[440px] shadow-xl">
          <CardContent className="p-6 text-center">
            <Alert variant="destructive">
              <AlertDescription>
                Nevažeći link za aktivaciju. Kontaktirajte vašeg administratora.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
      <Card className="w-full max-w-[480px] shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Landmark className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Aktivacija naloga</CardTitle>
          <CardDescription>
            Postavite svoju lozinku za pristup sistemu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700">
                Nalog uspešno aktiviran!
              </h3>
              <p className="text-sm text-muted-foreground">
                Sada se možete prijaviti sa vašim email-om i lozinkom.
              </p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Idi na prijavu
              </Button>
            </div>
          ) : (
            <>
              {serverError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              <Alert variant="info" className="mb-4">
                <AlertDescription>
                  Lozinka mora imati: 8-32 karaktera, najmanje 2 broja, 1 veliko i 1 malo slovo.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova lozinka</Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={cn(errors.password ? 'border-destructive pr-10' : 'pr-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}

                  {passwordValue && (
                    <div className="space-y-1">
                      <Progress
                        value={strength}
                        className="h-1.5"
                        indicatorClassName={strengthInfo.color}
                      />
                      <p className="text-xs text-muted-foreground">
                        Jačina lozinke: <span className="font-medium">{strengthInfo.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Potvrdite lozinku</Label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword')}
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      className={cn(errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aktivacija...
                    </>
                  ) : (
                    'Aktiviraj nalog'
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
