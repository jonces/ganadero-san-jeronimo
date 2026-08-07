"use client";
import { useState, useEffect, useCallback } from "react";
import { collectBIData }              from "../services/bi-data-collector.js";
import { calculateKPIs }              from "../services/kpi-calculator.js";
import { calculateScores }            from "../services/score-calculator.js";
import { getBenchmarkComparison, generateComparativeData } from "../services/benchmark-engine.js";
import { exportCSV, exportHTMLReport, triggerPrint, exportStub } from "../services/report-generator.js";
import { logBI, getAuditLog, exportAuditCSV } from "../services/audit-logger.js";
import {
  saveKPIs, loadKPIs, saveScores, loadScores,
  getLastRunTs, markLastRun, invalidateBICache,
  getEmpresas, saveEmpresas,
  getSchedules, saveSchedules,
  getKPIHistory,
} from "../services/bi-storage.js";

function buildSummary(kpis, scores) {
  const score     = scores?.general?.score ?? 0;
  const n         = Math.max(kpis.total_animales ?? 1, 1);

  const hallazgos = [];
  if ((kpis.animales_enfermos ?? 0) > 3)     hallazgos.push(`${kpis.animales_enfermos} animales enfermos — atención inmediata.`);
  if ((kpis.tasa_prenez ?? 0) < 65)           hallazgos.push(`Tasa de preñez baja: ${(kpis.tasa_prenez ?? 0).toFixed(1)}%.`);
  if ((kpis.rentabilidad ?? 0) < 10)          hallazgos.push(`Rentabilidad baja: ${(kpis.rentabilidad ?? 0).toFixed(1)}%.`);
  if ((kpis.vacunas_pendientes ?? 0) > 10)    hallazgos.push(`${kpis.vacunas_pendientes} vacunas pendientes por aplicar.`);
  if ((kpis.mortalidad ?? 0) / n > 0.03)      hallazgos.push(`Tasa de mortalidad por encima del promedio sectorial.`);

  const oportunidades = [];
  if ((kpis.prod_leche ?? 0) > 0) oportunidades.push("Incrementar producción lechera con suplementación estratégica.");
  oportunidades.push("Ampliar presencia en Marketplace Ganadero para vender excedentes.");
  if ((kpis.rotacion_potreros ?? 0) < 28)     oportunidades.push("Mejorar rotación de potreros para mayor capacidad de carga.");
  if ((kpis.gdp ?? 0) > 600)                  oportunidades.push("Ganancia de peso superior al promedio — considerar venta de novillos gordos.");

  const riesgos = [];
  if ((kpis.endeudamiento ?? 0) > 40)  riesgos.push(`Endeudamiento alto: ${(kpis.endeudamiento ?? 0).toFixed(1)}%.`);
  if ((kpis.liquidez ?? 0) < 1.2)      riesgos.push(`Liquidez ajustada: ${(kpis.liquidez ?? 0).toFixed(2)} — vigilar flujo de caja.`);

  const prioridades = [...hallazgos.map(h => `⚠️ ${h}`), ...riesgos.map(r => `🚨 ${r}`)].slice(0, 5);

  return {
    scoreGeneral: score,
    resumenEjecutivo: `La operación ganadera presenta un Score General de ${score.toFixed(0)}/100 con ${n} animales activos. ${
      score >= 80 ? "Desempeño excelente — continuar con los estándares actuales."
      : score >= 60 ? "Buen desempeño con oportunidades claras de mejora en productividad y reproducción."
      : "Se requieren acciones correctivas prioritarias en las áreas de menor score."}`,
    hallazgos,
    oportunidades,
    riesgos,
    prioridades,
    metas: [
      `Rentabilidad objetivo: ${Math.max(20, (kpis.rentabilidad ?? 0) + 5).toFixed(0)}% en 12 meses.`,
      `Elevar tasa de preñez al 80% mediante protocolo reproductivo.`,
      `Reducir costo por animal a ${((kpis.costo_animal ?? 0) * 0.9 / 1e6).toFixed(1)}M COP.`,
    ],
    acciones: [
      "Revisar protocolo sanitario con el veterinario esta semana.",
      "Actualizar plan nutricional según condición corporal actual.",
      "Evaluar rentabilidad por potrero y ajustar carga animal.",
      "Publicar excedente de inventario en el Marketplace Ganadero.",
    ],
  };
}

export function useExecutive() {
  const [kpis,        setKpis]         = useState(null);
  const [scores,      setScores]       = useState(null);
  const [benchmark,   setBenchmark]    = useState([]);
  const [history,     setHistory]      = useState({});
  const [summary,     setSummary]      = useState(null);
  const [comparative, setComparative]  = useState([]);
  const [compareDim,  setCompareDim]   = useState("finca");
  const [empresas,    setEmpresas]     = useState([]);
  const [schedules,   setSchedules]    = useState([]);
  const [auditLog,    setAuditLog]     = useState([]);
  const [loading,     setLoading]      = useState(false);
  const [error,       setError]        = useState(null);
  const [lastRun,     setLastRun]      = useState(null);

  const applyResults = useCallback((k, s) => {
    setKpis(k);
    setScores(s);
    setBenchmark(getBenchmarkComparison(k));
    setHistory(getKPIHistory());
    setComparative(generateComparativeData(k, "finca"));
    setSummary(buildSummary(k, s));
  }, []);

  const run = useCallback(async (force = false) => {
    if (!force) {
      const ck = loadKPIs();
      const cs = loadScores();
      if (ck && cs) {
        applyResults(ck, cs);
        setLastRun(getLastRunTs());
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const data = await collectBIData();
      const k    = calculateKPIs(data);
      const s    = calculateScores(k);
      saveKPIs(k);
      saveScores(s);
      markLastRun();
      applyResults(k, s);
      setLastRun(Date.now());
      logBI("Análisis BI ejecutado", { animales: k.total_animales, score: s.general?.score });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [applyResults]);

  const refresh = useCallback(() => { invalidateBICache(); run(true); }, [run]);

  // Comparative dim
  const changeCompareDim = useCallback((dim) => {
    setCompareDim(dim);
    if (kpis) setComparative(generateComparativeData(kpis, dim));
  }, [kpis]);

  // Reports
  const doExportCSV  = useCallback(() => { if (!kpis) return; const r = exportCSV(kpis); logBI("Exportar CSV", { ok: r.ok }); return r; }, [kpis]);
  const doExportHTML = useCallback(() => { if (!kpis) return; const r = exportHTMLReport(kpis, scores, empresas); logBI("Exportar HTML", { ok: r.ok }); return r; }, [kpis, scores, empresas]);
  const doPrint      = useCallback(() => { const r = triggerPrint(); logBI("Imprimir PDF"); return r; }, []);
  const doExportOther= useCallback((fmt) => { const r = exportStub(fmt); logBI(`Exportar ${fmt}`); return r; }, []);

  // Audit
  const reloadAudit  = useCallback(() => setAuditLog(getAuditLog()), []);

  // Empresas
  const toggleEmpresa = useCallback((id) => {
    const upd = empresas.map(e => e.id === id ? { ...e, activa: !e.activa } : e);
    saveEmpresas(upd);
    setEmpresas(upd);
    logBI("Toggle empresa", { id });
  }, [empresas]);

  // Schedules
  const addSchedule = useCallback((sch) => {
    const upd = [...schedules, { ...sch, id: crypto.randomUUID(), creadoEn: new Date().toISOString() }];
    saveSchedules(upd);
    setSchedules(upd);
    logBI("Programar reporte", { frecuencia: sch.frecuencia });
  }, [schedules]);

  const removeSchedule = useCallback((id) => {
    const upd = schedules.filter(s => s.id !== id);
    saveSchedules(upd);
    setSchedules(upd);
    logBI("Eliminar reporte programado", { id });
  }, [schedules]);

  useEffect(() => {
    setEmpresas(getEmpresas());
    setSchedules(getSchedules());
    setAuditLog(getAuditLog());
    run();
  }, []);

  return {
    kpis, scores, benchmark, history, summary,
    comparative, compareDim,
    empresas, schedules, auditLog,
    loading, error, lastRun,
    refresh, changeCompareDim,
    doExportCSV, doExportHTML, doPrint, doExportOther,
    reloadAudit, exportAuditCSV,
    toggleEmpresa,
    addSchedule, removeSchedule,
  };
}
