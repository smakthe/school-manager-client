import { apiFetch } from '../client';

export const dashboardApi = {
  getStats: (): Promise<any> => {
    return apiFetch('/admin/dashboard_stats');
  },
};