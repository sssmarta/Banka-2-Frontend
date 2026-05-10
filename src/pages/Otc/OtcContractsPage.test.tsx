import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OtcContractsPage from './OtcContractsPage';

const mockListContracts = vi.fn();
const mockExercise = vi.fn();
vi.mock('@/services/otcService', () => ({
  default: {
    listMyContracts: (...a: unknown[]) => mockListContracts(...a),
    exerciseContract: (...a: unknown[]) => mockExercise(...a),
  },
}));
vi.mock('@/services/accountService', () => ({
  accountService: {
    getMyAccounts: vi.fn().mockResolvedValue([
      { id: 1, status: 'ACTIVE', currency: 'USD', accountNumber: '222000111' },
    ]),
    getBankAccounts: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1 }, isAdmin: false, isAgent: false, isSupervisor: false }),
}));
vi.mock('./OtcInterBankContractsTab', () => ({
  default: () => <div data-testid="inter-bank-contracts">[InterBank Contracts]</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockListContracts.mockResolvedValue([
    {
      id: 1, listingTicker: 'AAPL', listingName: 'Apple Inc.', listingCurrency: 'USD',
      buyerId: 1, buyerName: 'Stefan', sellerId: 2, sellerName: 'Milica',
      quantity: 5, strikePrice: 100, premium: 10, currentPrice: 100,
      settlementDate: '2026-06-04', status: 'ACTIVE',
      createdAt: '2026-05-09T10:00:00',
    },
  ]);
});

describe('OtcContractsPage', () => {
  it('renders 2 filter chip lines (source + status)', async () => {
    render(<MemoryRouter><OtcContractsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Iz nase banke/i));
    // Source chip "Sve" — exact match
    expect(screen.getByRole('button', { name: /^Sve$/i })).toBeInTheDocument();
    // Status chip "Svi" — exact match
    expect(screen.getByRole('button', { name: /^Svi$/i })).toBeInTheDocument();
  });

  it('shows Iskoristi button only for buyer', async () => {
    render(<MemoryRouter><OtcContractsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('AAPL'));
    expect(screen.getByRole('button', { name: /Iskoristi/i })).toBeInTheDocument();
  });
});
