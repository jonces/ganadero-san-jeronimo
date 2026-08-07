/**
 * Recolector de datos para los motores predictivos.
 * Obtiene dashData del API y datos extras (incidentes, insumos, eventos) en paralelo.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  return res.json();
}

/**
 * Recolecta todos los datos necesarios para los motores predictivos.
 * @returns {{ dashData, extras, ok, errors }}
 */
export async function collectPredictiveData() {
  const errors = [];

  const safe = async (label, fn) => {
    try { return await fn(); }
    catch (e) { errors.push(`${label}: ${e.message}`); return null; }
  };

  const [dashboard, incidentes, insumos, eventos] = await Promise.all([
    safe("dashboard",  () => fetchJSON("/dashboard")),
    safe("incidentes", () => fetchJSON("/incidentes?limit=100")),
    safe("insumos",    () => fetchJSON("/inventario?limit=200")),
    safe("eventos",    () => fetchJSON("/eventos?limit=100")),
  ]);

  return {
    dashData: dashboard ?? {},
    extras: {
      incidentes: incidentes?.data ?? incidentes ?? [],
      insumos:    insumos?.data    ?? insumos    ?? [],
      eventos:    eventos?.data    ?? eventos     ?? [],
    },
    ok: !!dashboard,
    errors,
  };
}
