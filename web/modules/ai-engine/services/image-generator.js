/**
 * Servicio de generación de imágenes con IA.
 *
 * Casos de uso en ganadería:
 *   - Ilustraciones anatómicas veterinarias
 *   - Diagramas de instalaciones y corrales
 *   - Infografías de protocolos sanitarios
 *   - Renders de proyectos de infraestructura
 *   - Ilustraciones educativas para la Academia Ganadera
 *
 * Backend: /api/ia/images (proxea OpenAI DALL-E 3)
 * Require: OPENAI_API_KEY en variables de entorno del servidor
 */

/** @typedef {"standard"|"hd"}   Quality */
/** @typedef {"natural"|"vivid"} Style */
/** @typedef {"1024x1024"|"1792x1024"|"1024x1792"} Size */

/**
 * @typedef {object} GeneratedImage
 * @property {string}    url          URL temporal de la imagen (expira en 1 h en OpenAI)
 * @property {string}    [dataUrl]    Data URL si se descargó localmente
 * @property {string}    prompt       Prompt original usado
 * @property {number}    createdAt    Timestamp
 */

/**
 * Genera una imagen a partir de un prompt de texto.
 *
 * @param {object} opts
 * @param {string}   opts.prompt    Descripción de la imagen a generar
 * @param {Size}     [opts.size="1024x1024"]
 * @param {Quality}  [opts.quality="standard"]
 * @param {Style}    [opts.style="natural"]
 * @param {number}   [opts.n=1]     Número de imágenes (1-4, solo DALL-E 2)
 * @returns {Promise<GeneratedImage[]>}
 */
export async function generateImage({ prompt, size = "1024x1024", quality = "standard", style = "natural", n = 1 }) {
  const res = await fetch("/api/ia/images", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ prompt, size, quality, style, n }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Error generando imagen: ${res.status}`);
  }

  const { images } = await res.json();
  return images.map(img => ({
    url:       img.url,
    prompt,
    createdAt: Date.now(),
  }));
}

/**
 * Construye un prompt optimizado para generación de imágenes ganaderas.
 *
 * @param {string}  basePrompt    Descripción base del usuario
 * @param {string}  [category]   "veterinario"|"infraestructura"|"pasturas"|"educativo"
 * @param {string}  [style]      "illustration"|"diagram"|"photo"|"infographic"
 * @returns {string}
 */
export function buildGanaderiaPrompt(basePrompt, category = "", style = "illustration") {
  const categoryContext = {
    veterinario:   "veterinary cattle medicine, bovine anatomy,",
    infraestructura: "cattle farm infrastructure, corrals, Colombian ranch,",
    pasturas:      "tropical pastures, Colombian cattle grazing land,",
    educativo:     "educational agricultural illustration,",
  };

  const styleModifiers = {
    illustration: "detailed technical illustration, clean white background, professional agricultural art style",
    diagram:      "clear technical diagram with labels, educational style, white background",
    photo:        "professional livestock photography style, golden hour lighting",
    infographic:  "modern infographic style, data visualization, clean design, Spanish text labels",
  };

  const ctx = categoryContext[category] ?? "";
  const mod = styleModifiers[style] ?? styleModifiers.illustration;

  return `${ctx} ${basePrompt}, ${mod}, high quality, 4k resolution`.trim().replace(/\s+/g, " ");
}

/**
 * Descarga una imagen desde una URL y la convierte a data URL local.
 * Útil para guardar imágenes generadas antes de que expiren.
 *
 * @param {string} imageUrl
 * @returns {Promise<string>} data URL
 */
export async function downloadToDataUrl(imageUrl) {
  const res    = await fetch(imageUrl);
  const blob   = await res.blob();
  return new Promise((resolve, reject) => {
    const reader  = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Verifica si la generación de imágenes está disponible (OPENAI_API_KEY configurada).
 * @returns {Promise<boolean>}
 */
export async function isImageGenerationAvailable() {
  try {
    const res  = await fetch("/api/ia/status");
    const data = await res.json();
    return Boolean(data.images?.configured);
  } catch {
    return false;
  }
}
