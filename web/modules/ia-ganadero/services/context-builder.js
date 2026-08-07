import { ESPECIALISTAS } from "../constants/specialists.js";

/**
 * Construye el system prompt que se envía en cada llamada a la IA.
 * Inyecta contexto de finca, empresa, usuario, idioma, moneda, zona horaria.
 *
 * @param {object} opts
 * @param {import('../types/conversation-context').ConversationContext|null} opts.context
 * @param {string} [opts.specialistId]  - ID del especialista activo (ej: "veterinario")
 * @returns {string}
 */
export function buildSystemPrompt({ context, specialistId = "veterinario" } = {}) {
  const especialista = ESPECIALISTAS.find(e => e.id === specialistId) ?? ESPECIALISTAS[0];
  const now = new Date();

  let fincaBlock = "- Finca: información no disponible";
  let empresaBlock = "";
  let usuarioBlock = "";
  let locBlock = "";

  if (context) {
    const { finca, empresa, usuario, localizacion } = context;

    if (finca) {
      const partes = [
        `**${finca.nombre ?? "Finca sin nombre"}**`,
        finca.hectareas  ? `${finca.hectareas} ha` : null,
        finca.ubicacion  ? finca.ubicacion : null,
        finca.municipio  ? finca.municipio : null,
        finca.departamento ? finca.departamento : null,
      ].filter(Boolean);

      fincaBlock = [
        `- Finca: ${partes.join(" · ")}`,
        finca.animales     != null ? `- Total animales: ${finca.animales}` : null,
        finca.razas?.length ? `- Razas: ${finca.razas.join(", ")}` : null,
        finca.tipoSistema   ? `- Sistema: ${finca.tipoSistema}` : null,
      ].filter(Boolean).join("\n");
    }

    if (empresa) {
      empresaBlock = [
        `- Empresa: ${empresa.nombre ?? ""}`,
        empresa.nit ? `  NIT: ${empresa.nit}` : null,
      ].filter(Boolean).join("\n");
    }

    if (usuario) {
      usuarioBlock = [
        `- Usuario: ${usuario.nombre ?? ""}`,
        usuario.rol ? `  Rol: ${usuario.rol}` : null,
        usuario.permisos?.length ? `  Permisos: ${usuario.permisos.join(", ")}` : null,
      ].filter(Boolean).join("\n");
    }

    if (localizacion) {
      const tz = localizacion.zonaHoraria ?? "America/Bogota";
      const fechaLocal = now.toLocaleString("es-CO", { timeZone: tz, dateStyle: "full", timeStyle: "short" });
      locBlock = [
        `- Idioma: Español (${localizacion.codigoIdioma ?? "es-CO"})`,
        `- Moneda: ${localizacion.moneda ?? "COP"} (${localizacion.simboloMoneda ?? "$"})`,
        `- Zona horaria: ${tz}`,
        `- Fecha y hora actual: ${fechaLocal}`,
      ].join("\n");
    }
  }

  if (!locBlock) {
    const fechaLocal = now.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "full", timeStyle: "short" });
    locBlock = [
      "- Idioma: Español (es-CO)",
      "- Moneda: COP ($)",
      "- Zona horaria: America/Bogota",
      `- Fecha y hora actual: ${fechaLocal}`,
    ].join("\n");
  }

  return `Eres el asistente IA de GanaderoSG, la plataforma líder de gestión ganadera en Colombia. Eres experto en ganadería bovina y sistemas de producción pecuaria.

ESPECIALISTA ACTIVO: ${especialista.icono} ${especialista.label}

CONTEXTO DE LA FINCA:
${fincaBlock}
${empresaBlock ? `\nEMPRESA:\n${empresaBlock}` : ""}
${usuarioBlock ? `\nUSUARIO:\n${usuarioBlock}` : ""}

CONFIGURACIÓN:
${locBlock}

INSTRUCCIONES DE RESPUESTA:
- Responde siempre en español, de forma clara, directa y práctica.
- Usa **negrita** para términos técnicos importantes.
- Usa tablas Markdown cuando los datos tienen estructura tabular.
- Usa listas con viñetas para protocolos, pasos o enumeraciones.
- Usa bloques de código para protocolos técnicos específicos.
- Sé específico con dosis, cantidades, fechas y precios en la moneda configurada.
- Si no tienes suficiente información para responder con precisión, pide los datos que necesitas.
- No inventes datos que no estén en el contexto proporcionado.
- Mantén un tono profesional pero accesible para ganaderos y técnicos del campo.`;
}

/**
 * Convierte el historial de mensajes del chat al formato que espera Anthropic.
 *
 * @param {import('../types').Message[]} messages
 * @param {string} [latestUserText]          - Texto del mensaje del usuario actual (ya procesado)
 * @param {object[]} [latestUserContent]     - Contenido multimodal del mensaje actual
 * @returns {{ role: "user"|"assistant", content: string|object[] }[]}
 */
export function buildAnthropicMessages(messages, latestUserText, latestUserContent) {
  const history = messages
    .filter(m => m.sender !== "system" && m.text)
    .map(m => ({
      role:    m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));

  // Anthropic requiere que los mensajes alternen user/assistant sin repetir el mismo rol
  const deduped = [];
  for (const msg of history) {
    const last = deduped[deduped.length - 1];
    if (last && last.role === msg.role) {
      // Fusiona en el último si es el mismo rol
      if (typeof last.content === "string") last.content += "\n\n" + msg.content;
    } else {
      deduped.push({ ...msg });
    }
  }

  // Asegura que siempre empiece con "user"
  if (deduped.length > 0 && deduped[0].role !== "user") deduped.shift();

  // Si hay contenido multimodal (imágenes, etc.) para el mensaje actual
  if (latestUserContent) {
    deduped.push({ role: "user", content: latestUserContent });
  } else if (latestUserText) {
    deduped.push({ role: "user", content: latestUserText });
  }

  return deduped;
}
