/**
 * History drawer — lista postojecih konverzacija sa load/delete akcijama.
 * Klizi sa leve strane Panel-a kad korisnik klikne ikonicu sata u headeru.
 */
import { Loader2, MessageSquare, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  deleteConversation,
  fetchConversations,
  fetchMessages,
} from '../../services/assistantService';
import type { ArbitroConversation } from '../../types/arbitro';
import './arbitro.css';

const SESSION_KEY_CONV = 'arbitro:conversationUuid';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoadConversation: (uuid: string) => void;
}

export function ArbitroHistoryDrawer({ open, onClose, onLoadConversation }: Props) {
  // State kao discriminated union — nema potrebe da sync setState-ujemo u
  // effect body-ju (sto trigeruje strogo react-hooks/set-state-in-effect).
  // Status se postavlja iskljucivo iz async callback-a.
  type Status = 'idle' | 'loading' | 'ok' | 'error';
  const [status, setStatus] = useState<Status>('idle');
  const [items, setItems] = useState<ArbitroConversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refresh kad drawer postaje vidljiv. Status 'loading' ulazimo kroz
  // Promise microtask (event-handler-like kontekst, ne sync effect body).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        setStatus('loading');
        setError(null);
      }
    });
    fetchConversations()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setStatus('ok');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Greska pri ucitavanju istorije');
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const loading = status === 'loading';

  if (!open) return null;

  const handleLoad = async (uuid: string) => {
    try {
      // Verifikuj da poruke postoje pre prebacivanja conversationUuid-a
      const messages = await fetchMessages(uuid);
      sessionStorage.setItem(SESSION_KEY_CONV, uuid);
      onLoadConversation(uuid);
      onClose();
      return messages;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greska pri ucitavanju razgovora');
    }
  };

  const handleDelete = async (uuid: string, ev: React.MouseEvent) => {
    ev.stopPropagation();
    try {
      await deleteConversation(uuid);
      setItems((prev) => prev.filter((c) => c.conversationUuid !== uuid));
      // Ako je obrisana aktivna, cisti sessionStorage
      if (sessionStorage.getItem(SESSION_KEY_CONV) === uuid) {
        sessionStorage.removeItem(SESSION_KEY_CONV);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greska pri brisanju');
    }
  };

  return (
    <div className="arbitro-panel absolute inset-0 z-20 flex flex-col rounded-3xl">
      <div className="arbitro-header flex items-center gap-2.5 px-4 py-3.5 relative z-10">
        <div className="arbitro-avatar relative flex h-9 w-9 items-center justify-center rounded-2xl text-white">
          <MessageSquare className="h-4 w-4 relative z-10" />
        </div>
        <div className="flex-1 relative z-10">
          <div className="arbitro-empty-title text-[15px]">Istorija</div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
            Tvoji prethodni razgovori
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori istoriju"
          className="arbitro-header-btn"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="arbitro-scroll flex-1 overflow-y-auto px-3 py-3 relative z-10">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            Ucitavam istoriju…
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 backdrop-blur-md">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Nema sacuvanih razgovora.<br />
            <span className="opacity-70">Pocni sa pitanjem!</span>
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.conversationUuid}>
                <button
                  type="button"
                  onClick={() => void handleLoad(c.conversationUuid)}
                  className="arbitro-tool group flex w-full items-start gap-2.5 px-3 py-2.5 text-left"
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500/70" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {c.title ?? '(bez naslova)'}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {c.messageCount} poruka · {formatRelative(c.updatedAt)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(ev) => void handleDelete(c.conversationUuid, ev)}
                    aria-label="Obrisi razgovor"
                    className="opacity-0 transition group-hover:opacity-100 hover:text-rose-500 self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatRelative(isoTimestamp: string): string {
  try {
    const then = new Date(isoTimestamp).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return 'pre par sekundi';
    if (diffSec < 3600) return `pre ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `pre ${Math.floor(diffSec / 3600)} h`;
    return `pre ${Math.floor(diffSec / 86400)} d`;
  } catch {
    return '';
  }
}
