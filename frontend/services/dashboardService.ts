import axios from "axios";

const BASE = ((process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "/api").replace(/\/$/, "");
const api = axios.create({ baseURL: BASE });

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type DashboardStats = {
  total_clients: number;
  total_services: number;
  active_services: number;
  services_expiring_soon: number;
  overdue_services: number;
  pending_tasks: number;
  completed_tasks_today: number;
  actions_today: number;
};

export type ServiceStatusItem = { status: string; total: number };
export type ClientGrowthItem = { week: string; new_clients: number };
export type WeeklyActivityItem = { day_name: string; day_num: number; actions: number };
export type UpcomingService = { id: number; name: string; expiration_date: string; reminder_days: number; client_name: string };
export type PendingTask = { id: number; title: string; due_date: string; status: string };
export type TopClient = { id: number; name: string; total_services: number };

export type DashboardData = {
  stats: DashboardStats;
  services_by_status: ServiceStatusItem[];
  clients_growth: ClientGrowthItem[];
  weekly_activity: WeeklyActivityItem[];
  upcoming_services: UpcomingService[];
  pending_tasks: PendingTask[];
  top_clients: TopClient[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const res = await api.get<DashboardData>("/dashboard/all", { headers: authHeaders() });
  return res.data;
}
