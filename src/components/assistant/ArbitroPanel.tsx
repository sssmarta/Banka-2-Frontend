/**
 * Arbitro chat panel — Liquid Glass UI.
 *
 * Header (avatar, status, history, clear, close) → Body (empty state +
 * quick prompts ILI message list) → Composer (textarea + send/stop).
 * Floating iznad FAB-a desktop / fullscreen mobile.
 */
import { Bot, History, Sparkles, Trash2, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useArbitro } from '../../context/useArbitro';
import { ArbitroChoiceCard } from './ArbitroChoiceCard';
import { ArbitroComposer } from './ArbitroComposer';
import { ArbitroHistoryDrawer } from './ArbitroHistoryDrawer';
import { ArbitroMessageView } from './ArbitroMessage';
import { ArbitroSettingsDropdown } from './ArbitroSettingsDropdown';
import { ArbitroTutorial } from './ArbitroTutorial';
import { quickPromptsForRoute } from './quickPrompts';
import './arbitro.css';

export function ArbitroPanel() {
  const {
    isOpen,
    close,
    messages,
    clear,
    send,
    isStreaming,
    pageContext,
    health,
    loadConversation,
    agenticMode,
    wizardPrompt,
  } = useArbitro();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const empty = messages.length === 0;
  const quickPrompts = empty ? quickPromptsForRoute(pageContext.route) : [];
  const statusOnline = !!health?.llmReachable;

  return (
    <div
      role="dialog"
      aria-label="Arbitro AI asistent"
      className="arbitro-panel fixed z-50 flex flex-col overflow-hidden rounded-3xl sm:bottom-24 sm:right-6 sm:h-[640px] sm:w-[420px] inset-0 sm:inset-auto"
    >
      {/* Header */}
      <div className="arbitro-header flex items-center gap-2.5 px-4 py-3.5">
        <div className="arbitro-avatar flex h-10 w-10 items-center justify-center rounded-2xl text-white">
          <Bot className="h-5 w-5 relative z-10" />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="arbitro-empty-title text-[15px]">Arbitro</span>
            <Sparkles className="h-3 w-3 text-violet-500" />
            {agenticMode && (
              <span
                className="arbitro-agentic-badge"
                title="Agentic mode aktivan — asistent moze inicirati transakcije"
                data-testid="arbitro-agentic-badge"
              >
                <Zap className="h-2.5 w-2.5" />
                AGENTIC
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className={`arbitro-status-dot ${statusOnline ? 'online' : 'offline'}`} />
            <span className="font-medium">
              {statusOnline ? `Lokalno · ${health?.model || 'Gemma 4 E2B'}` : 'Offline'}
            </span>
          </div>
        </div>
        <ArbitroSettingsDropdown />
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="arbitro-header-btn"
          aria-label="Istorija razgovora"
          title="Istorija"
        >
          <History className="h-4 w-4" />
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="arbitro-header-btn danger"
            aria-label="Obrisi razgovor"
            title="Obrisi razgovor"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={close}
          className="arbitro-header-btn"
          aria-label="Zatvori"
          title="Zatvori"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="arbitro-scroll flex-1 overflow-y-auto px-4 py-4 relative z-10">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="arbitro-avatar relative flex h-16 w-16 items-center justify-center rounded-3xl">
              <Bot className="h-8 w-8 text-white relative z-10" />
            </div>
            <div className="space-y-1.5">
              <div className="arbitro-empty-title">Zdravo! Ja sam Arbitro.</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 max-w-[280px] leading-relaxed">
                AI asistent za Banka 2 platformu.
                Pomažem ti oko <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {pageContext.pageName.toLowerCase()}
                </span> i svega ostalog u aplikaciji.
              </div>
            </div>
            {!statusOnline && (
              <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 backdrop-blur-md">
                <div className="font-semibold mb-1">Arbitro nije online</div>
                <div className="text-[11px] opacity-90 leading-relaxed">
                  Pokreni stack:
                  <code className="block mt-1.5 px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 font-mono text-[10px]">
                    cd Banka-2-Backend/Banka-2-Tools<br />docker compose up -d
                  </code>
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 max-w-full">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={isStreaming}
                  className="arbitro-chip disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <ArbitroMessageView key={m.key} message={m} />
            ))}
            {wizardPrompt && (
              <div className="px-1">
                <ArbitroChoiceCard prompt={wizardPrompt} />
              </div>
            )}
          </div>
        )}
      </div>

      <ArbitroComposer />
      <ArbitroHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadConversation={(uuid) => {
          void loadConversation(uuid);
        }}
      />
      {/* Phase 5 — Tutorial overlay (prikazuje se prvi put). */}
      <ArbitroTutorial />
    </div>
  );
}
