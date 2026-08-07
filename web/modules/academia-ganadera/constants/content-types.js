export const CONTENT_TYPE = {
  CURSO:        "curso",
  GUIA:         "guia",
  PROTOCOLO:    "protocolo",
  MANUAL:       "manual",
  INFOGRAFIA:   "infografia",
  PRESENTACION: "presentacion",
  RESUMEN:      "resumen",
  CRONOGRAMA:   "cronograma",
  EJERCICIO:    "ejercicio",
  CASO:         "caso",
  FAQ:          "faq",
  CHECKLIST:    "checklist",
};

export const CONTENT_TYPE_CONFIG = {
  curso:        { id: "curso",        label: "Curso",          icono: "🎓", desc: "Curso estructurado con lecciones y evaluación" },
  guia:         { id: "guia",         label: "Guía",           icono: "📖", desc: "Guía práctica paso a paso" },
  protocolo:    { id: "protocolo",    label: "Protocolo",      icono: "📋", desc: "Protocolo técnico estandarizado" },
  manual:       { id: "manual",       label: "Manual",         icono: "📚", desc: "Manual completo de referencia" },
  infografia:   { id: "infografia",   label: "Infografía",     icono: "📊", desc: "Resumen visual informativo" },
  presentacion: { id: "presentacion", label: "Presentación",   icono: "🖥️", desc: "Presentación para capacitaciones" },
  resumen:      { id: "resumen",      label: "Resumen",        icono: "📝", desc: "Resumen ejecutivo del tema" },
  cronograma:   { id: "cronograma",   label: "Cronograma",     icono: "📅", desc: "Plan de actividades calendarizado" },
  ejercicio:    { id: "ejercicio",    label: "Ejercicio",      icono: "✏️", desc: "Ejercicio práctico evaluativo" },
  caso:         { id: "caso",         label: "Caso Práctico",  icono: "🔍", desc: "Caso real para análisis" },
  faq:          { id: "faq",          label: "Preguntas Frecuentes", icono: "❓", desc: "Respuestas a dudas comunes" },
  checklist:    { id: "checklist",    label: "Checklist",      icono: "✅", desc: "Lista de verificación" },
};

export const LEARNING_MODE = {
  EXPLICAME:     "explicame",
  IMAGENES:      "imagenes",
  PASO_A_PASO:   "paso_a_paso",
  CURSO:         "curso",
  INFOGRAFIA:    "infografia",
  PDF:           "pdf",
  EXAMEN:        "examen",
  PRINCIPIANTE:  "principiante",
  EXPERTO:       "experto",
};

export const LEARNING_MODE_CONFIG = [
  { id: "explicame",    label: "Explícamelo",                 icono: "💬", prompt: "Explica de forma clara y completa:" },
  { id: "imagenes",     label: "Muéstrame imágenes",          icono: "🖼️", prompt: "Explica visualmente con descripción detallada de imágenes:" },
  { id: "paso_a_paso",  label: "Enséñame paso a paso",        icono: "👣", prompt: "Enseña paso a paso con numeración clara:" },
  { id: "curso",        label: "Hazme un curso",              icono: "🎓", prompt: "Crea un curso completo estructurado sobre:" },
  { id: "infografia",   label: "Genera una infografía",       icono: "📊", prompt: "Crea el contenido para una infografía sobre:" },
  { id: "pdf",          label: "Genera un PDF",               icono: "📄", prompt: "Crea un documento completo en formato imprimible sobre:" },
  { id: "examen",       label: "Hazme un examen",             icono: "📝", prompt: "Crea un examen con preguntas de selección múltiple sobre:" },
  { id: "principiante", label: "Como principiante",           icono: "🌱", prompt: "Explica de forma muy sencilla, como si fuera para un principiante:" },
  { id: "experto",      label: "Como experto técnico",        icono: "🏆", prompt: "Explica con profundidad técnica y científica:" },
];
