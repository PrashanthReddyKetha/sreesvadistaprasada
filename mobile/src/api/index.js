import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://svadista-backend.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('ssp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync('ssp_token');
    }
    return Promise.reject(err);
  }
);

export default api;
