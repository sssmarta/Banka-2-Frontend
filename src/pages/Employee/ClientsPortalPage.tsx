// TODO [FE2-15a] @Elena - Portal klijenti: Lista i edit
//
// Ova stranica je dostupna samo zaposlenima.
// Prikazuje listu svih klijenata banke sa pretragom.
// - clientService.getAll(filters) sa paginacijom (src/services/clientService.ts)
// - Pretraga po imenu, prezimenu, email-u (ClientFilters)
// - Klik na klijenta => prikaz detalja i njegovih racuna
// - Izmena klijenta: clientService.update(id, data), schema: editClientSchema
//   (sve osim lozinke i JMBG-a se moze menjati)
// - Spec: "Portal klijenata" iz Celine 2 (employee section)
// TODO [FE2-15a] @Elena - Podrzati otvoranje detalja preko rute /employee/clients/:id

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/lib/notify';
import { accountService } from '@/services/accountService';
import { clientService } from '@/services/clientService';
import type { Client } from '@/types';
import type { Account } from '@/types/celina2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatAmount(value: number | null | undefined, decimals = 2): string {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : (0).toFixed(decimals);
}

export default function ClientsPortalPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAccounts, setClientAccounts] = useState<Account[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editGender, setEditGender] = useState('');

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientService.getAll({
        email: search || undefined,
        firstName: search || undefined,
        lastName: search || undefined,
        page,
        limit: 10,
      });
      setClients(asArray<Client>(response.content));
      setTotalPages(Math.max(1, response.totalPages));
    } catch {
      toast.error('Neuspešno učitavanje klijenata.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClientDetails = async (client: Client) => {
    setSelectedClient(client);
    setEditFirstName(client.firstName);
    setEditLastName(client.lastName);
    setEditEmail(client.email);
    setEditPhone(client.phoneNumber);
    setEditAddress(client.address);
    setEditDateOfBirth(client.dateOfBirth);
    setEditGender(client.gender);
    setIsEditing(false);

    try {
      const accountsResponse = await accountService.getAll({ ownerEmail: client.email, page: 0, limit: 20 });
      setClientAccounts(asArray<Account>(accountsResponse.content));
    } catch {
      setClientAccounts([]);
    }
  };

  useEffect(() => {
    loadClients();
  }, [page, search]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const loadFromRoute = async () => {
      if (!id) return;
      const clientId = Number(id);
      if (!clientId || Number.isNaN(clientId)) return;
      try {
        const client = await clientService.getById(clientId);
        await loadClientDetails(client);
      } catch {
        toast.error('Neuspešno učitavanje klijenta iz rute.');
      }
    };

    loadFromRoute();
  }, [id]);

  const saveClient = async () => {
    if (!selectedClient) return;
    try {
      const updated = await clientService.update(selectedClient.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phoneNumber: editPhone,
        address: editAddress,
        dateOfBirth: editDateOfBirth,
        gender: editGender,
      });
      setSelectedClient(updated);
      setIsEditing(false);
      toast.success('Klijent uspešno izmenjen.');
      await loadClients();
    } catch {
      toast.error('Izmena klijenta nije uspela.');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Portal klijenata</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pretraga i lista klijenata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Pretraga po imenu, prezimenu ili email-u"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <p className="text-muted-foreground">Učitavanje klijenata...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Ime</th>
                    <th className="text-left py-2">Prezime</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Telefon</th>
                    <th className="text-left py-2">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {asArray<Client>(clients).map((client) => (
                    <tr key={client.id} className="border-b">
                      <td className="py-2">{client.firstName}</td>
                      <td className="py-2">{client.lastName}</td>
                      <td className="py-2">{client.email}</td>
                      <td className="py-2">{client.phoneNumber}</td>
                      <td className="py-2">
                        <Button size="sm" variant="outline" onClick={() => loadClientDetails(client)}>
                          Detalji
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Prethodna
            </Button>
            <span className="text-sm text-muted-foreground">Strana {page + 1} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Sledeća
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>Detalji klijenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Ime</Label>
                <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Prezime</Label>
                <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Adresa</Label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Datum rođenja</Label>
                <Input value={editDateOfBirth} onChange={(e) => setEditDateOfBirth(e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Pol</Label>
                <Input value={editGender} onChange={(e) => setEditGender(e.target.value)} disabled={!isEditing} />
              </div>
            </div>

            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Izmeni</Button>
              ) : (
                <>
                  <Button onClick={saveClient}>Sačuvaj</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Otkaži</Button>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Računi klijenta</h3>
              {asArray<Account>(clientAccounts).length === 0 ? (
                <p className="text-muted-foreground">Nema računa za ovog klijenta.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Broj računa</th>
                        <th className="text-left py-2">Tip</th>
                        <th className="text-left py-2">Valuta</th>
                        <th className="text-left py-2">Stanje</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asArray<Account>(clientAccounts).map((account) => (
                        <tr key={account.id} className="border-b">
                          <td className="py-2">{account.accountNumber}</td>
                          <td className="py-2">{account.accountType}</td>
                          <td className="py-2">{account.currency}</td>
                          <td className="py-2">{formatAmount(account.balance)}</td>
                          <td className="py-2">{account.status}</td>
                          <td className="py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(account.accountType === 'POSLOVNI' ? `/accounts/${account.id}/business` : `/accounts/${account.id}`)}
                            >
                              Otvori
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

