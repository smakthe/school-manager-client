import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { TeacherAttributes } from '../../types/teacher';

export const teachersApi = {
  list: (page: number = 1, schoolId?: string): Promise<JsonApiCollectionResponse<TeacherAttributes, 'teacher'>> => {
    let url = `/admin/teachers?page[number]=${page}`;
    if (schoolId) url += `&school_id=${schoolId}`;
    return apiFetch(url);
  },

  get: (id: string): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> => {
    return apiFetch(`/admin/teachers/${id}`);
  },

  create: (data: any): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> => {
    return apiFetch('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({ teacher: data }),
    });
  },

  update: (id: string, data: Partial<TeacherAttributes>): Promise<JsonApiResponse<TeacherAttributes, 'teacher'>> => {
    return apiFetch(`/admin/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ teacher: data }),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiFetch(`/admin/teachers/${id}`, { method: 'DELETE' });
  },
};
