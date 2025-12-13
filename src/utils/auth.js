import api from "../api";

const extractRole = (payload) => payload?.role ?? payload?.user?.role ?? null;

export const persistAuth = ({ token, role }) => {
  if (token) localStorage.setItem("token", token);
  if (role) localStorage.setItem("role", role);
};

export const getStoredRole = () => localStorage.getItem("role");

export const syncRoleFromProfile = async () => {
  try {
    const { data } = await api.get("/user/me");
    const role = extractRole(data);
    if (role) {
      localStorage.setItem("role", role);
    }
    return role || null;
  } catch (err) {
    console.warn("Не удалось получить роль пользователя:", err.message || err);
    return null;
  }
};

export const applyAuthResponse = async (payload) => {
  const token = payload?.token;
  const role = extractRole(payload);
  persistAuth({ token, role });
  if (!role && token) {
    return syncRoleFromProfile();
  }
  return role || null;
};

export const resolveUserRole = (payload, fallback = "user") => {
  const role = extractRole(payload) || getStoredRole();
  return role || fallback;
};
