import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { ClassroomAttributes } from '../../types/classroom';

export const classroomsApi = {
  list: (page: number = 1, schoolId?: string): Promise<JsonApiCollectionResponse<ClassroomAttributes, 'classroom'>> => {
    let url = `/admin/classrooms?page[number]=${page}`;
    if (schoolId) url += `&school_id=${schoolId}`;
    return apiFetch(url);
  },

  get: (id: string): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> => {
    return apiFetch(`/admin/classrooms/${id}`);
  },

  create: (data: Partial<ClassroomAttributes>): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> => {
    return apiFetch('/admin/classrooms', {
      method: 'POST',
      body: JSON.stringify({ classroom: data }),
    });
  },

  update: (id: string, data: Partial<ClassroomAttributes>): Promise<JsonApiResponse<ClassroomAttributes, 'classroom'>> => {
    return apiFetch(`/admin/classrooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ classroom: data }),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiFetch(`/admin/classrooms/${id}`, { method: 'DELETE' });
  },
};
