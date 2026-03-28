import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, Loader2, User, Phone, Briefcase, Mail } from 'lucide-react';
import { createEmployeeSchema, type CreateEmployeeFormData } from '../../utils/validationSchemas';
import { employeeService } from '../../services/employeeService';
import { toast } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateInput } from '@/components/ui/date-input';

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
      address: '',
      dateOfBirth: '',
      gender: '',
      department: '',
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
        'Zaposleni uspesno kreiran! Email za aktivaciju naloga je poslat.'
      );
      navigate('/admin/employees');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      if (apiError.response?.data?.message?.includes('email')) {
        setServerError('Korisnik sa ovim email-om vec postoji.');
      } else {
        setServerError(
          apiError.response?.data?.message || 'Greska pri kreiranju zaposlenog.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <Button variant="ghost" onClick={() => navigate('/admin/employees')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Nazad na listu
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kreiranje novog zaposlenog</h1>
          <p className="text-sm text-muted-foreground">
            Nakon kreiranja, zaposleni ce dobiti email sa linkom za aktivaciju naloga
            i postavljanje lozinke.
          </p>
        </div>
      </div>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left column - Personal info */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-l-4 border-l-indigo-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                  <User className="h-4 w-4 text-indigo-500" />
                  <CardTitle>Licni podaci</CardTitle>
                </div>
                <CardDescription>Osnovne informacije o zaposlenom.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ime *</Label>
                    <Input
                      id="firstName"
                      className={`h-11 ${errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Prezime *</Label>
                    <Input
                      id="lastName"
                      className={`h-11 ${errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Datum rodjenja *</Label>
                    <Controller
                      name="dateOfBirth"
                      control={control}
                      render={({ field }) => (
                        <DateInput
                          id="dateOfBirth"
                          value={field.value}
                          onChange={field.onChange}
                          className={errors.dateOfBirth ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                      )}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pol *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            className={`h-11 ${errors.gender ? 'border-destructive focus:ring-destructive' : ''}`}
                          >
                            <SelectValue placeholder="Izaberite pol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Muski</SelectItem>
                            <SelectItem value="F">Zenski</SelectItem>
                            <SelectItem value="O">Ostalo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                  <Phone className="h-4 w-4 text-blue-500" />
                  <CardTitle>Kontakt</CardTitle>
                </div>
                <CardDescription>Email, telefon i adresa zaposlenog.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className={`h-11 pl-9 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Broj telefona *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        placeholder="+381 60 1234567"
                        className={`h-11 pl-9 ${errors.phoneNumber ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        {...register('phoneNumber')}
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Adresa *</Label>
                    <Input
                      id="address"
                      className={`h-11 ${errors.address ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...register('address')}
                    />
                    {errors.address && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Work info */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-l-4 border-l-violet-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  <Briefcase className="h-4 w-4 text-violet-500" />
                  <CardTitle>Posao</CardTitle>
                </div>
                <CardDescription>Pozicija, odeljenje i korisnicko ime.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="petar90"
                      className={`h-11 ${errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      {...register('username')}
                    />
                    {errors.username && (
                      <p className="text-sm font-medium text-destructive">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pozicija *</Label>
                    <Controller
                      name="position"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            data-cy="position-select"
                            className={`h-11 ${errors.position ? 'border-destructive focus:ring-destructive' : ''}`}
                          >
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
                      <p className="text-sm font-medium text-destructive">
                        {errors.position.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Odeljenje *</Label>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            data-cy="department-select"
                            className={`h-11 ${errors.department ? 'border-destructive focus:ring-destructive' : ''}`}
                          >
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
                      <p className="text-sm font-medium text-destructive">
                        {errors.department.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active status */}
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                  <div className="space-y-0.5">
                    <p className="font-semibold">Status zaposlenog</p>
                    <p className="text-sm text-muted-foreground">Aktivan nalog nakon kreiranja</p>
                  </div>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className={`text-sm font-medium ${field.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {field.value ? 'Aktivan' : 'Neaktivan'}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 rounded-t-xl border-t bg-background/80 px-4 py-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] backdrop-blur-lg sm:-mx-6 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/employees')}
            >
              Otkazi
            </Button>

            <Button
              type="submit"
              data-cy="createBtn"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Kreiranje...' : 'Kreiraj zaposlenog'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
