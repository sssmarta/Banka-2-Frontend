// TODO [FE2-06a] @Elena - Primaoci: Lista sacuvanih primalaca placanja
// TODO [FE2-06b] @Elena - Primaoci: CRUD operacije (dodaj/izmeni/obrisi)
//
// Ova stranica omogucava upravljanje listom sacuvanih primalaca placanja.
// - paymentRecipientService.getAll() za prikaz
// - CRUD: create, update, delete
// - Forma za novog primaoca: ime, broj racuna, adresa (opciono), telefon (opciono)
// - Inline edit ili modal za izmenu
// - Potvrda pre brisanja (confirm dialog)

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/notify';
import { paymentRecipientService } from '@/services/paymentRecipientService';
import type { PaymentRecipient } from '@/types/celina2';
import {
  createRecipientSchema,
  editRecipientSchema,
  type CreateRecipientFormData,
  type EditRecipientFormData,
} from '@/utils/validationSchemas.celina2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<PaymentRecipient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const createForm = useForm<CreateRecipientFormData>({
    resolver: zodResolver(createRecipientSchema),
    defaultValues: { name: '', accountNumber: '', address: '', phoneNumber: '' },
  });

  const editForm = useForm<EditRecipientFormData>({
    resolver: zodResolver(editRecipientSchema),
    defaultValues: { name: '', accountNumber: '', address: '', phoneNumber: '' },
  });

  const loadRecipients = async () => {
    setLoading(true);
    try {
      const data = await paymentRecipientService.getAll();
      setRecipients(asArray<PaymentRecipient>(data));
    } catch {
      toast.error('Neuspešno učitavanje primalaca.');
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const filteredRecipients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const safeRecipients = asArray<PaymentRecipient>(recipients);
    if (!term) return safeRecipients;
    return safeRecipients.filter((recipient) => recipient.name.toLowerCase().includes(term));
  }, [recipients, searchTerm]);

  const onCreate = async (data: CreateRecipientFormData) => {
    try {
      await paymentRecipientService.create({
        name: data.name,
        accountNumber: data.accountNumber,
        address: data.address || undefined,
        phoneNumber: data.phoneNumber || undefined,
      });
      toast.success('Primaoc je uspešno dodat.');
      createForm.reset();
      setShowCreateForm(false);
      await loadRecipients();
    } catch {
      toast.error('Dodavanje primaoca nije uspelo.');
    }
  };

  const startEdit = (recipient: PaymentRecipient) => {
    setEditingRecipient(recipient);
    editForm.reset({
      name: recipient.name,
      accountNumber: recipient.accountNumber,
      address: recipient.address || '',
      phoneNumber: recipient.phoneNumber || '',
    });
  };

  const onEdit = async (data: EditRecipientFormData) => {
    if (!editingRecipient) return;
    try {
      await paymentRecipientService.update(editingRecipient.id, {
        name: data.name,
        accountNumber: data.accountNumber,
        address: data.address || undefined,
        phoneNumber: data.phoneNumber || undefined,
      });
      toast.success('Primaoc je uspešno izmenjen.');
      setEditingRecipient(null);
      await loadRecipients();
    } catch {
      toast.error('Izmena primaoca nije uspela.');
    }
  };

  const onDelete = async (recipient: PaymentRecipient) => {
    const confirmed = window.confirm(`Da li ste sigurni da želite da obrišete primaoca ${recipient.name}?`);
    if (!confirmed) return;

    setDeletingId(recipient.id);
    try {
      await paymentRecipientService.delete(recipient.id);
      toast.success('Primaoc je obrisan.');
      await loadRecipients();
    } catch {
      toast.error('Brisanje primaoca nije uspelo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Primaoci plaćanja</h1>
        <Button onClick={() => setShowCreateForm((prev) => !prev)}>
          {showCreateForm ? 'Zatvori formu' : 'Dodaj primaoca'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novi primalac</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createForm.handleSubmit(onCreate)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="create-name">Ime</Label>
                <Input id="create-name" {...createForm.register('name')} />
                {createForm.formState.errors.name && <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-account">Broj računa</Label>
                <Input id="create-account" {...createForm.register('accountNumber')} />
                {createForm.formState.errors.accountNumber && <p className="text-sm text-destructive">{createForm.formState.errors.accountNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-address">Adresa</Label>
                <Input id="create-address" {...createForm.register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Telefon</Label>
                <Input id="create-phone" {...createForm.register('phoneNumber')} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Sačuvaj primaoca</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sačuvani primaoci</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Pretraga po imenu primaoca"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading ? (
            <p className="text-muted-foreground">Učitavanje primalaca...</p>
          ) : filteredRecipients.length === 0 ? (
            <p className="text-muted-foreground">Nemate sačuvanih primalaca.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Ime</th>
                    <th className="text-left py-2">Broj računa</th>
                    <th className="text-left py-2">Adresa</th>
                    <th className="text-left py-2">Telefon</th>
                    <th className="text-left py-2">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((recipient) => (
                    <tr key={recipient.id} className="border-b">
                      <td className="py-2">{recipient.name}</td>
                      <td className="py-2">{recipient.accountNumber}</td>
                      <td className="py-2">{recipient.address || '-'}</td>
                      <td className="py-2">{recipient.phoneNumber || '-'}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(recipient)}>Izmeni</Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(recipient)}
                            disabled={deletingId === recipient.id}
                          >
                            Obriši
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingRecipient && (
        <Card>
          <CardHeader>
            <CardTitle>Izmena primaoca</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={editForm.handleSubmit(onEdit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Ime</Label>
                <Input id="edit-name" {...editForm.register('name')} />
                {editForm.formState.errors.name && <p className="text-sm text-destructive">{editForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-account">Broj računa</Label>
                <Input id="edit-account" {...editForm.register('accountNumber')} />
                {editForm.formState.errors.accountNumber && <p className="text-sm text-destructive">{editForm.formState.errors.accountNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresa</Label>
                <Input id="edit-address" {...editForm.register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input id="edit-phone" {...editForm.register('phoneNumber')} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRecipient(null)}>Otkaži</Button>
                <Button type="submit">Sačuvaj izmene</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

