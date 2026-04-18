import { apiFetch } from '../client';

export const principalDashboardApi = {
  getStats: (): Promise<any> => apiFetch('/principal/dashboard_stats'),
};
