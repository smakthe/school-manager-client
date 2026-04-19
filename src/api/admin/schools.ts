import { apiFetch } from '../client';
import type { JsonApiCollectionResponse, JsonApiResponse } from '../../types/api';
import type { SchoolAttributes } from '../../types/school';

export const schoolsApi = {
  list: (page: number = 1, boards?: string[]): Promise<JsonApiCollectionResponse<SchoolAttributes, 'school'>> => {
    let url = `/admin/schools?page[number]=${page}`;
    if (boards && boards.length > 0) {
      url += `&board=${encodeURIComponent(boards.join(','))}`;
    } else if (boards && boards.length === 0) {
      url += `&board=none`; // ensures backend returns zero results
    }
    return apiFetch(url);
  },

  getBoardStats: (): Promise<Record<string, { schools: number; teachers: number; students: number }>> => {
    return apiFetch('/admin/schools/board_stats');
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
