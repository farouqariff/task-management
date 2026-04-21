import { request } from "./client";

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
