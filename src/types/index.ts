// ============================================================
// Tipovi za Banka 2025 - Celina 1: Upravljanje korisnicima
// ============================================================

export const Permission = {
  ADMIN: 'ADMIN',
  TRADE_STOCKS: 'TRADE_STOCKS',
  VIEW_STOCKS: 'VIEW_STOCKS',
  CREATE_CONTRACTS: 'CREATE_CONTRACTS',
  CREATE_INSURANCE: 'CREATE_INSURANCE',
  SUPERVISOR: 'SUPERVISOR',
  AGENT: 'AGENT',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  position: string;
  phoneNumber: string;
  isActive: boolean;
  permissions: Permission[];
  jmbg: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  department: string;
  role: string;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  jmbg: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Employee;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  position: string;
  phoneNumber: string;
  isActive: boolean;
  permissions: Permission[];
  jmbg: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  department: string;
  role: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  phoneNumber?: string;
  isActive?: boolean;
  jmbg?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  department?: string;
  role?: string;
}

export interface ActivateAccountRequest {
  token: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface EmployeeFilters {
  email?: string;
  name?: string;
  position?: string;
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  permissions: Permission[];
}
