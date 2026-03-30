import { ProfessionalVerificationStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';
import type { PortfolioItem } from '@shared-types';

export interface ProfessionalItem {
  _id: string;
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  verified: boolean;
  address: string;
  verificationStatus: ProfessionalVerificationStatus;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  portfolio: PortfolioItem[];
  createdAt?: string;
  updatedAt?: string;
}

type ProfessionalApi = Omit<ProfessionalItem, 'id' | 'portfolio'> & {
  portfolio?: PortfolioItem[];
};

type UpdateMyProfessionalPayload = {
  businessName?: string;
  description?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
};

type AddPortfolioItemPayload = {
  imageFile: File;
  title?: string;
  description?: string;
};

type UpdateVerificationPayload = {
  verificationStatus: ProfessionalVerificationStatus;
};

const getApiOrigin = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  return apiUrl.replace(/\/api\/?$/, '');
};

const toAbsoluteImageUrl = (value?: string | null) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

const normalizePortfolio = (portfolio?: PortfolioItem[]): PortfolioItem[] =>
  (portfolio ?? []).map((item) => ({
    ...item,
    images: (item.images ?? []).map((image) => toAbsoluteImageUrl(image)),
  }));

const normalizeProfessional = (item: ProfessionalApi): ProfessionalItem => ({
  ...item,
  id: item._id,
  portfolio: normalizePortfolio(item.portfolio),
});

export const professionalsService = {
  async getAll(): Promise<ProfessionalItem[]> {
    const { data } = await apiClient.get<ProfessionalApi[]>('/professionals');
    return data.map(normalizeProfessional);
  },

  async getById(professionalId: string): Promise<ProfessionalItem> {
    const { data } = await apiClient.get<ProfessionalApi>(`/professionals/${professionalId}`);

    return normalizeProfessional(data);
  },

  async getMe(): Promise<ProfessionalItem> {
    const { data } = await apiClient.get<ProfessionalApi>('/professionals/me');
    return normalizeProfessional(data);
  },

  async updateMe(payload: UpdateMyProfessionalPayload): Promise<ProfessionalItem> {
    const { data } = await apiClient.patch<ProfessionalApi>('/professionals/me', payload);
    return normalizeProfessional(data);
  },

  async addPortfolioItem(payload: AddPortfolioItemPayload): Promise<ProfessionalItem> {
    const formData = new FormData();
    formData.append('image', payload.imageFile);

    if (payload.title?.trim()) {
      formData.append('title', payload.title.trim());
    }

    if (payload.description?.trim()) {
      formData.append('description', payload.description.trim());
    }

    const { data } = await apiClient.patch<ProfessionalApi>(
      '/professionals/me/portfolio',
      formData,
    );

    return normalizeProfessional(data);
  },

  async removePortfolioItem(portfolioItemId: string): Promise<ProfessionalItem> {
    const { data } = await apiClient.delete<ProfessionalApi>(
      `/professionals/me/portfolio/${portfolioItemId}`,
    );

    return normalizeProfessional(data);
  },

  async updateVerification(
    professionalId: string,
    payload: UpdateVerificationPayload,
  ): Promise<ProfessionalItem> {
    const { data } = await apiClient.patch<ProfessionalApi>(
      `/professionals/${professionalId}/verification`,
      payload,
    );

    return normalizeProfessional(data);
  },
};
