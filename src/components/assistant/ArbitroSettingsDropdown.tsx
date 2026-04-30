/**
 * Arbitro Settings dropdown (gear ikonica u panel header-u).
 * Sadrzi:
 *  - Agentic mode toggle (sa upozorenjem)
 *  - (placeholder za buduce: detailedMode, useTools)
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Settings, Volume2, X } from 'lucide-react';
import { useArbitro } from '../../context/useArbitro';

const VOICE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'af_bella', label: 'Bella (US F)' },
  { id: 'af_sarah', label: 'Sarah (US F)' },
  { id: 'af_nicole', label: 'Nicole (US F)' },
  { id: 'af_sky', label: 'Sky (US F)' },
  { id: 'am_adam', label: 'Adam (US M)' },
  { id: 'am_michael', label: 'Michael (US M)' },
  { id: 'bf_emma', label: 'Emma (UK F)' },
  { id: 'bf_isabella', label: 'Isabella (UK F)' },
  { id: 'bm_george', label: 'George (UK M)' },
  { id: 'bm_lewis', label: 'Lewis (UK M)' },
];

export function ArbitroSettingsDropdown() {
  const { agenticMode, setAgenticMode, ttsEnabled, setTtsEnabled, ttsVoice, setTtsVoice } =
    useArbitro();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative z-40">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="arbitro-header-btn"
        aria-label="Podesavanja"
        title="Podesavanja"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="arbitro-settings-dropdown absolute right-0 top-10 w-72 z-50">
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Podesavanja
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Zatvori"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-3 pb-3 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-1 accent-indigo-500"
                checked={agenticMode}
                onChange={(e) => setAgenticMode(e.target.checked)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Agentic mode
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                    BETA
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Asistent moze inicirati placanja, transfere, ordere, OTC ponude
                  i druge transakcije. Uvek trazi tvoju potvrdu pre izvrsenja.
                </p>
                {agenticMode && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-1.5 text-[10px] text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>
                      Ukljucen — proveravaj pun preview pre nego sto klikne POTVRDI.
                    </span>
                  </div>
                )}
              </div>
            </label>

            {/* Phase 5 — TTS toggle + voice picker */}
            <div className="border-t border-zinc-200/60 dark:border-zinc-700/60 pt-3 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-1 accent-indigo-500"
                  checked={ttsEnabled}
                  onChange={(e) => setTtsEnabled(e.target.checked)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Glas asistenta
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Citanje odgovora preko Kokoro TTS-a (lokalno). Auto-play
                    posle svakog odgovora.
                  </p>
                </div>
              </label>
              {ttsEnabled && (
                <div className="ml-6">
                  <label
                    htmlFor="arbitro-tts-voice"
                    className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    Glas
                  </label>
                  <select
                    id="arbitro-tts-voice"
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="arbitro-voice-select w-full text-xs px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
