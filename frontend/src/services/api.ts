import type { AuthUser } from "../context/AuthContext";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:5000";

interface ApiOk<T> { data: T; error?: never }
interface ApiErr { data?: never; error: string }
type ApiResult<T> = ApiOk<T> | ApiErr;

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (json as { error?: string; msg?: string }).error ?? (json as { msg?: string }).msg ?? "Something went wrong" };
    }
    return { data: json as T };
  } catch {
    return { error: "Network error — is the backend running?" };
  }
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  msg: string;
  user_id: number;
}

export interface UserItem {
  id: number;
  full_name: string;
  email: string;
}

export const usersApi = {
  list: () => request<UserItem[]>("/users"),
};

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: number | null;
  resource_label: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  per_page: number;
}

export const auditApi = {
  list: (page = 1, per_page = 50) =>
    request<AuditLogResponse>(`/audit?page=${page}&per_page=${per_page}`),
};

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email, password }),
    }),
};
