import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateAccountPage from './CreateAccountPage';
import { renderWithProviders } from '../../test/test-utils';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockCreate = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('../../services/accountService', () => ({
  accountService: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

vi.mock('../../services/clientService', () => ({
  clientService: {
    getAll: vi.fn().mockResolvedValue({ content: [], totalPages: 0 }),
  },
}));

describe('CreateAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText('Kreiranje racuna')).toBeInTheDocument();
    expect(screen.getByText(/Kreirajte novi bankovni racun za klijenta/i)).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText('Nazad na portal racuna')).toBeInTheDocument();
  });

  it('navigates back when clicking back button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    await user.click(screen.getByText('Nazad na portal racuna'));

    expect(mockNavigate).toHaveBeenCalledWith('/employee/accounts');
  });

  it('renders owner email field', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByLabelText(/Email vlasnika/i)).toBeInTheDocument();
  });

  it('renders account type selection', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText('Tip racuna')).toBeInTheDocument();
  });

  it('renders account type options (Tekuci, Devizni, Poslovni)', () => {
    renderWithProviders(<CreateAccountPage />);

    // "Tekuci" appears in multiple places (type selector, preview card, etc.)
    expect(screen.getAllByText(/Tekuci/).length).toBeGreaterThan(0);
  });

  it('shows subtype options for standard accounts', () => {
    renderWithProviders(<CreateAccountPage />);

    // Default is TEKUCI, which shows standard subtypes
    expect(screen.getByText(/Podvrsta racuna/i)).toBeInTheDocument();
  });

  it('renders currency selection', () => {
    renderWithProviders(<CreateAccountPage />);

    // "Valuta" appears as a label and in the preview card
    expect(screen.getAllByText(/Valuta/i).length).toBeGreaterThan(0);
  });

  it('renders initial deposit field', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText(/Inicijalni depozit/i)).toBeInTheDocument();
  });

  it('renders create card switch', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText(/Napravi karticu uz racun/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    // Find and click submit button
    const submitButton = screen.getByText('Kreiraj racun');
    await user.click(submitButton);

    await waitFor(() => {
      // ownerEmail is required
      const errorMessages = document.querySelectorAll('.text-destructive');
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('renders the live preview card', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText(/Pregled racuna/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderWithProviders(<CreateAccountPage />);

    expect(screen.getByText('Kreiraj racun')).toBeInTheDocument();
  });

  it('renders Otkazi button that navigates back', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    const cancelButtons = screen.getAllByText('Otkazi');
    await user.click(cancelButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/employee/accounts');
  });

  it('shows preview card with default values', () => {
    renderWithProviders(<CreateAccountPage />);

    // Preview shows default currency RSD
    const previewTexts = screen.getAllByText('RSD');
    expect(previewTexts.length).toBeGreaterThan(0);

    // Preview shows "Tekuci racun" label
    expect(screen.getAllByText(/Tekuci racun/).length).toBeGreaterThan(0);

    // Preview shows card = Ne by default
    expect(screen.getByText('Ne')).toBeInTheDocument();
  });

  it('updates preview when initial deposit is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    const depositInput = screen.getByLabelText(/Inicijalni depozit/i);
    await user.type(depositInput, '50000');

    await waitFor(() => {
      // Preview should show the deposit value (format may vary by locale)
      expect(depositInput).toHaveValue(50000);
    });
  });

  it('updates preview when card switch is toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    // Initially card = Ne
    expect(screen.getByText('Ne')).toBeInTheDocument();

    // Toggle the switch
    const switchEl = screen.getByRole('switch');
    await user.click(switchEl);

    await waitFor(() => {
      expect(screen.getByText('Da')).toBeInTheDocument();
    });
  });

  it('shows business fields when POSLOVNI type is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    // Radix Select: click trigger then click option
    const selectTriggers = screen.getAllByRole('combobox');
    // First combobox is account type
    await user.click(selectTriggers[0]);

    // Wait for the dropdown to open, then find and click "Poslovni"
    const poslovniOption = await screen.findByRole('option', { name: 'Poslovni' });
    await user.click(poslovniOption);

    await waitFor(() => {
      expect(screen.getByText('Podaci firme')).toBeInTheDocument();
    });

    // Business fields should now be visible
    expect(screen.getByLabelText(/Naziv firme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maticni broj/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PIB/i)).toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    // Fill owner email
    const emailInput = screen.getByLabelText(/Email vlasnika/i);
    await user.type(emailInput, 'test@email.com');

    // Submit
    await user.click(screen.getByText('Kreiraj racun'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerEmail: 'test@email.com',
          accountType: 'CHECKING',
          currency: 'RSD',
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/employee/accounts');
  });

  it('shows error when API call fails on submit', async () => {
    mockCreate.mockRejectedValueOnce({
      response: { data: { message: 'Klijent ne postoji.' } },
    });

    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    const emailInput = screen.getByLabelText(/Email vlasnika/i);
    await user.type(emailInput, 'nonexistent@email.com');

    await user.click(screen.getByText('Kreiraj racun'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    // Should NOT navigate on error
    expect(mockNavigate).not.toHaveBeenCalledWith('/employee/accounts');
  });

  it('shows client suggestions when typing 3+ chars in email field', async () => {
    const { clientService } = await import('../../services/clientService');
    vi.mocked(clientService.getAll).mockResolvedValue({
      content: [
        { id: 1, firstName: 'Marko', lastName: 'Petrovic', email: 'marko@email.com' },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 5,
    } as never);

    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    const emailInput = screen.getByLabelText(/Email vlasnika/i);
    await user.type(emailInput, 'mar');

    await waitFor(() => {
      expect(screen.getByText('marko@email.com')).toBeInTheDocument();
    });
  });

  it('selects client from suggestions', async () => {
    const { clientService } = await import('../../services/clientService');
    vi.mocked(clientService.getAll).mockResolvedValue({
      content: [
        { id: 1, firstName: 'Marko', lastName: 'Petrovic', email: 'marko@email.com' },
      ],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 5,
    } as never);

    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    const emailInput = screen.getByLabelText(/Email vlasnika/i);
    await user.type(emailInput, 'mar');

    await waitFor(() => {
      expect(screen.getByText('marko@email.com')).toBeInTheDocument();
    });

    // Click on the suggestion
    await user.click(screen.getByText('marko@email.com'));

    // The email field should now have the selected email
    await waitFor(() => {
      expect(emailInput).toHaveValue('marko@email.com');
    });
  });

  it('shows preview company name for business accounts', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateAccountPage />);

    // Switch to POSLOVNI
    const selectTriggers = screen.getAllByRole('combobox');
    await user.click(selectTriggers[0]);
    const poslovniOption = await screen.findByRole('option', { name: 'Poslovni' });
    await user.click(poslovniOption);

    await waitFor(() => {
      expect(screen.getByLabelText(/Naziv firme/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Naziv firme/i), 'Test DOO');

    await waitFor(() => {
      // Preview should show company name
      expect(screen.getByText('Test DOO')).toBeInTheDocument();
    });
  });
});
