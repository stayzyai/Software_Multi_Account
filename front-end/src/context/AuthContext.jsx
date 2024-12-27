import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { getItem, setItem, removeItem } from "@/helpers/localstorage";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getItem("token");
    return !!token;
  });
  
  const [userRole, setUserRole] = useState(() => {
    const role = getItem("userRole");
    return role || null;
  });

  const logout = useCallback(() => {
    removeItem("token");
    removeItem("refreshToken");
    removeItem("userRole");
    setUserRole(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = getItem("token");
      const role = getItem("userRole");
      
      setIsAuthenticated(!!token);
      setUserRole(role);
    };

    const handleSessionExpired = () => {
      logout();
      const baseUrl = userRole === 'admin' ? '/admin/login' : '/user/login';
      window.location.href = `${baseUrl}?sessionExpired=true`;
    };

    window.addEventListener("storage", checkAuth);
    window.addEventListener("sessionExpired", handleSessionExpired);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("sessionExpired", handleSessionExpired);
    };
  }, [logout, userRole]);

  const login = useCallback((access_token, refresh_token, role) => {
    setItem("token", access_token);
    setItem("refreshToken", refresh_token);
    setItem("userRole", role);
    setUserRole(role);
    setIsAuthenticated(true);
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    login,
    logout,
    userRole
  }), [isAuthenticated, login, logout, userRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
