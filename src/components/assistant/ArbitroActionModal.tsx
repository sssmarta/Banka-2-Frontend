/**
 * Phase 4 v3.5 — confirmation modal za pending agentic akciju.
 *
 * Flow:
 *  1. BE emit-uje action_preview SSE event → ArbitroContext.pendingAction se setuje
 *  2. Ovaj modal renderuje se preko panel-a sa preview-om
 *  3. Klik POTVRDI:
 *     - Ako requiresOtp=false → odmah confirmAction() → BE izvrsi
 *     - Ako requiresOtp=true → otvori VerificationModal → posle OTP-a
 *       confirmAction(otpCode) → BE izvrsi
 *  4. Klik ODBACI → rejectAction()
 *
 * UI: Liquid Glass dizajn, paritet sa ostatkom Arbitro modula.
 */
import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, CheckCircle2, Loader2, Pencil, X } from 'lucide-react';
import VerificationModal from '../shared/VerificationModal';
import { useArbitro } from '../../context/useArbitro';
import { toast } from '@/lib/notify';

export function ArbitroActionModal() {
  const { pendingAction, confirmAction, rejectAction } = useArbitro();
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Phase 5 polish — inline edit. editedParameters cuva korisnikove izmene
  // (display label key → string vrednost). Prosledjuje se u confirmAction.
  // BE ima `ConfirmActionDto.editedParameters` koji vec radi merge sa originalnim
  // LLM-ovim parametrima — prenose se kao Map<String, Object>.
  const [editedParameters, setEditedParameters] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const isOpen = pendingAction !== null;

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setSubmitting(false);
      setEditedParameters({});
      setEditingKey(null);
    }
  }, [isOpen]);

  const parameterEntries = useMemo(() => {
    if (!pendingAction) return [];
    return Object.entries(pendingAction.parameters).map(([key, value]) => ({
      key,
      value: editedParameters[key] ?? formatValue(value),
      isEdited: editedParameters[key] !== undefined,
    }));
  }, [pendingAction, editedParameters]);

  const handleConfirm = async () => {
    if (!pendingAction) return;
    if (pendingAction.requiresOtp) {
      setOtpModalOpen(true);
      return;
    }
    await runConfirm();
  };

  const runConfirm = async (otpCode?: string) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Prosledi inline edit-ovane parametre BE-u — Gateway radi merge sa
      // originalnim LLM args-ima (samo edit-ovane kljuce override-uje).
      const editedForBe = Object.keys(editedParameters).length > 0
        ? editedParameters
        : undefined;
      const result = await confirmAction(otpCode, editedForBe);
      if (result.status === 'EXECUTED') {
        toast.success('Akcija uspesno izvrsena.');
        setOtpModalOpen(false);
      } else {
        const errMsg = result.error ?? `Akcija nije uspela (${result.status})`;
        setErrorMessage(errMsg);
        if (otpCode) {
          // Re-throw da OTP modal moze pokazati gresku i smanji attempts
          throw new Error(errMsg);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage(msg);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await rejectAction();
      toast.info('Akcija odbacena.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!pendingAction) return null;

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(o) => {
          if (!o && !submitting) {
            void handleReject();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content
            className="arbitro-action-modal fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-2xl"
            data-testid="arbitro-action-modal"
          >
            <div className="flex items-start justify-between border-b border-white/20 dark:border-zinc-700/40 px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="arbitro-action-icon flex h-10 w-10 items-center justify-center rounded-2xl">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Dialog.Title className="arbitro-empty-title text-lg">
                      Potvrda akcije
                    </Dialog.Title>
                    {/* Phase 5 multi-step plan progress indicator */}
                    {pendingAction.planStepIndex && pendingAction.planTotalSteps && (
                      <span
                        className="arbitro-step-badge px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        title={`Multi-step plan: korak ${pendingAction.planStepIndex} od ${pendingAction.planTotalSteps}`}
                      >
                        Korak {pendingAction.planStepIndex} / {pendingAction.planTotalSteps}
                      </span>
                    )}
                  </div>
                  <Dialog.Description className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {pendingAction.summary}
                  </Dialog.Description>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleReject()}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Zatvori"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              {pendingAction.warnings.length > 0 && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700/50 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <ul className="space-y-1 leading-relaxed">
                    {pendingAction.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <dl className="space-y-2">
                {parameterEntries.map(({ key, value, isEdited }) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-3 border-b border-zinc-200/40 dark:border-zinc-700/40 pb-2 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      {key}
                      {isEdited && (
                        <span
                          className="text-[9px] font-bold text-amber-600 dark:text-amber-400"
                          title="Vrednost je editovana"
                        >
                          ✎
                        </span>
                      )}
                    </dt>
                    <dd className="text-sm font-medium text-zinc-800 dark:text-zinc-100 text-right flex items-center gap-2 justify-end flex-1">
                      {editingKey === key ? (
                        <input
                          type="text"
                          autoFocus
                          defaultValue={value}
                          aria-label={`Editovanje vrednosti za ${key}`}
                          title={`Editovanje: ${key}`}
                          placeholder={key}
                          onBlur={(e) => {
                            const newValue = e.target.value.trim();
                            if (newValue && newValue !== formatValue(pendingAction.parameters[key])) {
                              setEditedParameters((prev) => ({ ...prev, [key]: newValue }));
                            } else if (newValue === formatValue(pendingAction.parameters[key])) {
                              // Vratio na originalnu — ukloni iz edit-a
                              setEditedParameters((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                            }
                            setEditingKey(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                          className="text-sm font-medium px-2 py-1 rounded-md border border-indigo-400 dark:border-indigo-500 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 w-full max-w-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                      ) : (
                        <>
                          <span>{value}</span>
                          <button
                            type="button"
                            onClick={() => setEditingKey(key)}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                            aria-label={`Edituj ${key}`}
                            title="Edituj vrednost"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-300/60 bg-rose-50/80 dark:bg-rose-950/30 dark:border-rose-700/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                  {errorMessage}
                </div>
              )}

              {pendingAction.requiresOtp && (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  Akcija zahteva OTP verifikaciju — bice zatrazen kod posle Potvrdi dugmeta.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/20 dark:border-zinc-700/40 px-5 py-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleReject()}
                className="rounded-2xl px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
              >
                ODBACI
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirm()}
                className="arbitro-action-btn flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                POTVRDI{pendingAction.requiresOtp ? ' I UNESI OTP' : ' I IZVRSI'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* OTP step — radi samo ako pendingAction.requiresOtp = true */}
      <VerificationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onVerified={async (code) => {
          await runConfirm(code);
        }}
      />
    </>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
