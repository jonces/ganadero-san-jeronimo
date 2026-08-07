/**
 * Sistema de prioridades del Copiloto Ganadero.
 */

export const PRIORITY = {
  CRITICA: "critica",
  ALTA:    "alta",
  MEDIA:   "media",
  BAJA:    "baja",
};

export const PRIORITY_CONFIG = {
  critica: {
    id:      "critica",
    label:   "Crítica",
    icono:   "🚨",
    color:   "#DC2626",
    bg:      "#FEF2F2",
    border:  "#FECACA",
    badge:   "#DC2626",
    order:   0,
  },
  alta: {
    id:      "alta",
    label:   "Alta",
    icono:   "⚠️",
    color:   "#EA580C",
    bg:      "#FFF7ED",
    border:  "#FED7AA",
    badge:   "#EA580C",
    order:   1,
  },
  media: {
    id:      "media",
    label:   "Media",
    icono:   "💡",
    color:   "#D97706",
    bg:      "#FFFBEB",
    border:  "#FDE68A",
    badge:   "#D97706",
    order:   2,
  },
  baja: {
    id:      "baja",
    label:   "Baja",
    icono:   "ℹ️",
    color:   "#2563EB",
    bg:      "#EFF6FF",
    border:  "#BFDBFE",
    badge:   "#2563EB",
    order:   3,
  },
};

/** @param {string} priorityId */
export function getPriorityConfig(priorityId) {
  return PRIORITY_CONFIG[priorityId] ?? PRIORITY_CONFIG.baja;
}

/** Ordena alertas por prioridad */
export function sortByPriority(alerts) {
  return [...alerts].sort((a, b) => {
    const oa = PRIORITY_CONFIG[a.priority]?.order ?? 9;
    const ob = PRIORITY_CONFIG[b.priority]?.order ?? 9;
    return oa - ob;
  });
}
