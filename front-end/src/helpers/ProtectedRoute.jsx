import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ element, allowedRole }) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return element;
};