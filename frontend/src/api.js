import axios from 'axios';

const BASE = (process.env.REACT_APP_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api';

// Wake Render backend immediately on page load (prevents cold-start delay on first real request)
axios.get(`${BASE}/health`).catch(() => {});

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ssp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
