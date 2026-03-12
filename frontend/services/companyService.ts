const API = ((process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "/api").replace(/\/$/, "");

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...getAuthHeaders(), ...(opts.headers ?? {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
  return data as T;
}

export interface CompanySettings {
  id: number;
  company_name: string | null;
  firma: string | null;
  logo_base64: string | null;
  updated_at: string;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  return request<CompanySettings>("/company");
}

export async function saveCompanySettings(payload: {
  company_name?: string;
  firma?: string;
  logo_base64?: string;
}): Promise<{ message: string; data: CompanySettings }> {
  return request("/company", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
