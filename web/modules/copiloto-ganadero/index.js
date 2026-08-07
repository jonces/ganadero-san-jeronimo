// Constants
export { PRIORITY, PRIORITY_CONFIG, getPriorityConfig, sortByPriority } from "./constants/priorities.js";
export { ALERT_TYPE, ALERT_TYPE_CONFIG, CATEGORIAS_ALERTA }             from "./constants/alert-types.js";

// Services
export { analyzeFarm, generateFarmSummary }     from "./services/farm-analyzer.js";
export { generatePlan, generateAllPlans }        from "./services/plan-generator.js";
export { generateObjectiveRoadmap, TIPOS_OBJETIVO } from "./services/objective-engine.js";
export { simular, ESCENARIOS_RAPIDOS }           from "./services/simulator.js";
export {
  registrarAccion, getAlertFeedback,
  getPatronAceptacion, getPatronIgnorado,
  saveObjetivo, loadObjetivos, deleteObjetivo, updateObjetivoEtapa,
  addHistorial, loadHistorial,
} from "./services/copiloto-storage.js";

// Hooks
export { useCopiloto } from "./hooks/useCopiloto.js";

// Components
export { AlertaCard }      from "./components/AlertaCard.js";
export { AlertasPanel }    from "./components/AlertasPanel.js";
export { ObjetivosPanel }  from "./components/ObjetivosPanel.js";
export { SimuladorPanel }  from "./components/SimuladorPanel.js";
export { CopilotoShell }   from "./components/CopilotoShell.js";
export { DashboardWidget } from "./components/DashboardWidget.js";
