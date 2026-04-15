import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [role]);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const newToken = res.data.access_token;
    const decoded = jwtDecode(newToken);
    setToken(newToken);
    setRole(decoded.role || "user");
  }

  async function register(email, password) {
    await api.post("/auth/register", { email, password });
  }

  function logout() {
    setToken(null);
    setRole(null);
  }

  const value = {
    token,
    role,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
