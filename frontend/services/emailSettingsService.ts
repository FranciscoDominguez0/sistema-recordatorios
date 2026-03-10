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

export async function getEmailSetting(): Promise<EmailSettingItem | null> {
  const response = await api
    .get<EmailSettingItem | null>("/email-settings", { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar configuración SMTP";
      throw new Error(message);
    });
  return response.data ?? null;
}

export async function createEmailSetting(input: CreateEmailSettingInput): Promise<EmailSettingItem> {
  const response = await api
    .post<EmailSettingItem>("/email-settings", input, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear configuración SMTP";
      throw new Error(message);
    });
  return response.data;
}

export async function updateEmailSetting(id: number, input: UpdateEmailSettingInput): Promise<EmailSettingItem[]> {
  const response = await api
    .put<EmailSettingItem[]>(`/email-settings/${id}`, input, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar configuración SMTP";
      throw new Error(message);
    });
  return response.data;
}

export async function setDefaultEmailSetting(id: number): Promise<EmailSettingItem> {
  const response = await api
    .put<EmailSettingItem>(`/email-settings/${id}/default`, {}, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cambiar SMTP principal";
      throw new Error(message);
    });
  return response.data;
}

export async function testEmailSetting(): Promise<{ message: string }> {
  const response = await api
    .post<{ message: string }>("/email-settings/test", {}, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo enviar correo de prueba";
      throw new Error(message);
    });
  return response.data;
}
