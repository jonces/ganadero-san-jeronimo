const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function decodePayload(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function tokenKey(userId) {
  return userId ? `token_${userId}` : "token";
}

function getToken() {
  if (typeof window === "undefined") return null;
  // Intentar con clave específica de usuario primero
  const keys = Object.keys(localStorage).filter(k => k.startsWith("token_"));
  for (const k of keys) {
    const t = localStorage.getItem(k);
    if (t) return t;
  }
  // Fallback: clave genérica (usuarios que aún no migraron)
  return localStorage.getItem("token");
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
      if (typeof window !== "undefined") localStorage.setItem("finca_suspendida", "1");
    }
    throw new Error(data?.error || "Error en la solicitud");
  }
  if (typeof window !== "undefined") localStorage.removeItem("finca_suspendida");
  return data;
}

export function saveToken(token) {
  // Guardar con clave específica del usuario
  const payload = decodePayload(token);
  const key = tokenKey(payload?.sub);
  // Limpiar token genérico viejo si existe
  localStorage.removeItem("token");
  localStorage.setItem(key, token);
}

export function logout() {
  // Limpiar token del usuario actual
  const keys = Object.keys(localStorage).filter(k => k.startsWith("token_"));
  keys.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem("token"); // legacy
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
