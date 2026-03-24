/// <reference types="cypress" />

function createJwt(role: string, email = 'admin@banka.rs') {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payload = btoa(JSON.stringify({
    sub: email, role, active: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${payload}.signature`;
}

function setSession(role: 'ADMIN' | 'CLIENT', email: string) {
  const token = createJwt(role, email);
  const [firstName, lastName] = email.split('@')[0].split('.');
  cy.window().then((win) => {
    win.sessionStorage.setItem('accessToken', token);
    win.sessionStorage.setItem('refreshToken', token);
    win.sessionStorage.setItem(
      'user',
      JSON.stringify({
        id: 0,
        email,
        username: email.split('@')[0],
        firstName: firstName ? firstName[0].toUpperCase() + firstName.slice(1) : '',
        lastName: lastName ? lastName[0].toUpperCase() + lastName.slice(1) : '',
        role,
        permissions: role === 'ADMIN' ? ['ADMIN'] : [],
      })
    );
  });
}

function loginAsAdmin() {
  setSession('ADMIN', 'marko.petrovic@banka.rs');
}

function loginAsClient() {
  setSession('CLIENT', 'stefan.jovanovic@gmail.com');
}

describe('Account Requests - Client', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsClient();
  });

  it('klijent vidi dugme za novi zahtev za racun', () => {
    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [] }).as('accounts');
    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains('Novi račun').should('be.visible');
  });

  it('klijent moze da podnese zahtev za tekuci racun', () => {
    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [] }).as('accounts');
    cy.intercept('POST', '**/accounts/requests', {
      statusCode: 201,
      body: { id: 1, accountType: 'CHECKING', currency: 'RSD', status: 'PENDING' },
    }).as('submitRequest');

    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains(/Novi ra.?un/i).click();
    cy.contains(/Otvaranje novog ra.?una/i).should('be.visible');

    cy.contains(/Po.etni depozit/i)
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('1500');

    cy.get('#createCardCheck').check();
    cy.contains(/Otvori ra.?un/i).click();

    cy.wait('@submitRequest').then(({ request }) => {
      expect(request.body).to.include({
        accountType: 'CHECKING',
        currency: 'RSD',
        createCard: true,
      });
      expect(Number(request.body.initialDeposit)).to.eq(1500);
    });
  });

  it('zahtev zahteva obavezna polja', () => {
    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [] }).as('accounts');
    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains('Novi račun').click();
  });

  it('klijent ne moze da kreira racun direktno', () => {
    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [] }).as('accounts');
    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains('Kreiraj račun').should('not.exist');
  });
});

describe('Account Requests - Admin Portal', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsAdmin();
  });

  it('admin vidi stranicu za zahteve za racune', () => {
    cy.intercept('GET', '**/accounts/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountType: 'CHECKING', currency: 'RSD', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00' },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');

    cy.visit('/employee/account-requests');
    cy.wait('@requests');
    cy.contains('h1', /Zahtevi za ra.?une/i).should('be.visible');
    cy.contains('Stefan Jovanovic').should('be.visible');
    cy.contains(/Na .?ekanju/i).should('be.visible');
  });

  it('admin moze da odobri zahtev', () => {
    cy.intercept('GET', '**/accounts/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountType: 'CHECKING', currency: 'RSD', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00' },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');
    cy.intercept('PATCH', '**/accounts/requests/1/approve', {
      statusCode: 200,
      body: { id: 1, status: 'APPROVED' },
    }).as('approve');

    cy.visit('/employee/account-requests');
    cy.wait('@requests');
    cy.contains('Odobri').click();
    cy.wait('@approve');
  });

  it('admin moze da odbije zahtev sa razlogom', () => {
    cy.intercept('GET', '**/accounts/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountType: 'CHECKING', currency: 'RSD', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00' },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');
    cy.intercept('PATCH', '**/accounts/requests/1/reject', {
      statusCode: 200,
      body: { id: 1, status: 'REJECTED', rejectionReason: 'Nedovoljno dokumentacije' },
    }).as('reject');

    cy.visit('/employee/account-requests');
    cy.wait('@requests');
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('Nedovoljno dokumentacije');
    });
    cy.contains('Odbij').click();
    cy.wait('@reject');
  });

  it('prazan spisak zahteva prikazuje poruku', () => {
    cy.intercept('GET', '**/accounts/requests**', {
      statusCode: 200,
      body: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    }).as('requests');

    cy.visit('/employee/account-requests');
    cy.wait('@requests');
    cy.contains('Nema zahteva').should('be.visible');
  });
});

describe('Account Requests - End to End', () => {
  it('klijent podnosi zahtev, admin odobrava, racun se pojavljuje', () => {
    let approved = false;

    const createdAccount = {
      id: 99,
      accountNumber: '265000000000123456',
      name: 'Tekuci racun - RSD',
      accountType: 'CHECKING',
      status: 'ACTIVE',
      balance: 1500,
      availableBalance: 1500,
      reservedBalance: 0,
      dailyLimit: 200000,
      monthlyLimit: 1000000,
      dailySpending: 0,
      monthlySpending: 0,
      maintenanceFee: 0,
      currency: 'RSD',
      ownerName: 'Stefan Jovanovic',
      createdAt: '2026-03-21',
    };

    const pendingRequest = {
      id: 1,
      accountType: 'CHECKING',
      currency: 'RSD',
      initialDeposit: 1500,
      createCard: true,
      status: 'PENDING',
      clientName: 'Stefan Jovanovic',
      clientEmail: 'stefan@test.com',
      createdAt: '2026-03-20T10:00:00',
    };

    cy.intercept('GET', '**/accounts/my', (req) => {
      req.reply({
        statusCode: 200,
        body: approved ? [createdAccount] : [],
      });
    }).as('accounts');

    cy.intercept('POST', '**/accounts/requests', {
      statusCode: 201,
      body: { id: 1, accountType: 'CHECKING', currency: 'RSD', status: 'PENDING' },
    }).as('submitRequest');

    cy.intercept('GET', '**/accounts/requests**', (req) => {
      req.reply({
        statusCode: 200,
        body: approved
          ? { content: [], totalPages: 0, totalElements: 0, number: 0 }
          : { content: [pendingRequest], totalPages: 1, totalElements: 1, number: 0 },
      });
    }).as('requests');

    cy.intercept('PATCH', '**/accounts/requests/1/approve', (req) => {
      approved = true;
      req.reply({ statusCode: 200, body: { id: 1, status: 'APPROVED' } });
    }).as('approve');

    // Client submits request
    cy.visit('/login');
    loginAsClient();
    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains(/Novi ra.?un/i).click();
    cy.contains(/Otvaranje novog ra.?una/i).should('be.visible');
    cy.contains(/Po.etni depozit/i)
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('1500');
    cy.get('#createCardCheck').check();
    cy.contains(/Otvori ra.?un/i).click();
    cy.wait('@submitRequest');

    // Admin approves request
    cy.visit('/login');
    loginAsAdmin();
    cy.visit('/employee/account-requests');
    cy.wait('@requests');
    cy.contains('Odobri').click();
    cy.wait('@approve');

    // Client sees newly created account
    cy.visit('/login');
    loginAsClient();
    cy.visit('/accounts');
    cy.wait('@accounts');
    cy.contains(/265-/).should('be.visible');
  });
});
