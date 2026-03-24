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

describe('Loan Application - Client', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsClient();
  });

  it('klijent vidi stranicu za podnosenje zahteva za kredit', () => {
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: [{ id: 1, accountNumber: '222000112345678911', currencyCode: 'RSD', currency: 'RSD', name: 'Glavni racun' }],
    }).as('accounts');
    cy.intercept('GET', '**/loans/my**', {
      statusCode: 200,
      body: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    }).as('loans');

    cy.visit('/loans');
    cy.wait('@loans');
    cy.contains('h1', /Moji krediti/i).should('be.visible');
  });

  it('klijent podnosi zahtev za gotovinski kredit', () => {
    cy.intercept('GET', '**/accounts/my', {
      statusCode: 200,
      body: [{ id: 1, accountNumber: '222000112345678911', currencyCode: 'RSD', currency: 'RSD', name: 'Glavni racun' }],
    }).as('accounts');
    cy.intercept('GET', '**/loans/my**', {
      statusCode: 200,
      body: { content: [], totalPages: 0, totalElements: 0, number: 0 },
    }).as('loans');
    cy.intercept('POST', '**/loans', {
      statusCode: 201,
      body: {
        id: 1, loanType: 'CASH', amount: 50000, currency: 'RSD',
        loanPurpose: 'Renoviranje stana', repaymentPeriod: 12,
        status: 'PENDING', interestType: 'FIXED',
      },
    }).as('applyLoan');

    cy.visit('/loans');
    cy.wait('@loans');
    cy.contains('Zahtev za kredit').click();

    cy.contains('h1', /Zahtev za kredit/i).should('be.visible');
    cy.get('#loanType').select('GOTOVINSKI');
    cy.get('#interestRateType').select('FIKSNI');
    cy.get('#amount').clear().type('50000');
    cy.get('#currency').select('RSD');
    cy.get('#loanPurpose').type('Renoviranje stana');
    cy.get('#repaymentPeriod').select('12');
    cy.get('#accountNumber').select('222000112345678911');
    cy.get('#phoneNumber').type('+381601234567');
    cy.get('button[type="submit"]').click();

    cy.wait('@applyLoan').then(({ request }) => {
      expect(request.body).to.include({
        loanType: 'CASH',
        interestType: 'FIXED',
        amount: 50000,
        currency: 'RSD',
        loanPurpose: 'Renoviranje stana',
        repaymentPeriod: 12,
        accountNumber: '222000112345678911',
        phoneNumber: '+381601234567',
      });
    });
  });

  it('klijent vidi listu svojih kredita', () => {
    cy.intercept('GET', '**/loans/my**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanNumber: 'LN-123', loanType: 'CASH', amount: 100000,
          currency: 'RSD', status: 'ACTIVE', repaymentPeriod: 24,
          monthlyPayment: 4523, remainingDebt: 90000, startDate: '2026-01-01',
          endDate: '2028-01-01', nominalRate: 6.25, effectiveRate: 8.0,
          interestType: 'FIXED', loanPurpose: 'Renoviranje',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('loans');

    cy.visit('/loans');
    cy.wait('@loans');
    cy.contains('CASH kredit').should('be.visible');
    cy.contains(/100000\.00/).should('be.visible');
    cy.contains('ACTIVE').should('be.visible');
  });

  it('kredit prikazuje sve detalje', () => {
    cy.intercept('GET', '**/loans/my**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanNumber: 'LN-123', loanType: 'CASH', amount: 100000,
          currency: 'RSD', status: 'ACTIVE', repaymentPeriod: 24,
          monthlyPayment: 4523, remainingDebt: 90000, startDate: '2026-01-01',
          endDate: '2028-01-01', nominalRate: 6.25, effectiveRate: 8.0,
          interestType: 'FIXED', loanPurpose: 'Renoviranje',
          accountNumber: '222000112345678911',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('loans');
    cy.intercept('GET', '**/loans/1/installments', {
      statusCode: 200,
      body: [],
    }).as('installments');

    cy.visit('/loans');
    cy.wait('@loans');
    cy.contains('Prikazi detalje').click();
    cy.wait('@installments');
    cy.contains('Detalji kredita').should('be.visible');
  });
});

describe('Loan Requests - Admin Portal', () => {
  beforeEach(() => {
    cy.visit('/login');
    loginAsAdmin();
  });

  it('admin vidi zahteve za kredite', () => {
    cy.intercept('GET', '**/loans/requests**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanType: 'CASH', amount: 50000, currency: 'RSD',
          status: 'PENDING', clientName: 'Stefan Jovanovic', interestRateType: 'FIXED',
          clientEmail: 'stefan@test.com', repaymentPeriod: 12,
          loanPurpose: 'Renoviranje', createdAt: '2026-03-20T10:00:00',
          accountNumber: '222000112345678911',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('requests');

    cy.visit('/employee/loan-requests');
    cy.wait('@requests');
    cy.contains('Stefan Jovanovic').should('be.visible');
    cy.contains(/50000\.00/).should('be.visible');
    cy.contains('Odobri').should('be.visible');
    cy.contains('Odbij').should('be.visible');
  });

  it('admin odobrava kredit', () => {
    cy.intercept('GET', '**/loans/requests**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanType: 'CASH', amount: 50000, currency: 'RSD',
          status: 'PENDING', clientName: 'Stefan Jovanovic', interestRateType: 'FIXED',
          clientEmail: 'stefan@test.com', repaymentPeriod: 12,
          loanPurpose: 'Renoviranje', createdAt: '2026-03-20T10:00:00',
          accountNumber: '222000112345678911',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('requests');
    cy.intercept('PATCH', '**/loans/requests/1/approve', {
      statusCode: 200,
      body: { id: 1, status: 'APPROVED', loanNumber: 'LN-ABC123' },
    }).as('approve');

    cy.visit('/employee/loan-requests');
    cy.wait('@requests');
    cy.contains('Odobri').first().click();
    cy.wait('@approve');
  });

  it('admin odbija kredit', () => {
    cy.intercept('GET', '**/loans/requests**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanType: 'CASH', amount: 50000, currency: 'RSD',
          status: 'PENDING', clientName: 'Stefan Jovanovic', interestRateType: 'FIXED',
          clientEmail: 'stefan@test.com', repaymentPeriod: 12,
          loanPurpose: 'Renoviranje', createdAt: '2026-03-20T10:00:00',
          accountNumber: '222000112345678911',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('requests');
    cy.intercept('PATCH', '**/loans/requests/1/reject', {
      statusCode: 200,
      body: { id: 1, status: 'REJECTED' },
    }).as('reject');

    cy.visit('/employee/loan-requests');
    cy.wait('@requests');
    cy.get('table tbody tr').first().within(() => {
      cy.contains('Detalji').click();
      cy.contains('Odbij').click();
    });
    cy.get('input[placeholder*="Unesite razlog"]').type('Nedovoljna dokumentacija');
    cy.contains('Potvrdi odbijanje').click();
    cy.wait('@reject');
  });

  it('admin vidi sve kredite', () => {
    cy.intercept('GET', '**/loans?**', {
      statusCode: 200,
      body: {
        content: [{
          id: 1, loanNumber: 'LN-123', loanType: 'CASH', amount: 100000,
          currency: 'RSD', status: 'ACTIVE', repaymentPeriod: 24,
          monthlyPayment: 4523, remainingDebt: 90000,
          clientName: 'Stefan Jovanovic',
        }],
        totalPages: 1, totalElements: 1, number: 0,
      },
    }).as('allLoans');

    cy.visit('/employee/loans');
    cy.wait('@allLoans');
    cy.contains('LN-123').should('be.visible');
  });
});

describe('Loan Application - End to End', () => {
  it('klijent podnosi zahtev, admin odobrava, kredit i rate se prikazuju', () => {
    let approved = false;

    const account = {
      id: 1,
      accountNumber: '222000112345678911',
      currency: 'RSD',
      name: 'Glavni racun',
    };

    const pendingRequest = {
      id: 1,
      loanType: 'CASH',
      amount: 50000,
      currency: 'RSD',
      status: 'PENDING',
      clientName: 'Stefan Jovanovic',
      clientEmail: 'stefan@test.com',
      repaymentPeriod: 12,
      loanPurpose: 'Renoviranje stana',
      createdAt: '2026-03-20T10:00:00',
      interestType: 'FIXED',
      accountNumber: account.accountNumber,
    };

    const approvedLoan = {
      id: 10,
      loanNumber: 'LN-ABC123',
      loanType: 'CASH',
      amount: 50000,
      currency: 'RSD',
      status: 'ACTIVE',
      repaymentPeriod: 12,
      monthlyPayment: 4523,
      remainingDebt: 48000,
      startDate: '2026-04-01',
      endDate: '2027-04-01',
      nominalRate: 6.25,
      effectiveRate: 8.0,
      interestType: 'FIXED',
      loanPurpose: 'Renoviranje stana',
      accountNumber: account.accountNumber,
    };

    const installments = [
      { id: 1, loanNumber: 'LN-ABC123', amount: 4523, interestAmount: 200, currency: 'RSD', expectedDueDate: '2026-05-01', paid: false },
      { id: 2, loanNumber: 'LN-ABC123', amount: 4523, interestAmount: 195, currency: 'RSD', expectedDueDate: '2026-06-01', paid: false },
    ];

    cy.intercept('GET', '**/accounts/my', { statusCode: 200, body: [account] }).as('accounts');
    cy.intercept('GET', '**/loans/my**', (req) => {
      req.reply({
        statusCode: 200,
        body: approved
          ? { content: [approvedLoan], totalPages: 1, totalElements: 1, number: 0 }
          : { content: [], totalPages: 0, totalElements: 0, number: 0 },
      });
    }).as('loans');
    cy.intercept('POST', '**/loans', {
      statusCode: 201,
      body: {
        id: 1, loanType: 'CASH', amount: 50000, currency: 'RSD',
        loanPurpose: 'Renoviranje stana', repaymentPeriod: 12,
        status: 'PENDING', interestType: 'FIXED',
      },
    }).as('applyLoan');
    cy.intercept('GET', '**/loans/requests**', (req) => {
      req.reply({
        statusCode: 200,
        body: approved
          ? { content: [], totalPages: 0, totalElements: 0, number: 0 }
          : { content: [pendingRequest], totalPages: 1, totalElements: 1, number: 0 },
      });
    }).as('requests');
    cy.intercept('PATCH', '**/loans/requests/1/approve', (req) => {
      approved = true;
      req.reply({ statusCode: 200, body: { id: 1, status: 'APPROVED', loanNumber: 'LN-ABC123' } });
    }).as('approve');
    cy.intercept('GET', '**/loans/10/installments', {
      statusCode: 200,
      body: installments,
    }).as('installments');

    // Client submits loan request
    cy.visit('/login');
    loginAsClient();
    cy.visit('/loans/apply');
    cy.wait('@accounts');
    cy.get('#loanType').select('GOTOVINSKI');
    cy.get('#interestRateType').select('FIKSNI');
    cy.get('#amount').clear().type('50000');
    cy.get('#currency').select('RSD');
    cy.get('#loanPurpose').type('Renoviranje stana');
    cy.get('#repaymentPeriod').select('12');
    cy.get('#accountNumber').select(account.accountNumber);
    cy.get('#phoneNumber').type('+381601234567');
    cy.get('button[type="submit"]').click();
    cy.wait('@applyLoan');

    // Admin approves request
    cy.visit('/login');
    loginAsAdmin();
    cy.visit('/employee/loan-requests');
    cy.wait('@requests');
    cy.contains('Odobri').first().click();
    cy.wait('@approve');

    // Client sees approved loan and installments
    cy.visit('/login');
    loginAsClient();
    cy.visit('/loans');
    cy.wait('@loans');
    cy.contains('CASH kredit').should('be.visible');
    cy.contains(/50000\.00/).should('be.visible');
    cy.contains('ACTIVE').should('be.visible');
    cy.contains('Prikazi detalje').click();
    cy.wait('@installments');
    cy.contains('Rata').should('be.visible');
    cy.contains('2026').should('be.visible');
  });
});
