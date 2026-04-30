import { describe, it, expect, beforeEach } from 'vitest';
import { activityTracker } from './activityTracker';

// activityTracker je singleton — resetujemo izmedju testova preko subscribe-a
function resetTracker() {
  // Praznimo buffer track-ovanjem 5+ no-op stavki pa ispitivanjem getRecent length-a
  // Ne postoji javni reset, ali kako limit je 5, dovoljno track-ovanja prepisuje sve
  for (let i = 0; i < 5; i++) activityTracker.track('__reset__');
}

describe('activityTracker', () => {
  beforeEach(() => {
    resetTracker();
  });

  it('tracks an action with timestamp prefix', () => {
    activityTracker.track('Klik BUY MSFT');
    const recent = activityTracker.getRecent();
    expect(recent[0]).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Klik BUY MSFT$/);
  });

  it('keeps only the 5 most recent actions', () => {
    activityTracker.track('a1');
    activityTracker.track('a2');
    activityTracker.track('a3');
    activityTracker.track('a4');
    activityTracker.track('a5');
    activityTracker.track('a6');
    const recent = activityTracker.getRecent();
    expect(recent).toHaveLength(5);
    // Najnovija prva — 'a6' u 0-tom slotu
    expect(recent[0]).toContain('a6');
    // 'a1' je istisnuta
    expect(recent.some((r) => r.includes('a1'))).toBe(false);
  });

  it('ignores blank actions', () => {
    activityTracker.track('valid');
    const beforeLen = activityTracker.getRecent().length;
    activityTracker.track('');
    activityTracker.track('   ');
    expect(activityTracker.getRecent().length).toBe(beforeLen);
  });

  it('notifies subscribers on track', () => {
    let received: string[] = [];
    const unsubscribe = activityTracker.subscribe((actions) => {
      received = actions;
    });
    activityTracker.track('signal');
    expect(received[0]).toContain('signal');
    unsubscribe();
  });

  it('subscribe returns unsubscribe that detaches listener', () => {
    let calls = 0;
    const unsubscribe = activityTracker.subscribe(() => calls++);
    activityTracker.track('one');
    activityTracker.track('two');
    expect(calls).toBe(2);
    unsubscribe();
    activityTracker.track('three');
    expect(calls).toBe(2); // ne menja se posle unsubscribe-a
  });
});
