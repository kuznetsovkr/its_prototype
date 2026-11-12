import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { verifyAdminSession } from "../utils/auth";
import { AdminAccessContext, isAdminRole } from "../admin/adminAccess";

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [session, setSession] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setStatus("denied");
        return;
      }

      const account = await verifyAdminSession();
      if (!isMounted) return;
      setSession(account);
      setStatus(isAdminRole(account?.role) ? "allowed" : "denied");
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return <div className="page" style={{ padding: "40px 16px" }}>Проверяем доступ...</div>;
  }

  if (status !== "allowed") {
    return <Navigate to="/admin" state={{ from: location.pathname }} replace />;
  }

  return <AdminAccessContext.Provider value={session}>{children}</AdminAccessContext.Provider>;
};

export default RequireAdmin;
