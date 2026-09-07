import axios from 'axios';

const BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://svadista-backend.onrender.com') + '/api';

// Render free tier can take ~30s to wake from a cold start — long enough that
// a short timeout would misfire as a network error on a perfectly good request.
const api = axios.create({ baseURL: BASE, timeout: 45000 });

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ssp_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Token is expired or invalid — drop it so the user isn't stuck "signed in"
      // to an account the backend no longer recognises.
      localStorage.removeItem('ssp_token');
      localStorage.removeItem('ssp_user');
      window.dispatchEvent(new Event('ssp:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
