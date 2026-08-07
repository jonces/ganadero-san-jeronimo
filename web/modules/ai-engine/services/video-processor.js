/**
 * Servicio de procesamiento de video para IA.
 *
 * Casos de uso en ganadería:
 *   - Análisis de comportamiento animal en corrales
 *   - Detección de cojeras y problemas locomotores
 *   - Evaluación de instalaciones
 *   - Registro de partos y procedimientos
 *
 * Implementado: miniatura (frame en t=0), metadatos (duración, resolución)
 * Pendiente:   análisis de frames múltiples, extracción de audio, transcripción
 */

/**
 * Resultado del procesamiento de video.
 * @typedef {object} VideoInfo
 * @property {number}  duration    Duración en segundos
 * @property {number}  width       Ancho en píxeles
 * @property {number}  height      Alto en píxeles
 * @property {string}  thumbnail   data URL del primer frame (JPEG)
 * @property {number}  fps         Fotogramas por segundo estimados
 * @property {string}  codec       Tipo MIME del video
 */

/**
 * Extrae metadatos y miniatura de un video.
 * @param {File}   file
 * @param {number} [thumbTime=1]  Segundo en el que tomar la miniatura
 * @returns {Promise<VideoInfo>}
 */
export function extractVideoInfo(file, thumbTime = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url   = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted   = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const { duration, videoWidth: width, videoHeight: height } = video;
      // Ir al segundo thumbTime para tomar el frame
      video.currentTime = Math.min(thumbTime, duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = Math.min(video.videoWidth,  640);
      canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width:    video.videoWidth,
        height:   video.videoHeight,
        thumbnail: canvas.toDataURL("image/jpeg", 0.82),
        fps:      0,   // no disponible via HTMLVideoElement
        codec:    file.type,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar el video"));
    };

    video.src = url;
  });
}

/**
 * Extrae N frames distribuidos uniformemente a lo largo del video.
 * Útil para análisis visual por la IA (máx recomendado: 5 frames).
 *
 * @param {File}   file
 * @param {number} [count=3]   Número de frames a extraer
 * @returns {Promise<string[]>}  Array de data URLs JPEG
 */
export async function extractFrames(file, count = 3) {
  return new Promise((resolve, reject) => {
    const video  = document.createElement("video");
    const url    = URL.createObjectURL(file);
    const frames = [];
    let   i      = 0;

    video.preload     = "auto";
    video.muted       = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      seekNext();
    };

    function seekNext() {
      if (i >= count) {
        URL.revokeObjectURL(url);
        resolve(frames);
        return;
      }
      const t = (i / (count - 1 || 1)) * video.duration;
      video.currentTime = t;
      i++;
    }

    video.onseeked = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = Math.min(video.videoWidth, 640);
      canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.8));
      seekNext();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error procesando video"));
    };

    video.src = url;
  });
}

/**
 * Formatea la duración de un video en mm:ss.
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
