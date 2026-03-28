import { OrderStatus, OrderType } from '@shared-types';
import apiClient from '@/src/lib/axios';

type ReviewClientSummary = {
	_id: string;
	firstName?: string;
	lastName?: string;
	avatar?: string;
};

type ReviewProfessionalSummary = {
	_id: string;
	businessName?: string;
};

type ReviewOrderSummary = {
	_id: string;
	status: OrderStatus;
	totalPrice: number;
	type: OrderType;
};

type ReviewApi = {
	_id: string;
	id?: string;
	clientId: string | ReviewClientSummary;
	professionalId: string | ReviewProfessionalSummary;
	orderId: string | ReviewOrderSummary;
	rating: number;
	comment?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type ReviewItem = {
	id: string;
	clientId: string | ReviewClientSummary;
	professionalId: string | ReviewProfessionalSummary;
	orderId: string | ReviewOrderSummary;
	rating: number;
	comment?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type ReviewsResponse = {
	data: ReviewItem[];
	summary: {
		averageRating: number;
		totalReviews: number;
	};
	pagination: {
		page: number;
		limit: number;
		total: number;
		pages: number;
	};
};

export type CreateReviewPayload = {
	orderId: string;
	rating: number;
	comment?: string;
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

const normalizeReview = (item: ReviewApi): ReviewItem => {
	const client =
		typeof item.clientId === 'string'
			? item.clientId
			: {
					...item.clientId,
					avatar: toAbsoluteImageUrl(item.clientId.avatar),
				};

	return {
		id: item.id ?? item._id,
		clientId: client,
		professionalId: item.professionalId,
		orderId: item.orderId,
		rating: item.rating,
		comment: item.comment,
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
	};
};

const buildReviewQuery = (params?: { page?: number; limit?: number }) => {
	const query = new URLSearchParams();

	if (params?.page) {
		query.append('page', String(params.page));
	}

	if (params?.limit) {
		query.append('limit', String(params.limit));
	}

	return query.toString();
};

export const reviewsService = {
	async create(payload: CreateReviewPayload): Promise<ReviewItem> {
		const { data } = await apiClient.post<ReviewApi>('/reviews', payload);
		return normalizeReview(data);
	},

	async getAll(params?: { page?: number; limit?: number }): Promise<ReviewsResponse> {
		const suffix = buildReviewQuery(params);
		const endpoint = suffix ? `/reviews?${suffix}` : '/reviews';

		const { data } = await apiClient.get<{
			data: ReviewApi[];
			summary: ReviewsResponse['summary'];
			pagination: ReviewsResponse['pagination'];
		}>(endpoint);

		return {
			data: data.data.map(normalizeReview),
			summary: data.summary,
			pagination: data.pagination,
		};
	},

	async getMyReviews(params?: { page?: number; limit?: number }): Promise<ReviewsResponse> {
		const suffix = buildReviewQuery(params);
		const endpoint = suffix ? `/reviews/my-reviews?${suffix}` : '/reviews/my-reviews';

		const { data } = await apiClient.get<{
			data: ReviewApi[];
			summary: ReviewsResponse['summary'];
			pagination: ReviewsResponse['pagination'];
		}>(endpoint);

		return {
			data: data.data.map(normalizeReview),
			summary: data.summary,
			pagination: data.pagination,
		};
	},

	async getByProfessional(
		professionalId: string,
		params?: { page?: number; limit?: number },
	): Promise<ReviewsResponse> {
		const suffix = buildReviewQuery(params);
		const endpoint = suffix
			? `/reviews/professional/${professionalId}?${suffix}`
			: `/reviews/professional/${professionalId}`;

		const { data } = await apiClient.get<{
			data: ReviewApi[];
			summary: ReviewsResponse['summary'];
			pagination: ReviewsResponse['pagination'];
		}>(endpoint);

		return {
			data: data.data.map(normalizeReview),
			summary: data.summary,
			pagination: data.pagination,
		};
	},

	async getById(reviewId: string): Promise<ReviewItem> {
		const { data } = await apiClient.get<ReviewApi>(`/reviews/${reviewId}`);
		return normalizeReview(data);
	},
};
