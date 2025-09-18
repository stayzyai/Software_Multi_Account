import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardComponent } from "../../pages/dashboard";
import NotFound from "../../pages/NotFound";
import { useAuth } from "../../hooks/useAuth";
import AdminLogin from "../../components/admin/login/login";
import UserLogin from "../../components/user/auth/login";
import SignUp from "../../components/user/auth/signup";
import { ProtectedRoute } from "../../helpers/ProtectedRoute";
import { UserDashboardComponent } from "../../pages/userdashboard";
// Payment components removed - not needed
import ForgotPassword from "../../components/user/auth/forgot-password";
import ResetPassword from "../../components/user/auth/reset-password";

function AppRoutes() {
  const { isAuthenticated, userRole } = useAuth();

  const redirectBasedOnRole = () => {
    if (userRole === "admin") {
      return "/admin/dashboard";
    } else if (userRole === "user") {
      return "/user/dashboard";
    }
    return "/user/login";
  };

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          isAuthenticated ? (
            <Navigate to={redirectBasedOnRole()} replace />
          ) : (
            <AdminLogin />
          )
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            element={<DashboardComponent role="admin" />}
            allowedRole="admin"
          />
        }
      />
      <Route
        path="/user/login"
        element={
          isAuthenticated ? (
            <Navigate to={redirectBasedOnRole()} replace />
          ) : (
            <UserLogin />
          )
        }
      />
      <Route
        path="/user/signup"
        element={
          isAuthenticated ? (
            <Navigate to={redirectBasedOnRole()} replace />
          ) : (
            <SignUp />
          )
        }
      />
      <Route
      path="/user/forgot-password"
      element={<ForgotPassword/>}
      />
      <Route 
      path="/user/reset-password/:token"
      element={<ResetPassword/>}
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute
            element={<DashboardComponent role="admin" />}
            allowedRole="admin"
          />
        }
      />
      {/* Payment routes removed - not needed */}
      <Route
        path="/user/*"
        element={
          <ProtectedRoute
            element={<UserDashboardComponent role="user" />}
            allowedRole="user"
          />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
