import apiClient from '../api/client';

export const getDashboardStats = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard-stats', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
