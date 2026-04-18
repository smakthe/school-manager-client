import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { StudentAttributes } from '../../types/student';

export const teacherStudentsApi = {
  list: (page: number = 1, classroomId?: string): Promise<JsonApiCollectionResponse<StudentAttributes, 'student'>> => {
    const params = new URLSearchParams();
    params.append('page[number]', page.toString());
    if (classroomId) params.append('classroom_id', classroomId);
    return apiFetch(`/teacher/students?${params.toString()}`);
  },

  get: (id: string): Promise<JsonApiResponse<StudentAttributes, 'student'>> =>
    apiFetch(`/teacher/students/${id}`),

  // Teachers can only update name, dob, gender, is_active for their homeroom students
  update: (id: string, data: Partial<StudentAttributes>): Promise<JsonApiResponse<StudentAttributes, 'student'>> =>
    apiFetch(`/teacher/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ student: data }),
    }),
};
