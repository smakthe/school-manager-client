import { apiFetch } from '../client';

export const teacherDashboardApi = {
  getStats: (): Promise<any> => apiFetch('/teacher/dashboard_stats'),
};
