const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function decodePayload(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function getToken() {
  if (typeof window === "undefined") return null;
  // Buscar en sessionStorage (nuevo sistema — por pestaña)
  const fromSession = sessionStorage.getItem("token");
  if (fromSession) return fromSession;
  // Migración automática: si hay token viejo en localStorage, moverlo a sessionStorage
  const fromLocal = localStorage.getItem("token")
    || Object.keys(localStorage).filter(k => k.startsWith("token_")).map(k => localStorage.getItem(k))[0];
  if (fromLocal) {
    sessionStorage.setItem("token", fromLocal);
    localStorage.removeItem("token");
    Object.keys(localStorage).filter(k => k.startsWith("token_")).forEach(k => localStorage.removeItem(k));
    return fromLocal;
  }
  return null;
}

export async function api(path, { method = "GET", body, isForm = false } = {}) {
  const token = getToken();
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data?.error === "FINCA_SUSPENDIDA") {
      if (typeof window !== "undefined") sessionStorage.setItem("finca_suspendida", "1");
    }
    throw new Error(data?.error || "Error en la solicitud");
  }
  if (typeof window !== "undefined") sessionStorage.removeItem("finca_suspendida");
  return data;
}

export function saveToken(token) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("token", token);
  // Limpiar tokens viejos de localStorage si existen
  localStorage.removeItem("token");
  Object.keys(localStorage).filter(k => k.startsWith("token_")).forEach(k => localStorage.removeItem(k));
}

export function logout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("finca_suspendida");
}

export function getUsuario() {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;
  try {
    const payload = decodePayload(token);
    return {
      id: payload.sub,
      nombre: payload.nombre,
      role: payload.role,
      cargo: payload.cargo,
    };
  } catch { return null; }
}
