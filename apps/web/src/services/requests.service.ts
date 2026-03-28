import { DeliveryType, RequestStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';

type RequestClientSummary = {
	_id: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
	email?: string;
	phone?: string;
};

type AllergySummary = {
	_id: string;
	name?: string;
};

type RequestApi = {
	_id: string;
	id?: string;
	clientId: string | RequestClientSummary;
	title: string;
	description: string;
	eventType?: string;
	budget?: number;
	deliveryDateTime: string;
	deliveryType: DeliveryType;
	location?: string;
	allergyIds: (string | AllergySummary)[];
	images: string[];
	status: RequestStatus;
	createdAt?: string;
	updatedAt?: string;
};

export type RequestItem = {
	id: string;
	clientId: string | RequestClientSummary;
	title: string;
	description: string;
	eventType?: string;
	budget?: number;
	deliveryDateTime: string;
	deliveryType: DeliveryType;
	location?: string;
	allergyIds: (string | AllergySummary)[];
	images: string[];
	status: RequestStatus;
	createdAt?: string;
	updatedAt?: string;
};

export type RequestsResponse = {
	data: RequestItem[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
};

export type CreateRequestPayload = {
	title: string;
	description: string;
	eventType?: string;
	budget?: number;
	deliveryDateTime: string;
	deliveryType: DeliveryType;
	location?: string;
	allergyIds?: string[];
	imageFile?: File;
};

const getApiOrigin = () => {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
	return apiUrl.replace(/\/api\/?$/, '');
};

const toAbsoluteImageUrl = (value?: string) => {
	if (!value) {
		return value;
	}

	if (/^https?:\/\//i.test(value)) {
		return value;
	}

	const normalizedPath = value.startsWith('/') ? value : `/${value}`;
	return `${getApiOrigin()}${normalizedPath}`;
};

const normalizeRequest = (item: RequestApi): RequestItem => ({
	id: item.id ?? item._id,
	clientId: item.clientId,
	title: item.title,
	description: item.description,
	eventType: item.eventType,
	budget: item.budget,
	deliveryDateTime: item.deliveryDateTime,
	deliveryType: item.deliveryType,
	location: item.location,
	allergyIds: item.allergyIds,
	images: (item.images ?? []).map((image) => toAbsoluteImageUrl(image) ?? ''),
	status: item.status,
	createdAt: item.createdAt,
	updatedAt: item.updatedAt,
});

const buildQuery = (params?: { page?: number; limit?: number; search?: string }) => {
	const query = new URLSearchParams();

	if (params?.page) {
		query.append('page', String(params.page));
	}

	if (params?.limit) {
		query.append('limit', String(params.limit));
	}

	if (params?.search?.trim()) {
		query.append('search', params.search.trim());
	}

	return query.toString();
};

export const requestsService = {
	async getOpen(params?: { page?: number; limit?: number; search?: string }): Promise<RequestsResponse> {
		const suffix = buildQuery(params);
		const endpoint = suffix ? `/requests?${suffix}` : '/requests';

		const { data } = await apiClient.get<{
			data: RequestApi[];
			pagination: RequestsResponse['pagination'];
		}>(endpoint);

		return {
			data: data.data.map(normalizeRequest),
			pagination: data.pagination,
		};
	},

	async getMine(params?: { page?: number; limit?: number }): Promise<RequestsResponse> {
		const suffix = buildQuery(params);
		const endpoint = suffix ? `/requests/my-requests?${suffix}` : '/requests/my-requests';

		const { data } = await apiClient.get<{
			data: RequestApi[];
			pagination: RequestsResponse['pagination'];
		}>(endpoint);

		return {
			data: data.data.map(normalizeRequest),
			pagination: data.pagination,
		};
	},

	async getById(requestId: string): Promise<RequestItem | null> {
		const { data } = await apiClient.get<RequestApi | null>(`/requests/${requestId}`);
		return data ? normalizeRequest(data) : null;
	},

	async create(payload: CreateRequestPayload): Promise<RequestItem> {
		const formData = new FormData();

		formData.append('title', payload.title.trim());
		formData.append('description', payload.description.trim());
		formData.append('deliveryDateTime', payload.deliveryDateTime);
		formData.append('deliveryType', payload.deliveryType);

		if (payload.eventType?.trim()) {
			formData.append('eventType', payload.eventType.trim());
		}

		if (
			payload.budget !== undefined &&
			Number.isFinite(payload.budget) &&
			payload.budget >= 0
		) {
			formData.append('budget', String(payload.budget));
		}

		if (payload.location?.trim()) {
			formData.append('location', payload.location.trim());
		}

		(payload.allergyIds ?? []).forEach((id) => formData.append('allergyIds', id));

		if (payload.imageFile) {
			formData.append('image', payload.imageFile);
		}

		const { data } = await apiClient.post<RequestApi>('/requests', formData);
		return normalizeRequest(data);
	},

	async updateStatus(requestId: string, status: RequestStatus): Promise<RequestItem> {
		const { data } = await apiClient.patch<RequestApi>(`/requests/${requestId}/status`, {
			status,
		});

		return normalizeRequest(data);
	},
};
