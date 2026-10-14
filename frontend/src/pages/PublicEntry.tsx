import { Navigate } from "react-router-dom";
import BrandPageLoader from "../components/ui/BrandPageLoader";
import { getHomePath } from "../config/menuItems";
import { useAuth } from "../context/AuthContext";
import PublicHomePage from "./PublicHomePage";

export default function PublicEntry() {
  const { user, loading } = useAuth();
  if (loading) return <BrandPageLoader fullScreen />;
  if (user) return <Navigate to={getHomePath(user.role)} replace />;
  return <PublicHomePage />;
}
