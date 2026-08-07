/**
 * Dispatcher de alertas multicanal.
 * Arquitectura preparada para integrar: Email, WhatsApp, Push, SMS.
 */
import { ALERT_CHANNEL, ALERT_CHANNEL_CONFIG } from "../constants/alert-channels.js";
import { addAlert, markAlertRead, getAlerts, clearAlerts } from "./hub-storage.js";

/**
 * Despacha una alerta por los canales configurados.
 * @param {object} alert   — datos de la alerta
 * @param {string[]} canales — canales a usar
 */
export async function dispatchAlert(alert, canales = [ALERT_CHANNEL.VISUAL]) {
  const results = {};

  for (const canal of canales) {
    const cfg = ALERT_CHANNEL_CONFIG[canal];
    if (!cfg?.disponible) {
      results[canal] = { ok: false, motivo: cfg?.descripcion ?? "No disponible" };
      continue;
    }

    try {
      switch (canal) {
        case ALERT_CHANNEL.VISUAL:
          addAlert({ ...alert, canal });
          results[canal] = { ok: true };
          break;

        case ALERT_CHANNEL.SONORA:
          if (typeof window !== "undefined" && window.AudioContext) {
            playBeep(alert.severidad);
          }
          results[canal] = { ok: true };
          break;

        case ALERT_CHANNEL.EMAIL:
          // Stub: en producción → POST /api/notificaciones/email
          results[canal] = { ok: false, motivo: "API de email no configurada — agregar endpoint /api/notificaciones/email" };
          break;

        case ALERT_CHANNEL.WHATSAPP:
          // Stub: en producción → WhatsApp Business API
          results[canal] = { ok: false, motivo: "Requiere WhatsApp Business API key" };
          break;

        case ALERT_CHANNEL.PUSH:
          // Stub: en producción → Web Push / FCM
          results[canal] = { ok: false, motivo: "Requiere service worker y permiso de notificaciones" };
          break;

        case ALERT_CHANNEL.SMS:
          // Stub: en producción → Twilio / AWS SNS
          results[canal] = { ok: false, motivo: "Requiere proveedor SMS (Twilio, AWS SNS)" };
          break;

        default:
          results[canal] = { ok: false, motivo: "Canal desconocido" };
      }
    } catch (e) {
      results[canal] = { ok: false, motivo: e.message };
    }
  }

  return results;
}

function playBeep(severidad) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = severidad === "critica" ? 880 : severidad === "alta" ? 660 : 440;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export { markAlertRead, getAlerts, clearAlerts };

/** Filtra alertas no leídas. */
export function getUnreadAlerts() {
  return getAlerts().filter(a => !a.leida);
}
