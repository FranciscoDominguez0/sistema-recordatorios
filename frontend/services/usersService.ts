import axios from "axios";

export type UserRole = "admin" | "staff";

export type UserItem = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  summary?: {
    active: number;
    admin: number;
    staff: number;
  };
  pagination: PaginationInfo;
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
};

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
}>;

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "http://localhost:3000";

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

export async function getUsers(search?: string): Promise<UserItem[]> {
  const response = await api
    .get<UserItem[]>("/users", {
      headers: authHeaders(),
      params: search ? { search } : undefined
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar usuarios";
      throw new Error(message);
    });

  return response.data ?? [];
}

export async function getUsersPaginated({
  page = 1,
  limit = 10,
  search
}: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<UserItem>> {
  const response = await api
    .get<PaginatedResponse<UserItem>>("/users", {
      headers: authHeaders(),
      params: {
        include_pagination: 1,
        page,
        limit,
        ...(search ? { search } : {})
      }
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar usuarios";
      throw new Error(message);
    });

  return response.data;
}

export async function createUser(input: CreateUserInput): Promise<UserItem> {
  const response = await api
    .post<UserItem>("/users", input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear usuario";
      throw new Error(message);
    });

  return response.data;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserItem> {
  const response = await api
    .put<UserItem>(`/users/${id}`, input, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar usuario";
      throw new Error(message);
    });

  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api
    .delete(`/users/${id}`, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar usuario";
      throw new Error(message);
    });
}
