/**
 * In-memory rolling buffer poslednjih korisnikovih akcija.
 * Stranice zovu activityTracker.track('Klik BUY za MSFT') a Arbitro panel ih
 * predaje BE-u kao USER CONTEXT BLOCK > "Poslednje akcije:".
 *
 * Reference: Info o predmetu/LLM_Asistent_Plan.txt v3.3 §8.
 */

const MAX_ACTIONS = 5;

type Listener = (actions: string[]) => void;

class ActivityTracker {
  private actions: string[] = [];
  private listeners = new Set<Listener>();

  track(action: string): void {
    if (!action || !action.trim()) return;
    const stamp = new Date().toLocaleTimeString('sr-RS', { hour12: false });
    this.actions = [`[${stamp}] ${action.trim()}`, ...this.actions].slice(0, MAX_ACTIONS);
    for (const l of this.listeners) l(this.actions);
  }

  getRecent(): string[] {
    return [...this.actions];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const activityTracker = new ActivityTracker();
