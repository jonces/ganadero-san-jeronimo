"use client";
import { useState, useEffect, useCallback } from "react";
import { collectPredictiveData }            from "../services/data-collector.js";
import { runAllEngines, generatePredictiveSummary, filterByHorizon } from "../services/prediction-runner.js";
import { buildRiskCenter, buildTimeline, calcularRiskScore }         from "../services/risk-aggregator.js";
import { savePredictions, loadPredictions, loadSummary, getLastRunTime, invalidateCache } from "../services/prediction-storage.js";
import { simularEscenario, ESCENARIOS_PREDICTIVOS } from "../services/scenario-simulator.js";
import { IoTRegistry }                      from "../constants/iot-adapters.js";
import { HORIZON }                          from "../constants/risk-levels.js";

export function usePredictive() {
  const [predictions,  setPredictions]  = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [riskCenter,   setRiskCenter]   = useState([]);
  const [timeline,     setTimeline]     = useState([]);
  const [riskScore,    setRiskScore]    = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [lastRun,      setLastRun]      = useState(null);
  const [horizonFilter,setHorizonFilter]= useState(null);     // null = todos
  const [areaFilter,   setAreaFilter]   = useState(null);
  const [iotStatus,    setIoTStatus]    = useState({});
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const processAndStore = useCallback((allPredictions, sum) => {
    setPredictions(allPredictions);
    setSummary(sum);
    setRiskCenter(buildRiskCenter(allPredictions));
    setTimeline(buildTimeline(allPredictions));
    setRiskScore(calcularRiskScore(allPredictions));
    setLastRun(Date.now());
    savePredictions(allPredictions, sum);
  }, []);

  const run = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadPredictions();
      const cachedSum = loadSummary();
      if (cached && cached.length > 0) {
        processAndStore(cached, cachedSum);
        setLastRun(getLastRunTime());
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const { dashData, extras, ok, errors } = await collectPredictiveData();
      if (!ok && errors.length) {
        setError(`Sin datos del servidor: ${errors[0]}`);
      }
      const all = runAllEngines(dashData, extras);
      const sum = generatePredictiveSummary(all);
      processAndStore(all, sum);

      // IoT status snapshot
      setIoTStatus(IoTRegistry.getEstados());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [processAndStore]);

  useEffect(() => { run(); }, [run]);

  const refresh = useCallback(() => {
    invalidateCache();
    run(true);
  }, [run]);

  // Predicciones filtradas
  const filteredPredictions = (() => {
    let list = predictions;
    if (horizonFilter) list = filterByHorizon(list, horizonFilter);
    if (areaFilter)    list = list.filter(p => p.area === areaFilter);
    return list;
  })();

  // Simular escenario
  const simular = useCallback(async (escenarioId, customParams = null) => {
    setScenarioLoading(true);
    setScenarioResult(null);
    try {
      const base = ESCENARIOS_PREDICTIVOS.find(e => e.id === escenarioId);
      if (!base) throw new Error("Escenario no encontrado");
      const { dashData } = await collectPredictiveData().catch(() => ({ dashData: {} }));
      const esc = customParams ? { tipo: base.tipo, params: { ...base.params, ...customParams } } : base;
      const result = simularEscenario(dashData, esc);
      setScenarioResult(result);
    } catch (e) {
      setScenarioResult({ error: e.message });
    } finally {
      setScenarioLoading(false);
    }
  }, []);

  return {
    predictions: filteredPredictions,
    allPredictions: predictions,
    summary,
    riskCenter,
    timeline,
    riskScore,
    loading,
    error,
    lastRun,
    iotStatus,
    scenarioResult,
    scenarioLoading,
    escenarios: ESCENARIOS_PREDICTIVOS,
    horizonFilter,
    areaFilter,
    setHorizonFilter,
    setAreaFilter,
    refresh,
    simular,
  };
}
