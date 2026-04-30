/**
 * Arbitro FAB (Floating Action Button) — Liquid Glass.
 * Plus proaktivni hint tooltip iznad sa fade-in animacijom.
 */
import { Bot, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useArbitro } from '../../context/useArbitro';
import { hintForRoute } from './proactiveHints';
import './arbitro.css';

export function ArbitroFAB() {
  const { toggle, isOpen, send, health } = useArbitro();
  const location = useLocation();
  const [hintToken, setHintToken] = useState<string | null>(null);
  const statusOnline = !!health?.llmReachable;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  useEffect(() => {
    if (isOpen) return;
    const route = location.pathname;
    const candidate = hintForRoute(route);
    if (!candidate) return;
    const dismissedKey = `arbitro_hint_${route}_dismissed`;
    if (sessionStorage.getItem(dismissedKey) === '1') return;
    const showTimer = window.setTimeout(() => setHintToken(candidate), 1000);
    const hideTimer = window.setTimeout(() => setHintToken(null), 6000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.pathname, isOpen]);

  const hint = isOpen ? null : hintToken;

  const dismissHint = () => {
    sessionStorage.setItem(`arbitro_hint_${location.pathname}_dismissed`, '1');
    setHintToken(null);
  };

  const acceptHint = () => {
    if (!hint) return;
    sessionStorage.setItem(`arbitro_hint_${location.pathname}_dismissed`, '1');
    setHintToken(null);
    toggle();
    setTimeout(() => send(hint.replace(/^Pitaj me /i, '')), 300);
  };

  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
      {hint && (
        <div className="arbitro-hint">
          <Sparkles className="h-3 w-3 text-violet-300" />
          <button type="button" onClick={acceptHint} className="hover:underline">
            {hint}
          </button>
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Zanemari"
            className="text-zinc-400 hover:text-white transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label="Otvori Arbitro asistent"
        className="arbitro-fab relative flex h-14 w-14 items-center justify-center rounded-2xl text-white"
      >
        <Bot className="h-6 w-6 relative z-10" />
        <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${
              statusOnline ? 'bg-emerald-400 animate-ping opacity-75' : 'bg-zinc-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white ${
              statusOnline ? 'bg-emerald-500' : 'bg-zinc-500'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
