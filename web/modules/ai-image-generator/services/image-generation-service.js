"use client";
import {
  generateImage,
  buildGanaderiaPrompt,
  downloadToDataUrl,
  isImageGenerationAvailable,
} from "../../ai-engine/services/image-generator.js";

export { buildGanaderiaPrompt, isImageGenerationAvailable };

/**
 * @typedef {object} GenerationTask
 * @property {string}    id
 * @property {string}    prompt
 * @property {"pending"|"generating"|"done"|"error"} status
 * @property {string[]}  results    URLs de las imágenes generadas
 * @property {string}    [error]
 * @property {number}    startedAt
 * @property {number}    [finishedAt]
 */

/** Caché en memoria de las imágenes generadas en esta sesión */
const _cache = new Map();

/**
 * Genera una o más imágenes y las guarda en caché.
 *
 * @param {object} opts
 * @param {string}   opts.prompt
 * @param {string}   [opts.category]
 * @param {string}   [opts.style]
 * @param {"1024x1024"|"1792x1024"|"1024x1792"} [opts.size]
 * @param {"standard"|"hd"} [opts.quality]
 * @param {function}  [opts.onProgress]  (task: GenerationTask) => void
 * @returns {Promise<GenerationTask>}
 */
export async function generateGanaderiaImage({ prompt, category, style, size, quality = "standard", onProgress }) {
  const id     = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  const builtPrompt = buildGanaderiaPrompt(prompt, category, style);

  /** @type {GenerationTask} */
  const task = {
    id,
    prompt:    builtPrompt,
    status:    "generating",
    results:   [],
    startedAt: Date.now(),
  };
  _cache.set(id, task);
  onProgress?.(task);

  try {
    const images = await generateImage({ prompt: builtPrompt, size, quality });
    task.status     = "done";
    task.results    = images.map(i => i.url);
    task.finishedAt = Date.now();
    _cache.set(id, task);
    onProgress?.(task);
    return task;
  } catch (err) {
    task.status     = "error";
    task.error      = err.message;
    task.finishedAt = Date.now();
    _cache.set(id, task);
    onProgress?.(task);
    throw err;
  }
}

/**
 * Descarga y convierte las imágenes de una tarea a data URLs para persistencia.
 * @param {string} taskId
 * @returns {Promise<string[]>}
 */
export async function downloadTaskImages(taskId) {
  const task = _cache.get(taskId);
  if (!task) throw new Error("Tarea no encontrada");
  const dataUrls = await Promise.all(task.results.map(downloadToDataUrl));
  task.results = dataUrls;
  _cache.set(taskId, task);
  return dataUrls;
}

/** Obtiene una tarea por ID */
export function getTask(id) { return _cache.get(id) ?? null; }

/** Obtiene todas las tareas de la sesión */
export function getAllTasks() { return [..._cache.values()]; }
