const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || `POST ${path} failed: ${res.status}`);
  return data;
}

export function setAuthToken(token) {
  localStorage.setItem("biff_admin_token", token);
}

export function getAuthToken() {
  return localStorage.getItem("biff_admin_token");
}

export function clearAuthToken() {
  localStorage.removeItem("biff_admin_token");
}
