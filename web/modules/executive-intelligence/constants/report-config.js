export const REPORT_FORMATS = [
  { id: "csv",          label: "Excel / CSV",       icono: "📊", color: "#16a34a", disponible: true  },
  { id: "html",         label: "Informe HTML",       icono: "🖥️",  color: "#0891b2", disponible: true  },
  { id: "print",        label: "PDF (imprimir)",     icono: "📄", color: "#dc2626", disponible: true  },
  { id: "word",         label: "Word / DOCX",        icono: "📝", color: "#2563eb", disponible: false },
  { id: "presentacion", label: "Presentación",       icono: "📽️",  color: "#7c3aed", disponible: false },
  { id: "dashboard",    label: "Dashboard PNG",      icono: "📈", color: "#d97706", disponible: false },
];

export const REPORT_FRECUENCIAS = [
  { id: "diario",  label: "Diario",  cron: "0 7 * * *"   },
  { id: "semanal", label: "Semanal", cron: "0 7 * * 1"   },
  { id: "mensual", label: "Mensual", cron: "0 7 1 * *"   },
  { id: "anual",   label: "Anual",   cron: "0 7 1 1 *"   },
];

export const REPORT_CANALES = [
  { id: "correo",   label: "Correo",       icono: "📧", disponible: true  },
  { id: "whatsapp", label: "WhatsApp",     icono: "📱", disponible: false },
  { id: "push",     label: "Notificación", icono: "🔔", disponible: false },
];
