import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountsPortalPage from './AccountsPortalPage';
import { renderWithProviders } from '../../test/test-utils';
import type { Account } from '@/types/celina2';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAccounts: Account[] = [
  {
    id: 1,
    ownerName: 'Marko Petrovic',
    accountNumber: '265000000000000001',
    accountType: 'TEKUCI',
    currency: 'RSD',
    status: 'ACTIVE',
    balance: 100000,
    availableBalance: 95000,
    createdAt: '2025-01-01',
  } as Account,
  {
    id: 2,
    ownerName: 'Ana Jovanovic',
    accountNumber: '265000000000000002',
    accountType: 'DEVIZNI',
    currency: 'EUR',
    status: 'BLOCKED',
    balance: 5000,
    availableBalance: 5000,
    createdAt: '2025-02-01',
  } as Account,
];

const mockGetAll = vi.fn().mockResolvedValue({
  content: mockAccounts,
  totalPages: 1,
  totalElements: 2,
});
const mockChangeStatus = vi.fn().mockResolvedValue(undefined);

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    changeStatus: (...args: unknown[]) => mockChangeStatus(...args),
  },
}));

describe('AccountsPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({
      content: mockAccounts,
      totalPages: 1,
      totalElements: 2,
    });
  });

  it('renders the page header', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Portal racuna')).toBeInTheDocument();
    });
    expect(screen.getByText(/Upravljajte svim bankovnim racunima/i)).toBeInTheDocument();
  });

  it('renders Kreiraj racun button', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Kreiraj racun')).toBeInTheDocument();
    });
  });

  it('navigates to create account when clicking Kreiraj racun', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Kreiraj racun')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Kreiraj racun'));
    expect(mockNavigate).toHaveBeenCalledWith('/employee/accounts/new');
  });

  it('renders stat cards', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Ukupno racuna')).toBeInTheDocument();
    });
    expect(screen.getByText('Aktivni')).toBeInTheDocument();
    expect(screen.getByText('Blokirani')).toBeInTheDocument();
    expect(screen.getByText('Ukupno stanje')).toBeInTheDocument();
  });

  it('renders accounts table with data', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });
    expect(screen.getByText('Ana Jovanovic')).toBeInTheDocument();
  });

  it('renders table headers', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Vlasnik')).toBeInTheDocument();
    });
    expect(screen.getByText('Broj racuna')).toBeInTheDocument();
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getAllByText('Stanje').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Valuta').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('renders formatted account numbers', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('265-0000000000000-01')).toBeInTheDocument();
    });
    expect(screen.getByText('265-0000000000000-02')).toBeInTheDocument();
  });

  it('renders account type labels', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Tekuci')).toBeInTheDocument();
    });
    expect(screen.getByText('Devizni')).toBeInTheDocument();
  });

  it('renders status labels', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Aktivan')).toBeInTheDocument();
    });
    expect(screen.getByText('Blokiran')).toBeInTheDocument();
  });

  it('shows Blokiraj button for active accounts', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Blokiraj')).toBeInTheDocument();
    });
  });

  it('shows Aktiviraj button for blocked accounts', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Aktiviraj')).toBeInTheDocument();
    });
  });

  it('shows Detalji buttons', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(2);
    });
  });

  it('calls changeStatus when Blokiraj is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Blokiraj')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Blokiraj'));

    await waitFor(() => {
      expect(mockChangeStatus).toHaveBeenCalledWith(1, 'BLOCKED');
    });
  });

  it('calls changeStatus when Aktiviraj is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Aktiviraj')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Aktiviraj'));

    await waitFor(() => {
      expect(mockChangeStatus).toHaveBeenCalledWith(2, 'ACTIVE');
    });
  });

  it('renders pagination info', async () => {
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText(/1–2 od 2/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Strana 1 \/ 1/)).toBeInTheDocument();
  });

  it('shows empty state when no accounts found', async () => {
    mockGetAll.mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
    });
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema pronadjenih racuna')).toBeInTheDocument();
    });
  });

  it('shows loading skeletons while loading', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AccountsPortalPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('toggles filter section when filter button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Click the filter toggle button (has title="Filteri")
    const filterBtn = screen.getByTitle('Filteri');
    await user.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByText('Filteri pretrage')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Pretrazi po emailu/i)).toBeInTheDocument();
  });

  it('navigates to cards page when card icon button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsPortalPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Find all card icon buttons (title="Kartice")
    const cardButtons = screen.getAllByTitle('Kartice');
    await user.click(cardButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/employee/accounts/1/cards');
  });
});
