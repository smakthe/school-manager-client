import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { StudentAttributes } from '../../types/student';

export const studentsApi = {
  list: (
    page: number = 1, 
    schoolId?: string, 
    classroomId?: string
  ): Promise<JsonApiCollectionResponse<StudentAttributes, 'student'>> => {
    const params = new URLSearchParams();
    params.append('page[number]', page.toString());
    
    if (schoolId) params.append('school_id', schoolId);
    if (classroomId) params.append('classroom_id', classroomId);
    
    return apiFetch(`/admin/students?${params.toString()}`);
  },

  get: (id: string): Promise<JsonApiResponse<StudentAttributes, 'student'>> => {
    return apiFetch(`/admin/students/${id}`);
  },

  create: (data: Partial<StudentAttributes>): Promise<JsonApiResponse<StudentAttributes, 'student'>> => {
    return apiFetch('/admin/students', {
      method: 'POST',
      body: JSON.stringify({ student: data }),
    });
  },

  update: (id: string, data: Partial<StudentAttributes>): Promise<JsonApiResponse<StudentAttributes, 'student'>> => {
    return apiFetch(`/admin/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ student: data }),
    });
  },

  delete: (id: string): Promise<void> => {
    return apiFetch(`/admin/students/${id}`, { method: 'DELETE' });
  },
};