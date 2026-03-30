import { ProductStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';

type ProductApi = {
  _id: string;
  id?: string;
  professionalId: string;
  name: string;
  description?: string;
  price: number;
  image: string;
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
  image: string;
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

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  categoryIds: string[];
  isAvailable?: boolean;
  status?: ProductStatus;
  imageFile: File;
};

export type UpdateProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  categoryIds?: string[];
  isAvailable?: boolean;
  status?: ProductStatus;
  imageFile?: File;
};

const normalizeProduct = (product: ProductApi): ProductItem => ({
  id: product.id ?? product._id,
  professionalId: product.professionalId,
  name: product.name,
  description: product.description,
  price: product.price,
  image: product.image,
  categoryIds: product.categoryIds,
  isAvailable: product.isAvailable,
  status: product.status,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  return apiUrl.replace(/\/api\/?$/, '');
};

const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f3ede4%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2222%22 fill=%22%236b5344%22%3ENo image%3C/text%3E%3C/svg%3E';

const toAbsoluteImageUrl = (value?: string | null) => {
  if (!value || typeof value !== 'string') {
    return FALLBACK_PRODUCT_IMAGE;
  }

  if (/^https?:\/\//i.test(value)) return value;

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

const normalizeProductWithImage = (product: ProductApi): ProductItem => {
  const normalized = normalizeProduct(product);
  return {
    ...normalized,
    image: toAbsoluteImageUrl(normalized.image),
  };
};

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
      data: data.data.map(normalizeProductWithImage),
      pagination: data.pagination,
    };
  },

  async getAllForClient(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ProductsResponse> {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);

    const suffix = query.toString();
    const endpoint = suffix ? `/products?${suffix}` : '/products';

    const { data } = await apiClient.get<{
      data: ProductApi[];
      pagination: ProductsResponse['pagination'];
    }>(endpoint);

    return {
      data: data.data.map(normalizeProductWithImage),
      pagination: data.pagination,
    };
  },

  async getAllForProfessional(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ProductsResponse> {
    const query = new URLSearchParams();

    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);

    const suffix = query.toString();
    const endpoint = suffix ? `/products/professional?${suffix}` : '/products/professional';

    const { data } = await apiClient.get<{
      data: ProductApi[];
      pagination: ProductsResponse['pagination'];
    }>(endpoint);

    return {
      data: data.data.map(normalizeProductWithImage),
      pagination: data.pagination,
    };
  },

  async getById(productId: string): Promise<ProductItem> {
    const { data } = await apiClient.get<ProductApi>(`/products/${productId}`);
    return normalizeProductWithImage(data);
  },

  async create(payload: CreateProductPayload): Promise<ProductItem> {
    const formData = new FormData();

    formData.append('name', payload.name);
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('price', String(payload.price));
    payload.categoryIds.forEach((id) => formData.append('categoryIds', id));

    if (payload.isAvailable !== undefined) {
      formData.append('isAvailable', String(payload.isAvailable));
    }

    if (payload.status) {
      formData.append('status', payload.status);
    }

    formData.append('image', payload.imageFile);

    const { data } = await apiClient.post<ProductApi>('/products', formData);
    return normalizeProductWithImage(data);
  },

  async update(productId: string, payload: UpdateProductPayload): Promise<ProductItem> {
    const formData = new FormData();

    if (payload.name !== undefined) {
      formData.append('name', payload.name);
    }

    if (payload.description !== undefined) {
      formData.append('description', payload.description);
    }

    if (payload.price !== undefined) {
      formData.append('price', String(payload.price));
    }

    if (payload.categoryIds !== undefined) {
      payload.categoryIds.forEach((id) => formData.append('categoryIds', id));
    }

    if (payload.isAvailable !== undefined) {
      formData.append('isAvailable', String(payload.isAvailable));
    }

    if (payload.status !== undefined) {
      formData.append('status', payload.status);
    }

    if (payload.imageFile) {
      formData.append('image', payload.imageFile);
    }

    const { data } = await apiClient.patch<ProductApi>(`/products/${productId}`, formData);
    return normalizeProductWithImage(data);
  },

  async updateStatus(productId: string, status: ProductStatus): Promise<ProductItem> {
    const { data } = await apiClient.patch<ProductApi>(`/products/${productId}/status`, {
      status,
    });

    return normalizeProductWithImage(data);
  },

  async remove(productId: string) {
    await apiClient.delete(`/products/${productId}`);
  },
};
