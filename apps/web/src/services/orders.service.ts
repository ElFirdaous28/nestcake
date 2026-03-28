import { OrderStatus, OrderType } from '@shared-types';
import apiClient from '@/src/lib/axios';

type OrderUserSummary = {
	_id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	avatar?: string;
};

type OrderProfessionalSummary = {
	_id: string;
	businessName?: string;
	verified?: boolean;
};

type OrderProductSummary = {
	_id: string;
	name?: string;
	price?: number;
	isAvailable?: boolean;
};

type OrderItemApi = {
	productId: string | OrderProductSummary;
	quantity: number;
	unitPrice: number;
};

type OrderApi = {
	_id: string;
	id?: string;
	clientId: string | OrderUserSummary;
	professionalId: string | OrderProfessionalSummary;
	type: OrderType;
	totalPrice: number;
	status: OrderStatus;
	items: OrderItemApi[];
	createdAt?: string;
	updatedAt?: string;
};

export type OrderItem = {
	productId: string | OrderProductSummary;
	quantity: number;
	unitPrice: number;
};

export type OrderRecord = {
	id: string;
	clientId: string | OrderUserSummary;
	professionalId: string | OrderProfessionalSummary;
	type: OrderType;
	totalPrice: number;
	status: OrderStatus;
	items: OrderItem[];
	createdAt?: string;
	updatedAt?: string;
};

export type OrdersResponse = {
	data: OrderRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
};

export type CreateDirectOrderPayload = {
	items: {
		productId: string;
		quantity: number;
	}[];
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

const normalizeOrder = (item: OrderApi): OrderRecord => ({
	id: item.id ?? item._id,
	clientId:
		typeof item.clientId === 'string'
			? item.clientId
			: {
					...item.clientId,
					avatar: toAbsoluteImageUrl(item.clientId.avatar),
				},
	professionalId: item.professionalId,
	type: item.type,
	totalPrice: item.totalPrice,
	status: item.status,
	items: item.items,
	createdAt: item.createdAt,
	updatedAt: item.updatedAt,
});

const buildOrdersQuery = (params?: {
	page?: number;
	limit?: number;
	status?: OrderStatus;
}) => {
	const query = new URLSearchParams();

	if (params?.page) {
		query.append('page', String(params.page));
	}

	if (params?.limit) {
		query.append('limit', String(params.limit));
	}

	if (params?.status) {
		query.append('status', params.status);
	}

	return query.toString();
};

const fetchOrders = async (
	endpointBase: string,
	params?: {
		page?: number;
		limit?: number;
		status?: OrderStatus;
	},
): Promise<OrdersResponse> => {
	const suffix = buildOrdersQuery(params);
	const endpoint = suffix ? `${endpointBase}?${suffix}` : endpointBase;

	const { data } = await apiClient.get<{
		data: OrderApi[];
		pagination: OrdersResponse['pagination'];
	}>(endpoint);

	return {
		data: data.data.map(normalizeOrder),
		pagination: data.pagination,
	};
};

export const ordersService = {
	async create(payload: CreateDirectOrderPayload): Promise<OrderRecord> {
		const { data } = await apiClient.post<OrderApi>('/orders', payload);
		return normalizeOrder(data);
	},

	async getForClient(params?: {
		page?: number;
		limit?: number;
		status?: OrderStatus;
	}): Promise<OrdersResponse> {
		return fetchOrders('/orders/client', params);
	},

	async getForProfessional(params?: {
		page?: number;
		limit?: number;
		status?: OrderStatus;
	}): Promise<OrdersResponse> {
		return fetchOrders('/orders/professional', params);
	},

	async markPaid(orderId: string): Promise<OrderRecord> {
		const { data } = await apiClient.patch<OrderApi>(`/orders/${orderId}/pay`);
		return normalizeOrder(data);
	},

	async markCompleted(orderId: string): Promise<OrderRecord> {
		const { data } = await apiClient.patch<OrderApi>(`/orders/${orderId}/complete`);
		return normalizeOrder(data);
	},

	async markReady(orderId: string): Promise<OrderRecord> {
		const { data } = await apiClient.patch<OrderApi>(`/orders/${orderId}/ready`);
		return normalizeOrder(data);
	},

	async reject(orderId: string): Promise<OrderRecord> {
		const { data } = await apiClient.patch<OrderApi>(`/orders/${orderId}/reject`);
		return normalizeOrder(data);
	},

	async remove(orderId: string) {
		await apiClient.delete(`/orders/${orderId}`);
	},

	async removeItem(orderId: string, productId: string) {
		await apiClient.delete(`/orders/${orderId}/items/${productId}`);
	},
};
