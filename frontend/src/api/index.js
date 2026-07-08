import axios from 'axios';

const BASE = (process.env.REACT_APP_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ssp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
