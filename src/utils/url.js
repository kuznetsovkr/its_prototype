import { API_BASE } from '../api'; 

// "https://site.com/api" -> "https://site.com"
const HOST_BASE = (API_BASE || '').replace(/\/api(?:\/|$)/, '');

// корни, которые реально отдаются бэкендом (подправь под себя, если нужно)
const BACKEND_FILE_ROOTS = ['uploads', 'files'];

export const buildImgSrc = (url) => {
  if (!url) return null;
  const s = String(url).trim();

  // абсолютные и data/blob — пропускаем
  if (/^(https?:|data:|blob:)/i.test(s)) return s;

  // нормализуем путь без ведущих слэшей
  const path = s.replace(/^\/+/, '');

  // только для серверных путей добавляем HOST_BASE
  if (BACKEND_FILE_ROOTS.some(root => path.startsWith(root))) {
    return `${HOST_BASE}/${path}`;
  }

  // для фронтовых ассетов гарантируем абсолютный путь от корня
  return `/${path}`;
};
