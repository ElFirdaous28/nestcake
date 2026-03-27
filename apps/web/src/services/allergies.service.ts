import apiClient from '@/src/lib/axios';

type AllergyApi = {
  _id?: string;
  id?: string;
  name: string;
};

export type Allergy = {
  id: string;
  name: string;
};

export type CreateAllergyPayload = {
  name: string;
};

export type UpdateAllergyPayload = {
  name: string;
};

const normalizeAllergy = (allergy: AllergyApi): Allergy => ({
  id: allergy.id ?? allergy._id ?? '',
  name: allergy.name,
});

export const allergiesService = {
  async getAll() {
    const { data } = await apiClient.get<AllergyApi[]>('/allergies');
    return data.map(normalizeAllergy);
  },

  async create(payload: CreateAllergyPayload) {
    const { data } = await apiClient.post<AllergyApi>('/allergies', payload);
    return normalizeAllergy(data);
  },

  async update(id: string, payload: UpdateAllergyPayload) {
    const { data } = await apiClient.patch<AllergyApi>(`/allergies/${id}`, payload);
    return normalizeAllergy(data);
  },

  async remove(id: string) {
    await apiClient.delete(`/allergies/${id}`);
  },
};
