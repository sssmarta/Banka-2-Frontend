import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OtcHubPage from './OtcHubPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/services/otcService', () => ({
  default: {
    listDiscovery: vi.fn().mockResolvedValue([
      { listingId: 1, listingTicker: 'AAPL', sellerName: 'Milica', publicQuantity: 5, availablePublicQuantity: 5, currentPrice: 100, listingCurrency: 'USD', listingName: 'Apple', portfolioId: 1, sellerId: 2, sellerRole: 'CLIENT' },
      { listingId: 2, listingTicker: 'GOOG', sellerName: 'Lazar', publicQuantity: 3, availablePublicQuantity: 3, currentPrice: 150, listingCurrency: 'USD', listingName: 'Google', portfolioId: 2, sellerId: 3, sellerRole: 'CLIENT' },
    ]),
    listMyActiveOffers: vi.fn().mockResolvedValue([
      { id: 1, myTurn: true, status: 'ACTIVE', listingTicker: 'AAPL' },
      { id: 2, myTurn: false, status: 'ACTIVE', listingTicker: 'GOOG' },
    ]),
    listMyContracts: vi.fn().mockResolvedValue([
      { id: 1, status: 'ACTIVE' },
      { id: 2, status: 'EXERCISED' },
    ]),
    listMyPublicListings: vi.fn().mockResolvedValue([
      { listingId: 1, listingTicker: 'AAPL', publicQuantity: 5 },
    ]),
  },
}));

beforeEach(() => mockNavigate.mockClear());

describe('OtcHubPage', () => {
  it('renders 4 hub cards', async () => {
    render(<MemoryRouter><OtcHubPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('hub-discovery')).toBeInTheDocument();
      expect(screen.getByTestId('hub-negotiations')).toBeInTheDocument();
      expect(screen.getByTestId('hub-contracts')).toBeInTheDocument();
      expect(screen.getByTestId('hub-my-public')).toBeInTheDocument();
    });
  });

  it('shows live counts after fetch', async () => {
    render(<MemoryRouter><OtcHubPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('hub-discovery')).toHaveTextContent('2');
      expect(screen.getByTestId('hub-negotiations')).toHaveTextContent('2');
      expect(screen.getByTestId('hub-contracts')).toHaveTextContent('1');
      expect(screen.getByTestId('hub-my-public')).toHaveTextContent('1');
    });
  });

  it('shows warning when myTurn offer exists', async () => {
    render(<MemoryRouter><OtcHubPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/ceka tebe/i)).toBeInTheDocument();
    });
  });

  it('navigates on card click', async () => {
    render(<MemoryRouter><OtcHubPage /></MemoryRouter>);
    await waitFor(() => screen.getByTestId('hub-discovery'));
    fireEvent.click(screen.getByTestId('hub-discovery'));
    expect(mockNavigate).toHaveBeenCalledWith('/otc/discovery');
    fireEvent.click(screen.getByTestId('hub-negotiations'));
    expect(mockNavigate).toHaveBeenCalledWith('/otc/pregovori');
    fireEvent.click(screen.getByTestId('hub-contracts'));
    expect(mockNavigate).toHaveBeenCalledWith('/otc/ugovori');
    fireEvent.click(screen.getByTestId('hub-my-public'));
    expect(mockNavigate).toHaveBeenCalledWith('/otc/moje');
  });
});
