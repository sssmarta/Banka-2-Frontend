import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Wallet,
  Receipt,
  BookUser,
  ArrowLeftRight,
  History,
  RefreshCw,
  CreditCard,
  FileText,
  Building2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';



interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function ClientSidebar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const permissions = Array.isArray((user as { permissions?: unknown[] } | null)?.permissions)
    ? ((user as { permissions?: string[] } | null)?.permissions ?? [])
    : [];

  const role = String(
    (user as { role?: string; userType?: string } | null)?.role ??
      (user as { role?: string; userType?: string } | null)?.userType ??
      ''
  ).toUpperCase();

  const isEmployeeOrAdmin =
    permissions.includes('ADMIN') ||
    permissions.includes('EMPLOYEE') ||
    role === 'ADMIN' ||
    role === 'EMPLOYEE';

  const clientLinks: SidebarItem[] = useMemo(
    () => [
      { label: 'Početna', path: '/home', icon: <Home className="h-4 w-4" /> },
      { label: 'Računi', path: '/accounts', icon: <Wallet className="h-4 w-4" /> },
      { label: 'Plaćanja', path: '/payments/new', icon: <Receipt className="h-4 w-4" /> },
      { label: 'Primaoci', path: '/payments/recipients', icon: <BookUser className="h-4 w-4" /> },
      { label: 'Prenosi', path: '/transfers', icon: <ArrowLeftRight className="h-4 w-4" /> },
      { label: 'Istorija', path: '/payments/history', icon: <History className="h-4 w-4" /> },
      { label: 'Menjačnica', path: '/exchange', icon: <RefreshCw className="h-4 w-4" /> },
      { label: 'Kartice', path: '/cards', icon: <CreditCard className="h-4 w-4" /> },
      { label: 'Krediti', path: '/loans', icon: <FileText className="h-4 w-4" /> },
    ],
    []
  );

  const employeeLinks: SidebarItem[] = useMemo(
    () => [
      { label: 'Portal računa', path: '/employee/accounts', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Portal kartica', path: '/employee/cards', icon: <CreditCard className="h-4 w-4" /> },
      { label: 'Portal klijenata', path: '/employee/clients', icon: <Users className="h-4 w-4" /> },
      { label: 'Zahtevi za kredit', path: '/employee/loan-requests', icon: <ShieldCheck className="h-4 w-4" /> },
      { label: 'Svi krediti', path: '/employee/loans', icon: <FileText className="h-4 w-4" /> },
    ],
    []
  );

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
      isActive && 'bg-primary/10 text-primary font-medium'
    );

  return (
    <>
      <div className="border-b p-3 md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Zatvori navigaciju' : 'Otvori navigaciju'}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-muted/40 p-4 transition-transform md:sticky md:top-0 md:block md:min-h-screen md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:transform-none'
        )}
      >
        <div className="mb-4 flex items-center justify-between md:hidden">
          <p className="text-sm font-semibold">Navigacija</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Zatvori navigaciju"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-6">
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Moje finansije
            </p>

            <div className="space-y-1">
              {clientLinks.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={linkClassName}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {isEmployeeOrAdmin && (
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Employee portal
              </p>

              <div className="space-y-1">
                {employeeLinks.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={linkClassName}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
