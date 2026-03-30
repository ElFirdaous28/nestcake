import { UserRole } from '@shared-types';
import apiClient from '@/src/lib/axios';

export interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    skip: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const usersService = {
  async getAll(params?: {
    search?: string;
    role?: string;
    skip?: number;
    limit?: number;
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.skip !== undefined) queryParams.append('skip', String(params.skip));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));

    const { data } = await apiClient.get<UsersResponse>(`/users?${queryParams.toString()}`);

    return {
      ...data,
      data: data.data.map((user) => ({
        ...user,
        id: user._id,
      })),
    };
  },
};
