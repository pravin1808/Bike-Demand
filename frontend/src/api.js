import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictDemand = async (data) => {
  try {
    const response = await api.post('/predict', data);
    return response.data;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error.response?.data?.error || 'Failed to get prediction from server.';
  }
};

export const checkStatus = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    console.error('Status check error:', error);
    return { model_loaded: false, status: 'offline' };
  }
};
