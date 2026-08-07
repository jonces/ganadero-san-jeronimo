/**
 * Estados de órdenes, pagos y envíos del Marketplace.
 */

export const ORDER_STATUS = {
  PENDIENTE:       "pendiente",
  ACEPTADA:        "aceptada",
  EN_PREPARACION:  "en_preparacion",
  EN_TRANSITO:     "en_transito",
  ENTREGADA:       "entregada",
  CANCELADA:       "cancelada",
};

export const ORDER_STATUS_CONFIG = {
  pendiente:       { label: "Pendiente",      color: "#d97706", bg: "#fffbeb", icono: "⏳", orden: 1 },
  aceptada:        { label: "Aceptada",       color: "#2563eb", bg: "#eff6ff", icono: "✅", orden: 2 },
  en_preparacion:  { label: "En preparación", color: "#7c3aed", bg: "#f5f3ff", icono: "📦", orden: 3 },
  en_transito:     { label: "En tránsito",    color: "#0891b2", bg: "#ecfeff", icono: "🚚", orden: 4 },
  entregada:       { label: "Entregada",      color: "#16a34a", bg: "#f0fdf4", icono: "🎉", orden: 5 },
  cancelada:       { label: "Cancelada",      color: "#dc2626", bg: "#fef2f2", icono: "❌", orden: 0 },
};

export const PAYMENT_METHOD = {
  STRIPE:          "stripe",
  PAYPAL:          "paypal",
  TRANSFERENCIA:   "transferencia",
  ACH:             "ach",
  TARJETA:         "tarjeta",
  CRIPTO:          "cripto",
};

export const PAYMENT_METHOD_CONFIG = {
  stripe:        { label: "Stripe",         icono: "💳", disponible: false, nota: "Próximamente — requiere cuenta Stripe" },
  paypal:        { label: "PayPal",         icono: "🅿️",  disponible: false, nota: "Próximamente — requiere cuenta PayPal" },
  transferencia: { label: "Transferencia",  icono: "🏦", disponible: true  },
  ach:           { label: "ACH",            icono: "🔄", disponible: false, nota: "Próximamente — requiere integración bancaria" },
  tarjeta:       { label: "Tarjeta",        icono: "💳", disponible: false, nota: "Próximamente — requiere PSP" },
  cripto:        { label: "Criptomoneda",   icono: "₿",  disponible: false, nota: "Próximamente — requiere wallet integration" },
};

export const QUOTE_STATUS = {
  ENVIADA:   "enviada",
  EN_NEGOCIACION: "en_negociacion",
  ACEPTADA:  "aceptada",
  RECHAZADA: "rechazada",
  EXPIRADA:  "expirada",
};

export const SHIPMENT_STATUS = {
  PENDIENTE:  "pendiente",
  PREPARANDO: "preparando",
  DESPACHADO: "despachado",
  EN_RUTA:    "en_ruta",
  ENTREGADO:  "entregado",
};
