/**
 * Motor de automatización: plantillas de reglas y tipos de condición/acción.
 */

export const RULE_TRIGGER = {
  TANQUE_BAJO:          "tanque_bajo",
  CERCA_FALLA:          "cerca_falla",
  ANIMAL_FUERA:         "animal_fuera",
  TEMPERATURA_ALTA:     "temperatura_alta",
  TEMPERATURA_BAJA:     "temperatura_baja",
  MEDICAMENTO_VENCE:    "medicamento_vence",
  DISPOSITIVO_OFFLINE:  "dispositivo_offline",
  LLUVIA_BAJA:          "lluvia_baja",
  BATERIA_BAJA:         "bateria_baja",
  PESO_ANOMALO:         "peso_anomalo",
  SENSOR_LIMITE:        "sensor_limite",
};

export const RULE_ACTION = {
  ALERTA_VISUAL:  "alerta_visual",
  ALERTA_SONORA:  "alerta_sonora",
  EMAIL:          "email",
  WHATSAPP:       "whatsapp",
  PUSH:           "push",
  SMS:            "sms",
  CREAR_TAREA:    "crear_tarea",
  ACTIVAR_BOMBA:  "activar_bomba",
  CORTAR_CERCA:   "cortar_cerca",
};

export const RULE_ACTION_CONFIG = {
  alerta_visual:  { label: "Alerta visual",   icono: "🔔", disponible: true  },
  alerta_sonora:  { label: "Alerta sonora",   icono: "🔊", disponible: true  },
  email:          { label: "Correo",           icono: "✉️",  disponible: true  },
  whatsapp:       { label: "WhatsApp",         icono: "💬", disponible: false, nota: "Requiere API WhatsApp Business" },
  push:           { label: "Notif. push",     icono: "📲", disponible: false, nota: "Requiere service worker" },
  sms:            { label: "SMS",              icono: "📱", disponible: false, nota: "Requiere proveedor SMS" },
  crear_tarea:    { label: "Crear tarea",     icono: "📋", disponible: true  },
  activar_bomba:  { label: "Activar bomba",   icono: "🔧", disponible: false, nota: "Requiere dispositivo conectado" },
  cortar_cerca:   { label: "Cortar cerca",    icono: "⚡", disponible: false, nota: "Requiere dispositivo conectado" },
};

/** Plantillas de reglas predefinidas. */
export const RULE_TEMPLATES = [
  {
    id:          "tpl-tanque-bajo",
    titulo:      "Tanque de agua bajo",
    descripcion: "Alerta cuando el nivel del tanque baje del umbral configurado.",
    icono:       "🪣",
    trigger:     RULE_TRIGGER.TANQUE_BAJO,
    condicion:   { campo: "nivel_pct", operador: "menor_que", valor: 20 },
    acciones:    [RULE_ACTION.ALERTA_VISUAL, RULE_ACTION.CREAR_TAREA],
    prioridad:   "alta",
    activa:      true,
    tipoDispositivo: "sensor_tanque",
  },
  {
    id:          "tpl-cerca-falla",
    titulo:      "Falla en cerca eléctrica",
    descripcion: "Notifica cuando el voltaje de la cerca cae por debajo del mínimo.",
    icono:       "⚡",
    trigger:     RULE_TRIGGER.CERCA_FALLA,
    condicion:   { campo: "voltaje_v", operador: "menor_que", valor: 2000 },
    acciones:    [RULE_ACTION.ALERTA_VISUAL, RULE_ACTION.EMAIL],
    prioridad:   "critica",
    activa:      true,
    tipoDispositivo: "sensor_cerca",
  },
  {
    id:          "tpl-animal-fuera",
    titulo:      "Animal fuera del perímetro",
    descripcion: "Alerta cuando un collar GPS detecta al animal fuera de la geocerca.",
    icono:       "🐄",
    trigger:     RULE_TRIGGER.ANIMAL_FUERA,
    condicion:   { campo: "geocerca_activa", operador: "igual", valor: false },
    acciones:    [RULE_ACTION.ALERTA_VISUAL, RULE_ACTION.PUSH, RULE_ACTION.WHATSAPP],
    prioridad:   "critica",
    activa:      true,
    tipoDispositivo: "collar",
  },
  {
    id:          "tpl-temp-alta",
    titulo:      "Temperatura ambiente alta",
    descripcion: "Alerta de estrés calórico cuando la temperatura supera el límite.",
    icono:       "🌡️",
    trigger:     RULE_TRIGGER.TEMPERATURA_ALTA,
    condicion:   { campo: "temperatura_c", operador: "mayor_que", valor: 35 },
    acciones:    [RULE_ACTION.ALERTA_VISUAL, RULE_ACTION.CREAR_TAREA],
    prioridad:   "alta",
    activa:      true,
    tipoDispositivo: "sensor_temp",
  },
  {
    id:          "tpl-medicamento-vence",
    titulo:      "Medicamento próximo a vencer",
    descripcion: "Crea tarea cuando un medicamento vence en menos de 30 días.",
    icono:       "💊",
    trigger:     RULE_TRIGGER.MEDICAMENTO_VENCE,
    condicion:   { campo: "dias_vencimiento", operador: "menor_que", valor: 30 },
    acciones:    [RULE_ACTION.CREAR_TAREA, RULE_ACTION.ALERTA_VISUAL],
    prioridad:   "media",
    activa:      true,
    tipoDispositivo: null,
  },
  {
    id:          "tpl-dispositivo-offline",
    titulo:      "Dispositivo sin conexión",
    descripcion: "Alerta cuando un dispositivo no reporta en el tiempo esperado.",
    icono:       "📴",
    trigger:     RULE_TRIGGER.DISPOSITIVO_OFFLINE,
    condicion:   { campo: "minutos_sin_reporte", operador: "mayor_que", valor: 30 },
    acciones:    [RULE_ACTION.ALERTA_VISUAL],
    prioridad:   "baja",
    activa:      true,
    tipoDispositivo: null,
  },
  {
    id:          "tpl-bateria-baja",
    titulo:      "Batería baja en dispositivo",
    descripcion: "Alerta cuando la batería de un dispositivo baja del 15%.",
    icono:       "🔋",
    trigger:     RULE_TRIGGER.BATERIA_BAJA,
    condicion:   { campo: "bateria_pct", operador: "menor_que", valor: 15 },
    acciones:    [RULE_ACTION.ALERTA_VISUAL],
    prioridad:   "media",
    activa:      true,
    tipoDispositivo: null,
  },
];

export const PRIORIDAD_CONFIG = {
  critica: { label: "Crítica", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  alta:    { label: "Alta",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  media:   { label: "Media",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  baja:    { label: "Baja",    color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

export const OPERADOR_CONFIG = {
  menor_que:    { label: "<",      fn: (a, b) => a < b  },
  mayor_que:    { label: ">",      fn: (a, b) => a > b  },
  igual:        { label: "=",      fn: (a, b) => a === b },
  diferente:    { label: "≠",      fn: (a, b) => a !== b },
  mayor_igual:  { label: "≥",     fn: (a, b) => a >= b  },
  menor_igual:  { label: "≤",     fn: (a, b) => a <= b  },
};
