import axios from 'axios';
import authService from './authService';

export const getDashboardStats = async () => {
  try {
    const token = authService.getAccessToken();
    const response = await axios.get('/api/dashboard-stats/', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
