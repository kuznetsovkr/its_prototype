import axios from 'axios';

// экспортим, чтобы использовать в других местах
export const API_BASE = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { Accept: 'application/json' },
  // withCredentials: true, // включи, если авторизация через куки
});

// токен из localStorage
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// единое сообщение об ошибке (+ можно ловить 401)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Request error';
    // if (err.response?.status === 401) { /* logout/redirect */ }
    return Promise.reject(new Error(msg));
  }
);

export default api;
