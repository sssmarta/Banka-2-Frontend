// =============================================================================
// TODO [FE-21] ANTONIJE ILIĆ — Poboljšanje EmployeeCreatePage UI
// =============================================================================
// ZADATAK: Poboljšati izgled i UX ove stranice.
//   1. Grupisanje polja u logične sekcije sa Card wrapper-ima
//      (Lični podaci, Kontakt, Posao) — delimično već urađeno
//   2. Sekcije sa jasnijim naslovima (CardHeader + CardTitle)
//   3. Bolji raspored polja (grid layout: 2 kolone na desktopu, 1 na mobu)
//   4. Poboljšani error prikaz (highlight polja sa greškom)
//   5. Sačuvaj/Otkaži dugmad sticky na dnu
// NAPOMENA: Koristi postojeće shadcn/ui komponente (Card, Separator, etc).
// Koristi AI Agent Mode za pomoć!
// + Napiši E2E test koji proverava validaciju na create formi.
// =============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { createEmployeeSchema, type CreateEmployeeFormData } from '../../utils/validationSchemas';
import { employeeService } from '../../services/employeeService';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const POSITIONS = [
  'Software Developer',
  'Project Manager',
  'Team Lead',
  'QA Engineer',
  'Business Analyst',
  'DevOps Engineer',
  'HR Manager',
  'Accountant',
  'Actuary',
  'Supervisor',
];

const DEPARTMENTS = [
  'IT',
  'Finance',
  'HR',
  'Marketing',
  'Operations',
  'Legal',
  'Risk Management',
];

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      position: '',
      phoneNumber: '',
      isActive: true,
      jmbg: '',
      address: '',
      dateOfBirth: '',
      gender: '',
      department: '',
      role: '',
    },
  });

  const onSubmit = async (data: CreateEmployeeFormData) => {
    setServerError('');
    setIsSubmitting(true);
    try {
      await employeeService.create({
        ...data,
        permissions: [],
      });
      toast.success(
        'Zaposleni uspešno kreiran! Email za aktivaciju naloga je poslat.'
      );
      navigate('/admin/employees');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message?.includes('email')) {
        setServerError('Korisnik sa ovim email-om već postoji.');
      } else {
        setServerError(
          error.response?.data?.message || 'Greška pri kreiranju zaposlenog.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/employees')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Nazad na listu
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kreiranje novog zaposlenog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Nakon kreiranja, zaposleni će dobiti email sa linkom za aktivaciju naloga
          i postavljanje lozinke.
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Lični podaci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ime *</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prezime *</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input id="username" placeholder="petar90" {...register('username')} />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Broj telefona *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+381 60 1234567"
                  {...register('phoneNumber')}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="jmbg">JMBG *</Label>
                <Input
                  id="jmbg"
                  placeholder="1234567890123"
                  maxLength={13}
                  {...register('jmbg')}
                />
                {errors.jmbg && (
                  <p className="text-sm text-destructive">{errors.jmbg.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Datum rođenja *</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                {errors.dateOfBirth && (
                  <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pol *</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite pol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Muški</SelectItem>
                        <SelectItem value="F">Ženski</SelectItem>
                        <SelectItem value="O">Ostalo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adresa *</Label>
                <Input id="address" {...register('address')} />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pozicija i odeljenje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pozicija *</Label>
                <Controller
                  name="position"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite poziciju" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.position && (
                  <p className="text-sm text-destructive">{errors.position.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Odeljenje *</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite odeljenje" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Uloga *</Label>
                <Input id="role" {...register('role')} />
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label className="cursor-pointer" onClick={() => field.onChange(!field.value)}>
                        {field.value ? 'Aktivan (default)' : 'Neaktivan'}
                      </Label>
                    </>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/employees')}
          >
            Otkaži
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Kreiranje...' : 'Kreiraj zaposlenog'}
          </Button>
        </div>
      </form>
    </div>
  );
}
