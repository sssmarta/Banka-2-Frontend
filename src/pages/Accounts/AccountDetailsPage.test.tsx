import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountDetailsPage from './AccountDetailsPage';
import { mockAccount, mockTransaction, paginatedResponse } from '@/test/helpers';

// ---------- Mocks ----------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/accountService', () => ({
  accountService: {
    getById: vi.fn(),
    updateName: vi.fn(),
    changeLimit: vi.fn(),
  },
}));

vi.mock('@/services/transactionService', () => ({
  transactionService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/components/shared/VerificationModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="verification-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
}));

import { accountService } from '@/services/accountService';
import { transactionService } from '@/services/transactionService';

const mockAccountService = vi.mocked(accountService);
const mockTransactionService = vi.mocked(transactionService);

const account = mockAccount({
  id: 42,
  name: 'Moj tekuci',
  balance: 250000,
  availableBalance: 240000,
  dailyLimit: 100000,
  monthlyLimit: 500000,
  dailySpending: 20000,
  monthlySpending: 150000,
});

function renderPage(accountId = '42') {
  return render(
    <MemoryRouter initialEntries={[`/accounts/${accountId}`]}>
      <Routes>
        <Route path="/accounts/:id" element={<AccountDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AccountDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountService.getById.mockResolvedValue(account);
    mockTransactionService.getAll.mockResolvedValue(paginatedResponse([
      mockTransaction({ id: 1, recipientName: 'EPS', amount: 5000 }),
      mockTransaction({ id: 2, recipientName: 'Telenor', amount: 3000 }),
    ]));
  });

  it('renders account details after loading', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    // Account number formatted
    expect(screen.getByText(/265-0000000000000-01/)).toBeInTheDocument();
  });

  it('shows balance and available balance', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Stanje/)).toBeInTheDocument();
    });
    // "Raspolozivo" appears in both the hero header and the balance detail card
    expect(screen.getAllByText(/Raspolozivo/).length).toBeGreaterThanOrEqual(2);
  });

  it('shows limit usage rings when limits are set', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Dnevna potrosnja/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Mesecna potrosnja/)).toBeInTheDocument();
  });

  it('shows recent transactions', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('EPS')).toBeInTheDocument();
    });
    expect(screen.getByText('Telenor')).toBeInTheDocument();
  });

  it('shows empty transactions state when no transactions', async () => {
    mockTransactionService.getAll.mockResolvedValue(paginatedResponse([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Nema transakcija za ovaj racun/)).toBeInTheDocument();
    });
  });

  it('shows rename form when Preimenuj button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    const renameBtn = screen.getByRole('button', { name: /Preimenuj/i });
    await user.click(renameBtn);

    expect(screen.getByPlaceholderText(/Novi naziv racuna/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sacuvaj/i })).toBeInTheDocument();
  });

  it('saves new name via accountService.updateName', async () => {
    const user = userEvent.setup();
    mockAccountService.updateName.mockResolvedValue({
      ...account,
      name: 'Novi naziv',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Preimenuj/i }));

    const input = screen.getByPlaceholderText(/Novi naziv racuna/i);
    await user.clear(input);
    await user.type(input, 'Novi naziv');
    await user.click(screen.getByRole('button', { name: /^Sacuvaj$/i }));

    await waitFor(() => {
      expect(mockAccountService.updateName).toHaveBeenCalledWith(42, 'Novi naziv');
    });
  });

  it('shows change limit form when Promeni limit button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Promeni limit/i }));

    expect(screen.getByLabelText(/Novi dnevni limit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Novi mesecni limit/i)).toBeInTheDocument();
  });

  it('shows "not found" when account does not exist', async () => {
    mockAccountService.getById.mockRejectedValue(new Error('Not found'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Racun nije pronadjen/)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    mockAccountService.getById.mockImplementation(() => new Promise(() => {}));

    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders action buttons', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Novo placanje/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Transfer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Promeni limit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preimenuj/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sve transakcije/i })).toBeInTheDocument();
  });

  it('navigates back to accounts on back button click', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Moj tekuci')).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Nazad na racune/i });
    await user.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts');
  });
});
