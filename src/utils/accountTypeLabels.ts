/**
 * BE vraca tip racuna kao srpsku ("TEKUCI") ili englesku ("CHECKING")
 * formu zavisno od endpoint-a — DTO normalizacija nije konzistentna.
 * Mapa pokriva oba seta da `accountTypeLabels[type]` uvek vraca prikaz.
 *
 * Bila duplirana u AccountListPage / AccountDetailsPage / AccountsPortalPage /
 * CreateAccountPage.
 */
export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  TEKUCI: 'Tekuci',
  DEVIZNI: 'Devizni',
  POSLOVNI: 'Poslovni',
  CHECKING: 'Tekuci',
  FOREIGN: 'Devizni',
  BUSINESS: 'Poslovni',
};
