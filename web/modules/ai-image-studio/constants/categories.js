/**
 * Categorías de imágenes generables por el AI Image Studio.
 */

export const IMAGE_CATEGORIES = {
  PLANO:        { id: "plano",        label: "Plano",          icono: "📐", size: "1792x1024", style: "natural"  },
  DIAGRAMA:     { id: "diagrama",     label: "Diagrama",       icono: "📊", size: "1792x1024", style: "natural"  },
  ILUSTRACION:  { id: "ilustracion",  label: "Ilustración",    icono: "🎨", size: "1024x1024", style: "vivid"    },
  INFOGRAFIA:   { id: "infografia",   label: "Infografía",     icono: "📋", size: "1024x1792", style: "natural"  },
  EDUCATIVO:    { id: "educativo",    label: "Educativo",      icono: "📚", size: "1792x1024", style: "natural"  },
  RENDER:       { id: "render",       label: "Render 3D",      icono: "🏗️", size: "1792x1024", style: "vivid"    },
  COMPARACION:  { id: "comparacion",  label: "Comparación",    icono: "⚖️", size: "1792x1024", style: "natural"  },
  ESQUEMA:      { id: "esquema",      label: "Esquema",        icono: "🔷", size: "1792x1024", style: "natural"  },
};

// Sufijos de calidad visual que se añaden a todos los prompts
export const QUALITY_SUFFIX =
  "Professional technical illustration style, clean white or light background, " +
  "high contrast labels in Spanish, educational quality, cattle farming context, " +
  "Colombia/Latin America, accurate proportions, no text errors.";

/** @param {string} categoryId */
export function getCategoryConfig(categoryId) {
  return IMAGE_CATEGORIES[categoryId?.toUpperCase()] ?? IMAGE_CATEGORIES.ILUSTRACION;
}
