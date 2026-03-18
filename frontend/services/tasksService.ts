import axios from "axios";

export type TaskItem = {
  id: number;
  title: string;
  description?: string | null;
  due_date: string;
  status: "pending" | "completed";
  created_at?: string;
};

type CreateTaskInput = {
  title: string;
  description?: string;
  due_date: string;
};

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "") || "/api";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllTasks(): Promise<TaskItem[]> {
  const response = await api
    .get<TaskItem[]>("/tasks", { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar las tareas";
      throw new Error(message);
    });
  return response.data;
}

export type TaskPagination = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export async function getCompletedTasksPaginated({
  page = 1,
  limit = 10
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{ data: TaskItem[]; pagination: TaskPagination }> {
  const response = await api
    .get<{ data: TaskItem[]; pagination: TaskPagination }>("/tasks", {
      headers: authHeaders(),
      params: { status: "completed", page, limit }
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar las tareas";
      throw new Error(message);
    });
  return response.data;
}

export async function getPendingTasks(): Promise<TaskItem[]> {
  const response = await api
    .get<TaskItem[]>("/tasks/pending", { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar las tareas";
      throw new Error(message);
    });
  return response.data;
}

export async function getCompletedTasks({ limit = 10 }: { limit?: number } = {}): Promise<TaskItem[]> {
  const response = await api
    .get<TaskItem[]>("/tasks", {
      headers: authHeaders(),
      params: { status: "completed", limit }
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar las tareas";
      throw new Error(message);
    });
  return response.data;
}

export async function createTask(input: CreateTaskInput): Promise<TaskItem> {
  const response = await api
    .post<TaskItem>("/tasks", input, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear la tarea";
      throw new Error(message);
    });
  return response.data;
}

export async function completeTask(id: number): Promise<TaskItem> {
  const response = await api
    .put<TaskItem>(`/tasks/${id}/complete`, {}, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo completar la tarea";
      throw new Error(message);
    });
  return response.data;
}

export async function setTaskPending(id: number): Promise<TaskItem> {
  const response = await api
    .put<TaskItem>(`/tasks/${id}/pending`, {}, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo deshacer la tarea";
      throw new Error(message);
    });
  return response.data;
}

export async function deleteTask(id: number): Promise<void> {
  await api
    .delete(`/tasks/${id}`, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar la tarea";
      throw new Error(message);
    });
}
