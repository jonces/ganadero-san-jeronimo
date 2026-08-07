// Builds the context payload injected into every AI request
// This runs server-side so it can safely call the backend

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function safeFetch(path) {
  try {
    const r = await fetch(`${API}${path}`, {
      cache:  "no-store",
      signal: AbortSignal.timeout(3000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export async function buildContext({ usuario, empresa, finca, idioma = "es-CO", agentId }) {
  const [dashboard, eventos, incidentes, inventario] = await Promise.all([
    safeFetch("/dashboard"),
    safeFetch("/eventos"),
    safeFetch("/incidentes"),
    safeFetch("/inventario"),
  ]);

  const now    = new Date().toLocaleString("es-CO", { dateStyle: "full", timeStyle: "short" });
  const moneda = "COP (pesos colombianos)";

  const alertasCriticas = (incidentes ?? [])
    .filter(i => i.estado !== "resuelto")
    .slice(0, 5)
    .map(i => `• ${i.tipo ?? "Incidente"}: ${i.descripcion ?? i.titulo ?? ""}`)
    .join("\n");

  const eventosPrximos = (eventos ?? [])
    .slice(0, 5)
    .map(e => `• ${e.tipo}: ${e.titulo} (${e.fecha ?? "próximamente"})`)
    .join("\n");

  const invResumen = (inventario ?? []).slice(0, 8)
    .map(i => `${i.nombre}: ${i.cantidad} ${i.unidad ?? ""}`)
    .join(", ");

  return `=== CONTEXTO DE LA OPERACIÓN GANADERA ===
Fecha y hora: ${now}
Idioma: Español colombiano | Moneda: ${moneda}

USUARIO: ${usuario ?? "Propietario"}
EMPRESA: ${empresa ?? "Empresa Ganadera"}
FINCA ACTIVA: ${finca ?? "Finca Principal"}
ESPECIALISTA IA: ${agentId ?? "Asistente General"}

RESUMEN DEL HATO:
${dashboard
  ? `• Total animales: ${dashboard.totalAnimales ?? "—"}
• Categorías: ${JSON.stringify(dashboard.categorias ?? {})}
• Ingresos mes: ${dashboard.ingresos ? `$${(dashboard.ingresos / 1e6).toFixed(1)}M COP` : "—"}
• Gastos mes: ${dashboard.gastos ? `$${(dashboard.gastos / 1e6).toFixed(1)}M COP` : "—"}`
  : "• Backend no disponible — usar datos estimados"}

ALERTAS SANITARIAS ACTIVAS:
${alertasCriticas || "• Sin alertas activas"}

PRÓXIMOS EVENTOS:
${eventosPrximos || "• Sin eventos programados"}

INVENTARIO DESTACADO:
${invResumen || "• Sin datos de inventario"}

INSTRUCCIÓN: Usa este contexto para responder con información precisa de la finca.
Nunca inventes datos que no estén en el contexto. Si necesitas más información, usa las herramientas disponibles.
=== FIN DEL CONTEXTO ===`;
}
