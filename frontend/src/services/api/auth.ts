import type { AuthUser } from "../../context/AuthContext";
import { request } from "./client";

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
}

export interface RegisterResponse {
  msg: string;
  user_id: number;
}

export const authApi = {
  login: (email: string, password: string, keepLoggedIn: boolean) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, keep_logged_in: keepLoggedIn }),
    }),

  register: (first_name: string, last_name: string, email: string, password: string) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ msg: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ msg: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};
