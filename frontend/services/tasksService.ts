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

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "http://localhost:3000";

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

export async function deleteTask(id: number): Promise<void> {
  await api
    .delete(`/tasks/${id}`, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar la tarea";
      throw new Error(message);
    });
}
