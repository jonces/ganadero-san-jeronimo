/**
 * Servicio de procesamiento de audio para IA.
 *
 * Casos de uso en ganadería:
 *   - Transcripción de notas de voz del ganadero
 *   - Registro de observaciones en campo (manos libres)
 *   - Instrucciones verbales para análisis de la IA
 *
 * Implementado:  grabación con MediaRecorder, reproducción, metadatos
 * Pendiente:     transcripción (requiere Whisper API o Web Speech API)
 */

/**
 * @typedef {object} RecordingResult
 * @property {Blob}   blob      Audio grabado (audio/webm;codecs=opus o audio/mp4)
 * @property {number} duration  Duración en segundos
 * @property {string} mimeType  MIME del codec usado
 */

/**
 * Inicia la grabación de audio usando el micrófono del dispositivo.
 * @returns {Promise<{ stop: () => Promise<RecordingResult> }>}
 */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const mime   = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/mp4";

  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const startedAt = Date.now();

  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(200);

  return {
    stop: () => new Promise((resolve) => {
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob     = new Blob(chunks, { type: mime });
        const duration = (Date.now() - startedAt) / 1000;
        resolve({ blob, duration, mimeType: mime });
      };
      recorder.stop();
    }),
  };
}

/**
 * Transcribe un archivo de audio usando la Web Speech API (solo Chrome/Edge).
 * No soportado en todos los navegadores — usar Whisper API como alternativa.
 * @param {Blob|File} audio
 * @returns {Promise<string>}
 */
export async function transcribeWithWebSpeech(audio) {
  const SpeechRecognition =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error("Web Speech API no disponible en este navegador. Usa Chrome o Edge.");
  }

  const url     = URL.createObjectURL(audio);
  const audioEl = new Audio(url);

  return new Promise((resolve, reject) => {
    const recog          = new SpeechRecognition();
    recog.continuous     = true;
    recog.interimResults = false;
    recog.lang           = "es-CO";

    const parts = [];
    recog.onresult = e => {
      for (const res of e.results) {
        if (res.isFinal) parts.push(res[0].transcript);
      }
    };
    recog.onerror = e => reject(new Error(`Error de transcripción: ${e.error}`));
    recog.onend   = () => { URL.revokeObjectURL(url); resolve(parts.join(" ")); };

    audioEl.onended = () => recog.stop();
    audioEl.onerror = () => { recog.stop(); reject(new Error("Error reproduciendo audio")); };

    recog.start();
    audioEl.play().catch(reject);
  });
}

/**
 * Devuelve la duración de un archivo de audio en segundos.
 * @param {File|Blob} audio
 * @returns {Promise<number>}
 */
export function getAudioDuration(audio) {
  return new Promise((resolve) => {
    const el  = new Audio();
    const url = URL.createObjectURL(audio);
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(el.duration); };
    el.onerror          = () => { URL.revokeObjectURL(url); resolve(0); };
    el.src = url;
  });
}

/**
 * Verifica si el navegador soporta grabación de audio.
 * @returns {boolean}
 */
export function isRecordingSupported() {
  return Boolean(
    typeof window !== "undefined" &&
    navigator?.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined",
  );
}
