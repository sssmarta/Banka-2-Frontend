import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OtcMyPublicPage from './OtcMyPublicPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockListMy = vi.fn();
vi.mock('@/services/otcService', () => ({
  default: { listMyPublicListings: (...a: unknown[]) => mockListMy(...a) },
}));

beforeEach(() => { vi.clearAllMocks(); });

describe('OtcMyPublicPage', () => {
  it('renders empty state when no public listings', async () => {
    mockListMy.mockResolvedValue([]);
    render(<MemoryRouter><OtcMyPublicPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/Nemate javnih akcija/i)).toBeInTheDocument());
  });

  it('renders list when public listings exist', async () => {
    mockListMy.mockResolvedValue([
      { listingId: 1, listingTicker: 'AAPL', listingName: 'Apple Inc.', listingCurrency: 'USD',
        currentPrice: 100, publicQuantity: 5, availablePublicQuantity: 5, portfolioId: 1,
        sellerId: 1, sellerRole: 'CLIENT', sellerName: 'Stefan' },
    ]);
    render(<MemoryRouter><OtcMyPublicPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('AAPL')).toBeInTheDocument());
  });

  it('Izmeni button navigates to /portfolio', async () => {
    mockListMy.mockResolvedValue([
      { listingId: 1, listingTicker: 'AAPL', listingName: 'Apple Inc.', listingCurrency: 'USD',
        currentPrice: 100, publicQuantity: 5, availablePublicQuantity: 5, portfolioId: 1,
        sellerId: 1, sellerRole: 'CLIENT', sellerName: 'Stefan' },
    ]);
    render(<MemoryRouter><OtcMyPublicPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('AAPL'));
    fireEvent.click(screen.getByRole('button', { name: /Izmeni/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/portfolio');
  });
});
