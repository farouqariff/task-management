import { request } from "./client";

export interface ProjectMemberItem {
  id: number;
  project_id: number;
  user_id: number;
  user_email: string;
  user_full_name: string;
  role: "leader" | "member";
  added_at: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  created_by: number | null;
  is_completed: boolean;
  created_at: string;
  members: ProjectMemberItem[];
}

export const projectsApi = {
  list: () => request<ProjectItem[]>("/projects"),
  get: (project_id: number) => request<ProjectItem>(`/projects/${project_id}`),
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
