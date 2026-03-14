import axios from "axios";

export type UserRole = "admin" | "staff";

export type UserItem = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  receive_notifications?: boolean;
  avatar_url?: string | null;
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
  receive_notifications?: boolean;
};

type UpdateUserInput = Partial<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  receive_notifications: boolean;
}>;

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

function currentUserId() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const id = Number(parsed?.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
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

export async function getMe(): Promise<UserItem> {
  const id = currentUserId();
  if (!id) {
    throw new Error("No se encontró el usuario en sesión");
  }

  const list = await getUsers();
  const me = list.find((u) => Number(u.id) === id) ?? null;
  if (!me) {
    throw new Error("No se pudo cargar tu perfil");
  }
  return me;
}

export async function updateMe(input: { name?: string }): Promise<UserItem> {
  const id = currentUserId();
  if (!id) {
    throw new Error("No se encontró el usuario en sesión");
  }
  return updateUser(id, input);
}

export async function uploadMyAvatar(avatarBase64: string): Promise<UserItem> {
  const id = currentUserId();
  if (!id) {
    throw new Error("No se encontró el usuario en sesión");
  }
  return uploadAvatar(id, avatarBase64);
}

export async function changeMyPassword(input: { current_password: string; new_password: string }): Promise<UserItem> {
  const id = currentUserId();
  if (!id) {
    throw new Error("No se encontró el usuario en sesión");
  }

  return updateUser(id, { password: input.new_password });
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

export async function uploadAvatar(userId: number, avatarBase64: string): Promise<UserItem> {
  const response = await api
    .put<UserItem>(`/users/${userId}/avatar`, { avatar_base64: avatarBase64 }, {
      headers: authHeaders()
    })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar el avatar";
      throw new Error(message);
    });

  return response.data;
}
