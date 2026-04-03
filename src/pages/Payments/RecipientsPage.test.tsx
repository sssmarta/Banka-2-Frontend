import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipientsPage from './RecipientsPage';
import { mockRecipient } from '@/test/helpers';

// ---------- Mocks ----------

vi.mock('@/services/paymentRecipientService', () => ({
  paymentRecipientService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { paymentRecipientService } from '@/services/paymentRecipientService';

const mockService = vi.mocked(paymentRecipientService);

const r1 = mockRecipient({ id: 1, name: 'Marko Petrovic', accountNumber: '265000000000000001' });
const r2 = mockRecipient({ id: 2, name: 'Ana Jovanovic', accountNumber: '265000000000000002' });

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/payments/recipients']}>
      <RecipientsPage />
    </MemoryRouter>
  );
}

describe('RecipientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getAll.mockResolvedValue([r1, r2]);
  });

  it('renders page header', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Primaoci placanja/i)).toBeInTheDocument();
    });
  });

  it('renders list of recipients', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });
    expect(screen.getByText('Ana Jovanovic')).toBeInTheDocument();
  });

  it('displays account numbers', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('265000000000000001')).toBeInTheDocument();
    });
    expect(screen.getByText('265000000000000002')).toBeInTheDocument();
  });

  it('shows create form when Dodaj primaoca is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Dodaj primaoca/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Dodaj primaoca/i));

    expect(screen.getByLabelText(/Ime primaoca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Broj racuna/i)).toBeInTheDocument();
  });

  it('creates a new recipient', async () => {
    const user = userEvent.setup();
    mockService.create.mockResolvedValue({ id: 3, name: 'Novi Primalac', accountNumber: '265000000000000003' });
    mockService.getAll.mockResolvedValueOnce([r1, r2]).mockResolvedValueOnce([r1, r2, mockRecipient({ id: 3, name: 'Novi Primalac', accountNumber: '265000000000000003' })]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Dodaj primaoca/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Dodaj primaoca/i));

    await user.type(screen.getByLabelText(/Ime primaoca/i), 'Novi Primalac');
    await user.type(screen.getByLabelText(/Broj racuna/i), '265000000000000003');

    await user.click(screen.getByRole('button', { name: /Sacuvaj primaoca/i }));

    await waitFor(() => {
      expect(mockService.create).toHaveBeenCalledWith({
        name: 'Novi Primalac',
        accountNumber: '265000000000000003',
      });
    });
  });

  it('shows edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    // Find and click the edit button (Pencil icon button)
    const editButtons = screen.getAllByTitle(/Izmeni/i);
    await user.click(editButtons[0]);

    // Should show the edit form
    await waitFor(() => {
      expect(screen.getByDisplayValue('Marko Petrovic')).toBeInTheDocument();
    });
  });

  it('updates recipient on edit save', async () => {
    const user = userEvent.setup();
    mockService.update.mockResolvedValue(undefined);
    mockService.getAll.mockResolvedValueOnce([r1, r2]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/Izmeni/i);
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Marko Petrovic')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Marko Petrovic');
    await user.clear(nameInput);
    await user.type(nameInput, 'Marko Markovic');

    await user.click(screen.getByRole('button', { name: /Sacuvaj/i }));

    await waitFor(() => {
      expect(mockService.update).toHaveBeenCalledWith(1, expect.objectContaining({
        name: 'Marko Markovic',
      }));
    });
  });

  it('deletes recipient when delete button is clicked', async () => {
    const user = userEvent.setup();
    mockService.delete.mockResolvedValue(undefined);
    vi.mocked(window.confirm).mockReturnValue(true);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Obrisi/i);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockService.delete).toHaveBeenCalledWith(1);
    });
  });

  it('filters recipients by search term', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Pretraga po imenu ili broju/i);
    await user.type(searchInput, 'Ana');

    await waitFor(() => {
      expect(screen.getByText('Ana Jovanovic')).toBeInTheDocument();
    });
    expect(screen.queryByText('Marko Petrovic')).not.toBeInTheDocument();
  });

  it('shows empty state when no recipients', async () => {
    mockService.getAll.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Nema sacuvanih primalaca/i)).toBeInTheDocument();
    });
  });

  it('shows empty search result state', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marko Petrovic')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Pretraga po imenu ili broju/i);
    await user.type(searchInput, 'XYZNONEXISTENT');

    await waitFor(() => {
      expect(screen.getByText(/Nema rezultata pretrage/i)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    mockService.getAll.mockImplementation(() => new Promise(() => {}));

    renderPage();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
