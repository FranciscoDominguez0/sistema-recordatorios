import axios from "axios";

export type ServiceStatus = "activo" | "vencido" | "completado";

export type ServiceItem = {
  id: number;
  client_id: number;
  client_name?: string;
  service_name: string;
  description?: string | null;
  start_date?: string | null;
  expiration_date: string;
  reminder_days?: number | null;
  status?: ServiceStatus;
  created_at?: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type ServicesSummary = {
  activos: number;
  vencidos: number;
  completados: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  summary?: ServicesSummary;
  pagination: PaginationInfo;
};

type CreateServiceInput = {
  client_id: number;
  service_name: string;
  description?: string;
  start_date?: string;
  expiration_date: string;
  reminder_days?: number;
  status?: ServiceStatus;
};

type UpdateServiceInput = Partial<CreateServiceInput>;

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

export async function getServicesPaginated({
  page = 1,
  limit = 10,
  search,
  status
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ServiceStatus;
}): Promise<PaginatedResponse<ServiceItem>> {
  const response = await api
    .get<PaginatedResponse<ServiceItem>>("/services", {
      headers: authHeaders(),
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(status ? { status } : {})
      }
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar servicios";
      throw new Error(message);
    });

  return response.data;
}

export async function getServiceById(id: number): Promise<ServiceItem> {
  const response = await api
    .get<ServiceItem>(`/services/${id}`, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar el servicio";
      throw new Error(message);
    });

  return response.data;
}

export async function createService(input: CreateServiceInput): Promise<ServiceItem> {
  const response = await api
    .post<ServiceItem>("/services", input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear servicio";
      throw new Error(message);
    });

  return response.data;
}

export async function updateService(id: number, input: UpdateServiceInput): Promise<ServiceItem> {
  const response = await api
    .put<ServiceItem>(`/services/${id}`, input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar servicio";
      throw new Error(message);
    });

  return response.data;
}

export async function deleteService(id: number): Promise<void> {
  await api
    .delete(`/services/${id}`, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar servicio";
      throw new Error(message);
    });
}
export async function renewService(id: number, new_expiration_date?: string): Promise<ServiceItem> {
  const response = await api
    .post<ServiceItem>(`/services/${id}/renew`, { new_expiration_date }, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo renovar servicio";
      throw new Error(message);
    });

  return response.data;
}
