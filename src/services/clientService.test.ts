import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { clientService } from './clientService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('clientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== getAll ====================

  describe('getAll', () => {
    it('should fetch clients and map phone field', async () => {
      const mockResponse = {
        content: [
          { id: 1, firstName: 'Marko', lastName: 'Petrovic', phone: '0601234567' },
          { id: 2, firstName: 'Jovan', lastName: 'Jovic', phoneNumber: '0609876543' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0,
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await clientService.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/clients', { params: expect.any(URLSearchParams) });
      expect(result.content).toHaveLength(2);
      expect(result.content[0].phoneNumber).toBe('0601234567');
      expect(result.content[1].phoneNumber).toBe('0609876543');
    });

    it('should pass all filters', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await clientService.getAll({
        firstName: 'Marko',
        lastName: 'Petrovic',
        email: 'marko@banka.rs',
        page: 1,
        limit: 10,
      });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('firstName')).toBe('Marko');
      expect(params.get('lastName')).toBe('Petrovic');
      expect(params.get('email')).toBe('marko@banka.rs');
      expect(params.get('page')).toBe('1');
      expect(params.get('limit')).toBe('10');
    });

    it('should omit undefined filters', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await clientService.getAll({ firstName: 'Marko' });

      const params = mockedApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.get('firstName')).toBe('Marko');
      expect(params.get('lastName')).toBeNull();
      expect(params.get('email')).toBeNull();
    });

    it('should handle null content gracefully', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: null, totalElements: 0 } });

      const result = await clientService.getAll();

      expect(result.content).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Forbidden'));
      await expect(clientService.getAll()).rejects.toThrow('Forbidden');
    });
  });

  // ==================== getById ====================

  describe('getById', () => {
    it('should fetch client by id and map phone', async () => {
      const backendClient = { id: 5, firstName: 'Elena', lastName: 'Markovic', phone: '0607777777' };
      mockedApi.get.mockResolvedValue({ data: backendClient });

      const result = await clientService.getById(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/clients/5');
      expect(result.phoneNumber).toBe('0607777777');
    });

    it('should prefer phoneNumber over phone', async () => {
      const backendClient = { id: 5, phoneNumber: '111', phone: '222' };
      mockedApi.get.mockResolvedValue({ data: backendClient });

      const result = await clientService.getById(5);

      expect(result.phoneNumber).toBe('111');
    });

    it('should handle missing phone fields', async () => {
      const backendClient = { id: 5, firstName: 'Test' };
      mockedApi.get.mockResolvedValue({ data: backendClient });

      const result = await clientService.getById(5);

      expect(result.phoneNumber).toBe('');
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));
      await expect(clientService.getById(999)).rejects.toThrow('Not found');
    });
  });

  // ==================== create ====================

  describe('create', () => {
    it('should create client and map phoneNumber to phone', async () => {
      const clientData = {
        firstName: 'Novi',
        lastName: 'Klijent',
        email: 'novi@banka.rs',
        phoneNumber: '0601111111',
        password: 'Test12345',
      };
      const backendResponse = { id: 10, ...clientData, phone: '0601111111' };
      mockedApi.post.mockResolvedValue({ data: backendResponse });

      const result = await clientService.create(clientData);

      expect(mockedApi.post).toHaveBeenCalledWith('/clients', expect.objectContaining({
        phone: '0601111111',
      }));
      expect(result.phoneNumber).toBe('0601111111');
    });

    it('should propagate errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Validation error'));
      await expect(clientService.create({ firstName: '' })).rejects.toThrow('Validation error');
    });
  });

  // ==================== update ====================

  describe('update', () => {
    it('should update client and map phoneNumber to phone', async () => {
      const updateData = { phoneNumber: '0602222222', firstName: 'Updated' };
      const backendResponse = { id: 5, firstName: 'Updated', phone: '0602222222' };
      mockedApi.put.mockResolvedValue({ data: backendResponse });

      const result = await clientService.update(5, updateData);

      expect(mockedApi.put).toHaveBeenCalledWith('/clients/5', expect.objectContaining({
        phone: '0602222222',
      }));
      expect(result.phoneNumber).toBe('0602222222');
    });

    it('should propagate errors', async () => {
      mockedApi.put.mockRejectedValue(new Error('Update failed'));
      await expect(clientService.update(5, { firstName: '' })).rejects.toThrow('Update failed');
    });
  });
});
