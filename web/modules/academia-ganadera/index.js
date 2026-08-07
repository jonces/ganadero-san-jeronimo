// Constants
export { ACADEMIA_CATEGORIA, ACADEMIA_CATEGORIA_CONFIG, getCategoriaConfig, CATEGORIAS_LISTA } from "./constants/categories.js";
export { NIVEL, NIVEL_CONFIG, getNivelConfig }                                                  from "./constants/levels.js";
export { CONTENT_TYPE, CONTENT_TYPE_CONFIG, LEARNING_MODE, LEARNING_MODE_CONFIG }              from "./constants/content-types.js";
export { CURSO_CATALOG, getCursoById, getCursosByCategoria, getCursosPopulares }               from "./constants/catalog.js";
export { SIMULADORES, getSimuladorById }                                                         from "./constants/simuladores.js";

// Services
export {
  getProgreso, saveProgreso, getProgresoGlobal, marcarLeccionCompletada,
  getCursoContent, saveCursoContent,
  getCertificados, saveCertificado, getCertificadoByCurso,
  getBiblioteca, saveBibliotecaItem, deleteBibliotecaItem,
  getFavoritos, toggleFavorito, isFavorito,
  addHistorial, getHistorial, getCursosRecientes,
  addTiempoEstudio, getTiempoTotal,
  saveExamen, getExamen,
  getEstadisticasGlobales,
} from "./services/academia-storage.js";

export { generateCursoContent, generateExamen, generateLearningContent, generateDocumento } from "./services/content-generator.js";
export { getRecomendaciones, buscarCursos }                                                  from "./services/recommendations-engine.js";
export { generateCertificado, buildCertificadoHTML, printCertificado }                      from "./services/certificate-generator.js";

// Hooks
export { useAcademia } from "./hooks/useAcademia.js";
export { useCurso }    from "./hooks/useCurso.js";

// Components
export { AcademiaShell }           from "./components/AcademiaShell.js";
export { CursoCard }               from "./components/CursoCard.js";
export { CursoViewer }             from "./components/CursoViewer.js";
export { ExamenPanel }             from "./components/ExamenPanel.js";
export { CertificadoCard }         from "./components/CertificadoCard.js";
export { ModoAprenderPanel }       from "./components/ModoAprenderPanel.js";
export { SimuladorEducativoPanel } from "./components/SimuladorEducativoPanel.js";
export { BibliotecaPanel }         from "./components/BibliotecaPanel.js";
export { ProgresoDashboard }       from "./components/ProgresoDashboard.js";
