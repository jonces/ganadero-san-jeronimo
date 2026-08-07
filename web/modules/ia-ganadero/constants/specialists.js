export const ESPECIALISTAS = [
  { id: "veterinario",     label: "Veterinario",     icono: "🩺", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", badge: "#DC2626" },
  { id: "nutricionista",   label: "Nutricionista",   icono: "🌾", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", badge: "#D97706" },
  { id: "reproduccion",    label: "Reproducción",    icono: "🐄", color: "#EC4899", bg: "#FDF2F8", border: "#FBCFE8", badge: "#DB2777" },
  { id: "pasturas",        label: "Pasturas",        icono: "🌿", color: "#10A37F", bg: "#F0FDF4", border: "#A7F3D0", badge: "#059669" },
  { id: "infraestructura", label: "Infraestructura", icono: "🏗️", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", badge: "#4F46E5" },
  { id: "finanzas",        label: "Finanzas",        icono: "💰", color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD", badge: "#0284C7" },
  { id: "administrador",   label: "Administrador",   icono: "📋", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", badge: "#7C3AED" },
];

/** @param {string} id */
export function getEspecialista(id) {
  return ESPECIALISTAS.find(e => e.id === id) ?? ESPECIALISTAS[0];
}
