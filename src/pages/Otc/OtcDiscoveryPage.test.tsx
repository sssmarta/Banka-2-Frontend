import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OtcDiscoveryPage from './OtcDiscoveryPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockListDiscovery = vi.fn();
const mockCreateOffer = vi.fn();

vi.mock('@/services/otcService', () => ({
  default: {
    listDiscovery: (...a: unknown[]) => mockListDiscovery(...a),
    createOffer: (...a: unknown[]) => mockCreateOffer(...a),
  },
}));

vi.mock('./OtcInterBankDiscoveryTab', () => ({
  default: () => <div data-testid="inter-bank-discovery">[InterBank Discovery]</div>,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockListDiscovery.mockReset();
  mockCreateOffer.mockReset();
  mockListDiscovery.mockResolvedValue([
    {
      portfolioId: 1, listingId: 1, listingTicker: 'AAPL', listingName: 'Apple Inc.',
      listingCurrency: 'USD', currentPrice: 190, publicQuantity: 5, availablePublicQuantity: 5,
      sellerId: 2, sellerRole: 'CLIENT', sellerName: 'Milica Nikolic',
    },
  ]);
});

describe('OtcDiscoveryPage', () => {
  it('renders source filter chip', async () => {
    render(<MemoryRouter><OtcDiscoveryPage /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Iz nase banke/i));
    expect(screen.getByRole('button', { name: /Sve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iz drugih banaka/i })).toBeInTheDocument();
  });

  it('shows local listings under "Sve" filter', async () => {
    render(<MemoryRouter><OtcDiscoveryPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('AAPL')).toBeInTheDocument());
  });

  it('switches to inter-bank when filter "Iz drugih banaka" clicked', async () => {
    render(<MemoryRouter><OtcDiscoveryPage /></MemoryRouter>);
    await waitFor(() => screen.getByText(/Iz drugih banaka/i));
    fireEvent.click(screen.getByRole('button', { name: /Iz drugih banaka/i }));
    expect(screen.getByTestId('inter-bank-discovery')).toBeInTheDocument();
  });

  it('opens create-offer form when "Napravi ponudu" clicked', async () => {
    render(<MemoryRouter><OtcDiscoveryPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('AAPL'));
    fireEvent.click(screen.getByRole('button', { name: /Napravi ponudu/i }));
    expect(screen.getByLabelText(/Kolicina akcija/i)).toBeInTheDocument();
  });
});
