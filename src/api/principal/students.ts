import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { StudentAttributes } from '../../types/student';

export const principalStudentsApi = {
  list: (page: number = 1, classroomId?: string): Promise<JsonApiCollectionResponse<StudentAttributes, 'student'>> => {
    const params = new URLSearchParams();
    params.append('page[number]', page.toString());
    if (classroomId) params.append('classroom_id', classroomId);
    return apiFetch(`/principal/students?${params.toString()}`);
  },

  get: (id: string): Promise<JsonApiResponse<StudentAttributes, 'student'>> =>
    apiFetch(`/principal/students/${id}`),

  create: (data: Partial<StudentAttributes>): Promise<JsonApiResponse<StudentAttributes, 'student'>> =>
    apiFetch('/principal/students', {
      method: 'POST',
      body: JSON.stringify({ student: data }),
    }),

  update: (id: string, data: Partial<StudentAttributes>): Promise<JsonApiResponse<StudentAttributes, 'student'>> =>
    apiFetch(`/principal/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ student: data }),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch(`/principal/students/${id}`, { method: 'DELETE' }),
};
