import axios from "axios";

export type ClientItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type ClientServiceOverviewItem = {
  id: number;
  client_id: number;
  service_name: string;
  description: string | null;
  start_date: string | null;
  expiration_date: string;
  reminder_days: number;
  status: "activo" | "vencido" | "completado";
  created_at: string;
  days_to_expire: number | null;
  last_reminder_sent_at: string | null;
  reminders_sent_count: number;
  emails_sent_count: number;
  emails_failed_count: number;
  last_email_sent_at: string | null;
};

export type ClientEmailLogItem = {
  id: number;
  client_id: number | null;
  service_id: number | null;
  email: string;
  subject: string | null;
  status: "sent" | "failed";
  error_message: string | null;
  sent_at: string;
};

export type ClientNotificationItem = {
  id: number;
  user_id: number | null;
  client_id: number | null;
  service_id: number | null;
  task_id: number | null;
  type: string;
  title: string;
  message: string | null;
  is_read: 0 | 1 | boolean;
  created_at: string;
  recipients_count?: number;
};

export type ClientOverviewResponse = {
  client: ClientItem;
  services: ClientServiceOverviewItem[];
  email_logs: ClientEmailLogItem[];
  notifications: ClientNotificationItem[];
  activity_logs: {
    id: number;
    user_id: number | null;
    user: string | null;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    description: string | null;
    ip_address: string | null;
    created_at: string;
  }[];
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ClientsSummary = {
  with_email: number;
  with_phone: number;
  with_notes: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  summary?: ClientsSummary;
  pagination: PaginationInfo;
};

type CreateClientInput = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
};

type UpdateClientInput = Partial<CreateClientInput>;

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "") || "/api";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getClientsPaginated({
  page = 1,
  limit = 10,
  search
}: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<ClientItem>> {
  const response = await api
    .get<PaginatedResponse<ClientItem>>("/clients", {
      headers: authHeaders(),
      params: {
        page,
        limit,
        ...(search ? { search } : {})
      }
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar clientes";
      throw new Error(message);
    });

  return response.data;
}

export async function createClient(input: CreateClientInput): Promise<ClientItem> {
  const response = await api
    .post<ClientItem>("/clients", input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear cliente";
      throw new Error(message);
    });

  return response.data;
}

export async function updateClient(id: number, input: UpdateClientInput): Promise<ClientItem> {
  const response = await api
    .put<ClientItem>(`/clients/${id}`, input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar cliente";
      throw new Error(message);
    });

  return response.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api
    .delete(`/clients/${id}`, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar cliente";
      throw new Error(message);
    });
}

export async function getClientOverview(id: number): Promise<ClientOverviewResponse> {
  const response = await api
    .get<ClientOverviewResponse>(`/clients/${id}/overview`, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar detalle del cliente";
      throw new Error(message);
    });

  return response.data;
}
