import { API_BASE } from '../api'; 

const HOST_BASE = (API_BASE || '').replace(/\/api\/?$/, ''); // "https://site.com/api" -> "https://site.com"

export const buildImgSrc = (url) => {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url; // абсолютные — без изменений
  const host = HOST_BASE; // может быть пустым, если API_BASE="/api" — это ок
  const path = String(url).replace(/^\/+/, ''); // убираем лишние слэши
  return `${host}/${path}`; // host может быть "" -> итог "/api/uploads/.."
};
