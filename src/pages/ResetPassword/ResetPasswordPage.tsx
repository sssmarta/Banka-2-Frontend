import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '../../utils/validationSchemas';
import { authService } from '../../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getPasswordStrength, getStrengthInfo } from '../../utils/passwordStrength';

export default function ResetPasswordPage() {
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
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const passwordValue = watch('newPassword', '');
  const strength = getPasswordStrength(passwordValue);
  const strengthInfo = getStrengthInfo(strength);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Nevažeći link za resetovanje lozinke.');
      return;
    }
    setServerError('');
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(
        error.response?.data?.message ||
          'Greška pri resetovanju lozinke. Link je možda istekao.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 p-4">
        <Card className="w-full max-w-[440px] shadow-xl">
          <CardContent className="p-6 text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Nevažeći link za resetovanje lozinke. Zatražite novi link.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/forgot-password')}>
              Zatraži novi link
            </Button>
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
          <CardTitle className="text-xl">Resetovanje lozinke</CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700">
                Lozinka uspešno promenjena!
              </h3>
              <p className="text-sm text-muted-foreground">
                Sada se možete prijaviti sa novom lozinkom.
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
                  <Label htmlFor="newPassword">Nova lozinka</Label>
                  <div className="relative">
                    <Input
                      {...register('newPassword')}
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      className={cn(errors.newPassword ? 'border-destructive pr-10' : 'pr-10')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
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
                      Postavljanje...
                    </>
                  ) : (
                    'Postavi novu lozinku'
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
