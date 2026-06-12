import apiClient from '../api/client';
import type { DashboardStats } from '../api/types';

export const getDashboardStats = async (params: Record<string, unknown> = {}): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get<DashboardStats>('/dashboard-stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
