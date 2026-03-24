/// <reference types="cypress" />

describe('Exchange with account - source/dest accounts, conversion, balance update', () => {
  const accountRsd = {
    id: 1,
    accountNumber: '160123456789012345',
    ownerName: 'Test User',
    accountType: 'TEKUCI',
    currency: 'RSD',
    balance: 150000,
    availableBalance: 120000,
    reservedBalance: 0,
    dailyLimit: 300000,
    monthlyLimit: 1000000,
    dailySpending: 0,
    monthlySpending: 0,
    maintenanceFee: 0,
    status: 'ACTIVE',
    createdAt: '2026-03-01T10:00:00Z',
    name: 'RSD racun',
  };

  const accountEur = {
    id: 2,
    accountNumber: '340555666777888900',
    ownerName: 'Test User',
    accountType: 'DEVIZNI',
    currency: 'EUR',
    balance: 1000,
    availableBalance: 1000,
    reservedBalance: 0,
    dailyLimit: 5000,
    monthlyLimit: 20000,
    dailySpending: 0,
    monthlySpending: 0,
    maintenanceFee: 0,
    status: 'ACTIVE',
    createdAt: '2026-03-01T10:00:00Z',
    name: 'EUR racun',
  };

  const formatAccountNumber = (accountNumber: string) =>
    `${accountNumber.slice(0, 3)}-${accountNumber.slice(3, 16)}-${accountNumber.slice(16)}`;

  const formatBalance = (amount: number, currency: string) =>
    `${amount.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  const setClientSession = (win: Window) => {
    win.sessionStorage.setItem('accessToken', 'fake-access-token');
    win.sessionStorage.setItem('refreshToken', 'fake-refresh-token');
    win.sessionStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        email: 'client@test.com',
        username: 'client',
        firstName: 'Test',
        lastName: 'Client',
        permissions: ['CLIENT'],
      })
    );
  };

  it('izabere source/dest racun, izvrsi konverziju, balans se azurira', () => {
    let transferCompleted = false;
    const updatedAccounts = [
      { ...accountRsd, availableBalance: 119000, balance: 149000 },
      { ...accountEur, availableBalance: 1100, balance: 1100 },
    ];

    cy.intercept('GET', '**/accounts/my', (req) => {
      req.reply({
        statusCode: 200,
        body: transferCompleted ? updatedAccounts : [accountRsd, accountEur],
      });
    }).as('getMyAccounts');

    cy.intercept('GET', '**/exchange/calculate**', {
      statusCode: 200,
      body: {
        convertedAmount: 8.5,
        exchangeRate: 0.0085,
        fromCurrency: 'RSD',
        toCurrency: 'EUR',
      },
    }).as('convert');

    cy.intercept('POST', '**/transfers/internal', (req) => {
      transferCompleted = true;
      req.reply({
        statusCode: 200,
        body: {
          id: 1001,
          fromAccountNumber: req.body.fromAccountNumber,
          toAccountNumber: req.body.toAccountNumber,
          amount: req.body.amount,
          status: 'PENDING',
          createdAt: '2026-03-14T12:00:00Z',
        },
      });
    }).as('createTransfer');

    cy.intercept('GET', '**/payments**', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
    }).as('getPayments');

    cy.visit('/transfers', {
      onBeforeLoad(win) {
        setClientSession(win);
      },
    });

    cy.wait('@getMyAccounts');

    cy.get('#fromAccount').select(accountRsd.accountNumber);
    cy.get('#toAccount').select(accountEur.accountNumber);
    cy.get('#amount').clear().type('1000');

    cy.wait('@convert');
    cy.contains('Konvertovani iznos').should('be.visible');

    cy.contains('button', 'Nastavi na potvrdu').click();
    cy.contains('button', 'Potvrdi transfer').click();

    cy.wait('@createTransfer');
    cy.location('pathname', { timeout: 10000 }).should('include', '/accounts');

    cy.wait('@getMyAccounts');
    cy.wait('@getPayments');

    cy.contains('td', formatAccountNumber(accountRsd.accountNumber))
      .closest('tr')
      .within(() => {
        cy.contains(formatBalance(119000, 'RSD')).should('be.visible');
      });
  });
});
