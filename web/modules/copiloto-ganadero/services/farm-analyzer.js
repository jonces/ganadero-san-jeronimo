/**
 * Motor de análisis de finca — convierte datos del dashboard en alertas priorizadas.
 * Es puramente funcional: recibe datos, retorna alertas. Sin efectos secundarios.
 */

import { PRIORITY }     from "../constants/priorities.js";
import { ALERT_TYPE }   from "../constants/alert-types.js";

let _alertId = 0;
function alert(type, priority, titulo, descripcion, extra = {}) {
  return { id: `alert-${++_alertId}-${type}`, type, priority, titulo, descripcion, ts: Date.now(), ...extra };
}

/**
 * Analiza los datos del dashboard y genera alertas priorizadas.
 *
 * @param {object} dashData    — Respuesta de GET /dashboard
 * @param {object} [extras]    — Datos adicionales opcionales
 * @param {object[]} [extras.eventos]     — Próximos eventos
 * @param {object[]} [extras.incidentes]  — Incidentes abiertos
 * @param {object[]} [extras.insumos]     — Insumos próximos a vencer
 * @returns {import('../types').CopilotoAlert[]}
 */
export function analyzeFarm(dashData, extras = {}) {
  _alertId = 0;
  const alerts = [];
  if (!dashData) return alerts;

  const hato       = dashData.resumenHato   ?? {};
  const ventasMes  = dashData.ventasMes     ?? {};
  const gastosMes  = dashData.gastosMes     ?? {};
  const meses      = dashData.graficaMeses  ?? [];

  const totalHato       = Object.values(hato).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const vacas           = hato.vacas    ?? 0;
  const prenadas        = hato.prenadas ?? 0;
  const tasaPrenez      = dashData.tasaPrenez   ?? null;
  const mortalidad      = dashData.mortalidad   ?? null;
  const gananciaNeta    = dashData.gananciaNeta ?? null;
  const margenGanancia  = dashData.margenGanancia ?? null;
  const cajaDisponible  = dashData.cajaDisponible ?? null;
  const cuentasPagar    = dashData.cuentasPagar   ?? null;
  const animalesActivos = dashData.animalesActivos ?? 0;

  // ── FINANCIERO ────────────────────────────────────────────────────────────

  if (gananciaNeta != null && gananciaNeta < 0) {
    alerts.push(alert(ALERT_TYPE.PERDIDA_NETA, PRIORITY.CRITICA,
      "⚠️ La finca está generando pérdidas",
      `La pérdida neta este mes es de ${fmt(Math.abs(gananciaNeta))}. Revisa los costos y busca aumentar ingresos.`,
      { accion_principal: "analizar_finanzas", href: "/finanzas", datos: { monto: gananciaNeta } },
    ));
  }

  if (cajaDisponible != null && cuentasPagar != null && cuentasPagar > cajaDisponible * 1.2) {
    alerts.push(alert(ALERT_TYPE.FLUJO_NEGATIVO, PRIORITY.CRITICA,
      "Cuentas por pagar superan la caja disponible",
      `Tienes ${fmt(cuentasPagar)} en cuentas pendientes pero solo ${fmt(cajaDisponible)} disponibles.`,
      { accion_principal: "ver_cuentas", href: "/cuentas-pagar", datos: { cuentasPagar, cajaDisponible } },
    ));
  }

  if (margenGanancia != null && margenGanancia >= 0 && margenGanancia < 10) {
    alerts.push(alert(ALERT_TYPE.MARGEN_BAJO, PRIORITY.ALTA,
      `Margen de ganancia bajo (${margenGanancia.toFixed(1)}%)`,
      "Un margen inferior al 10% pone en riesgo la sostenibilidad. Analiza los costos principales.",
      { accion_principal: "analizar_finanzas", href: "/finanzas" },
    ));
  }

  // Tendencia de 3 meses
  if (meses.length >= 3) {
    const ult3 = meses.slice(-3);
    const tendenciaGastos = ult3.every((m, i) => i === 0 || m.gastos > ult3[i - 1].gastos);
    if (tendenciaGastos && ult3[0].gastos > 0) {
      const incremento = ((ult3[2].gastos - ult3[0].gastos) / ult3[0].gastos * 100).toFixed(0);
      alerts.push(alert(ALERT_TYPE.MARGEN_BAJO, PRIORITY.MEDIA,
        `Gastos en aumento por 3 meses consecutivos (+${incremento}%)`,
        "Los gastos han aumentado mes a mes. Revisa si hay categorías que puedan optimizarse.",
        { accion_principal: "analizar_gastos", href: "/gastos" },
      ));
    }
  }

  // ── REPRODUCTIVO ──────────────────────────────────────────────────────────

  if (tasaPrenez != null && tasaPrenez < 50 && vacas > 0) {
    const priority = tasaPrenez < 35 ? PRIORITY.CRITICA : PRIORITY.ALTA;
    alerts.push(alert(ALERT_TYPE.BAJA_PRENEZ, priority,
      `Tasa de preñez baja: ${tasaPrenez.toFixed(1)}% (meta >60%)`,
      "La baja tasa de preñez aumenta el intervalo entre partos y reduce la productividad.",
      { accion_principal: "consultar_especialista", especialista: "reproduccion", href: "/reproduccion",
        datos: { tasaPrenez } },
    ));
  }

  if (vacas > 0 && prenadas != null) {
    const pctPrenadas = (prenadas / vacas) * 100;
    if (pctPrenadas < 30 && vacas >= 5) {
      alerts.push(alert(ALERT_TYPE.ANESTRO_PROBABLE, PRIORITY.ALTA,
        `Solo el ${pctPrenadas.toFixed(0)}% de las vacas están preñadas`,
        "Es posible que haya un problema de anestro o de detección de celo en el hato.",
        { accion_principal: "consultar_especialista", especialista: "reproduccion",
          datos: { vacas, prenadas, pctPrenadas } },
      ));
    }
  }

  // ── SANITARIO ─────────────────────────────────────────────────────────────

  if (mortalidad != null && mortalidad > 3) {
    const priority = mortalidad > 6 ? PRIORITY.CRITICA : PRIORITY.ALTA;
    alerts.push(alert(ALERT_TYPE.MORTALIDAD_ALTA, priority,
      `Mortalidad elevada: ${mortalidad.toFixed(2)}%`,
      "Una mortalidad superior al 3% anual indica posibles problemas sanitarios o nutricionales graves.",
      { accion_principal: "consultar_especialista", especialista: "veterinario",
        datos: { mortalidad } },
    ));
  }

  if (extras.incidentes?.length > 0) {
    const abiertos = extras.incidentes.filter(i => i.estado === "abierto" || i.estado === "pendiente");
    if (abiertos.length > 0) {
      alerts.push(alert(ALERT_TYPE.INCIDENTE_ABIERTO, PRIORITY.ALTA,
        `${abiertos.length} incidente${abiertos.length > 1 ? "s" : ""} sanitario${abiertos.length > 1 ? "s" : ""} abierto${abiertos.length > 1 ? "s" : ""}`,
        `Hay incidentes de salud sin resolver: ${abiertos.slice(0, 2).map(i => i.descripcion ?? i.tipo).join(", ")}`,
        { accion_principal: "ver_incidentes", href: "/incidentes" },
      ));
    }
  }

  if (extras.insumos?.length > 0) {
    const vencen = extras.insumos.filter(i => {
      if (!i.fechaVencimiento) return false;
      const dias = Math.ceil((new Date(i.fechaVencimiento) - new Date()) / 86400000);
      return dias > 0 && dias <= 30;
    });
    if (vencen.length > 0) {
      alerts.push(alert(ALERT_TYPE.MEDICAMENTO_VENCER, PRIORITY.ALTA,
        `${vencen.length} medicamento${vencen.length > 1 ? "s" : ""} venc${vencen.length > 1 ? "en" : "e"} en 30 días`,
        `Revisa: ${vencen.slice(0, 3).map(i => i.nombre).join(", ")}`,
        { accion_principal: "ver_insumos", href: "/insumos" },
      ));
    }
  }

  // ── EVENTOS PRÓXIMOS ──────────────────────────────────────────────────────

  if (extras.eventos?.length > 0) {
    const proximos = extras.eventos.filter(e => {
      if (!e.fecha) return false;
      const dias = Math.ceil((new Date(e.fecha) - new Date()) / 86400000);
      return dias >= 0 && dias <= 7;
    });
    proximos.forEach(ev => {
      const dias = Math.ceil((new Date(ev.fecha) - new Date()) / 86400000);
      alerts.push(alert(ALERT_TYPE.EVENTO_PROXIMO,
        dias === 0 ? PRIORITY.CRITICA : dias <= 2 ? PRIORITY.ALTA : PRIORITY.MEDIA,
        `Evento${dias === 0 ? " HOY" : ` en ${dias} día${dias > 1 ? "s" : ""}`}: ${ev.titulo ?? ev.tipo}`,
        ev.descripcion ?? `Evento programado para el ${new Date(ev.fecha).toLocaleDateString("es-CO")}`,
        { accion_principal: "ver_evento", href: "/eventos", datos: ev },
      ));
    });
  }

  // ── OPORTUNIDADES ─────────────────────────────────────────────────────────

  if (animalesActivos > 0) {
    const enVenta = hato.enVenta ?? 0;
    const novillos = hato.novillos ?? 0;

    if (novillos > 10 && enVenta === 0) {
      alerts.push(alert(ALERT_TYPE.OPORTUNIDAD_VENTA, PRIORITY.BAJA,
        `${novillos} novillos sin marcar para venta`,
        "Tienes novillos que podrían estar listos para comercializar. Evalúa el peso y el mercado actual.",
        { accion_principal: "ver_inventario", href: "/inventario",
          datos: { novillos } },
      ));
    }
  }

  // Alerta positiva si hay buen margen
  if (margenGanancia != null && margenGanancia > 25) {
    alerts.push(alert(ALERT_TYPE.META_ALCANZADA, PRIORITY.BAJA,
      `Excelente margen de ganancia: ${margenGanancia.toFixed(1)}%`,
      "La finca está operando con un margen sólido. Buen momento para considerar inversiones.",
      { accion_principal: "simular_escenario" },
    ));
  }

  // ── RECOMENDACIONES GENERALES (si hay pocos datos) ───────────────────────

  if (alerts.length === 0 && animalesActivos === 0) {
    alerts.push(alert(ALERT_TYPE.TAREA_PENDIENTE, PRIORITY.MEDIA,
      "Registra tu hato para activar el análisis inteligente",
      "El Copiloto necesita datos de tu finca para generar recomendaciones personalizadas.",
      { accion_principal: "ver_inventario", href: "/inventario" },
    ));
  }

  return alerts;
}

/**
 * Genera el resumen ejecutivo del estado de la finca.
 * @param {object} dashData
 * @param {import('../types').CopilotoAlert[]} alerts
 * @returns {{ semaforo: "verde"|"amarillo"|"rojo", texto: string, puntaje: number }}
 */
export function generateFarmSummary(dashData, alerts) {
  const criticas = alerts.filter(a => a.priority === PRIORITY.CRITICA).length;
  const altas    = alerts.filter(a => a.priority === PRIORITY.ALTA).length;

  if (criticas > 0) {
    return {
      semaforo: "rojo",
      texto:    `${criticas} situación${criticas > 1 ? "es críticas" : " crítica"} requiere${criticas === 1 ? "" : "n"} atención inmediata.`,
      puntaje:  Math.max(0, 40 - criticas * 15 - altas * 5),
    };
  }
  if (altas > 1) {
    return {
      semaforo: "amarillo",
      texto:    `${altas} puntos de atención identificados. Revisa las recomendaciones.`,
      puntaje:  Math.max(40, 75 - altas * 8),
    };
  }
  return {
    semaforo: "verde",
    texto:    "La finca opera en parámetros normales. Sin alertas críticas.",
    puntaje:  Math.min(100, 80 + (10 - Math.max(0, alerts.length)) * 2),
  };
}

function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
