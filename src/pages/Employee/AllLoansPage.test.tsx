import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AllLoansPage from './AllLoansPage';
import { renderWithProviders } from '../../test/test-utils';
import type { Loan } from '@/types/celina2';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLoans: Loan[] = [
  {
    id: 1,
    loanNumber: 'KR-001',
    loanType: 'GOTOVINSKI',
    amount: 500000,
    currency: 'RSD',
    nominalRate: 5.5,
    effectiveRate: 6.2,
    monthlyPayment: 15000,
    remainingDebt: 450000,
    status: 'ACTIVE',
    startDate: '2025-01-15',
    endDate: '2028-01-15',
  } as Loan,
  {
    id: 2,
    loanNumber: 'KR-002',
    loanType: 'STAMBENI',
    amount: 10000000,
    currency: 'RSD',
    nominalRate: 3.5,
    effectiveRate: 4.0,
    monthlyPayment: 55000,
    remainingDebt: 9500000,
    status: 'PENDING',
    startDate: '2025-03-01',
    endDate: '2045-03-01',
  } as Loan,
  {
    id: 3,
    loanNumber: 'KR-003',
    loanType: 'AUTO',
    amount: 2000000,
    currency: 'RSD',
    nominalRate: 4.0,
    effectiveRate: 4.5,
    monthlyPayment: 35000,
    remainingDebt: 100000,
    status: 'LATE',
    startDate: '2024-06-01',
    endDate: '2027-06-01',
  } as Loan,
];

const mockGetAll = vi.fn().mockResolvedValue({
  content: mockLoans,
  totalPages: 1,
});

vi.mock('../../services/creditService', () => ({
  creditService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}));

describe('AllLoansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAll.mockResolvedValue({
      content: mockLoans,
      totalPages: 1,
    });
  });

  it('renders the page header', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('Svi krediti')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregled svih kredita u bankarskom sistemu/i)).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('Ukupno kredita')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Aktivni').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kasnjenje').length).toBeGreaterThan(0);
    expect(screen.getByText('Ukupan iznos')).toBeInTheDocument();
  });

  it('renders filter section', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('Filteri')).toBeInTheDocument();
    });
    expect(screen.getByText('Tip kredita')).toBeInTheDocument();
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('renders table headers', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getAllByText('ID').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Tip').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Iznos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mesecna rata').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preostali dug').length).toBeGreaterThan(0);
  });

  it('renders loan data in the table', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('KR-001')).toBeInTheDocument();
    });
    expect(screen.getByText('KR-002')).toBeInTheDocument();
    expect(screen.getByText('KR-003')).toBeInTheDocument();
  });

  it('renders loan type labels', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('GOTOVINSKI')).toBeInTheDocument();
    });
    expect(screen.getByText('STAMBENI')).toBeInTheDocument();
    expect(screen.getByText('AUTO')).toBeInTheDocument();
  });

  it('renders status badges', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('Aktivan')).toBeInTheDocument();
    });
    // "Na cekanju" appears in status badge
    expect(screen.getAllByText('Na cekanju').length).toBeGreaterThan(0);
  });

  it('renders Detalji buttons for each loan', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(3);
    });
  });

  it('shows loan details panel when Detalji is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(3);
    });

    await user.click(screen.getAllByText('Detalji')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Detalji kredita #KR-001/)).toBeInTheDocument();
    });
    // Detail panel fields
    expect(screen.getAllByText('Tip kredita').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nominalna kamata').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Efektivna kamata').length).toBeGreaterThan(0);
  });

  it('closes details panel when X is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Detalji').length).toBe(3);
    });

    await user.click(screen.getAllByText('Detalji')[0]);

    await waitFor(() => {
      expect(screen.getByText(/Detalji kredita #KR-001/)).toBeInTheDocument();
    });

    // Close button has title="Zatvori"
    const closeBtn = screen.getByTitle('Zatvori');
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Detalji kredita #KR-001/)).not.toBeInTheDocument();
    });
  });

  it('renders pagination', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText(/Strana 1 \/ 1/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no loans', async () => {
    mockGetAll.mockResolvedValue({ content: [], totalPages: 1 });
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema kredita za izabrane filtere')).toBeInTheDocument();
    });
  });

  it('shows loading skeletons while loading', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AllLoansPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls getAll with correct params on load', async () => {
    renderWithProviders(<AllLoansPage />);

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledWith({
        page: 0,
        limit: 10,
        loanType: undefined,
        status: undefined,
      });
    });
  });
});
