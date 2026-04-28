import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfitBankPage from './ProfitBankPage';

const useAuthMock = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/services/profitBankService', () => ({
  default: {
    listActuaryPerformance: vi.fn(),
    listBankFundPositions: vi.fn(),
  },
}));

vi.mock('@/services/investmentFundService', () => ({
  default: {
    list: vi.fn(),
    invest: vi.fn(),
    withdraw: vi.fn(),
  },
}));

vi.mock('@/services/accountService', () => ({
  accountService: {
    getMyAccounts: vi.fn(),
    getBankAccounts: vi.fn(),
  },
}));

vi.mock('@/lib/notify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import profitBankService from '@/services/profitBankService';
import investmentFundService from '@/services/investmentFundService';
import { accountService } from '@/services/accountService';

const mockedProfitBankService = vi.mocked(profitBankService);
const mockedInvestmentFundService = vi.mocked(investmentFundService);
const mockedAccountService = vi.mocked(accountService);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employee/profit-bank']}>
      <ProfitBankPage />
    </MemoryRouter>,
  );
}

describe('ProfitBankPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedProfitBankService.listActuaryPerformance.mockResolvedValue([
      { employeeId: 1, name: 'Marko Petrovic', position: 'SUPERVISOR', totalProfitRsd: 25000, ordersDone: 7 },
      { employeeId: 2, name: 'Tamara Pavlovic', position: 'AGENT', totalProfitRsd: 12000, ordersDone: 4 },
    ]);
    mockedProfitBankService.listBankFundPositions.mockResolvedValue([
      {
        id: 10,
        fundId: 5,
        fundName: 'Alpha Fund',
        userId: 99,
        userRole: 'BANK',
        userName: 'Banka 2',
        totalInvested: 100000,
        currentValue: 120000,
        percentOfFund: 15,
        profit: 20000,
        lastModifiedAt: '2026-04-28T10:00:00Z',
      },
    ]);
    mockedInvestmentFundService.list.mockResolvedValue([
      {
        id: 5,
        name: 'Alpha Fund',
        description: '',
        minimumContribution: 1000,
        fundValue: 800000,
        profit: 50000,
        managerName: 'Marko',
        inceptionDate: '2026-01-01',
      },
    ]);
    mockedAccountService.getBankAccounts.mockResolvedValue([] as never);
  });

  it('redirects non-supervisors to /home', () => {
    useAuthMock.mockReturnValue({ isSupervisor: false, isAdmin: false });
    const { container } = renderPage();
    expect(container.textContent).not.toContain('Profit Banke');
    expect(mockedProfitBankService.listActuaryPerformance).not.toHaveBeenCalled();
  });

  it('renders actuary tab content for supervisors', async () => {
    useAuthMock.mockReturnValue({ isSupervisor: true, isAdmin: false });
    renderPage();

    expect(await screen.findByText('Profit Banke')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
      expect(screen.getByText('Tamara Pavlovic')).toBeInTheDocument();
    });
  });

  it('switches to positions tab and shows Uplati/Povuci buttons', async () => {
    useAuthMock.mockReturnValue({ isSupervisor: true, isAdmin: false });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Profit Banke');
    await user.click(screen.getByRole('tab', { name: /Pozicije u fondovima/i }));

    expect(await screen.findByText('Alpha Fund')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Uplati u ime banke/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Povuci u ime banke/i })).toBeInTheDocument();
  });

  it('shows empty state when bank has no positions', async () => {
    useAuthMock.mockReturnValue({ isSupervisor: true, isAdmin: false });
    mockedProfitBankService.listBankFundPositions.mockResolvedValue([]);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Profit Banke');
    await user.click(screen.getByRole('tab', { name: /Pozicije u fondovima/i }));

    expect(await screen.findByText(/Banka trenutno nema pozicije u fondovima/i)).toBeInTheDocument();
  });
});
