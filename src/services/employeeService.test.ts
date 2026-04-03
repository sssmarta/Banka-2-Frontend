import { employeeService } from './employeeService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

const backendEmployee = {
  id: 1,
  firstName: 'Marko',
  lastName: 'Petrovic',
  username: 'marko.p',
  email: 'marko@banka.rs',
  position: 'Developer',
  phone: '+381641234567',
  active: true,
  permissions: ['ADMIN'],
  address: 'Bulevar 1',
  dateOfBirth: '1990-01-01',
  gender: 'M',
  department: 'IT',
};

const frontendEmployee = {
  id: 1,
  firstName: 'Marko',
  lastName: 'Petrovic',
  username: 'marko.p',
  email: 'marko@banka.rs',
  position: 'Developer',
  phoneNumber: '+381641234567',
  isActive: true,
  permissions: ['ADMIN'],
  address: 'Bulevar 1',
  dateOfBirth: '1990-01-01',
  gender: 'M',
  department: 'IT',
};

describe('employeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches employees and maps from backend format', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          content: [backendEmployee],
          totalElements: 1,
          totalPages: 1,
          size: 10,
          number: 0,
        },
      });

      const result = await employeeService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/employees', { params: expect.any(URLSearchParams) });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].phoneNumber).toBe('+381641234567');
      expect(result.content[0].isActive).toBe(true);
      // Ensure backend fields are mapped
      expect((result.content[0] as Record<string, unknown>).phone).toBeUndefined();
    });

    it('passes filters as query params', async () => {
      mockApi.get.mockResolvedValue({
        data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
      });

      await employeeService.getAll({
        email: 'test@banka.rs',
        firstName: 'Marko',
        lastName: 'Petrovic',
        position: 'Dev',
        page: 0,
        limit: 10,
      });

      const callArgs = mockApi.get.mock.calls[0];
      const params = callArgs[1]?.params as URLSearchParams;
      expect(params.get('email')).toBe('test@banka.rs');
      expect(params.get('firstName')).toBe('Marko');
      expect(params.get('lastName')).toBe('Petrovic');
      expect(params.get('position')).toBe('Dev');
      expect(params.get('page')).toBe('0');
      expect(params.get('limit')).toBe('10');
    });

    it('omits empty filters', async () => {
      mockApi.get.mockResolvedValue({
        data: { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 },
      });

      await employeeService.getAll({});

      const params = mockApi.get.mock.calls[0][1]?.params as URLSearchParams;
      expect(params.toString()).toBe('');
    });
  });

  describe('getById', () => {
    it('fetches employee by ID and maps from backend', async () => {
      mockApi.get.mockResolvedValue({ data: backendEmployee });

      const result = await employeeService.getById(1);

      expect(mockApi.get).toHaveBeenCalledWith('/employees/1');
      expect(result.phoneNumber).toBe('+381641234567');
      expect(result.isActive).toBe(true);
    });

    it('handles missing phone (maps to empty string)', async () => {
      mockApi.get.mockResolvedValue({ data: { ...backendEmployee, phone: '' } });

      const result = await employeeService.getById(1);
      expect(result.phoneNumber).toBe('');
    });
  });

  describe('create', () => {
    it('maps FE format to BE format and sends POST', async () => {
      mockApi.post.mockResolvedValue({ data: backendEmployee });

      const result = await employeeService.create({
        firstName: 'Marko',
        lastName: 'Petrovic',
        username: 'marko.p',
        email: 'marko@banka.rs',
        position: 'Developer',
        phoneNumber: '+381641234567',
        isActive: true,
        permissions: ['ADMIN'],
        address: 'Bulevar 1',
        dateOfBirth: '1990-01-01',
        gender: 'M',
        department: 'IT',
      });

      // Verify backend format was sent
      const sentData = mockApi.post.mock.calls[0][1] as Record<string, unknown>;
      expect(sentData.phone).toBe('+381641234567');
      expect(sentData.active).toBe(true);
      expect(sentData.phoneNumber).toBeUndefined();
      expect(sentData.isActive).toBeUndefined();

      // Verify response is mapped back to FE format
      expect(result).toEqual(frontendEmployee);
    });
  });

  describe('update', () => {
    it('maps FE format to BE format and sends PUT', async () => {
      mockApi.put.mockResolvedValue({ data: backendEmployee });

      await employeeService.update(1, {
        firstName: 'Marko',
        phoneNumber: '+381641234567',
        isActive: false,
      });

      expect(mockApi.put).toHaveBeenCalledWith('/employees/1', expect.objectContaining({
        phone: '+381641234567',
        active: false,
      }));
    });
  });

  describe('deactivate', () => {
    it('sends PATCH to deactivate endpoint', async () => {
      mockApi.patch.mockResolvedValue({ data: undefined });

      await employeeService.deactivate(1);

      expect(mockApi.patch).toHaveBeenCalledWith('/employees/1/deactivate');
    });
  });
});
