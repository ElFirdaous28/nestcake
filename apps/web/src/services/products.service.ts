import { ProductStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';

type ProductApi = {
  _id: string;
  id?: string;
  professionalId: string;
  name: string;
  description?: string;
  price: number;
  categoryIds: string[];
  isAvailable: boolean;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductItem = {
  id: string;
  professionalId: string;
  name: string;
  description?: string;
  price: number;
  categoryIds: string[];
  isAvailable: boolean;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductsResponse = {
  data: ProductItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const normalizeProduct = (product: ProductApi): ProductItem => ({
  id: product.id ?? product._id,
  professionalId: product.professionalId,
  name: product.name,
  description: product.description,
  price: product.price,
  categoryIds: product.categoryIds,
  isAvailable: product.isAvailable,
  status: product.status,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const productsService = {
  async getAllForAdmin(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ProductsResponse> {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);

    const suffix = query.toString();
    const endpoint = suffix ? `/products/admin?${suffix}` : '/products/admin';

    const { data } = await apiClient.get<{
      data: ProductApi[];
      pagination: ProductsResponse['pagination'];
    }>(endpoint);

    return {
      data: data.data.map(normalizeProduct),
      pagination: data.pagination,
    };
  },

  async remove(productId: string) {
    await apiClient.delete(`/products/${productId}`);
  },
};
