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
    if (res.status === 401) {
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/signin";
        return { error: "Session expired" };
      }
      return { error: (json as { error?: string }).error ?? "Invalid credentials" };
    }
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
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  is_admin: boolean;
}

export const usersApi = {
  list: () => request<UserItem[]>("/users"),
  search: (query: string) => request<UserItem[]>(`/users?search=${encodeURIComponent(query)}`),
  getPersonalProject: () => request<{ id: number; name: string }>("/users/me/personal-project"),
  adminCreate: (first_name: string, last_name: string, email: string) =>
    request<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify({ first_name, last_name, email }),
    }),
  update: (user_id: number, data: { first_name?: string; last_name?: string; email?: string; password?: string }) =>
    request<UserItem>(`/users/${user_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (user_id: number) =>
    request<{ msg: string; id: number }>(`/users/${user_id}`, { method: "DELETE" }),
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

export interface ProjectItem {
  id: number;
  name: string;
  created_by: number | null;
  is_completed: boolean;
  created_at: string;
  members: ProjectMemberItem[];
}

export interface ProjectMemberItem {
  id: number;
  project_id: number;
  user_id: number;
  user_email: string;
  user_full_name: string;
  role: "leader" | "member";
  added_at: string;
}

export const projectsApi = {
  list: () => request<ProjectItem[]>("/projects"),
  create: (name: string, leader_id: number) =>
    request<ProjectItem>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, leader_id }),
    }),
  update: (project_id: number, data: { name?: string; leader_id?: number; is_completed?: boolean }) =>
    request<ProjectItem>(`/projects/${project_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (project_id: number) =>
    request<{ msg: string; id: number }>(`/projects/${project_id}`, { method: "DELETE" }),
  getMembers: (project_id: number) =>
    request<ProjectMemberItem[]>(`/projects/${project_id}/members`),
  addMember: (project_id: number, user_id: number, role: string) =>
    request(`/projects/${project_id}/members`, {
      method: "POST",
      body: JSON.stringify({ user_id, role }),
    }),
  removeMember: (project_id: number, user_id: number) =>
    request(`/projects/${project_id}/members/${user_id}`, { method: "DELETE" }),
};

export interface TaskAssigneeItem {
  id: number;
  task_id: number;
  user_id: number;
  user_email: string;
  user_full_name: string;
  assigned_at: string;
}

export interface TaskItem {
  id: number;
  name: string;
  status: "todo" | "completed";
  priority: "low" | "medium" | "high";
  project_id: number;
  created_by: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  creator_email: string | null;
  project_name: string;
  assignees: TaskAssigneeItem[];
}

export const tasksApi = {
  list: (project_id?: number) =>
    request<TaskItem[]>(project_id !== undefined ? `/tasks?project_id=${project_id}` : "/tasks"),
  create: (data: {
    name: string;
    priority: string;
    project_id: number;
    due_date?: string;
  }) =>
    request<TaskItem>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (task_id: number, data: Partial<Pick<TaskItem, "status" | "priority" | "name" | "due_date">>) =>
    request<TaskItem>(`/tasks/${task_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (task_id: number) =>
    request<{ msg: string; id: number }>(`/tasks/${task_id}`, { method: "DELETE" }),
  addAssignee: (task_id: number, user_id: number) =>
    request(`/tasks/${task_id}/assignees`, {
      method: "POST",
      body: JSON.stringify({ user_id }),
    }),
  removeAssignee: (task_id: number, user_id: number) =>
    request(`/tasks/${task_id}/assignees/${user_id}`, { method: "DELETE" }),
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
