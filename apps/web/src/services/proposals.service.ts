import { ProposalStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';

type ProposalProfessionalSummary = {
  _id: string;
  userId?: string;
  businessName?: string;
  description?: string;
  verified?: boolean;
  address?: string;
};

type ProposalRequestSummary = {
  _id: string;
  title?: string;
  description?: string;
};

type ProposalApi = {
  _id: string;
  id?: string;
  requestId: string | ProposalRequestSummary;
  professionalId: string | ProposalProfessionalSummary;
  price: number;
  message?: string;
  deliveryDateTime?: string;
  status: ProposalStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ProposalItem = {
  id: string;
  requestId: string | ProposalRequestSummary;
  professionalId: string | ProposalProfessionalSummary;
  price: number;
  message?: string;
  deliveryDateTime?: string;
  status: ProposalStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProposalPayload = {
  requestId: string;
  price: number;
  message?: string;
  deliveryDateTime?: string;
};

export type AcceptedProposalOrder = {
  _id: string;
  id?: string;
  totalPrice?: number;
};

const normalizeProposal = (item: ProposalApi): ProposalItem => ({
  id: item.id ?? item._id,
  requestId: item.requestId,
  professionalId: item.professionalId,
  price: item.price,
  message: item.message,
  deliveryDateTime: item.deliveryDateTime,
  status: item.status,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const proposalsService = {
  async create(payload: CreateProposalPayload): Promise<ProposalItem> {
    const { data } = await apiClient.post<ProposalApi>('/proposals', payload);
    return normalizeProposal(data);
  },

  async getMy(): Promise<ProposalItem[]> {
    const { data } = await apiClient.get<ProposalApi[]>('/proposals/my');
    return data.map(normalizeProposal);
  },

  async getByRequest(requestId: string): Promise<ProposalItem[]> {
    const { data } = await apiClient.get<ProposalApi[]>(`/proposals/request/${requestId}`);
    return data.map(normalizeProposal);
  },

  async accept(proposalId: string): Promise<AcceptedProposalOrder> {
    const { data } = await apiClient.patch<AcceptedProposalOrder>(
      `/proposals/${proposalId}/accept`,
    );
    return data;
  },
};
