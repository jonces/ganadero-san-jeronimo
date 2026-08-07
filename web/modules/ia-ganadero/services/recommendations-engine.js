/**
 * Motor de recomendaciones automáticas basado en el contexto de la finca.
 * Genera sugerencias proactivas sin necesidad de que el usuario pregunte.
 */

/**
 * @typedef {object} Recommendation
 * @property {string} id
 * @property {string} specialistId  - Especialista que debe atender la recomendación
 * @property {string} icono
 * @property {"alta"|"media"|"baja"} prioridad
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string} consulta      - Texto sugerido para enviar al especialista
 */

/**
 * Genera recomendaciones a partir del contexto de la finca disponible.
 * @param {import('../types/conversation-context').ConversationContext|null} context
 * @returns {Recommendation[]}
 */
export function generateRecommendations(context) {
  if (!context?.finca) return [];

  const recs = [];
  const { finca } = context;
  const now = new Date();
  const mes = now.getMonth() + 1; // 1–12

  // Época seca Colombia aprox. dic–mar y jul–ago
  const epocaSeca = (mes >= 12 || mes <= 3) || (mes >= 7 && mes <= 8);

  // Recomendaciones estacionales — época seca
  if (epocaSeca) {
    recs.push({
      id:           "suplementacion-seca",
      specialistId: "nutricionista",
      icono:        "🌾",
      prioridad:    "alta",
      titulo:       "Suplementación en época seca",
      descripcion:  "Las praderas reducen su producción. Evalúa la condición corporal y ajusta la suplementación.",
      consulta:     "Estamos entrando a la época seca. ¿Qué suplementación debo dar a mis vacas para evitar pérdida de condición corporal?",
    });

    recs.push({
      id:           "aforo-seco",
      specialistId: "pasturas",
      icono:        "🌿",
      prioridad:    "media",
      titulo:       "Aforo de potreros",
      descripcion:  "Mide la biomasa disponible para planificar la rotación en meses de menor producción de forraje.",
      consulta:     "¿Cómo hago el aforo de mis potreros para estimar cuántos días me dura el pasto en época seca?",
    });
  }

  // Verificación de vacunación aftosa — ciclos en Colombia: abril y octubre
  if (mes === 3 || mes === 9) {
    recs.push({
      id:           "vacunacion-aftosa",
      specialistId: "veterinario",
      icono:        "💉",
      prioridad:    "alta",
      titulo:       "Próxima vacunación aftosa",
      descripcion:  "En Colombia la vacunación contra fiebre aftosa es obligatoria cada 6 meses. El ciclo se acerca.",
      consulta:     "¿Cómo planifico la vacunación contra fiebre aftosa para todo el hato? ¿Qué más vacunas debo dar en este ciclo?",
    });
  }

  // Recomendaciones basadas en tamaño del hato
  if (finca.animales != null) {
    if (finca.animales > 50 && !finca.registros) {
      recs.push({
        id:           "registros-productivos",
        specialistId: "produccion",
        icono:        "📈",
        prioridad:    "media",
        titulo:       "Implementar registros productivos",
        descripcion:  "Con más de 50 animales, los registros permiten identificar las vacas más rentables.",
        consulta:     "¿Qué registros productivos básicos debo llevar en una finca con " + finca.animales + " animales?",
      });
    }

    if (finca.animales > 100) {
      recs.push({
        id:           "flujo-caja",
        specialistId: "finanzas",
        icono:        "💰",
        prioridad:    "media",
        titulo:       "Planificar flujo de caja",
        descripcion:  "Un hato de más de 100 animales requiere planificación financiera anual para anticipar necesidades de caja.",
        consulta:     "¿Cómo hago un flujo de caja anual para mi finca con " + finca.animales + " animales?",
      });
    }
  }

  // Recomendaciones de bienestar
  recs.push({
    id:           "check-bienestar",
    specialistId: "bienestar",
    icono:        "❤️",
    prioridad:    "baja",
    titulo:       "Evaluación de bienestar animal",
    descripcion:  "Realiza una evaluación periódica de las cinco libertades para identificar problemas ocultos.",
    consulta:     "¿Cómo evalúo el bienestar de mi hato con una revisión rápida en campo?",
  });

  // Limitar a 4 recomendaciones máximo, ordenadas por prioridad
  const orden = { alta: 0, media: 1, baja: 2 };
  return recs
    .sort((a, b) => orden[a.prioridad] - orden[b.prioridad])
    .slice(0, 4);
}

/**
 * Devuelve el color de badge según la prioridad.
 * @param {"alta"|"media"|"baja"} prioridad
 */
export function prioridadColor(prioridad) {
  return { alta: "#EF4444", media: "#F59E0B", baja: "#6B7280" }[prioridad] ?? "#6B7280";
}

/**
 * Devuelve el label legible de la prioridad.
 * @param {"alta"|"media"|"baja"} prioridad
 */
export function prioridadLabel(prioridad) {
  return { alta: "Alta", media: "Media", baja: "Baja" }[prioridad] ?? "";
}
