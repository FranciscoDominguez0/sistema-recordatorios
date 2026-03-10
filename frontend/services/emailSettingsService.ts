import axios from "axios";

export type EmailSettingItem = {
  id: number;
  user_id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_email: string;
  smtp_password?: string;
  encryption: "tls" | "ssl";
  is_default: boolean;
  created_at?: string;
};

type CreateEmailSettingInput = {
  smtp_host: string;
  smtp_port: number;
  smtp_email: string;
  smtp_password: string;
  encryption: "tls" | "ssl";
};

type UpdateEmailSettingInput = Partial<CreateEmailSettingInput>;

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "http://localhost:3000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: { "Content-Type": "application/json" }
});

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Devuelve TODOS los SMTP configurados */
export async function getAllEmailSettings(): Promise<EmailSettingItem[]> {
  const response = await api
    .get<EmailSettingItem[]>("/email-settings/all", { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo cargar configuraciones SMTP");
    });
  return response.data ?? [];
}

/** Devuelve el SMTP del usuario actual (compatibilidad) */
export async function getEmailSetting(): Promise<EmailSettingItem | null> {
  const response = await api
    .get<EmailSettingItem | null>("/email-settings", { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo cargar configuración SMTP");
    });
  return response.data ?? null;
}

export async function createEmailSetting(input: CreateEmailSettingInput): Promise<EmailSettingItem> {
  const response = await api
    .post<EmailSettingItem>("/email-settings", input, { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo crear configuración SMTP");
    });
  return response.data;
}

export async function updateEmailSetting(id: number, input: UpdateEmailSettingInput): Promise<EmailSettingItem> {
  const response = await api
    .put<EmailSettingItem>(`/email-settings/${id}`, input, { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo actualizar configuración SMTP");
    });
  return response.data;
}

export async function deleteEmailSetting(id: number): Promise<void> {
  await api
    .delete(`/email-settings/${id}`, { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo eliminar configuración SMTP");
    });
}

export async function setDefaultEmailSetting(id: number): Promise<EmailSettingItem> {
  const response = await api
    .put<EmailSettingItem>(`/email-settings/${id}/default`, {}, { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo cambiar SMTP principal");
    });
  return response.data;
}

export async function testEmailSetting(): Promise<{ message: string }> {
  const response = await api
    .post<{ message: string }>("/email-settings/test", {}, { headers: authHeaders() })
    .catch((error) => {
      throw new Error(error?.response?.data?.message || error?.message || "No se pudo enviar correo de prueba");
    });
  return response.data;
}
