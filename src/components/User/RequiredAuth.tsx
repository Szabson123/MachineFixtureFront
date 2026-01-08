import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const RequireAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user/auth/me/", {
          credentials: "include",
        });
        setIsAuth(res.ok);
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return null;
  if (!isAuth) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default RequireAuth;
