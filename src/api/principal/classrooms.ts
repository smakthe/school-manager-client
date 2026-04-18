import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { ClassroomAttributes } from '../../types/classroom';

export const principalClassroomsApi = {
  list: (page: number = 1): Promise<JsonApiCollectionResponse<ClassroomAttributes, 'classroom'>> =>
    apiFetch(`/principal/classrooms?page[number]=${page}`),

  get: (id: string): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> =>
    apiFetch(`/principal/classrooms/${id}`),

  create: (data: Partial<ClassroomAttributes>): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> =>
    apiFetch('/principal/classrooms', {
      method: 'POST',
      body: JSON.stringify({ classroom: data }),
    }),

  update: (id: string, data: Partial<ClassroomAttributes>): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> =>
    apiFetch(`/principal/classrooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ classroom: data }),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/principal/classrooms/${id}`, { method: 'DELETE' }),
};
