import { ESPECIALISTAS, getEspecialista } from "../constants/specialists.js";

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
  const especialista = getEspecialista(specialistId);
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

  // Usa el systemPrompt rico del especialista si está disponible
  const expertPrompt = especialista.systemPrompt
    ? especialista.systemPrompt
    : `Eres el asistente IA de GanaderoSG especializado en ${especialista.label}.`;

  return `${expertPrompt}

---

## CONTEXTO DE LA FINCA DEL USUARIO

${fincaBlock}
${empresaBlock ? `\n**Empresa:**\n${empresaBlock}` : ""}
${usuarioBlock ? `\n**Usuario:**\n${usuarioBlock}` : ""}

**Configuración:**
${locBlock}

---

## INSTRUCCIONES GENERALES

- Responde siempre en español, de forma clara, directa y práctica.
- Cuando el contexto de la finca esté disponible, personaliza tus respuestas con esos datos.
- Sé específico con dosis, cantidades, fechas y precios en COP (pesos colombianos) salvo que se indique otra moneda.
- Si no tienes suficiente información para responder con precisión, pide los datos que necesitas.
- No inventes datos que no estén en el contexto proporcionado.`;
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
