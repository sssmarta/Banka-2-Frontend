/**
 * Vitest za ArbitroSettingsDropdown — testira agentic toggle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArbitroSettingsDropdown } from './ArbitroSettingsDropdown';

const setAgenticModeMock = vi.fn();
let agenticModeMock = false;

vi.mock('../../context/useArbitro', () => ({
  useArbitro: () => ({
    agenticMode: agenticModeMock,
    setAgenticMode: setAgenticModeMock,
    ttsEnabled: false,
    setTtsEnabled: vi.fn(),
    ttsVoice: 'af_bella',
    setTtsVoice: vi.fn(),
  }),
}));

describe('ArbitroSettingsDropdown', () => {
  beforeEach(() => {
    setAgenticModeMock.mockClear();
    agenticModeMock = false;
  });

  it('prikazuje gear ikonicu po default-u (zatvoren dropdown)', () => {
    render(<ArbitroSettingsDropdown />);
    expect(screen.getByLabelText('Podesavanja')).toBeInTheDocument();
    expect(screen.queryByText(/Agentic mode/i)).not.toBeInTheDocument();
  });

  it('otvara dropdown na klik gear-a', () => {
    render(<ArbitroSettingsDropdown />);
    fireEvent.click(screen.getByLabelText('Podesavanja'));
    expect(screen.getByText(/Agentic mode/i)).toBeInTheDocument();
  });

  it('toggle aktivira agentic mode', () => {
    render(<ArbitroSettingsDropdown />);
    fireEvent.click(screen.getByLabelText('Podesavanja'));
    // Prvi checkbox je Agentic mode (drugi je TTS)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(setAgenticModeMock).toHaveBeenCalledWith(true);
  });

  it('prikazuje upozorenje kad je agentic mode aktivan', () => {
    agenticModeMock = true;
    render(<ArbitroSettingsDropdown />);
    fireEvent.click(screen.getByLabelText('Podesavanja'));
    expect(screen.getByText(/Ukljucen/i)).toBeInTheDocument();
  });

  it('checkbox je checked kad je agenticMode = true', () => {
    agenticModeMock = true;
    render(<ArbitroSettingsDropdown />);
    fireEvent.click(screen.getByLabelText('Podesavanja'));
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0].checked).toBe(true);
  });
});
