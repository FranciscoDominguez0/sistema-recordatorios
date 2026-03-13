import axios from "axios";

export type ActivityLog = {
  id: number;
  user_id: number | null;
  user: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
};

export type LogsResponse = {
  data: ActivityLog[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

export type DashboardStats = {
  actions_today: number;
  actions_this_week: number;
  top_users: { id: number; name: string; actions: number }[];
};

export type ChartData = {
  daily: { date: string; total: number }[];
  by_action: { action: string; total: number }[];
  by_entity: { entity_type: string; total: number }[];
};

const BASE = ((process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "/api").replace(/\/$/, "");

const api = axios.create({ baseURL: BASE });

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getActivityLogs(params: {
  page?: number; limit?: number; user_id?: string; action?: string;
  entity_type?: string; entity_id?: number; date_from?: string; date_to?: string;
} = {}): Promise<LogsResponse> {
  const res = await api.get<LogsResponse>("/activity-logs", {
    headers: authHeaders(),
    params
  });
  return res.data;
}

export async function getActivityDashboard(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/activity-logs/dashboard", { headers: authHeaders() });
  return res.data;
}

export async function getActivityChart(days = 30): Promise<ChartData> {
  const res = await api.get<ChartData>("/activity-logs/chart", {
    headers: authHeaders(),
    params: { days }
  });
  return res.data;
}

export async function getActionTypes(): Promise<string[]> {
  const res = await api.get<string[]>("/activity-logs/action-types", { headers: authHeaders() });
  return res.data;
}
