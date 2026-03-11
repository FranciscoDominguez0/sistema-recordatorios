import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const api = axios.create({ baseURL: BASE });

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type EmailLogStatus = "sent" | "failed";

export type EmailLogItem = {
  id: number;
  email: string;
  subject: string | null;
  status: EmailLogStatus;
  error_message: string | null;
  sent_at: string;
  client_name: string | null;
};

export type EmailLogSummary = {
  total: number;
  sent: number;
  failed: number;
  today: number;
};

export type EmailLogPaginated = {
  data: EmailLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export async function getEmailLogs(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<EmailLogPaginated> {
  const res = await api.get<EmailLogPaginated>("/email-logs", {
    headers: authHeaders(),
    params
  });
  return res.data;
}

export async function getEmailLogsSummary(): Promise<EmailLogSummary> {
  const res = await api.get<EmailLogSummary>("/email-logs/summary", {
    headers: authHeaders()
  });
  return res.data;
}
