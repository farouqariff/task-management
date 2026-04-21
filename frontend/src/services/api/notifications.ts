import { request } from "./client";

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  status: "unread" | "read";
  created_at: string;
  read_at: string | null;
}

export const notificationsApi = {
  list: () => request<NotificationItem[]>("/notifications"),
  markRead: (id: number) => request<NotificationItem>(`/notifications/${id}/read`, { method: "PUT" }),
};
