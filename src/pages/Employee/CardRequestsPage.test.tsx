import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardRequestsPage from './CardRequestsPage';
import { renderWithProviders } from '../../test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockRequests = [
  {
    id: 1,
    accountId: 10,
    accountNumber: '265000000000000001',
    cardLimit: 50000,
    clientEmail: 'marko@email.com',
    clientName: 'Marko Petrovic',
    status: 'PENDING',
    createdAt: '2025-03-15T10:30:00',
  },
  {
    id: 2,
    accountId: 20,
    accountNumber: '265000000000000002',
    cardLimit: 100000,
    clientEmail: 'ana@email.com',
    clientName: 'Ana Jovanovic',
    status: 'APPROVED',
    createdAt: '2025-03-14T09:00:00',
  },
  {
    id: 3,
    accountId: 30,
    accountNumber: '265000000000000003',
    cardLimit: 30000,
    clientEmail: 'jovan@email.com',
    clientName: 'Jovan Markovic',
    status: 'REJECTED',
    createdAt: '2025-03-13T14:00:00',
  },
];

const mockGet = vi.fn().mockResolvedValue({ data: { content: mockRequests } });
const mockPatch = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

describe('CardRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { content: mockRequests } });
    mockPatch.mockResolvedValue({ data: {} });
  });

  it('renders the page header', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Zahtevi za kartice')).toBeInTheDocument();
    });
    expect(screen.getByText(/Pregledajte i odobrite zahteve klijenata za izdavanje kartica/i)).toBeInTheDocument();
  });

  it('renders stats cards', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Ukupno').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Na cekanju').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odobreni').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odbijeni').length).toBeGreaterThan(0);
  });

  it('renders request cards with client info', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });
    expect(screen.getByText('marko@email.com')).toBeInTheDocument();
    expect(screen.getByText('Ana Jovanovic')).toBeInTheDocument();
    expect(screen.getByText('ana@email.com')).toBeInTheDocument();
    expect(screen.getByText('Jovan Markovic')).toBeInTheDocument();
  });

  it('renders account numbers', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('265000000000000001')).toBeInTheDocument();
    });
    expect(screen.getByText('265000000000000002')).toBeInTheDocument();
  });

  it('renders status badges correctly', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      const pendingBadges = screen.getAllByText('Na cekanju');
      expect(pendingBadges.length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Odobreno').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Odbijeno').length).toBeGreaterThan(0);
  });

  it('shows card limit info', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText(/50\.000 RSD/)).toBeInTheDocument();
    });
  });

  it('shows Odobri and Odbij buttons for pending requests', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odobri')).toBeInTheDocument();
    });
    expect(screen.getByText('Odbij')).toBeInTheDocument();
  });

  it('does not show action buttons for non-pending requests', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      // Only 1 pending request means only 1 set of action buttons
      expect(screen.getAllByText('Odobri').length).toBe(1);
    });
    expect(screen.getAllByText('Odbij').length).toBe(1);
  });

  it('calls approve API when Odobri is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odobri')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Odobri'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/cards/requests/1/approve');
    });
  });

  it('calls reject API when Odbij is clicked', async () => {
    window.prompt = vi.fn(() => 'Nema sredstava');
    const user = userEvent.setup();
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Odbij')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Odbij'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/cards/requests/1/reject', { reason: 'Nema sredstava' });
    });
  });

  it('shows loading skeletons while loading', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<CardRequestsPage />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no requests', async () => {
    mockGet.mockResolvedValue({ data: { content: [] } });
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nema zahteva za prikaz')).toBeInTheDocument();
    });
    expect(screen.getByText(/Trenutno nema zahteva za izdavanje kartica/i)).toBeInTheDocument();
  });

  it('fetches requests on mount', async () => {
    renderWithProviders(<CardRequestsPage />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/cards/requests?page=0&limit=50');
    });
  });
});
