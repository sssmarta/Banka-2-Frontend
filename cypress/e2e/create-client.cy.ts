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

describe('Create Client - Admin Portal', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsAdmin();
  });

  it('admin vidi dugme za kreiranje novog klijenta', () => {
    cy.intercept('GET', '**/clients?*', {
      statusCode: 200,
      body: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    }).as('clients');

    cy.visit('/employee/clients');
    cy.wait('@clients');
    cy.contains('Novi klijent').should('be.visible');
  });

  it('admin kreira novog klijenta', () => {
    let created = false;
    const newClient = {
      id: 10,
      firstName: 'Novi',
      lastName: 'Klijent',
      email: 'novi@test.com',
      phoneNumber: '+381601234567',
    };

    cy.intercept('GET', '**/clients?*', (req) => {
      req.reply({
        statusCode: 200,
        body: created
          ? { content: [newClient], totalPages: 1, totalElements: 1, number: 0 }
          : { content: [], totalPages: 0, totalElements: 0, number: 0 },
      });
    }).as('clients');
    cy.intercept('POST', '**/clients', (req) => {
      created = true;
      req.reply({
        statusCode: 201,
        body: { ...newClient, active: true },
      });
    }).as('createClient');

    cy.visit('/employee/clients');
    cy.wait('@clients');
    cy.contains('button', 'Novi klijent').should('be.visible').click();

    cy.contains('h3', 'Novi klijent')
      .should('be.visible')
      .closest('div.rounded-lg')
      .as('createCard');

    cy.get('@createCard').within(() => {
      cy.contains('label', /^Ime/).next('input:enabled').clear().type('Novi');
      cy.contains('label', /^Prezime/).next('input:enabled').clear().type('Klijent');
      cy.contains('label', /^Email/).next('input:enabled').clear().type('novi@test.com');
      cy.contains('label', /^Lozinka/).next('input:enabled').clear().type('Test12345');
      cy.contains('label', /^Telefon/).next('input:enabled').clear().type('+381601234567');
      cy.contains('label', /^Adresa/).next('input:enabled').clear().type('Beograd');
      cy.contains('label', /^Datum rodjenja/).next('input:enabled').clear().type('1995-05-15');
      cy.contains('label', /^Pol/).next('input:enabled').clear().type('M');
      cy.contains('button', 'Kreiraj klijenta').click();
    });
    cy.wait('@createClient');
    cy.wait('@clients');

    cy.contains('Novi').should('be.visible');
    cy.contains('Klijent').should('be.visible');
    cy.contains('novi@test.com').should('be.visible');
  });

  it('admin vidi listu klijenata sa pretragom', () => {
    cy.intercept('GET', '**/clients?*', {
      statusCode: 200,
      body: {
        content: [
          { id: 1, firstName: 'Stefan', lastName: 'Jovanovic', email: 'stefan@test.com', phoneNumber: '+381601234567', address: 'Beograd', dateOfBirth: '1995-05-15', gender: 'M', jmbg: '0101995500000' },
          { id: 2, firstName: 'Milica', lastName: 'Nikolic', email: 'milica@test.com', phoneNumber: '+381609876543', address: 'Novi Sad', dateOfBirth: '1998-03-10', gender: 'F', jmbg: '1003998500000' },
        ],
        totalPages: 1, totalElements: 2, number: 0,
      },
    }).as('clients');

    cy.visit('/employee/clients');
    cy.wait('@clients');
    cy.contains('h3', 'Pretraga i lista klijenata').should('be.visible');
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length', 2);
    cy.contains('td', 'Stefan').should('be.visible');
    cy.contains('td', 'Milica').should('be.visible');
    cy.get('input[placeholder*="Pretraga"]').should('be.visible');
  });

  it('admin vidi detalje klijenta', () => {
    cy.intercept('GET', '**/clients?*', {
      statusCode: 200,
      body: {
        content: [
          { id: 1, firstName: 'Stefan', lastName: 'Jovanovic', email: 'stefan@test.com', phone: '+381601234567', address: 'Beograd', dateOfBirth: '1995-05-15', gender: 'M' },
        ],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('clients');
    cy.intercept('GET', '**/clients/1*', {
      statusCode: 200,
      body: { id: 1, firstName: 'Stefan', lastName: 'Jovanovic', email: 'stefan@test.com', phoneNumber: '+381601234567', address: 'Beograd', dateOfBirth: '1995-05-15', gender: 'M' },
    }).as('clientDetails');
    cy.intercept('GET', '**/accounts/client/1', {
      statusCode: 200,
      body: [
        { id: 1, accountNumber: '222000112345678911', accountType: 'CHECKING', currencyCode: 'RSD', currency: 'RSD', balance: 185000, status: 'ACTIVE' },
      ],
    }).as('clientAccounts');

    cy.visit('/employee/clients');
    cy.wait('@clients');
    cy.contains('td', 'Stefan')
      .closest('tr')
      .within(() => {
        cy.contains('button', 'Detalji').click();
      });
    cy.url({ timeout: 10000 }).should('include', '/employee/clients/1');
    cy.wait('@clientDetails');
    cy.wait('@clientAccounts');
    cy.contains('h3', 'Detalji klijenta').should('be.visible');
    cy.contains('h3', 'Detalji klijenta')
      .closest('div.rounded-lg')
      .within(() => {
        cy.contains('label', /^Ime/).next('input').should('have.value', 'Stefan');
        cy.contains('label', /^Prezime/).next('input').should('have.value', 'Jovanovic');
        cy.contains('label', /^Email/).next('input').should('have.value', 'stefan@test.com');
        cy.contains('label', /^Telefon/).next('input').should('have.value', '+381601234567');
      });
    cy.contains('td', '222000112345678911').should('be.visible');
  });

  it('klijent NE moze da pristupi portalu klijenata', () => {
    cy.visit('/login');
    loginAsClient();

    cy.visit('/employee/clients');
    cy.url().should('include', '/403');
  });
});

describe('Payment with OTP Verification', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsClient();
  });

  it('klijent vrsi placanje sa OTP verifikacijom', () => {
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: [
        { id: 1, accountNumber: '222000112345678911', currencyCode: 'RSD', currency: 'RSD', balance: 185000, availableBalance: 178000, name: 'Glavni racun' },
      ],
    }).as('accounts');
    cy.intercept('GET', '**/payment-recipients', {
      statusCode: 200,
      body: { content: [{ id: 1, name: 'Milica', accountNumber: '222000112345678913' }], totalPages: 1, totalElements: 1, number: 0 },
    }).as('recipients');
    cy.intercept('POST', '**/payments', {
      statusCode: 201,
      body: { id: 1, status: 'PENDING', amount: 5000 },
    }).as('createPayment');
    cy.intercept('POST', '**/payments/verify', {
      statusCode: 200,
      body: { verified: true, message: 'Transakcija uspesno verifikovana' },
    }).as('verify');

    cy.visit('/payments/new');
    cy.wait('@accounts');
    cy.wait('@recipients');

    cy.get('#fromAccount', { timeout: 10000 }).should('not.be.disabled');
    cy.get('#fromAccount').select('222000112345678911');
    cy.get('#toAccount').clear();
    cy.get('#toAccount').type('222000112345678913');
    cy.get('#recipientName').clear();
    cy.get('#recipientName').type('Milica');
    cy.get('#amount').clear();
    cy.get('#amount').type('5000');
    cy.get('#paymentCode').should('not.be.disabled');
    cy.get('#paymentCode').clear();
    cy.get('#paymentCode').type('289');
    cy.get('#purpose').clear();
    cy.get('#purpose').type('Test placanje');

    cy.contains('button', 'Nastavi na verifikaciju').click();
    cy.wait('@createPayment');

    cy.contains('Verifikacija transakcije').should('be.visible');
    cy.get('#otp').clear().type('1234');
    cy.contains('button', 'Potvrdi').click();

    cy.wait('@verify')
      .its('request.body')
      .should('deep.include', { transactionId: 1, code: '1234' });

    cy.url().should('include', '/payments/history');
  });

  it('pogresan OTP kod ne prolazi', () => {
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: [
        { id: 1, accountNumber: '222000112345678911', currencyCode: 'RSD', currency: 'RSD', balance: 185000, availableBalance: 178000, name: 'Glavni racun' },
      ],
    }).as('accounts');
    cy.intercept('GET', '**/payment-recipients', {
      statusCode: 200,
      body: { content: [{ id: 1, name: 'Milica', accountNumber: '222000112345678913' }], totalPages: 1, totalElements: 1, number: 0 },
    }).as('recipients');
    cy.intercept('POST', '**/payments', {
      statusCode: 201,
      body: { id: 2, status: 'PENDING', amount: 5000 },
    }).as('createPayment');
    cy.intercept('POST', '**/payments/verify', {
      statusCode: 400,
      body: { message: 'Neispravan verifikacioni kod' },
    }).as('verifyFail');

    cy.visit('/payments/new');
    cy.wait('@accounts');
    cy.wait('@recipients');

    cy.get('#fromAccount', { timeout: 10000 }).should('not.be.disabled');
    cy.get('#fromAccount').select('222000112345678911');
    cy.get('#toAccount').clear();
    cy.get('#toAccount').type('222000112345678913');
    cy.get('#recipientName').clear();
    cy.get('#recipientName').type('Milica');
    cy.get('#amount').clear();
    cy.get('#amount').type('5000');
    cy.get('#paymentCode').should('not.be.disabled');
    cy.get('#paymentCode').clear();
    cy.get('#paymentCode').type('289');
    cy.get('#purpose').clear();
    cy.get('#purpose').type('Test placanje');

    cy.contains('button', 'Nastavi na verifikaciju').click();
    cy.wait('@createPayment');

    cy.contains('Verifikacija transakcije').should('be.visible');
    cy.get('#otp').clear().type('0000');
    cy.contains('button', 'Potvrdi').click();
    cy.wait('@verifyFail');
    cy.contains('Neispravan verifikacioni kod').should('be.visible');
  });
});
