/**
 * Device Manager — registro central de todos los dispositivos IoT.
 * Arquitectura desacoplada: la conexión real se hace a través de adapters.
 */
import { DEVICE_STATUS, DEVICE_TYPE_CONFIG } from "../constants/device-types.js";
import { upsertDevice, deleteDevice, getDevices } from "./hub-storage.js";

let _idCounter = Date.now();
function newId() { return `dev-${++_idCounter}`; }

/**
 * Registra un nuevo dispositivo.
 */
export function registerDevice({
  nombre,
  tipo,
  empresa = null,
  finca   = null,
  ubicacion = "",
  protocolo = null,
  config  = {},
}) {
  const tipoCfg = DEVICE_TYPE_CONFIG[tipo] ?? {};
  const device = {
    id:           newId(),
    nombre,
    tipo,
    empresa,
    finca,
    ubicacion,
    protocolo:    protocolo ?? tipoCfg.protocolos?.[0] ?? "wifi",
    estado:       DEVICE_STATUS.OFFLINE,
    bateria_pct:  null,
    senal_pct:    null,
    ultimaSync:   null,
    config:       { ...config },
    historial:    [],
    metadatos:    { categoria: tipoCfg.categoria ?? "otro" },
  };
  return upsertDevice(device);
}

/**
 * Actualiza el estado de un dispositivo (simula heartbeat).
 */
export function updateDeviceStatus(id, { estado, bateria_pct, senal_pct, lecturaActual = null }) {
  const devices = getDevices();
  const device  = devices.find(d => d.id === id);
  if (!device) return devices;

  const entry = { ts: Date.now(), estado, bateria_pct, senal_pct, lectura: lecturaActual };
  const historial = [entry, ...(device.historial ?? [])].slice(0, 100);

  return upsertDevice({ ...device, estado, bateria_pct, senal_pct, ultimaSync: Date.now(), historial });
}

/**
 * Simula un ciclo de lecturas de dispositivos (demo sin hardware).
 */
export function simulateReadings(devices) {
  return devices.map(device => {
    const reading = generateFakeReading(device.tipo);
    return { ...device, lecturaActual: reading, ultimaSync: Date.now() };
  });
}

function generateFakeReading(tipo) {
  const r = (min, max, dec = 1) => +(Math.random() * (max - min) + min).toFixed(dec);
  const readings = {
    sensor_temp:    { temperatura_c: r(18, 38), indice_thi: r(60, 90) },
    sensor_humedad: { humedad_pct: r(40, 95) },
    sensor_tanque:  { nivel_pct: r(10, 100), volumen_litros: r(100, 5000, 0) },
    sensor_cerca:   { voltaje_v: r(1800, 8000, 0), estado: Math.random() > 0.1 ? "activa" : "falla" },
    bascula:        { peso_kg: r(200, 600, 1) },
    sensor_agua:    { ph: r(6.5, 8.5), turbidez: r(0, 10) },
    sensor_pastura: { altura_cm: r(10, 60), humedad_suelo: r(20, 80) },
    panel_solar:    { potencia_w: r(0, 5000, 0), energia_dia_kwh: r(0, 30) },
    bomba:          { caudal_lpm: r(0, 200, 0), presion_bar: r(1, 6) },
    collar:         { temperatura_corporal: r(38, 39.5), pasos: r(100, 5000, 0) },
    estacion_meteo: { temperatura_c: r(15, 38), humedad_pct: r(40, 95), lluvia_mm: r(0, 20) },
    gps:            { lat: 4.6 + Math.random() * 0.01, lng: -74.1 + Math.random() * 0.01 },
  };
  return readings[tipo] ?? {};
}

export function removeDevice(id) { return deleteDevice(id); }
