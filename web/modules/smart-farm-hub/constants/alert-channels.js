/**
 * Canales de alerta del Smart Farm Hub.
 */

export const ALERT_CHANNEL = {
  VISUAL:   "visual",
  SONORA:   "sonora",
  EMAIL:    "email",
  WHATSAPP: "whatsapp",
  PUSH:     "push",
  SMS:      "sms",
};

export const ALERT_CHANNEL_CONFIG = {
  visual:   { label: "Visual",    icono: "🔔", disponible: true,  descripcion: "Notificación en pantalla" },
  sonora:   { label: "Sonora",    icono: "🔊", disponible: true,  descripcion: "Alerta de audio en la app" },
  email:    { label: "Correo",    icono: "✉️",  disponible: true,  descripcion: "Envío por correo electrónico" },
  whatsapp: { label: "WhatsApp",  icono: "💬", disponible: false, descripcion: "API WhatsApp Business (configurar clave)" },
  push:     { label: "Push",      icono: "📲", disponible: false, descripcion: "Notificación push (service worker)" },
  sms:      { label: "SMS",       icono: "📱", disponible: false, descripcion: "Requiere proveedor SMS (Twilio, etc.)" },
};

export const ALERT_SEVERITY = {
  CRITICA: "critica",
  ALTA:    "alta",
  MEDIA:   "media",
  BAJA:    "baja",
  INFO:    "info",
};

export const ALERT_SEVERITY_CONFIG = {
  critica: { label: "Crítica", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", icono: "🔴" },
  alta:    { label: "Alta",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", icono: "🟡" },
  media:   { label: "Media",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icono: "🔵" },
  baja:    { label: "Baja",    color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icono: "⚪" },
  info:    { label: "Info",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", icono: "🟢" },
};
