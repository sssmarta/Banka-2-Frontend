import api from './api';
import type { Order, CreateOrderRequest, PaginatedResponse } from '../types/celina3';

const orderService = {
  /**
   * POST /orders
   * Kreiranje BUY ili SELL ordera.
   */
  create: async (request: CreateOrderRequest): Promise<Order> => {
    const response = await api.post('/orders', request);
    return response.data;
  },

  /**
   * GET /orders?status=ALL&page=0&size=20
   * Supervizor: lista svih ordera sa filtriranjem po statusu.
   */
  getAll: async (
    status: string = 'ALL',
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/orders', {
      params: { status, page, size },
    });
    return response.data;
  },

  /**
   * GET /orders/my?page=0&size=20
   * Korisnik: moji orderi.
   */
  getMy: async (page: number = 0, size: number = 20): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/orders/my', {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * GET /orders/{id}
   * Detalji jednog ordera.
   */
  getById: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * PATCH /orders/{id}/approve
   * Supervizor odobrava order.
   */
  approve: async (id: number): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/approve`);
    return response.data;
  },

  /**
   * PATCH /orders/{id}/decline
   * Supervizor odbija order.
   */
  decline: async (id: number): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/decline`);
    return response.data;
  },
};

export default orderService;
