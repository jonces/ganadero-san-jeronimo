// ── API pública del módulo AI Image Generator ────────────────────────────────
// Importar siempre desde aquí para mantener la interfaz estable.

export { ImageGeneratorPanel }              from "./components/ImageGeneratorPanel.js";
export {
  generateGanaderiaImage,
  downloadTaskImages,
  getTask,
  getAllTasks,
  buildGanaderiaPrompt,
  isImageGenerationAvailable,
}                                           from "./services/image-generation-service.js";
