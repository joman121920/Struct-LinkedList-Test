#Changed api base url to production url
// frontend/src/data/api.js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function apiFetch(
  path,
  { headers = {}, auth = true, ...options } = {}
) {
  const defaultHeaders = { "Content-Type": "application/json", ...headers };

  const token = localStorage.getItem("authToken");
  if (auth && token) {
    defaultHeaders.Authorization = `Token ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    headers: defaultHeaders,
    ...options,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg = (isJson && body?.error) || body || `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
  return body;
}

export const api = {
  get: (path, options) => apiFetch(path, { method: "GET", ...options }),
  post: (path, data, options) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(data), ...options }),
  put: (path, data, options) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(data), ...options }),
  patch: (path, data, options) =>
    apiFetch(path, { method: "PATCH", body: JSON.stringify(data), ...options }),
  del: (path, options) => apiFetch(path, { method: "DELETE", ...options }),
};

export { API_BASE };
