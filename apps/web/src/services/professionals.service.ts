import { ProfessionalVerificationStatus } from '@shared-types';
import apiClient from '@/src/lib/axios';

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
	createdAt?: string;
	updatedAt?: string;
}

type UpdateVerificationPayload = {
	verificationStatus: ProfessionalVerificationStatus;
};

const normalizeProfessional = (item: ProfessionalItem): ProfessionalItem => ({
	...item,
	id: item._id,
});

export const professionalsService = {
	async getAll(): Promise<ProfessionalItem[]> {
		const { data } = await apiClient.get<ProfessionalItem[]>('/professionals');
		return data.map(normalizeProfessional);
	},

	async updateVerification(
		professionalId: string,
		payload: UpdateVerificationPayload,
	): Promise<ProfessionalItem> {
		const { data } = await apiClient.patch<ProfessionalItem>(
			`/professionals/${professionalId}/verification`,
			payload,
		);

		return normalizeProfessional(data);
	},
};
