import axios from 'axios';

const BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ssp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
