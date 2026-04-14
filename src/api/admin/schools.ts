import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { SchoolAttributes } from '../../types/school';

export const schoolsApi = {
  list: (page: number = 1): Promise<JsonApiCollectionResponse<SchoolAttributes, 'school'>> => {
    return apiFetch(`/admin/schools?page[number]=${page}`);
  },

  get: (id: string): Promise<JsonApiResponse<SchoolAttributes, 'school'>> => {
    return apiFetch(`/admin/schools/${id}`);
  },

  create: (data: Partial<SchoolAttributes>): Promise<JsonApiResponse<SchoolAttributes, 'school'>> => {
    return apiFetch('/admin/schools', {
      method: 'POST',
      body: JSON.stringify({ school: data }),
    });
  },

  update: (id: string, data: Partial<SchoolAttributes>): Promise<JsonApiResponse<SchoolAttributes, 'school'>> => {
    return apiFetch(`/admin/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ school: data }),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiFetch(`/admin/schools/${id}`, { method: 'DELETE' });
  },
};
