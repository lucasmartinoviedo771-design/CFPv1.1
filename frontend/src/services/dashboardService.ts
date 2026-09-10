import apiClient from '../api/client';
import type { ExtendedDashboardStats } from '../components/Dashboard/types';

export const getDashboardStats = async (params: Record<string, unknown> = {}): Promise<ExtendedDashboardStats> => {
  try {
    const response = await apiClient.get<ExtendedDashboardStats>('/dashboard-stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
