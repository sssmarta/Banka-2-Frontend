/// <reference types="cypress" />

// ============================================================
// JWT & Session Helpers
// ============================================================

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createFakeJwt(role: string, email: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: email,
      role,
      active: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
  );
  return `${header}.${payload}.fake-signature`;
}

interface SessionOptions {
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  permissions?: string[];
  username?: string;
}

function injectSession(win: Window, opts: SessionOptions): void {
  const token = createFakeJwt(opts.role, opts.email);
  win.sessionStorage.setItem('accessToken', token);
  win.sessionStorage.setItem('refreshToken', 'fake-refresh-token');

  const defaultPerms =
    opts.role === 'ADMIN'
      ? ['ADMIN', 'TRADE_STOCKS', 'TRADE_FOREX', 'TRADE_FUTURES', 'TRADE_OPTIONS', 'CONTRACT_CONCLUSION', 'SUPERVISOR', 'AGENT']
      : opts.role === 'EMPLOYEE'
        ? ['TRADE_STOCKS', 'TRADE_FOREX', 'TRADE_FUTURES', 'TRADE_OPTIONS']
        : [];

  const permissions = opts.permissions ?? defaultPerms;
  const username = opts.username ?? opts.email.split('@')[0];

  win.sessionStorage.setItem(
    'user',
    JSON.stringify({
      id: 1,
      email: opts.email,
      role: opts.role,
      firstName: opts.firstName,
      lastName: opts.lastName,
      username,
      permissions,
    })
  );
}

// ============================================================
// Exported session setup functions (for onBeforeLoad)
// ============================================================

export function setupAdminSession(win: Window): void {
  injectSession(win, {
    role: 'ADMIN',
    email: 'marko.petrovic@banka.rs',
    firstName: 'Marko',
    lastName: 'Petrovic',
  });
}

export function setupClientSession(win: Window): void {
  injectSession(win, {
    role: 'CLIENT',
    email: 'stefan.jovanovic@gmail.com',
    firstName: 'Stefan',
    lastName: 'Jovanovic',
    permissions: ['TRADE_STOCKS', 'TRADE_FUTURES'],
  });
}

export function setupEmployeeSession(win: Window): void {
  injectSession(win, {
    role: 'EMPLOYEE',
    email: 'ana.ivanovic@banka.rs',
    firstName: 'Ana',
    lastName: 'Ivanovic',
  });
}

export function setupSupervisorSession(win: Window): void {
  injectSession(win, {
    role: 'EMPLOYEE',
    email: 'nikola.supervisor@banka.rs',
    firstName: 'Nikola',
    lastName: 'Jokic',
    permissions: ['SUPERVISOR', 'TRADE_STOCKS', 'TRADE_FOREX', 'TRADE_FUTURES', 'TRADE_OPTIONS', 'AGENT'],
  });
}

export function setupAgentSession(win: Window): void {
  injectSession(win, {
    role: 'EMPLOYEE',
    email: 'agent.smith@banka.rs',
    firstName: 'Agent',
    lastName: 'Smith',
    permissions: ['AGENT', 'TRADE_STOCKS', 'TRADE_FOREX', 'TRADE_FUTURES', 'TRADE_OPTIONS'],
  });
}

// ============================================================
// Cypress Custom Commands
// ============================================================

Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => setupAdminSession(win));
});

Cypress.Commands.add('loginAsClient', () => {
  cy.window().then((win) => setupClientSession(win));
});

Cypress.Commands.add('loginAsEmployee', () => {
  cy.window().then((win) => setupEmployeeSession(win));
});

Cypress.Commands.add('loginAsSupervisor', () => {
  cy.window().then((win) => setupSupervisorSession(win));
});

Cypress.Commands.add('loginAsAgent', () => {
  cy.window().then((win) => setupAgentSession(win));
});

Cypress.Commands.add('mockCommonEndpoints', () => {
  // Auth
  cy.intercept('POST', '**/api/auth/refresh', { statusCode: 200, body: { accessToken: 'fake-access-token' } });

  // Accounts & Finance
  cy.intercept('GET', '**/api/accounts/my', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/payment-recipients', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/exchange-rates', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/loans/my*', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  cy.intercept('GET', '**/api/payments*', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  cy.intercept('GET', '**/api/cards', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/transfers*', { statusCode: 200, body: [] });

  // Trading & Securities
  cy.intercept('GET', '**/api/listings*', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  cy.intercept('GET', '**/api/orders*', { statusCode: 200, body: { content: [], totalElements: 0, totalPages: 0 } });
  cy.intercept('GET', '**/api/portfolio*', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/actuaries*', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/tax*', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/exchanges', { statusCode: 200, body: [] });
  cy.intercept('GET', '**/api/margin-accounts*', { statusCode: 200, body: [] });
});

// ============================================================
// Type Declarations
// ============================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      loginAsClient(): Chainable<void>;
      loginAsEmployee(): Chainable<void>;
      loginAsSupervisor(): Chainable<void>;
      loginAsAgent(): Chainable<void>;
      mockCommonEndpoints(): Chainable<void>;
    }
  }
}
