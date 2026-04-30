/**
 * Phase 4.5 — Wizard choice card.
 *
 * Renderuje pitanje + dugmad (CHOICE), input polje (TEXT/NUMBER), Da/Ne
 * (CONFIRM). Klik salje selectWizardSlot REST poziv koji vraca sledeci
 * prompt ili final action_preview.
 */
import { ChevronRight, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import type { WizardPrompt } from '../../types/arbitro';
import { useArbitro } from '../../context/useArbitro';
import './arbitro.css';

export interface ArbitroChoiceCardProps {
  prompt: WizardPrompt;
  /** True kad je vec izabran odgovor i cekamo BE response — disable interakciju. */
  busy?: boolean;
}

export function ArbitroChoiceCard({ prompt, busy }: ArbitroChoiceCardProps) {
  const { submitWizardChoice, cancelWizard } = useArbitro();
  const [textValue, setTextValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInteractive = !busy && !submitting;

  const submit = async (value: string) => {
    if (!isInteractive) return;
    setSubmitting(true);
    try {
      await submitWizardChoice(prompt.wizardId, prompt.slotName, value);
    } finally {
      setSubmitting(false);
    }
  };

  const submitText = () => {
    if (textValue.trim().length === 0 && prompt.slotType !== 'TEXT') {
      return;
    }
    void submit(textValue.trim());
  };

  return (
    <div className="arbitro-choice-card">
      {/* Header sa naslovom + step counter */}
      <div className="arbitro-choice-header">
        <div className="flex items-center gap-2">
          <span className="arbitro-choice-step">
            Korak {prompt.stepIndex} od {prompt.totalSteps}
          </span>
          <span className="arbitro-choice-title">{prompt.title}</span>
        </div>
        <button
          type="button"
          onClick={() => void cancelWizard(prompt.wizardId)}
          disabled={!isInteractive}
          className="arbitro-choice-cancel"
          title="Otkazi"
          aria-label="Otkazi"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Previous selections summary */}
      {prompt.previousSelections.length > 0 && (
        <ul className="arbitro-choice-previous">
          {prompt.previousSelections.map((p) => (
            <li key={p.slotName}>
              <span className="arbitro-choice-prev-key">{p.slotName}:</span>{' '}
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Prompt */}
      <p className="arbitro-choice-prompt">{prompt.prompt}</p>

      {/* Error from previous validation */}
      {prompt.errorMessage && (
        <div className="arbitro-choice-error">{prompt.errorMessage}</div>
      )}

      {/* Body — buttons or input */}
      <div className="arbitro-choice-body">
        {prompt.slotType === 'CHOICE' && prompt.options.length > 0 ? (
          <div className="arbitro-choice-options">
            {prompt.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={!isInteractive}
                onClick={() => void submit(opt.value)}
                className="arbitro-choice-option"
              >
                <div className="arbitro-choice-option-label">{opt.label}</div>
                {opt.hint && <div className="arbitro-choice-option-hint">{opt.hint}</div>}
                <ChevronRight className="arbitro-choice-option-arrow h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ) : prompt.slotType === 'CONFIRM' ? (
          <div className="arbitro-choice-confirm">
            <button
              type="button"
              disabled={!isInteractive}
              onClick={() => void submit('YES')}
              className="arbitro-choice-yes"
            >
              Da
            </button>
            <button
              type="button"
              disabled={!isInteractive}
              onClick={() => void submit('NO')}
              className="arbitro-choice-no"
            >
              Ne
            </button>
          </div>
        ) : (
          <div className="arbitro-choice-input-row">
            <input
              type={prompt.slotType === 'NUMBER' ? 'number' : 'text'}
              inputMode={prompt.slotType === 'NUMBER' ? 'decimal' : 'text'}
              step="any"
              value={textValue}
              disabled={!isInteractive}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitText();
                }
              }}
              placeholder={prompt.slotType === 'NUMBER' ? 'Unesi iznos' : 'Unesi tekst'}
              className="arbitro-choice-input"
              autoFocus
            />
            <button
              type="button"
              disabled={!isInteractive}
              onClick={submitText}
              className="arbitro-choice-submit"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dalje'}
            </button>
          </div>
        )}

        {prompt.slotType === 'CHOICE' && prompt.options.length === 0 && (
          <div className="arbitro-choice-empty">
            Nema dostupnih opcija. Otkazite ili pokusajte drugaciji unos.
          </div>
        )}
      </div>
    </div>
  );
}
