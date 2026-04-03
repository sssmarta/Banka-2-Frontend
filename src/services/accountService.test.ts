import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { accountService } from './accountService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('accountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== getAll ====================

  describe('getAll', () => {
    it('should fetch all accounts without filters', async () => {
      const mockResponse = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };
      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await accountService.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/accounts/all', { params: expect.any(URLSearchParams) });
      expect(result).toEqual(mockResponse);
    });

    it('should pass ownerName filter', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await accountService.getAll({ ownerName: 'Marko' });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('ownerName')).toBe('Marko');
    });

    it('should fallback to ownerEmail when ownerName is not provided', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await accountService.getAll({ ownerEmail: 'marko@banka.rs' });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('ownerName')).toBe('marko@banka.rs');
    });

    it('should prefer ownerName over ownerEmail', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await accountService.getAll({ ownerName: 'Marko', ownerEmail: 'marko@banka.rs' });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('ownerName')).toBe('Marko');
    });

    it('should pass page and limit', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await accountService.getAll({ page: 2, limit: 10 });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('page')).toBe('2');
      expect(params.get('limit')).toBe('10');
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));
      await expect(accountService.getAll()).rejects.toThrow('Server error');
    });
  });

  // ==================== getById ====================

  describe('getById', () => {
    it('should fetch account by id', async () => {
      const mockAccount = { id: 1, accountNumber: '111111111111111111', balance: 50000 };
      mockedApi.get.mockResolvedValue({ data: mockAccount });

      const result = await accountService.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/accounts/1');
      expect(result).toEqual(mockAccount);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));
      await expect(accountService.getById(999)).rejects.toThrow('Not found');
    });
  });

  // ==================== getMyAccounts ====================

  describe('getMyAccounts', () => {
    it('should fetch current user accounts', async () => {
      const accounts = [
        { id: 1, accountNumber: '111', balance: 1000 },
        { id: 2, accountNumber: '222', balance: 2000 },
      ];
      mockedApi.get.mockResolvedValue({ data: accounts });

      const result = await accountService.getMyAccounts();

      expect(mockedApi.get).toHaveBeenCalledWith('/accounts/my');
      expect(result).toEqual(accounts);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(accountService.getMyAccounts()).rejects.toThrow('Unauthorized');
    });
  });

  // ==================== getByClientId ====================

  describe('getByClientId', () => {
    it('should fetch accounts by client id', async () => {
      const accounts = [{ id: 5, accountNumber: '333', balance: 3000 }];
      mockedApi.get.mockResolvedValue({ data: accounts });

      const result = await accountService.getByClientId(42);

      expect(mockedApi.get).toHaveBeenCalledWith('/accounts/client/42');
      expect(result).toEqual(accounts);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Client not found'));
      await expect(accountService.getByClientId(999)).rejects.toThrow('Client not found');
    });
  });

  // ==================== create ====================

  describe('create', () => {
    it('should create an account', async () => {
      const createData = {
        ownerEmail: 'marko@banka.rs',
        accountType: 'CHECKING' as const,
        currency: 'RSD' as const,
        initialDeposit: 10000,
      };
      const created = { id: 10, accountNumber: '444444444444444444', ...createData, balance: 10000 };
      mockedApi.post.mockResolvedValue({ data: created });

      const result = await accountService.create(createData);

      expect(mockedApi.post).toHaveBeenCalledWith('/accounts', createData);
      expect(result).toEqual(created);
    });

    it('should propagate errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid data'));
      await expect(
        accountService.create({ ownerEmail: '', accountType: 'CHECKING', currency: 'RSD' })
      ).rejects.toThrow('Invalid data');
    });
  });

  // ==================== updateName ====================

  describe('updateName', () => {
    it('should update account name', async () => {
      const updated = { id: 1, name: 'My Savings', accountNumber: '111' };
      mockedApi.patch.mockResolvedValue({ data: updated });

      const result = await accountService.updateName(1, 'My Savings');

      expect(mockedApi.patch).toHaveBeenCalledWith('/accounts/1/name', { name: 'My Savings' });
      expect(result).toEqual(updated);
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Failed'));
      await expect(accountService.updateName(1, 'test')).rejects.toThrow('Failed');
    });
  });

  // ==================== changeLimit ====================

  describe('changeLimit', () => {
    it('should change daily and monthly limits', async () => {
      mockedApi.patch.mockResolvedValue({ data: undefined });

      await accountService.changeLimit(1, { dailyLimit: 50000, monthlyLimit: 500000 });

      expect(mockedApi.patch).toHaveBeenCalledWith('/accounts/1/limits', {
        dailyLimit: 50000,
        monthlyLimit: 500000,
      });
    });

    it('should send OTP code when provided', async () => {
      mockedApi.patch.mockResolvedValue({ data: undefined });

      await accountService.changeLimit(1, { dailyLimit: 50000, otpCode: '123456' });

      expect(mockedApi.patch).toHaveBeenCalledWith('/accounts/1/limits', {
        dailyLimit: 50000,
        otpCode: '123456',
      });
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Limit change failed'));
      await expect(accountService.changeLimit(1, { dailyLimit: 999999 })).rejects.toThrow('Limit change failed');
    });
  });

  // ==================== changeStatus ====================

  describe('changeStatus', () => {
    it('should change account status', async () => {
      mockedApi.patch.mockResolvedValue({ data: undefined });

      await accountService.changeStatus(1, 'BLOCKED');

      expect(mockedApi.patch).toHaveBeenCalledWith('/accounts/1/status', { status: 'BLOCKED' });
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Status change failed'));
      await expect(accountService.changeStatus(1, 'ACTIVE')).rejects.toThrow('Status change failed');
    });
  });

  // ==================== submitRequest ====================

  describe('submitRequest', () => {
    it('should submit account creation request', async () => {
      const requestData = { accountType: 'CHECKING', currency: 'RSD', initialDeposit: 5000, createCard: true };
      mockedApi.post.mockResolvedValue({ data: { requestId: 99 } });

      const result = await accountService.submitRequest(requestData);

      expect(mockedApi.post).toHaveBeenCalledWith('/accounts/requests', requestData);
      expect(result).toEqual({ requestId: 99 });
    });

    it('should propagate errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Request failed'));
      await expect(accountService.submitRequest({ accountType: 'CHECKING', currency: 'RSD' })).rejects.toThrow(
        'Request failed'
      );
    });
  });
});
