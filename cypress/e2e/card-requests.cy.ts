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

describe('Card Requests - Client', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsClient();
  });

  it('klijent vidi dugme za zahtev za novu karticu', () => {
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: [] });
    }).as('cards');
    cy.visit('/cards');
    cy.wait('@cards');
    cy.contains('Nova kartica').should('be.visible');
  });

  it('klijent podnosi zahtev za karticu', () => {
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: [] });
    }).as('cards');
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: [{ id: 1, accountNumber: '222000112345678911', currency: 'RSD', name: 'Glavni racun', status: 'ACTIVE' }],
    }).as('accounts');
    cy.intercept('POST', '**/cards/requests', {
      statusCode: 201,
      body: { id: 1, status: 'PENDING', accountId: 1, clientName: 'Stefan Jovanovic' },
    }).as('submitRequest');

    cy.visit('/cards');
    cy.wait('@cards');
    cy.wait('@accounts');
    cy.contains('Nova kartica').click();
    cy.contains(/Zahtev za novu karticu/i).should('be.visible');

    cy.contains('[role="combobox"]', /Izaberite/i).click();
    cy.get('[role="option"]').contains('222000112345678911').click();

    cy.contains(/Limit kartice/i)
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('50000');

    cy.contains(/Kreiraj karticu/i).click();

    cy.wait('@submitRequest').then(({ request }) => {
      expect(request.body).to.include({ accountId: 1, cardLimit: 50000 });
    });
  });

  it('klijent moze da blokira svoju karticu', () => {
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({
        statusCode: 200,
        body: [{
          id: 1, cardNumber: '4111111111111111', cardName: 'Visa Debit',
          accountNumber: '222000112345678911', status: 'ACTIVE', cardLimit: 100000,
          expirationDate: '2028-01-01', createdAt: '2026-01-01',
        }],
      });
    }).as('cards');
    cy.intercept('PATCH', '**/cards/1/block', {
      statusCode: 200, body: { id: 1, status: 'BLOCKED' },
    }).as('block');

    cy.visit('/cards');
    cy.wait('@cards');
    cy.contains('Blokiraj').should('be.visible');
  });

  it('klijent NE moze da deaktivira karticu', () => {
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({
        statusCode: 200,
        body: [{
          id: 1, cardNumber: '4111111111111111', cardName: 'Visa Debit',
          accountNumber: '222000112345678911', status: 'ACTIVE', cardLimit: 100000,
          expirationDate: '2028-01-01', createdAt: '2026-01-01',
        }],
      });
    }).as('cards');

    cy.visit('/cards');
    cy.wait('@cards');
    cy.contains('Deaktiviraj').should('not.exist');
  });

  it('klijent NE moze da odblokira karticu', () => {
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({
        statusCode: 200,
        body: [{
          id: 1, cardNumber: '4111111111111111', cardName: 'Visa Debit',
          accountNumber: '222000112345678911', status: 'BLOCKED', cardLimit: 100000,
          expirationDate: '2028-01-01', createdAt: '2026-01-01',
        }],
      });
    }).as('cards');

    cy.visit('/cards');
    cy.wait('@cards');
    cy.contains('Odblokiraj').should('not.exist');
  });
});

describe('Card Requests - Admin Portal', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsAdmin();
  });

  it('admin vidi stranicu za zahteve za kartice', () => {
    cy.intercept('GET', '**/cards/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountId: 1, accountNumber: '222000112345678911', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00', cardLimit: 50000 },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');

    cy.visit('/employee/card-requests');
    cy.wait('@requests');
    cy.contains('h1', /Zahtevi za kartice/i).should('be.visible');
    cy.contains('Stefan Jovanovic').should('be.visible');
  });

  it('admin odobrava zahtev za karticu', () => {
    cy.intercept('GET', '**/cards/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountId: 1, accountNumber: '222000112345678911', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00', cardLimit: 50000 },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');
    cy.intercept('PATCH', '**/cards/requests/1/approve', {
      statusCode: 200, body: { id: 1, status: 'APPROVED' },
    }).as('approve');

    cy.visit('/employee/card-requests');
    cy.wait('@requests');
    cy.contains('Odobri').click();
    cy.wait('@approve');
  });

  it('admin odbija zahtev za karticu', () => {
    cy.intercept('GET', '**/cards/requests**', {
      statusCode: 200,
      body: { content: [
        { id: 1, accountId: 1, accountNumber: '222000112345678911', status: 'PENDING', clientName: 'Stefan Jovanovic', clientEmail: 'stefan@test.com', createdAt: '2026-03-20T10:00:00', cardLimit: 50000 },
      ], totalPages: 1, totalElements: 1, number: 0 },
    }).as('requests');
    cy.intercept('PATCH', '**/cards/requests/1/reject', {
      statusCode: 200, body: { id: 1, status: 'REJECTED' },
    }).as('reject');

    cy.visit('/employee/card-requests');
    cy.wait('@requests');
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('Nedovoljno dokumentacije');
    });
    cy.contains('Odbij').click();
    cy.wait('@reject');
  });

  it('admin moze da odblokira karticu klijenta', () => {
    cy.intercept('GET', '**/accounts/1', {
      statusCode: 200,
      body: {
        id: 1,
        accountNumber: '222000112345678911',
        ownerName: 'Stefan Jovanovic',
        status: 'ACTIVE',
        currency: 'RSD',
      },
    }).as('account');
    cy.intercept('GET', '**/cards/account/1', {
      statusCode: 200,
      body: [{
        id: 1, cardNumber: '4111111111111111', cardName: 'Visa Debit',
        cardType: 'VISA', holderName: 'Stefan Jovanovic',
        accountNumber: '222000112345678911', status: 'BLOCKED', limit: 100000,
        expirationDate: '2028-01-01', createdAt: '2026-01-01',
      }],
    }).as('cards');
    cy.intercept('PATCH', '**/cards/1/unblock', {
      statusCode: 200, body: { id: 1, status: 'ACTIVE' },
    }).as('unblock');

    cy.visit('/employee/accounts/1/cards');
    cy.wait('@account');
    cy.wait('@cards');
    cy.get('button[title="Deblokiraj"]').should('be.visible');
  });

  it('admin moze da deaktivira karticu klijenta', () => {
    cy.intercept('GET', '**/accounts/1', {
      statusCode: 200,
      body: {
        id: 1,
        accountNumber: '222000112345678911',
        ownerName: 'Stefan Jovanovic',
        status: 'ACTIVE',
        currency: 'RSD',
      },
    }).as('account');
    cy.intercept('GET', '**/cards/account/1', {
      statusCode: 200,
      body: [{
        id: 1, cardNumber: '4111111111111111', cardName: 'Visa Debit',
        cardType: 'VISA', holderName: 'Stefan Jovanovic',
        accountNumber: '222000112345678911', status: 'ACTIVE', limit: 100000,
        expirationDate: '2028-01-01', createdAt: '2026-01-01',
      }],
    }).as('cards');
    cy.intercept('PATCH', '**/cards/1/deactivate', {
      statusCode: 200, body: { id: 1, status: 'DEACTIVATED' },
    }).as('deactivate');

    cy.visit('/employee/accounts/1/cards');
    cy.wait('@account');
    cy.wait('@cards');
    cy.get('button[title="Deaktiviraj"]').should('be.visible');
  });
});

describe('Card Requests - End to End', () => {
  it('klijent podnosi zahtev, admin odobrava, kartica se pojavljuje', () => {
    let approved = false;

    const account = {
      id: 1,
      accountNumber: '222000112345678911',
      currency: 'RSD',
      name: 'Glavni racun',
      status: 'ACTIVE',
    };

    const pendingRequest = {
      id: 1,
      accountId: 1,
      accountNumber: account.accountNumber,
      status: 'PENDING',
      clientName: 'Stefan Jovanovic',
      clientEmail: 'stefan@test.com',
      createdAt: '2026-03-20T10:00:00',
      cardLimit: 50000,
    };

    const createdCard = {
      id: 10,
      cardNumber: '4111111111111111',
      cardName: 'Visa Debit',
      accountNumber: account.accountNumber,
      status: 'ACTIVE',
      cardLimit: 50000,
      expirationDate: '2028-01-01',
      createdAt: '2026-03-20',
      ownerName: 'Stefan Jovanovic',
    };

    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [account] }).as('accounts');
    cy.intercept('GET', '**/cards', (req) => {
      if (req.resourceType === 'document') {
        req.continue();
        return;
      }
      req.reply({ statusCode: 200, body: approved ? [createdCard] : [] });
    }).as('cards');
    cy.intercept('POST', '**/cards/requests', {
      statusCode: 201,
      body: { id: 1, status: 'PENDING', accountId: 1, clientName: 'Stefan Jovanovic' },
    }).as('submitRequest');
    cy.intercept('GET', '**/cards/requests**', (req) => {
      req.reply({
        statusCode: 200,
        body: approved
          ? { content: [], totalPages: 0, totalElements: 0, number: 0 }
          : { content: [pendingRequest], totalPages: 1, totalElements: 1, number: 0 },
      });
    }).as('requests');
    cy.intercept('PATCH', '**/cards/requests/1/approve', (req) => {
      approved = true;
      req.reply({ statusCode: 200, body: { id: 1, status: 'APPROVED' } });
    }).as('approve');

    // Client submits request
    cy.visit('/login');
    loginAsClient();
    cy.visit('/cards');
    cy.wait('@cards');
    cy.wait('@accounts');
    cy.contains('Nova kartica').click();
    cy.contains(/Zahtev za novu karticu/i).should('be.visible');
    cy.contains('[role="combobox"]', /Izaberite/i).click();
    cy.get('[role="option"]').contains(account.accountNumber).click();
    cy.contains(/Limit kartice/i)
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('50000');
    cy.contains(/Kreiraj karticu/i).click();
    cy.wait('@submitRequest');

    // Admin approves request
    cy.visit('/login');
    loginAsAdmin();
    cy.visit('/employee/card-requests');
    cy.wait('@requests');
    cy.contains('Odobri').click();
    cy.wait('@approve');

    // Client sees new card
    cy.visit('/login');
    loginAsClient();
    cy.visit('/cards');
    cy.wait('@cards');
    cy.contains('**** **** **** 1111').should('be.visible');
  });
});
