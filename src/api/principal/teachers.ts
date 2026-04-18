import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { TeacherAttributes } from '../../types/teacher';

export const principalTeachersApi = {
  list: (page: number = 1): Promise<JsonApiCollectionResponse<TeacherAttributes, 'teacher'>> =>
    apiFetch(`/principal/teachers?page[number]=${page}`),

  get: (id: string): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> =>
    apiFetch(`/principal/teachers/${id}`),

  create: (data: any): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> =>
    apiFetch('/principal/teachers', {
      method: 'POST',
      body: JSON.stringify({ teacher: data }),
    }),

  update: (id: string, data: Partial<TeacherAttributes>): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> =>
    apiFetch(`/principal/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ teacher: data }),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/principal/teachers/${id}`, { method: 'DELETE' }),
};
