import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getStoredRole, syncRoleFromProfile } from "../utils/auth";

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setStatus("denied");
        return;
      }

      const cached = getStoredRole();
      if (cached === "admin") {
        if (isMounted) setStatus("allowed");
      }

      const role = await syncRoleFromProfile();
      if (!isMounted) return;
      setStatus(role === "admin" ? "allowed" : "denied");
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
    return <Navigate to="/profile" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default RequireAdmin;
