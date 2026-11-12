import { createContext, useContext } from "react";

export const AdminAccessContext = createContext(null);
export const useAdminAccess = () => useContext(AdminAccessContext);
export const isAdminRole = (role) => role === "admin" || role === "super_admin";
export const canManageCatalog = (session) => session?.role === "super_admin";
