import axios from 'axios';

export const API_BASE = (process.env.REACT_APP_API_URL || '/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

// 🔧 если baseURL оканчивается на /api, а в запросе снова /api/..., удаляем дубликат
api.interceptors.request.use((config) => {
  if (API_BASE.endsWith('/api') && typeof config.url === 'string' && config.url.startsWith('/api/')) {
    config.url = config.url.slice(4); // убираем начальный "/api"
  }
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Request error';
    return Promise.reject(new Error(msg));
  }
);

if (process.env.NODE_ENV === 'development') {
  console.log('[api] baseURL =', API_BASE);
}

export default api;
