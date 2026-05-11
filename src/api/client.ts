import axios from "axios";

// ── Instancia base ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ── Interceptor: inyecta el token automáticamente ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// ── Interceptor: manejo global de errores ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || "Error desconocido";
    return Promise.reject(new Error(msg));
  }
);
// ── Helpers de conveniencia (reemplazan apiFetch / authHeader / jsonHeaders) ──
export const apiFetch = {
  get:    (url: string) =>
    api.get(url).then(r => r.data),

  post:   (url: string, body?: unknown) =>
    api.post(url, body).then(r => r.data),

  postForm: (url: string, form: FormData) =>
    api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),

  put:    (url: string, body?: unknown) =>
    api.put(url, body).then(r => r.data),

  patch:  (url: string, body?: unknown) =>
    api.patch(url, body).then(r => r.data),

  delete: (url: string) =>
    api.delete(url).then(r => r.data),
};