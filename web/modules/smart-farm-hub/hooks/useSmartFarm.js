"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getDevices, getRules, getAlerts, upsertDevice, saveRules, upsertRule, deleteRule as deleteRuleStorage } from "../services/hub-storage.js";
import { registerDevice, updateDeviceStatus, simulateReadings, removeDevice } from "../services/device-manager.js";
import { evaluateRules }  from "../services/automation-engine.js";
import { dispatchAlert }  from "../services/alert-dispatcher.js";
import { getQueueStats, runSync, enqueue } from "../services/sync-queue.js";
import { RULE_TEMPLATES } from "../constants/automation-rules.js";
import { DEVICE_STATUS }  from "../constants/device-types.js";

const POLL_MS = 8000; // simula lecturas cada 8s

export function useSmartFarm() {
  const [devices,    setDevices]    = useState([]);
  const [rules,      setRules]      = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [syncStats,  setSyncStats]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [online,     setOnline]     = useState(true);
  const [lastSync,   setLastSync]   = useState(null);
  const [simulation, setSimulation] = useState(false);
  const pollRef = useRef(null);

  /* ── Carga inicial ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const stored = getDevices();
    const storedRules = getRules();
    setDevices(stored);

    // Carga reglas: si no hay reglas guardadas, precarga las plantillas
    if (!storedRules.length) {
      const initial = RULE_TEMPLATES.map(t => ({ ...t, id: `rule-${t.id}`, creadoTs: Date.now() }));
      saveRules(initial);
      setRules(initial);
    } else {
      setRules(storedRules);
    }

    setAlerts(getAlerts());
    setSyncStats(getQueueStats());
  }, []);

  /* ── Listener de conexión online/offline ──────────────────────────────── */
  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  /* ── Simulación de lecturas en tiempo real ───────────────────────────── */
  const startSimulation = useCallback(() => {
    setSimulation(true);
    pollRef.current = setInterval(() => {
      const current = getDevices();
      if (!current.length) return;
      const simulated = simulateReadings(current);
      simulated.forEach(d => upsertDevice({ ...d, estado: DEVICE_STATUS.ONLINE }));
      const updated = getDevices();
      setDevices(updated);
      setAlerts(getAlerts());

      // Evaluar reglas
      const currentRules = getRules();
      const fired = evaluateRules(currentRules.filter(r => r.activa), updated);
      if (fired.length) {
        fired.forEach(a => dispatchAlert(a, a.acciones?.filter(ac => ac === "alerta_visual") ?? []));
        setAlerts(getAlerts());
      }

      setSyncStats(getQueueStats());
    }, POLL_MS);
  }, []);

  const stopSimulation = useCallback(() => {
    clearInterval(pollRef.current);
    setSimulation(false);
  }, []);

  useEffect(() => () => clearInterval(pollRef.current), []);

  /* ── Sync manual ──────────────────────────────────────────────────────── */
  const syncNow = useCallback(async () => {
    if (!online) return;
    setLoading(true);
    try {
      await runSync();
      setSyncStats(getQueueStats());
      setLastSync(Date.now());
    } finally {
      setLoading(false);
    }
  }, [online]);

  /* ── CRUD Dispositivos ─────────────────────────────────────────────────── */
  const addDevice = useCallback((data) => {
    const updated = registerDevice(data);
    setDevices(updated);
    enqueue({ entidad: "device", operacion: "create", payload: data });
    setSyncStats(getQueueStats());
  }, []);

  const removeDeviceById = useCallback((id) => {
    const updated = removeDevice(id);
    setDevices(updated);
    enqueue({ entidad: "device", operacion: "delete", payload: { id } });
  }, []);

  /* ── CRUD Reglas ──────────────────────────────────────────────────────── */
  const saveRule = useCallback((rule) => {
    const newRule = { ...rule, id: rule.id ?? `rule-${Date.now()}`, creadoTs: rule.creadoTs ?? Date.now() };
    const updated = upsertRule(newRule);
    setRules(updated);
  }, []);

  const removeRule = useCallback((id) => {
    const updated = deleteRuleStorage(id);
    setRules(updated);
  }, []);

  const toggleRule = useCallback((id) => {
    const updated = getRules().map(r => r.id === id ? { ...r, activa: !r.activa } : r);
    saveRules(updated);
    setRules(updated);
  }, []);

  /* ── Alertas ──────────────────────────────────────────────────────────── */
  const refreshAlerts = useCallback(() => {
    setAlerts(getAlerts());
  }, []);

  const unreadCount = alerts.filter(a => !a.leida).length;

  return {
    devices, rules, alerts, syncStats,
    loading, online, lastSync, simulation, unreadCount,
    addDevice, removeDeviceById,
    saveRule, removeRule, toggleRule,
    refreshAlerts, syncNow,
    startSimulation, stopSimulation,
  };
}
