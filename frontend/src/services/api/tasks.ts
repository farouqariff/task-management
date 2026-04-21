import { request } from "./client";

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
  create: (data: { name: string; priority: string; project_id: number; due_date?: string }) =>
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
