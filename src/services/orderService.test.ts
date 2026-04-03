import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import orderService from './orderService';

vi.mock('./api');
const mockedApi = vi.mocked(api);

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== create ====================

  describe('create', () => {
    it('should create a BUY order', async () => {
      const request = {
        listingId: 42,
        orderType: 'MARKET',
        quantity: 10,
        direction: 'BUY',
        allOrNone: false,
        margin: false,
        accountId: 1,
      };
      const created = { id: 100, ...request, status: 'PENDING', createdAt: '2026-03-15' };
      mockedApi.post.mockResolvedValue({ data: created });

      const result = await orderService.create(request);

      expect(mockedApi.post).toHaveBeenCalledWith('/orders', request);
      expect(result).toEqual(created);
    });

    it('should create a SELL LIMIT order with limit and stop values', async () => {
      const request = {
        listingId: 42,
        orderType: 'STOP_LIMIT',
        quantity: 5,
        direction: 'SELL',
        limitValue: 180.0,
        stopValue: 170.0,
        allOrNone: true,
        margin: true,
        accountId: 2,
      };
      mockedApi.post.mockResolvedValue({ data: { id: 101, ...request, status: 'PENDING' } });

      const result = await orderService.create(request);

      expect(mockedApi.post).toHaveBeenCalledWith('/orders', request);
      expect(result.id).toBe(101);
    });

    it('should propagate errors', async () => {
      mockedApi.post.mockRejectedValue(new Error('Insufficient funds'));
      await expect(
        orderService.create({
          listingId: 1,
          orderType: 'MARKET',
          quantity: 1,
          direction: 'BUY',
          allOrNone: false,
          margin: false,
          accountId: 1,
        })
      ).rejects.toThrow('Insufficient funds');
    });
  });

  // ==================== getAll ====================

  describe('getAll', () => {
    it('should fetch all orders with default params', async () => {
      const mockResponse = {
        content: [{ id: 1, status: 'PENDING' }],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await orderService.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/orders', {
        params: { status: 'ALL', page: 0, size: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass custom status and pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await orderService.getAll('PENDING', 2, 10);

      expect(mockedApi.get).toHaveBeenCalledWith('/orders', {
        params: { status: 'PENDING', page: 2, size: 10 },
      });
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Forbidden'));
      await expect(orderService.getAll()).rejects.toThrow('Forbidden');
    });
  });

  // ==================== getMy ====================

  describe('getMy', () => {
    it('should fetch my orders with default params', async () => {
      const mockResponse = {
        content: [{ id: 5, status: 'DONE' }],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0,
      };
      mockedApi.get.mockResolvedValue({ data: mockResponse });

      const result = await orderService.getMy();

      expect(mockedApi.get).toHaveBeenCalledWith('/orders/my', {
        params: { page: 0, size: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass custom pagination', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await orderService.getMy(3, 5);

      expect(mockedApi.get).toHaveBeenCalledWith('/orders/my', {
        params: { page: 3, size: 5 },
      });
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Unauthorized'));
      await expect(orderService.getMy()).rejects.toThrow('Unauthorized');
    });
  });

  // ==================== getById ====================

  describe('getById', () => {
    it('should fetch order by id', async () => {
      const order = { id: 100, listingTicker: 'AAPL', quantity: 10, status: 'APPROVED' };
      mockedApi.get.mockResolvedValue({ data: order });

      const result = await orderService.getById(100);

      expect(mockedApi.get).toHaveBeenCalledWith('/orders/100');
      expect(result).toEqual(order);
    });

    it('should propagate errors', async () => {
      mockedApi.get.mockRejectedValue(new Error('Not found'));
      await expect(orderService.getById(999)).rejects.toThrow('Not found');
    });
  });

  // ==================== approve ====================

  describe('approve', () => {
    it('should approve an order', async () => {
      const approved = { id: 100, status: 'APPROVED' };
      mockedApi.patch.mockResolvedValue({ data: approved });

      const result = await orderService.approve(100);

      expect(mockedApi.patch).toHaveBeenCalledWith('/orders/100/approve');
      expect(result).toEqual(approved);
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Approval failed'));
      await expect(orderService.approve(999)).rejects.toThrow('Approval failed');
    });
  });

  // ==================== decline ====================

  describe('decline', () => {
    it('should decline an order', async () => {
      const declined = { id: 100, status: 'DECLINED' };
      mockedApi.patch.mockResolvedValue({ data: declined });

      const result = await orderService.decline(100);

      expect(mockedApi.patch).toHaveBeenCalledWith('/orders/100/decline');
      expect(result).toEqual(declined);
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Decline failed'));
      await expect(orderService.decline(999)).rejects.toThrow('Decline failed');
    });
  });

  // ==================== cancelOrder ====================

  describe('cancelOrder', () => {
    it('should cancel an order using decline endpoint', async () => {
      const cancelled = { id: 100, status: 'DECLINED' };
      mockedApi.patch.mockResolvedValue({ data: cancelled });

      const result = await orderService.cancelOrder(100);

      expect(mockedApi.patch).toHaveBeenCalledWith('/orders/100/decline');
      expect(result).toEqual(cancelled);
    });

    it('should propagate errors', async () => {
      mockedApi.patch.mockRejectedValue(new Error('Cancel failed'));
      await expect(orderService.cancelOrder(999)).rejects.toThrow('Cancel failed');
    });
  });
});
