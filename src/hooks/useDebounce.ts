import { useEffect, useState } from 'react';

/**
 * Vraca debounceovan snapshot vrednosti — update-uje tek nakon `delayMs`
 * mira (nema novih promena). Tipicna upotreba: search input gde fetch ne
 * treba da se okida na svaki karakter.
 *
 * Bila duplirana 3 puta u SecuritiesListPage (search + advanced filters)
 * + 1 put u ActuaryManagementPage + 1 put u EmployeeListPage. Sad jedan
 * helper.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
