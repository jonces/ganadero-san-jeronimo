// Builds the context payload injected into every AI request
// This runs server-side so it can safely call the backend

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function safeFetch(path, authToken) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = authToken;
    const r = await fetch(`${API}${path}`, {
      cache:  "no-store",
      headers,
      signal: AbortSignal.timeout(3000),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

export async function buildContext({ usuario, empresa, finca, idioma = "es-CO", agentId, authToken = "" }) {
  const [dashboard, eventos, incidentes, inventario] = await Promise.all([
    safeFetch("/dashboard", authToken),
    safeFetch("/eventos", authToken),
    safeFetch("/incidentes", authToken),
    safeFetch("/insumos", authToken),
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
    .map(i => `${i.nombre}: ${i.stockActual ?? i.cantidad ?? 0} ${i.unidad ?? ""}`)
    .join(", ");

  const d = dashboard;
  const h = d?.resumenHato ?? {};
  const monedaFinca = "NIO (córdobas nicaragüenses)";

  return `=== CONTEXTO DE LA OPERACIÓN GANADERA ===
Fecha y hora: ${now}
Moneda: ${monedaFinca}

FINCA ACTIVA: ${d?.nombreFinca ?? finca ?? "Finca"}
ESPECIALISTA IA: ${agentId ?? "Asistente General"}

HATO (animales con estado ACTIVO):
• Total activos: ${d?.animalesActivos ?? "—"}
• Vacas: ${h.vacas ?? "—"} | Toros: ${h.toros ?? "—"} | Novillos: ${h.novillos ?? "—"} | Novillas: ${h.novillas ?? "—"}
• Terneros: ${h.terneros ?? "—"} | Terneras: ${h.terneras ?? "—"}
• Preñadas: ${h.prenadas ?? "—"} | En venta: ${h.enVenta ?? "—"} | Reservados: ${h.reservados ?? "—"}
• Peso promedio: ${d?.pesoPromedio ? `${Math.round(d.pesoPromedio)} kg` : "—"}
• Tasa de preñez: ${d?.tasaPrenez ? `${d.tasaPrenez.toFixed(1)}%` : "—"}
• Nacimientos este mes: ${h.nacimientosMes ?? "—"}
• Natalidad anual: ${d?.natalidad ? `${d.natalidad.toFixed(1)}%` : "—"}
• Mortalidad anual: ${d?.mortalidad ? `${d.mortalidad.toFixed(1)}%` : "—"}

FINANZAS DEL MES:
• Ventas: ${d?.ventasMes?.total ? `C$${d.ventasMes.total.toLocaleString("es-NI")}` : "—"} (${d?.ventasMes?.cantidad ?? 0} animales)
• Gastos: ${d?.gastosMes?.total ? `C$${d.gastosMes.total.toLocaleString("es-NI")}` : "—"}
• Ganancia neta: ${d?.gananciaNeta != null ? `C$${d.gananciaNeta.toLocaleString("es-NI")}` : "—"}
• Caja disponible: ${d?.cajaDisponible != null ? `C$${d.cajaDisponible.toLocaleString("es-NI")}` : "—"}
• Valor estimado del hato: ${d?.valorEstimadoHato ? `C$${d.valorEstimadoHato.toLocaleString("es-NI")}` : "—"}

ALERTAS SANITARIAS ACTIVAS:
${alertasCriticas || "• Sin alertas activas"}

PRÓXIMOS EVENTOS:
${eventosPrximos || "• Sin eventos programados"}

INVENTARIO DESTACADO:
${invResumen || "• Sin datos de inventario"}

INSTRUCCIÓN CRÍTICA: Los datos del HATO y FINANZAS de arriba son los datos REALES y ACTUALES de la finca.
Úsalos como fuente de verdad. Nunca inventes ni estimes cifras que no aparezcan en este contexto.
Si el usuario pregunta algo que no está aquí, usa las herramientas disponibles para obtenerlo.
=== FIN DEL CONTEXTO ===`;
}
