import axios from "axios";

type LoginResponse = {
  token: string;
  user?: unknown;
};

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "") || "/api";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", { email, password }).catch((error) => {
    const status = Number(error?.response?.status ?? NaN);
    const rawMessage = String(error?.response?.data?.message ?? error?.message ?? "").trim();

    if (status === 403) {
      throw new Error(
        rawMessage ||
          "Tu cuenta está deshabilitada. Contacta al administrador para reactivarla."
      );
    }

    const message = rawMessage || "No se pudo iniciar sesión";
    throw new Error(message);
  });

  const token = response.data?.token;

  if (!token) {
    throw new Error("Respuesta inválida del servidor: no se recibió token");
  }

  localStorage.setItem("token", token);
  if (response.data?.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
}
