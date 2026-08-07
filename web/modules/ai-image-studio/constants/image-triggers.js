/**
 * Palabras clave que activan la generación automática de imágenes en el chat.
 * La detección es case-insensitive y busca cualquiera de estos términos.
 */

export const IMAGE_TRIGGER_VERBS = [
  "diseña", "diseñar", "diseño",
  "genera", "generar", "generame",
  "muéstrame", "muestrame", "muéstrame",
  "ilustra", "ilustrar", "ilustración",
  "crea", "crear",
  "dibuja", "dibujar",
  "visualiza", "visualizar",
  "hazme un plano", "haz un plano",
  "hazme un diagrama", "haz un diagrama",
  "hazme una infografía", "haz una infografía",
  "hazme un render", "haz un render",
  "muéstrame cómo", "enséñame cómo",
  "enséñame",
];

// Sustantivos / objetos que cuando aparecen junto a un verbo trigger confirman imagen
export const IMAGE_TRIGGER_NOUNS = [
  // Infraestructura
  "corral", "manga", "brete", "embarcadero", "lechería", "bodega",
  "bebedero", "saladero", "sala de ordeño", "sistema de agua",
  "panel solar", "paneles solares", "cerca", "potrero", "finca",
  // Procesos / procedimientos
  "inyección", "inyectar", "vacuna", "vacunar", "desparasitar",
  "parto", "palpación", "inseminación", "arete", "herida", "pezuña",
  "condición corporal", "condición física",
  // Tipos de imagen
  "plano", "diagrama", "infografía", "render", "esquema",
  "ilustración", "paso a paso", "comparación",
  // Sistemas
  "rotación de potreros", "sistema silvopastoril", "silvopastoril",
  "sistema de rotación", "distribución de potreros",
  // Tipos de pastos / cercas
  "pasto", "cerca eléctrica", "tipo de corral",
];

/**
 * Detecta si un mensaje del usuario requiere generación de imagen.
 * @param {string} userText
 * @returns {{ shouldGenerate: boolean, confidence: "high"|"medium"|"low" }}
 */
export function detectImageTrigger(userText) {
  if (!userText) return { shouldGenerate: false, confidence: "low" };
  const lower = userText.toLowerCase();

  const verbMatch = IMAGE_TRIGGER_VERBS.some(v => lower.includes(v));
  const nounMatch = IMAGE_TRIGGER_NOUNS.some(n => lower.includes(n));

  if (verbMatch && nounMatch) return { shouldGenerate: true, confidence: "high" };
  if (verbMatch)              return { shouldGenerate: true, confidence: "medium" };
  if (nounMatch && lower.length < 80) return { shouldGenerate: false, confidence: "low" };

  return { shouldGenerate: false, confidence: "low" };
}

/**
 * Determina la categoría de imagen más apropiada según el texto.
 * @param {string} userText
 * @returns {string} categoryId
 */
export function detectImageCategory(userText) {
  const lower = userText.toLowerCase();

  if (/plano|distribución|mapa|diseño de (corral|potrero|finca|manga|brete|lechería|bodega)/.test(lower)) return "plano";
  if (/diagrama|flujo|proceso|protocolo|cronograma|rotación/.test(lower)) return "diagrama";
  if (/infografía|pasos|paso a paso|guía visual|consejos/.test(lower)) return "infografia";
  if (/cómo (aplicar|hacer|realizar|poner|colocar|curar|limpiar|detectar)|enséñame/.test(lower)) return "educativo";
  if (/render|vista 3d|perspectiva|diseño moderno/.test(lower)) return "render";
  if (/comparación|diferencia|versus|vs\.?/.test(lower)) return "comparacion";

  return "ilustracion";
}
