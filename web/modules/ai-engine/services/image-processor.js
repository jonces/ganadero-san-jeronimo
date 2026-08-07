/**
 * Servicio de procesamiento de imágenes para análisis con IA.
 *
 * Casos de uso en ganadería:
 *   - Análisis de condición corporal de animales
 *   - Identificación de enfermedades cutáneas
 *   - Evaluación de potreros y pasturas
 *   - Lectura de facturas, recetas veterinarias, actas
 *   - Análisis de documentos escaneados
 */

/**
 * Convierte un File/Blob a base64 sin prefijo data:.
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Error leyendo imagen"));
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona una imagen al tamaño máximo permitido por la API,
 * manteniendo proporción. Devuelve el nuevo File.
 *
 * @param {File}   file
 * @param {number} maxWidth   default 1568 (límite Claude)
 * @param {number} maxHeight  default 1568
 * @returns {Promise<File>}
 */
export async function resizeIfNeeded(file, maxWidth = 1568, maxHeight = 1568) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth && img.height <= maxHeight) {
        resolve(file);
        return;
      }
      const ratio   = Math.min(maxWidth / img.width, maxHeight / img.height);
      const canvas  = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(
        new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }),
      ), "image/jpeg", 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * Genera una miniatura cuadrada de una imagen.
 * @param {File} file
 * @param {number} size  lado del cuadrado en px (default 200)
 * @returns {Promise<string>}  data URL
 */
export async function generateThumbnail(file, size = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas  = document.createElement("canvas");
      canvas.width  = size;
      canvas.height = size;
      const ctx     = canvas.getContext("2d");
      const min     = Math.min(img.width, img.height);
      const sx      = (img.width  - min) / 2;
      const sy      = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

/**
 * Devuelve las dimensiones de una imagen.
 * @param {File} file
 * @returns {Promise<{ width: number, height: number }>}
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload  = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }); };
    img.src = url;
  });
}

/**
 * Determina si el MIME type es soportado por Claude Vision.
 * @param {string} mime
 * @returns {boolean}
 */
export function isSupportedByVision(mime) {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mime);
}
