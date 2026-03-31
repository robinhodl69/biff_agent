import { createContext, useContext, useState, useEffect } from "react";
import {
  apiPost,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (secret) => {
    try {
      const data = await apiPost("/api/auth", { secret });
      if (data.success) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
