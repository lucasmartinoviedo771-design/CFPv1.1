import apiClient from '../api/client';

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/dashboard-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
