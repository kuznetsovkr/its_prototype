import api from "../api";
import { isAdminRole } from "../admin/adminAccess";

const extractRole = (payload) => payload?.role ?? null;

export const persistAdminAuth = ({ token, role }) => {
  if (token) localStorage.setItem("token", token);
  if (role) localStorage.setItem("role", role);
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

export const verifyAdminSession = async () => {
  try {
    const { data } = await api.get("/auth/admin-session");
    const role = extractRole(data);
    if (!isAdminRole(role)) throw new Error("Недостаточно прав администратора");
    localStorage.setItem("role", role);
    return data;
  } catch (err) {
    clearAuth();
    console.warn("Не удалось подтвердить сессию администратора:", err.message || err);
    return null;
  }
};

export const applyAdminAuthResponse = (payload) => {
  const token = payload?.token;
  const role = extractRole(payload);
  persistAdminAuth({ token, role });
  return role || null;
};
