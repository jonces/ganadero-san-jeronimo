/**
 * Generador de planes de acción a partir de alertas priorizadas.
 * Produce planes: día, semana, mes, año.
 */

import { PRIORITY } from "../constants/priorities.js";

/**
 * @param {import('../types').CopilotoAlert[]} alerts
 * @param {object} [opts]
 * @param {string} [opts.tipo] — "dia" | "semana" | "mes" | "año"
 * @returns {import('../types').CopilotoPlane}
 */
export function generatePlan(alerts, opts = { tipo: "semana" }) {
  const { tipo = "semana" } = opts;
  const hoy = new Date();

  const tareas = buildTareasFromAlerts(alerts, tipo);

  return {
    id:          `plan-${tipo}-${Date.now()}`,
    tipo,
    titulo:      planTitulo(tipo, hoy),
    generadoEn:  hoy.toISOString(),
    periodoLabel: planPeriodo(tipo, hoy),
    tareas,
    resumen: {
      total:    tareas.length,
      criticas: tareas.filter(t => t.prioridad === PRIORITY.CRITICA).length,
      altas:    tareas.filter(t => t.prioridad === PRIORITY.ALTA).length,
    },
  };
}

/**
 * Genera múltiples planes de una vez.
 * @param {import('../types').CopilotoAlert[]} alerts
 */
export function generateAllPlans(alerts) {
  return {
    dia:    generatePlan(alerts, { tipo: "dia"    }),
    semana: generatePlan(alerts, { tipo: "semana" }),
    mes:    generatePlan(alerts, { tipo: "mes"    }),
    anio:   generatePlan(alerts, { tipo: "año"    }),
  };
}

function buildTareasFromAlerts(alerts, tipo) {
  const tareas = [];
  const ahora  = new Date();

  for (const alert of alerts) {
    const tarea = alertToTarea(alert, tipo, ahora);
    if (tarea) tareas.push(tarea);
  }

  // Agregar tareas estándar periódicas si no están cubiertas
  const tieneSanitario = tareas.some(t => t.categoria === "sanitario");
  if (!tieneSanitario && (tipo === "semana" || tipo === "mes")) {
    tareas.push({
      id:          `std-revision-${Date.now()}`,
      prioridad:   PRIORITY.MEDIA,
      categoria:   "sanitario",
      icono:       "🩺",
      titulo:      tipo === "semana" ? "Revisión sanitaria semanal" : "Revisión sanitaria mensual",
      descripcion: "Observación general del hato: comportamiento, apetito, locomoción, condición corporal.",
      accion:      "consultar_especialista",
      especialista: "veterinario",
      diasSugeridos: tipo === "semana" ? ["Lunes", "Jueves"] : ["Primer día hábil del mes"],
      duracionMin:  30,
    });
  }

  if (tipo === "mes" || tipo === "año") {
    tareas.push({
      id:          `std-financiero-${Date.now()}`,
      prioridad:   PRIORITY.MEDIA,
      categoria:   "financiero",
      icono:       "📊",
      titulo:      "Análisis financiero mensual",
      descripcion: "Revisar flujo de caja, margen de ganancia, proyección del mes siguiente.",
      accion:      "analizar_finanzas",
      href:        "/finanzas",
      diasSugeridos: ["Último día hábil del mes"],
      duracionMin:  60,
    });
  }

  return tareas.sort((a, b) => {
    const pOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
    return (pOrder[a.prioridad] ?? 9) - (pOrder[b.prioridad] ?? 9);
  });
}

function alertToTarea(alert, tipo, ahora) {
  const pOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
  const alertOrder = pOrder[alert.priority] ?? 9;

  // Filtrar por relevancia según tipo de plan
  if (tipo === "dia"    && alertOrder > 1) return null; // Solo críticas y altas para el día
  if (tipo === "semana" && alertOrder > 2) return null; // Hasta medias para la semana

  const cats = {
    mortalidad_alta:       { cat: "sanitario",     icono: "💀", dur: 60  },
    vacuna_pendiente:      { cat: "sanitario",     icono: "💉", dur: 120 },
    medicamento_vencer:    { cat: "sanitario",     icono: "💊", dur: 30  },
    incidente_abierto:     { cat: "sanitario",     icono: "🩺", dur: 45  },
    baja_prenez:           { cat: "reproductivo",  icono: "🐄", dur: 60  },
    anestro_probable:      { cat: "reproductivo",  icono: "🔴", dur: 90  },
    perdida_neta:          { cat: "financiero",    icono: "📉", dur: 60  },
    flujo_negativo:        { cat: "financiero",    icono: "💸", dur: 45  },
    margen_bajo:           { cat: "financiero",    icono: "📊", dur: 45  },
    cuentas_vencer:        { cat: "financiero",    icono: "📋", dur: 30  },
    potrero_descanso:      { cat: "pasturas",      icono: "🌿", dur: 60  },
    carga_excesiva:        { cat: "pasturas",      icono: "🐂", dur: 90  },
    evento_proximo:        { cat: "administrativo",icono: "📆", dur: 30  },
    oportunidad_venta:     { cat: "oportunidad",   icono: "🤝", dur: 30  },
  };

  const meta = cats[alert.type] ?? { cat: "general", icono: "📌", dur: 30 };

  return {
    id:           `tarea-${alert.id}`,
    alertId:      alert.id,
    prioridad:    alert.priority,
    categoria:    meta.cat,
    icono:        meta.icono,
    titulo:       alert.titulo,
    descripcion:  alert.descripcion,
    accion:       alert.accion_principal,
    especialista: alert.especialista,
    href:         alert.href,
    duracionMin:  meta.dur,
    completada:   false,
  };
}

function planTitulo(tipo, fecha) {
  const opts = { weekday: "long", day: "numeric", month: "long" };
  switch (tipo) {
    case "dia":    return `Plan del día — ${fecha.toLocaleDateString("es-CO", opts)}`;
    case "semana": return `Plan semanal — Semana del ${lunesDeSemana(fecha).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`;
    case "mes":    return `Plan mensual — ${fecha.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`;
    case "año":    return `Plan anual — ${fecha.getFullYear()}`;
    default:       return "Plan de acción";
  }
}

function planPeriodo(tipo, fecha) {
  switch (tipo) {
    case "dia":    return "Hoy";
    case "semana": return "Esta semana";
    case "mes":    return fecha.toLocaleDateString("es-CO", { month: "long" });
    case "año":    return String(fecha.getFullYear());
    default:       return "";
  }
}

function lunesDeSemana(fecha) {
  const d = new Date(fecha);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}
