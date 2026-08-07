/**
 * Taxonomía de tipos de alerta del Copiloto Ganadero.
 */

export const ALERT_TYPE = {
  // Sanitario
  MORTALIDAD_ALTA:       "mortalidad_alta",
  VACUNA_PENDIENTE:      "vacuna_pendiente",
  MEDICAMENTO_VENCER:    "medicamento_vencer",
  RIESGO_SANITARIO:      "riesgo_sanitario",
  INCIDENTE_ABIERTO:     "incidente_abierto",

  // Reproductivo
  BAJA_PRENEZ:           "baja_prenez",
  VACA_SIN_PRENEZ:       "vaca_sin_prenez",
  IEP_ELEVADO:           "iep_elevado",
  ANESTRO_PROBABLE:      "anestro_probable",

  // Nutricional / Peso
  PERDIDA_PESO:          "perdida_peso",
  BAJO_BCS:              "bajo_bcs",

  // Financiero
  FLUJO_NEGATIVO:        "flujo_negativo",
  MARGEN_BAJO:           "margen_bajo",
  PERDIDA_NETA:          "perdida_neta",
  CUENTAS_VENCER:        "cuentas_vencer",
  OPORTUNIDAD_VENTA:     "oportunidad_venta",

  // Pasturas / Infraestructura
  POTRERO_DESCANSO:      "potrero_descanso",
  CARGA_EXCESIVA:        "carga_excesiva",

  // Administrativo
  EVENTO_PROXIMO:        "evento_proximo",
  TAREA_PENDIENTE:       "tarea_pendiente",

  // Oportunidad
  OPORTUNIDAD_COMPRA:    "oportunidad_compra",
  META_ALCANZADA:        "meta_alcanzada",
};

export const ALERT_TYPE_CONFIG = {
  [ALERT_TYPE.MORTALIDAD_ALTA]:    { categoria: "sanitario",     icono: "💀", label: "Mortalidad elevada"      },
  [ALERT_TYPE.VACUNA_PENDIENTE]:   { categoria: "sanitario",     icono: "💉", label: "Vacuna pendiente"         },
  [ALERT_TYPE.MEDICAMENTO_VENCER]: { categoria: "sanitario",     icono: "💊", label: "Medicamento por vencer"   },
  [ALERT_TYPE.RIESGO_SANITARIO]:   { categoria: "sanitario",     icono: "🦠", label: "Riesgo sanitario"         },
  [ALERT_TYPE.INCIDENTE_ABIERTO]:  { categoria: "sanitario",     icono: "🩺", label: "Incidente abierto"        },
  [ALERT_TYPE.BAJA_PRENEZ]:        { categoria: "reproductivo",  icono: "🐄", label: "Tasa de preñez baja"      },
  [ALERT_TYPE.VACA_SIN_PRENEZ]:    { categoria: "reproductivo",  icono: "📅", label: "Vaca sin preñez reciente" },
  [ALERT_TYPE.IEP_ELEVADO]:        { categoria: "reproductivo",  icono: "⏱️", label: "IEP elevado"              },
  [ALERT_TYPE.ANESTRO_PROBABLE]:   { categoria: "reproductivo",  icono: "🔴", label: "Anestro probable"         },
  [ALERT_TYPE.PERDIDA_PESO]:       { categoria: "nutricional",   icono: "⚖️", label: "Pérdida de peso"          },
  [ALERT_TYPE.BAJO_BCS]:           { categoria: "nutricional",   icono: "📉", label: "Condición corporal baja"  },
  [ALERT_TYPE.FLUJO_NEGATIVO]:     { categoria: "financiero",    icono: "💸", label: "Flujo de caja negativo"   },
  [ALERT_TYPE.MARGEN_BAJO]:        { categoria: "financiero",    icono: "📊", label: "Margen bajo"              },
  [ALERT_TYPE.PERDIDA_NETA]:       { categoria: "financiero",    icono: "🔻", label: "Pérdida neta"             },
  [ALERT_TYPE.CUENTAS_VENCER]:     { categoria: "financiero",    icono: "📋", label: "Cuentas por vencer"       },
  [ALERT_TYPE.OPORTUNIDAD_VENTA]:  { categoria: "financiero",    icono: "🤝", label: "Oportunidad de venta"     },
  [ALERT_TYPE.POTRERO_DESCANSO]:   { categoria: "pasturas",      icono: "🌿", label: "Potrero necesita descanso" },
  [ALERT_TYPE.CARGA_EXCESIVA]:     { categoria: "pasturas",      icono: "🐂", label: "Exceso de carga animal"   },
  [ALERT_TYPE.EVENTO_PROXIMO]:     { categoria: "administrativo",icono: "📆", label: "Evento próximo"           },
  [ALERT_TYPE.TAREA_PENDIENTE]:    { categoria: "administrativo",icono: "✅", label: "Tarea pendiente"          },
  [ALERT_TYPE.OPORTUNIDAD_COMPRA]: { categoria: "oportunidad",   icono: "🛒", label: "Oportunidad de compra"    },
  [ALERT_TYPE.META_ALCANZADA]:     { categoria: "oportunidad",   icono: "🏆", label: "Meta alcanzada"           },
};

export const CATEGORIAS_ALERTA = {
  sanitario:      { label: "Sanitario",      icono: "🏥", color: "#DC2626" },
  reproductivo:   { label: "Reproductivo",   icono: "🐄", color: "#EC4899" },
  nutricional:    { label: "Nutricional",    icono: "🌾", color: "#D97706" },
  financiero:     { label: "Financiero",     icono: "💰", color: "#059669" },
  pasturas:       { label: "Pasturas",       icono: "🌿", color: "#10A37F" },
  administrativo: { label: "Administrativo", icono: "📋", color: "#6366F1" },
  oportunidad:    { label: "Oportunidad",    icono: "⭐", color: "#7C3AED" },
};
