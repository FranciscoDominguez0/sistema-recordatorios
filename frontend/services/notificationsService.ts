const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...getAuthHeaders(), ...(opts.headers ?? {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationType =
  | "service_expiring"
  | "service_expired"
  | "task_due"
  | "email_sent";

export interface NotificationItem {
  id: number;
  user_id: number | null;
  client_id: number | null;
  service_id: number | null;
  task_id: number | null;
  type: NotificationType;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unread_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API functions
// ─────────────────────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<NotificationsResponse> {
  return request<NotificationsResponse>("/notifications");
}

export async function getUnreadCount(): Promise<number> {
  const data = await request<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await request(`/notifications/${id}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request("/notifications/read-all", { method: "PUT" });
}

export async function deleteNotification(id: number): Promise<void> {
  await request(`/notifications/${id}`, { method: "DELETE" });
}
