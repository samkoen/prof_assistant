import { Navigate, Outlet } from "react-router-dom";
import BrandPageLoader from "./ui/BrandPageLoader";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../api/client";

export default function ProtectedRoute({
  children,
  roles,
}: {
  children?: React.ReactNode;
  roles?: UserRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <BrandPageLoader />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}
