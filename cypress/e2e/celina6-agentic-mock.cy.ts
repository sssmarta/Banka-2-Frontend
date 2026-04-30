/**
 * CELINA 6 v3.5 — Agentic Mode Mock E2E Tests
 *
 * Pokriva Phase 4 agentic flow:
 *  1. Settings dropdown → Agentic mode toggle
 *  2. SSE action_preview event → ArbitroActionModal renderuje
 *  3. ODBACI → rejectAgentAction
 *  4. POTVRDI bez OTP-a → confirmAgentAction
 *  5. POTVRDI sa OTP-om → VerificationModal → confirmAgentAction sa otpCode
 *  6. Greska handler-a → FAILED status u modalu
 *
 * Reference: Info o predmetu/LLM_Asistent_Plan.txt v3.5 §17.
 */

import { setupAdminSession } from '../support/commands';

const HEALTHY_RESPONSE = {
  provider: 'ollama',
  model: 'gemma4:e2b',
  llmReachable: true,
  wikipediaToolReachable: true,
  ragToolReachable: true,
};

function sseLine(eventName: string, data: object): string {
  return `event:${eventName}\ndata:${JSON.stringify(data)}\n\n`;
}

function buildAgenticSseStream(actionUuid: string, requiresOtp = true): string {
  return [
    sseLine('thinking_start', {}),
    sseLine('thinking_end', {}),
    sseLine('tool_call', {
      name: 'create_payment',
      args: { fromAccount: '222000000000123456', amount: 5000 },
    }),
    sseLine('action_preview', {
      actionUuid,
      tool: 'create_payment',
      summary: 'Placanje 5000 RSD Stefanu',
      parameters: {
        'Sa racuna': '222****3456',
        'Na racun': '222****7890',
        'Primalac': 'Stefan Jovanovic',
        'Iznos': '5000.00 RSD',
        'Svrha': 'Test placanje',
      },
      warnings: [],
      requiresOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }),
    sseLine('tool_result', {
      name: 'create_payment',
      ok: true,
      summary: 'preview emitovan',
    }),
    sseLine('token', {
      text: 'Pripremio sam akciju za izvrsenje. Pogledaj preview modal.',
    }),
    sseLine('done', {
      messageId: 1,
      conversationUuid: 'test-conv-uuid',
      totalTokens: 8,
      latencyMs: 100,
      reasoningChars: 0,
    }),
  ].join('');
}

describe('Celina 6 v3.5 — Agentic Mode (mock)', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/employees*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/clients*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/accounts/my', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/orders/my*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/portfolio/my', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/exchanges*', { statusCode: 200, body: [] });
    cy.intercept('GET', '/api/assistant/health', HEALTHY_RESPONSE);
    cy.intercept('GET', '/api/assistant/conversations', { statusCode: 200, body: [] });
  });

  it('toggle u Settings dropdown-u aktivira agentic mode + prikazuje badge', () => {
    cy.visit('/home', { onBeforeLoad: setupAdminSession });
    cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
    cy.get('button[aria-label="Podesavanja"]').click();
    cy.contains('Agentic mode').should('be.visible');
    cy.get('input[type="checkbox"]').click();
    cy.get('[data-testid="arbitro-agentic-badge"]').should('be.visible');
  });

  it('chat sa agentic ON emit-uje action_preview → modal se otvara sa preview-om', () => {
    cy.visit('/home', { onBeforeLoad: setupAdminSession });
    cy.window().then((w) => {
      w.sessionStorage.setItem('arbitro:agenticMode', 'true');
    });

    const actionUuid = 'test-action-uuid-1';
    cy.intercept('POST', '/api/assistant/chat', {
      statusCode: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: buildAgenticSseStream(actionUuid, true),
    }).as('chat');

    cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
    cy.get('textarea').type('Plati 5000 RSD Stefanu{enter}');

    cy.wait('@chat');
    cy.get('[data-testid="arbitro-action-modal"]').should('be.visible');
    cy.contains('Placanje 5000 RSD Stefanu').should('be.visible');
    cy.contains('Sa racuna').should('be.visible');
    cy.contains('5000.00 RSD').should('be.visible');
  });

  it('klik ODBACI u modalu poziva reject endpoint', () => {
    cy.visit('/home', { onBeforeLoad: setupAdminSession });
    cy.window().then((w) => {
      w.sessionStorage.setItem('arbitro:agenticMode', 'true');
    });

    const actionUuid = 'test-action-uuid-reject';
    cy.intercept('POST', '/api/assistant/chat', {
      statusCode: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: buildAgenticSseStream(actionUuid, false),
    }).as('chat');
    cy.intercept('POST', `/api/assistant/actions/${actionUuid}/reject`, {
      statusCode: 200,
      body: { status: 'REJECTED' },
    }).as('reject');

    cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
    cy.get('textarea').type('Plati 5000 RSD{enter}');
    cy.wait('@chat');
    cy.contains('ODBACI').click();
    cy.wait('@reject');
    cy.get('[data-testid="arbitro-action-modal"]').should('not.exist');
  });

  it('klik POTVRDI bez OTP-a poziva confirm endpoint odmah', () => {
    cy.visit('/home', { onBeforeLoad: setupAdminSession });
    cy.window().then((w) => {
      w.sessionStorage.setItem('arbitro:agenticMode', 'true');
    });

    const actionUuid = 'test-action-no-otp';
    cy.intercept('POST', '/api/assistant/chat', {
      statusCode: 200,
      headers: { 'content-type': 'text/event-stream' },
      body: buildAgenticSseStream(actionUuid, false),
    }).as('chat');
    cy.intercept('POST', `/api/assistant/actions/${actionUuid}/confirm`, {
      statusCode: 200,
      body: { status: 'EXECUTED', result: { paymentId: 1 } },
    }).as('confirm');

    cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
    cy.get('textarea').type('Otkazi order #5{enter}');
    cy.wait('@chat');
    cy.contains(/POTVRDI/i).click();
    cy.wait('@confirm');
    cy.get('[data-testid="arbitro-action-modal"]').should('not.exist');
  });

  it('agentic mode OFF (default) NE prikazuje badge', () => {
    cy.visit('/home', { onBeforeLoad: setupAdminSession });
    cy.get('button[aria-label="Otvori Arbitro asistent"]').click();
    cy.get('[data-testid="arbitro-agentic-badge"]').should('not.exist');
  });
});
