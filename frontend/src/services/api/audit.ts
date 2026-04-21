import { request } from "./client";

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
