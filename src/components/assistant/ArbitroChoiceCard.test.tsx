/**
 * Vitest za ArbitroChoiceCard — Phase 4.5 wizard choice card.
 *
 * Pokriva:
 *  - render CHOICE prompt sa dugmadima
 *  - klik dugmeta → submitWizardChoice poziv sa pravim slotName + value
 *  - render TEXT/NUMBER prompt sa input poljem
 *  - render CONFIRM sa Da/Ne dugmadima
 *  - X dugme zove cancelWizard
 *  - previous selections panel prikazuje labele (ne raw value)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArbitroChoiceCard } from './ArbitroChoiceCard';
import type { WizardPrompt } from '../../types/arbitro';

const submitMock = vi.fn();
const cancelMock = vi.fn();

vi.mock('../../context/useArbitro', () => ({
  useArbitro: () => ({
    submitWizardChoice: submitMock,
    cancelWizard: cancelMock,
  }),
}));

const basePrompt: WizardPrompt = {
  wizardId: 'wiz-1',
  toolName: 'create_payment',
  title: 'Novo placanje',
  slotName: 'fromAccount',
  prompt: 'Sa kog racuna saljemo?',
  slotType: 'CHOICE',
  options: [
    { value: '222000111', label: 'Tekuci RSD', hint: '1.250 RSD dostupno' },
    { value: '222000222', label: 'Devizni EUR', hint: '500 EUR' },
  ],
  stepIndex: 1,
  totalSteps: 5,
  previousSelections: [],
};

describe('ArbitroChoiceCard', () => {
  beforeEach(() => {
    submitMock.mockReset();
    cancelMock.mockReset();
    submitMock.mockResolvedValue(undefined);
    cancelMock.mockResolvedValue(undefined);
  });

  it('prikazuje step counter i naslov', () => {
    render(<ArbitroChoiceCard prompt={basePrompt} />);
    expect(screen.getByText(/Korak 1 od 5/i)).toBeInTheDocument();
    expect(screen.getByText('Novo placanje')).toBeInTheDocument();
  });

  it('renderuje sve CHOICE opcije sa label + hint', () => {
    render(<ArbitroChoiceCard prompt={basePrompt} />);
    expect(screen.getByText('Tekuci RSD')).toBeInTheDocument();
    expect(screen.getByText('1.250 RSD dostupno')).toBeInTheDocument();
    expect(screen.getByText('Devizni EUR')).toBeInTheDocument();
    expect(screen.getByText('500 EUR')).toBeInTheDocument();
  });

  it('klik na dugme submituje slot value', () => {
    render(<ArbitroChoiceCard prompt={basePrompt} />);
    fireEvent.click(screen.getByText('Tekuci RSD'));
    expect(submitMock).toHaveBeenCalledWith('wiz-1', 'fromAccount', '222000111');
  });

  it('X dugme zove cancelWizard', () => {
    render(<ArbitroChoiceCard prompt={basePrompt} />);
    fireEvent.click(screen.getByLabelText('Otkazi'));
    expect(cancelMock).toHaveBeenCalledWith('wiz-1');
  });

  it('renderuje prompt tekst', () => {
    render(<ArbitroChoiceCard prompt={basePrompt} />);
    expect(screen.getByText('Sa kog racuna saljemo?')).toBeInTheDocument();
  });

  it('prikazuje previous selections sa label-om (ne raw value)', () => {
    const promptWithHistory: WizardPrompt = {
      ...basePrompt,
      slotName: 'amount',
      slotType: 'NUMBER',
      options: [],
      stepIndex: 2,
      previousSelections: [
        { slotName: 'fromAccount', label: 'Tekuci RSD' },
      ],
    };
    render(<ArbitroChoiceCard prompt={promptWithHistory} />);
    // Provera da je label vidljiv u panel-u
    expect(screen.getByText('Tekuci RSD')).toBeInTheDocument();
  });

  it('renderuje TEXT input umesto dugmadi', () => {
    const textPrompt: WizardPrompt = {
      ...basePrompt,
      slotName: 'description',
      slotType: 'TEXT',
      options: [],
      prompt: 'Svrha placanja?',
    };
    render(<ArbitroChoiceCard prompt={textPrompt} />);
    expect(screen.getByPlaceholderText('Unesi tekst')).toBeInTheDocument();
    expect(screen.getByText('Dalje')).toBeInTheDocument();
  });

  it('renderuje NUMBER input', () => {
    const numPrompt: WizardPrompt = {
      ...basePrompt,
      slotName: 'amount',
      slotType: 'NUMBER',
      options: [],
      prompt: 'Iznos?',
    };
    render(<ArbitroChoiceCard prompt={numPrompt} />);
    const input = screen.getByPlaceholderText('Unesi iznos') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('number');
  });

  it('TEXT submit salje uneti tekst', () => {
    const textPrompt: WizardPrompt = {
      ...basePrompt,
      slotName: 'description',
      slotType: 'TEXT',
      options: [],
    };
    render(<ArbitroChoiceCard prompt={textPrompt} />);
    const input = screen.getByPlaceholderText('Unesi tekst');
    fireEvent.change(input, { target: { value: 'Rodjendan' } });
    fireEvent.click(screen.getByText('Dalje'));
    expect(submitMock).toHaveBeenCalledWith('wiz-1', 'description', 'Rodjendan');
  });

  it('renderuje CONFIRM sa Da/Ne dugmadima', () => {
    const confirmPrompt: WizardPrompt = {
      ...basePrompt,
      slotName: 'confirmAction',
      slotType: 'CONFIRM',
      options: [],
      prompt: 'Da li ste sigurni?',
    };
    render(<ArbitroChoiceCard prompt={confirmPrompt} />);
    expect(screen.getByText('Da')).toBeInTheDocument();
    expect(screen.getByText('Ne')).toBeInTheDocument();
  });

  it('CONFIRM Da submituje YES', () => {
    const confirmPrompt: WizardPrompt = {
      ...basePrompt,
      slotName: 'confirmAction',
      slotType: 'CONFIRM',
      options: [],
    };
    render(<ArbitroChoiceCard prompt={confirmPrompt} />);
    fireEvent.click(screen.getByText('Da'));
    expect(submitMock).toHaveBeenCalledWith('wiz-1', 'confirmAction', 'YES');
  });

  it('prikazuje error iz prethodne validacije', () => {
    const errorPrompt: WizardPrompt = {
      ...basePrompt,
      errorMessage: 'Iznos mora biti veci od nule',
    };
    render(<ArbitroChoiceCard prompt={errorPrompt} />);
    expect(screen.getByText('Iznos mora biti veci od nule')).toBeInTheDocument();
  });

  it('prikazuje empty fallback ako nema opcija', () => {
    const emptyPrompt: WizardPrompt = {
      ...basePrompt,
      options: [],
    };
    render(<ArbitroChoiceCard prompt={emptyPrompt} />);
    expect(screen.getByText(/Nema dostupnih opcija/i)).toBeInTheDocument();
  });
});
