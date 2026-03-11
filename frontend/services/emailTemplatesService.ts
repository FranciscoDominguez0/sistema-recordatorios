import axios from "axios";

export type EmailTemplateItem = {
  id: number;
  name: string;
  subject: string;
  content: string;
  card_content?: string;
  template_type?: string;
  created_at?: string;
};

type TemplateInput = {
  name: string;
  subject: string;
  content: string;
  card_content?: string;
  template_type?: string;
};

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "http://localhost:3000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: { "Content-Type": "application/json" }
});

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllTemplates(): Promise<EmailTemplateItem[]> {
  const response = await api
    .get<EmailTemplateItem[]>("/email-templates", { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo cargar plantillas";
      throw new Error(message);
    });
  return response.data;
}

export async function createTemplate(input: TemplateInput): Promise<EmailTemplateItem> {
  const response = await api
    .post<EmailTemplateItem>("/email-templates", input, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo crear plantilla";
      throw new Error(message);
    });
  return response.data;
}

export async function updateTemplate(id: number, input: TemplateInput): Promise<EmailTemplateItem> {
  const response = await api
    .put<EmailTemplateItem>(`/email-templates/${id}`, input, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo actualizar plantilla";
      throw new Error(message);
    });
  return response.data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await api
    .delete(`/email-templates/${id}`, { headers: authHeaders() })
    .catch((error) => {
      const message = error?.response?.data?.message || error?.message || "No se pudo eliminar plantilla";
      throw new Error(message);
    });
}
