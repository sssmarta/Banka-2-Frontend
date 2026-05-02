import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Lucide ikona koja ide u zaobljeni gradijent kontejner. */
  icon: ReactNode;
  /** Glavni naslov stranice. */
  title: string;
  /** Opcionalna podkratka ispod naslova. */
  description?: string;
  /** Opcionalan slot za dugmad sa desne strane (npr. "Novi zahtev"). */
  actions?: ReactNode;
  /** Default `'lg'` (10x10 ikona, 3xl naslov); `'md'` za podstranice. */
  size?: 'md' | 'lg';
}

/**
 * Konzistentan page header sa indigo→violet gradient ikonom + naslov +
 * opcioni opis + action slot. Pojavljivao se inline u 18+ stranica sa
 * jako slicnom strukturom (ovde objedinjeno radi DRY-a + lakseg
 * ujednacenja stilova kroz aplikaciju).
 */
export default function PageHeader({
  icon,
  title,
  description,
  actions,
  size = 'lg',
}: PageHeaderProps) {
  const iconBox = size === 'lg' ? 'h-10 w-10 rounded-xl' : 'h-9 w-9 rounded-lg';
  const heading = size === 'lg' ? 'text-3xl font-bold tracking-tight' : 'text-2xl font-semibold';

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex ${iconBox} items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className={heading}>{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
