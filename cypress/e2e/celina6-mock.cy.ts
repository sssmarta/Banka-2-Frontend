/**
 * CELINA 6 - Arbitro AI assistant Mock E2E Tests
 *
 * Pokriva FAB + Panel + Chat flow + Tool indicators + Markdown rendering +
 * #action:goto: navigation + Persistencija conversationUuid + History reload
 * + Warming notification.
 *
 * Sve API pozive (uključujući SSE chat stream) mock-ujemo sa cy.intercept().
 *
 * Reference: Info o predmetu/LLM_Asistent_Plan.txt v3.3 §8 (FE arhitektura).
 */

import { setupAdminSession, setupClientSession } from '../support/commands';

// ============================================================
// HELPERS — SSE event mock builders
// ============================================================

function sseLine(eventName: string, data: object): string {
  return `event:${eventName}\ndata:${JSON.stringify(data)}\n\n`;
}

/**
 * Sastavi SSE telo za chat response. Vraca string koji simulira tok BE-a.
 * Cypress intercept ce ga vratiti kao body sa text/event-stream content type-om.
 */
function buildSseStream(events: Array<{ name: string; data: object }>): string {
  return events.map((e) => sseLine(e.name, e.data)).join('');
}

const HEALTHY_RESPONSE = {
  provider: 'ollama',
  model: 'gemma4:e2b',
  llmReachable: true,
  wikipediaToolReachable: true,
  ragToolReachable: true,
};

const OFFLINE_RESPONSE = {
  provider: 'ollama',
  model: 'gemma4:e2b',
  llmReachable: false,
  wikipediaToolReachable: false,
  ragToolReachable: false,
};

const SAMPLE_CONVERSATION_UUID = '11111111-2222-3333-4444-555555555555';

// ============================================================
//  Tests
// ============================================================

describe('Celina 6 — Arbitro AI Assistant (mock)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/employees*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/clients*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/accounts/my', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/orders/my*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/portfolio/my', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/exchanges*', { statusCode: 200, body: [] });
  });

  describe('FAB visibility & status', () => {
    it('prikazuje FAB sa zelenim statusom kad je BE healthy', () => {
      cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE).as('health');
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });

      cy.visit('/home', { onBeforeLoad: setupAdminSession });
      cy.wait('@health');

      cy.get('button[aria-label="Otvori Arbitro asistent"]').should('be.visible');
    });

    it('prikazuje FAB i kad je BE offline (samo siv status indicator)', () => {
      cy.intercept('GET', '/api/assistant/health', OFFLINE_RESPONSE).as('health');
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });

      cy.visit('/home', { onBeforeLoad: setupAdminSession });
      cy.wait('@health');

      cy.get('button[aria-label="Otvori Arbitro asistent"]').should('be.visible');
    });

    it('NE prikazuje FAB kad korisnik nije logovan (login stranica)', () => {
      cy.visit('/login');
      cy.get('button[aria-label="Otvori Arbitro asistent"]').should('not.exist');
    });
  });

  describe('Panel toggle & empty state', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE);
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });
    });

    it('otvara Panel klikom na FAB', () => {
      cy.visit('/home', { onBeforeLoad: setupAdminSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();

      cy.get('div[role="dialog"][aria-label="Arbitro AI asistent"]').should('be.visible');
      cy.contains('Arbitro').should('be.visible');
      cy.contains('Zdravo! Ja sam Arbitro.').should('be.visible');
    });

    it('zatvara Panel preko Esc', () => {
      cy.visit('/home', { onBeforeLoad: setupAdminSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
      cy.get('div[role="dialog"]').should('be.visible');

      cy.get('body').type('{esc}');
      cy.get('div[role="dialog"]').should('not.exist');
    });

    it('prikazuje warming notification kad je AI offline', () => {
      cy.intercept('GET', '/api/assistant/health', OFFLINE_RESPONSE);
      cy.visit('/home', { onBeforeLoad: setupAdminSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();

      cy.contains('Arbitro nije online').should('be.visible');
      cy.contains('docker compose up -d').should('be.visible');
    });
  });

  describe('Chat flow — tekstualni odgovor (bez tool poziva)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE);
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });

      const stream = buildSseStream([
        { name: 'thinking_start', data: {} },
        { name: 'thinking_end', data: {} },
        { name: 'token', data: { text: 'AON ' } },
        { name: 'token', data: { text: 'znaci ' } },
        { name: 'token', data: { text: '"All ' } },
        { name: 'token', data: { text: 'or ' } },
        { name: 'token', data: { text: 'Nothing".' } },
        {
          name: 'done',
          data: {
            messageId: 1,
            conversationUuid: SAMPLE_CONVERSATION_UUID,
            totalTokens: 5,
            latencyMs: 5030,
            reasoningChars: 0,
          },
        },
      ]);

      cy.intercept('POST', '/api/assistant/chat', {
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: stream,
      }).as('chat');
    });

    it('salje korisnikovu poruku i prikazuje streaming odgovor', () => {
      cy.visit('/orders/new', { onBeforeLoad: setupAdminSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();

      cy.get('textarea[placeholder*="Pitaj"]').type('Sta je AON?{enter}');
      cy.wait('@chat');

      // User bubble se vidi
      cy.contains('Sta je AON?').should('be.visible');
      // Assistant token-i se akumuliraju u poruku
      cy.contains(/All or Nothing/).should('be.visible');
    });

    it('persistuje conversationUuid u sessionStorage posle done event-a', () => {
      cy.visit('/orders/new', { onBeforeLoad: setupAdminSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();

      cy.get('textarea[placeholder*="Pitaj"]').type('Sta je AON?{enter}');
      cy.wait('@chat');
      cy.contains(/All or Nothing/).should('be.visible');

      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('arbitro:conversationUuid')).to.equal(
          SAMPLE_CONVERSATION_UUID
        );
      });
    });
  });

  describe('Chat flow — sa tool pozivima (Wikipedia + RAG)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE);
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });

      const stream = buildSseStream([
        { name: 'thinking_start', data: {} },
        { name: 'thinking_end', data: {} },
        {
          name: 'tool_call',
          data: { name: 'rag_search_spec', args: { query: 'kako kreiram fond', top_k: 3 } },
        },
        {
          name: 'tool_result',
          data: { name: 'rag_search_spec', ok: true, summary: '3 rezultata' },
        },
        {
          name: 'source',
          data: { type: 'spec', title: 'Banka 2 spec — Celina 4' },
        },
        { name: 'token', data: { text: 'Da kreiras fond, ' } },
        { name: 'token', data: { text: 'idi na Investicione fondove.' } },
        {
          name: 'done',
          data: {
            messageId: 2,
            conversationUuid: SAMPLE_CONVERSATION_UUID,
            totalTokens: 2,
            latencyMs: 8500,
            reasoningChars: 0,
          },
        },
      ]);

      cy.intercept('POST', '/api/assistant/chat', {
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: stream,
      }).as('chat');
    });

    it('prikazuje tool indicator + source badge u poruci', () => {
      cy.visit('/funds/create', { onBeforeLoad: setupSupervisorSession });
      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();

      cy.get('textarea[placeholder*="Pitaj"]').type('Kako da kreiram fond?{enter}');
      cy.wait('@chat');

      cy.contains('Trazim u Banka 2 spec-u').should('be.visible');
      cy.contains('3 rezultata').should('be.visible');
      cy.contains('Banka 2 spec — Celina 4').should('be.visible');
      cy.contains('Investicione fondove').should('be.visible');
    });
  });

  describe('History reload (sessionStorage UUID survives reload)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE);
      cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });
      cy.intercept('GET', `/api/assistant/conversations/${SAMPLE_CONVERSATION_UUID}/messages`, {
        statusCode: 200,
        body: [
          { id: 10, role: 'USER', content: 'Sta je AON?', createdAt: '2026-04-29T22:00:00Z' },
          {
            id: 11,
            role: 'ASSISTANT',
            content: 'AON znaci All or Nothing.',
            createdAt: '2026-04-29T22:00:05Z',
          },
        ],
      }).as('history');
    });

    it('ucitava istoriju iz BE-a kad postoji UUID u sessionStorage', () => {
      cy.visit('/home', {
        onBeforeLoad(win) {
          setupAdminSession(win);
          win.sessionStorage.setItem('arbitro:conversationUuid', SAMPLE_CONVERSATION_UUID);
        },
      });
      cy.wait('@history');

      cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
      cy.contains('Sta je AON?').should('be.visible');
      cy.contains('AON znaci All or Nothing.').should('be.visible');
    });
  });
});

// Wrapper za supervisor session (slicno setupAdminSession ali sa SUPERVISOR perm)
function setupSupervisorSession(win: Window): void {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    btoa(
      JSON.stringify({
        sub: 'nikola.milenkovic@banka.rs',
        role: 'EMPLOYEE',
        active: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      })
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_') +
    '.fake-signature';
  win.sessionStorage.setItem('accessToken', token);
  win.sessionStorage.setItem('refreshToken', 'fake-refresh-token');
  win.sessionStorage.setItem(
    'user',
    JSON.stringify({
      id: 2,
      email: 'nikola.milenkovic@banka.rs',
      role: 'EMPLOYEE',
      firstName: 'Nikola',
      lastName: 'Milenkovic',
      username: 'nikola',
      permissions: ['SUPERVISOR', 'TRADE_STOCKS', 'TRADE_FOREX', 'TRADE_FUTURES', 'TRADE_OPTIONS'],
    })
  );
}

// silence unused warning ako se ne koristi u nekim testovima
void setupClientSession;
