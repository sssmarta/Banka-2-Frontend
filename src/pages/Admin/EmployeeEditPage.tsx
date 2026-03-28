import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, User, Phone, Briefcase, Shield, UserX, Mail, AlertTriangle } from 'lucide-react';
import { editEmployeeSchema, type EditEmployeeFormData } from '../../utils/validationSchemas';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types';
import { Permission } from '../../types';
import { toast } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateInput } from '@/components/ui/date-input';

const ALL_PERMISSIONS = Object.values(Permission);

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

function EditPageSkeleton() {
  return (
    <div className="space-y-6" data-testid="employee-edit-skeleton">
      <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
      <div className="space-y-2">
        <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-[28rem] max-w-full animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {[1, 2].map(col => (
          <div key={col} className="space-y-6">
            {[1, 2].map(card => (
              <Card key={card} className="rounded-2xl">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                  </div>
                  <div className="h-4 w-56 max-w-full animate-pulse rounded-md bg-muted/60" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-16 animate-pulse rounded bg-muted/70" />
                        <div className="h-11 w-full animate-pulse rounded-md bg-muted/50" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;

      try {
        const data = await employeeService.getById(Number(id));
        setEmployee(data);
        setPermissions(data.permissions);

        reset({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          position: data.position,
          phoneNumber: data.phoneNumber,
          isActive: data.isActive,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          department: data.department,
        });
      } catch {
        setError('Greska pri ucitavanju podataka o zaposlenom.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, reset]);

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const onSubmit = async (data: EditEmployeeFormData) => {
    if (!id) return;

    setSaving(true);
    setError('');

    try {
      if (!data.isActive && employee?.isActive) {
        await employeeService.deactivate(Number(id));
      }

      const updateData = { ...data, permissions };
      if (!data.isActive && employee?.isActive) {
        delete (updateData as Record<string, unknown>).isActive;
      }
      await employeeService.update(Number(id), updateData);

      toast.success('Zaposleni uspesno azuriran!');
      navigate('/admin/employees');
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Greska pri cuvanju izmena.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <EditPageSkeleton />;
  }

  if (!employee) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <UserX className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Zaposleni nije pronadjen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trazeni zaposleni ne postoji ili je uklonjen iz sistema.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/employees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Nazad na listu
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <Button variant="ghost" onClick={() => navigate('/admin/employees')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Nazad na listu
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Izmeni zaposlenog: {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Azurirajte licne podatke, kontakt informacije, radnu poziciju i permisije zaposlenog.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6"
        data-testid="employee-edit-form"
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left column - Personal + Contact */}
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
                    <Label htmlFor="firstName">Ime</Label>
                    <Input id="firstName" className="h-11" {...register('firstName')} />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Prezime</Label>
                    <Input id="lastName" className="h-11" {...register('lastName')} />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Datum rodjenja</Label>
                    <Controller
                      name="dateOfBirth"
                      control={control}
                      render={({ field }) => (
                        <DateInput
                          id="dateOfBirth"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Pol</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11">
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
                      <p className="text-sm text-destructive">{errors.gender.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={employee.username || ''} disabled className="h-11 bg-muted/50" />
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
                <CardDescription>Kontakt podaci i adresa zaposlenog.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" className="h-11 pl-9" {...register('email')} />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Broj telefona</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phoneNumber" className="h-11 pl-9" {...register('phoneNumber')} />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Adresa</Label>
                    <Input id="address" className="h-11" {...register('address')} />
                    {errors.address && (
                      <p className="text-sm text-destructive">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Work + Permissions */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm border-l-4 border-l-violet-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  <Briefcase className="h-4 w-4 text-violet-500" />
                  <CardTitle>Posao</CardTitle>
                </div>
                <CardDescription>Pozicija, odeljenje i status zaposlenog.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pozicija</Label>
                    <Controller
                      name="position"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11">
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
                    <Label>Odeljenje</Label>
                    <Controller
                      name="department"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11">
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
                </div>

                <Separator />

                <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold">Status zaposlenog</p>
                    <p className="text-sm text-muted-foreground">
                      Odredite da li je zaposleni trenutno aktivan u sistemu.
                    </p>
                  </div>

                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <Badge
                          variant={field.value ? 'default' : 'destructive'}
                          className={field.value ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : ''}
                        >
                          {field.value ? 'Aktivan' : 'Neaktivan'}
                        </Badge>
                      </div>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />
                  <Shield className="h-4 w-4 text-amber-500" />
                  <CardTitle>Permisije</CardTitle>
                </div>
                <CardDescription>Izaberite dozvole koje zaposleni ima u sistemu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {permissions.length} od {ALL_PERMISSIONS.length} selektovano
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPermissions([...ALL_PERMISSIONS])}
                    >
                      Selektuj sve
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPermissions([])}
                    >
                      Ponisti sve
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      htmlFor={`perm-${perm}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 hover:bg-primary/5 ${
                        permissions.includes(perm)
                          ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30'
                          : ''
                      }`}
                    >
                      <Checkbox
                        id={`perm-${perm}`}
                        checked={permissions.includes(perm)}
                        onCheckedChange={() => handlePermissionToggle(perm)}
                      />
                      <span className="text-sm font-normal">{perm}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="rounded-2xl shadow-sm border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-red-600 dark:text-red-400">Opasna zona</p>
                    <p className="text-sm text-muted-foreground">
                      Deaktivacija zaposlenog ce trajno onemoguciti pristup sistemu.
                      Koristite prekidac iznad za promenu statusa pre cuvanja.
                    </p>
                  </div>
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
              disabled={saving}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Cuvanje...' : 'Sacuvaj izmene'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
