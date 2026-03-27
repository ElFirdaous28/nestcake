import apiClient from '@/src/lib/axios';

type CategoryApi = {
  _id?: string;
  id?: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = {
  name: string;
};

const normalizeCategory = (category: CategoryApi): Category => ({
  id: category.id ?? category._id ?? '',
  name: category.name,
});

export const categoriesService = {
  async getAll() {
    const { data } = await apiClient.get<CategoryApi[]>('/categories');
    return data.map(normalizeCategory);
  },

  async create(payload: CreateCategoryPayload) {
    const { data } = await apiClient.post<CategoryApi>('/categories', payload);
    return normalizeCategory(data);
  },

  async update(id: string, payload: UpdateCategoryPayload) {
    const { data } = await apiClient.patch<CategoryApi>(`/categories/${id}`, payload);
    return normalizeCategory(data);
  },

  async remove(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },
};
