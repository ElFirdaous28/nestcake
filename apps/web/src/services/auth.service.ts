import { UserRole, type AuthUser } from '@shared-types';
import apiClient from '@/src/lib/axios';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};

export type RegisterProfessionalPayload = RegisterUserPayload & {
  businessName: string;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

type MeResponse = {
  _id: string;
  email: string;
  role: UserRole;
};

const TOKEN_STORAGE_KEY = 'token';

const storeAccessToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const saveAuthResponse = (response: AuthResponse) => {
  storeAccessToken(response.accessToken);
  return response;
};

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return saveAuthResponse(data);
  },

  async registerUser(payload: RegisterUserPayload) {
    const { data } = await apiClient.post<AuthResponse>('/auth/register/user', payload);
    return saveAuthResponse(data);
  },

  async registerProfessional(payload: RegisterProfessionalPayload) {
    const { data } = await apiClient.post<AuthResponse>('/auth/register/professional', payload);
    return saveAuthResponse(data);
  },

  async refresh() {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh');
    return saveAuthResponse(data);
  },

  async logout() {
    await apiClient.post('/auth/logout');
    clearAccessToken();
  },

  async getMe() {
    const { data } = await apiClient.get<MeResponse>('/auth/me');
    return {
      sub: data._id,
      email: data.email,
      role: data.role,
    } satisfies AuthUser;
  },
};
