/**
 * Motor de automatización — evalúa reglas contra lecturas de dispositivos
 * y dispara acciones cuando se cumplen las condiciones.
 */
import { OPERADOR_CONFIG } from "../constants/automation-rules.js";
import { addAlert }        from "./hub-storage.js";
import { ALERT_SEVERITY }  from "../constants/alert-channels.js";

/**
 * Evalúa todas las reglas activas contra las lecturas actuales.
 * @param {object[]} rules   — reglas almacenadas
 * @param {object[]} devices — dispositivos con lecturaActual
 * @returns {FiredRule[]}    — reglas disparadas
 */
export function evaluateRules(rules, devices) {
  const fired = [];

  for (const rule of rules) {
    if (!rule.activa) continue;

    const targets = rule.tipoDispositivo
      ? devices.filter(d => d.tipo === rule.tipoDispositivo)
      : devices;

    for (const device of targets) {
      const lectura = device.lecturaActual ?? {};
      const valor   = lectura[rule.condicion?.campo];

      if (valor === undefined) continue;

      const opFn = OPERADOR_CONFIG[rule.condicion?.operador]?.fn;
      if (!opFn) continue;

      const triggered = opFn(valor, rule.condicion?.valor);
      if (!triggered) continue;

      const alertaData = {
        ruleId:     rule.id,
        ruleTitulo: rule.titulo,
        deviceId:   device.id,
        deviceNombre: device.nombre,
        tipo:       device.tipo,
        campo:      rule.condicion.campo,
        valorActual: valor,
        valorUmbral: rule.condicion.valor,
        operador:   rule.condicion.operador,
        acciones:   rule.acciones ?? [],
        severidad:  rule.prioridad === "critica" ? ALERT_SEVERITY.CRITICA
                   : rule.prioridad === "alta"    ? ALERT_SEVERITY.ALTA
                   : rule.prioridad === "media"   ? ALERT_SEVERITY.MEDIA
                   : ALERT_SEVERITY.BAJA,
        mensaje: buildMessage(rule, device, valor),
      };

      addAlert(alertaData);
      fired.push(alertaData);
    }
  }

  return fired;
}

function buildMessage(rule, device, valor) {
  return `${rule.titulo} — ${device.nombre}: valor actual ${valor} ${OPERADOR_CONFIG[rule.condicion?.operador]?.label ?? ""} umbral ${rule.condicion?.valor}`;
}

/** Registra eventos RFID — relaciona lectura con animal y genera evento. */
export function processRFIDReading({ deviceId, eid, vid, tipo_evento = "deteccion", extras = {} }) {
  addAlert({
    ruleId:      "rfid-auto",
    ruleTitulo:  "Lectura RFID",
    deviceId,
    deviceNombre: `Lector RFID`,
    tipo:        "rfid",
    severidad:   ALERT_SEVERITY.INFO,
    mensaje:     `RFID leído: EID ${eid}${vid ? ` / VID ${vid}` : ""} — evento: ${tipo_evento}`,
    rfidData:    { eid, vid, tipo_evento, ...extras },
  });
}
