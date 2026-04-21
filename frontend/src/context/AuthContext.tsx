import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser, keepLoggedIn: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("token");
    if (
      stored &&
      localStorage.getItem("session_only") === "true" &&
      !sessionStorage.getItem("session_active")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("session_only");
      return null;
    }
    return stored;
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored || !localStorage.getItem("token")) return null;
    return JSON.parse(stored) as AuthUser;
  });

  const login = (newToken: string, newUser: AuthUser, keepLoggedIn: boolean) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    if (keepLoggedIn) {
      localStorage.removeItem("session_only");
    } else {
      localStorage.setItem("session_only", "true");
    }
    sessionStorage.setItem("session_active", "true");
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("session_only");
    sessionStorage.removeItem("session_active");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
