import axios from "axios";

type LoginResponse = {
  token: string;
  user?: unknown;
};

const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim() || "http://localhost:3000";

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", { email, password }).catch((error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "No se pudo iniciar sesión";
    throw new Error(message);
  });

  const token = response.data?.token;

  if (!token) {
    throw new Error("Respuesta inválida del servidor: no se recibió token");
  }

  localStorage.setItem("token", token);
  return response.data;
}
