/**
 * Construye prompts optimizados para DALL-E 3 a partir del texto del usuario
 * y el contexto del especialista activo.
 */

import { getSpecialistPrefix, findMatchingTemplate } from "../constants/specialist-prompts.js";
import { detectImageCategory }                        from "../constants/image-triggers.js";
import { QUALITY_SUFFIX, IMAGE_CATEGORIES }           from "../constants/categories.js";

/**
 * Construye el prompt final para DALL-E 3.
 *
 * @param {object} opts
 * @param {string} opts.userText          — Texto del usuario
 * @param {string} [opts.specialistId]    — ID del especialista activo
 * @param {string} [opts.categoryId]      — Categoría de imagen (si ya detectada)
 * @param {string} [opts.fincaContext]    — Nombre y contexto de la finca (opcional)
 * @returns {{ prompt: string, categoryId: string, size: string, style: string }}
 */
export function buildImagePrompt({ userText, specialistId = "default", categoryId, fincaContext }) {
  const detectedCategory = categoryId ?? detectImageCategory(userText);
  const catConfig = IMAGE_CATEGORIES[detectedCategory?.toUpperCase()] ?? IMAGE_CATEGORIES.ILUSTRACION;

  // 1. Intentar usar plantilla predefinida si hay coincidencia exacta
  const template = findMatchingTemplate(specialistId, userText);
  if (template) {
    return {
      prompt:     template + " " + QUALITY_SUFFIX,
      categoryId: detectedCategory,
      size:       catConfig.size,
      style:      catConfig.style,
    };
  }

  // 2. Construir prompt dinámico
  const prefix  = getSpecialistPrefix(specialistId);
  const cleaned = sanitizeUserPrompt(userText);

  // Sufijo de categoría
  const categorySuffix = buildCategorySuffix(detectedCategory, catConfig);

  // Contexto de finca opcional
  const fincaSuffix = fincaContext
    ? `Context: ${fincaContext} cattle farm in Colombia. `
    : "Context: Colombian cattle farm. ";

  const prompt = `${prefix}${cleaned}. ${categorySuffix}${fincaSuffix}${QUALITY_SUFFIX}`;

  return {
    prompt,
    categoryId: detectedCategory,
    size:       catConfig.size,
    style:      catConfig.style,
  };
}

/** Limpia y traduce al inglés la parte del prompt del usuario para DALL-E */
function sanitizeUserPrompt(text) {
  // DALL-E responde mejor en inglés — hacemos una traducción funcional de los términos más comunes
  const translations = {
    "diseña":                  "design",
    "genera":                  "generate",
    "crea":                    "create",
    "muéstrame":               "show me",
    "muestrame":               "show me",
    "enséñame":                "teach me",
    "ilustra":                 "illustrate",
    "dibuja":                  "draw",
    "hazme":                   "make me",
    "haz un":                  "make a",
    "haz una":                 "make a",
    "plano":                   "blueprint plan",
    "corral":                  "cattle corral handling facility",
    "manga":                   "cattle chute alley",
    "brete":                   "squeeze chute",
    "embarcadero":             "cattle loading ramp",
    "bebedero":                "cattle water trough",
    "saladero":                "mineral salt station",
    "lechería":                "dairy milking parlor",
    "bodega":                  "farm storage building",
    "potrero":                 "grazing paddock",
    "potreros":                "grazing paddocks",
    "cerca eléctrica":         "electric fence",
    "sistema de agua":         "water supply system",
    "sistema silvopastoril":   "silvopastoral system",
    "sala de ordeño":          "milking parlor",
    "paneles solares":         "solar panels",
    "inseminación artificial": "artificial insemination",
    "condición corporal":      "body condition score",
    "parto bovino":            "bovine parturition calving",
    "vacuna":                  "cattle vaccination",
    "vacunas":                 "cattle vaccination",
    "inyección":               "injection technique",
    "desparasitación":         "deworming antiparasitic",
    "infografía":              "infographic",
    "diagrama":                "diagram",
    "finca modelo":            "model cattle farm",
    "de":                      "of",
    "para":                    "for",
    "con":                     "with",
    "una":                     "a",
    "un":                      "a",
    "el":                      "",
    "la":                      "",
    "los":                     "",
    "las":                     "",
    "moderno":                 "modern",
    "moderna":                 "modern",
    "pequeño":                 "small",
    "grande":                  "large",
    "completo":                "complete",
  };

  let result = text.toLowerCase();
  for (const [es, en] of Object.entries(translations)) {
    result = result.replace(new RegExp(`\\b${es}\\b`, "gi"), en);
  }
  // Limpiar espacios dobles
  return result.replace(/\s+/g, " ").trim();
}

function buildCategorySuffix(categoryId, catConfig) {
  const suffixes = {
    plano:       "Top-down blueprint floor plan view, architectural drawing style, dimension labels, scale bar. ",
    diagrama:    "Clear flowchart/diagram with numbered steps, arrows, boxes. Clean minimal design. ",
    infografia:  "Vertical infographic layout, numbered sections, icons, title at top, tips at bottom. ",
    educativo:   "Step-by-step educational sequence, numbered panels, clear procedure demonstration. ",
    render:      "Photorealistic 3D render, exterior view, professional architectural visualization. ",
    comparacion: "Split-panel comparison layout, two options side by side, pros/cons table. ",
    esquema:     "Technical schematic diagram, labeled components, connection lines, exploded view. ",
    ilustracion: "Clear technical illustration, isometric or perspective view. ",
  };
  return suffixes[categoryId] ?? "";
}
