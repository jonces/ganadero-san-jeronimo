/**
 * Generador de contenido educativo mediante la API de IA existente.
 * Reutiliza el endpoint /api/ia/stream del Centro IA Ganadero.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/**
 * Genera el contenido completo de un curso (no-streaming, espera respuesta).
 * Retorna { introduccion, lecciones[], resumen, glosario[] }
 */
export async function generateCursoContent(curso) {
  const systemPrompt = `Eres un experto en ganadería bovina y docente universitario especializado en ${curso.categoria}.
Generas contenido educativo estructurado, preciso y práctico para productores ganaderos latinoamericanos.
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin bloques de código.`;

  const userPrompt = `Crea el contenido completo para el siguiente curso:

CURSO: ${curso.titulo}
NIVEL: ${curso.nivel}
DURACIÓN: ${curso.duracionMins} minutos
OBJETIVOS: ${curso.objetivos.join(", ")}
DESCRIPCIÓN: ${curso.descripcion}

Responde con este JSON exacto:
{
  "introduccion": "texto de introducción motivadora (2-3 párrafos)",
  "lecciones": [
    {
      "id": "leccion-1",
      "numero": 1,
      "titulo": "Título de la lección",
      "contenido": "Contenido detallado en markdown (mínimo 300 palabras con subtítulos ##, listas, ejemplos prácticos)",
      "puntosClave": ["punto 1", "punto 2", "punto 3"],
      "duracionMins": 15,
      "tipo": "teoria"
    }
  ],
  "resumen": "resumen ejecutivo del curso completo",
  "glosario": [
    { "termino": "término técnico", "definicion": "definición clara y corta" }
  ],
  "consejosPracticos": ["consejo 1", "consejo 2", "consejo 3"]
}

Genera exactamente ${curso.lecciones} lecciones. Incluye al menos 3 glosarios.`;

  const res = await fetch(`${API_URL}/ia/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      maxTokens: 4000,
    }),
  });

  if (!res.ok) throw new Error(`Error generando curso: HTTP ${res.status}`);
  const data = await res.json();

  // El endpoint /ia/chat devuelve { message: "texto" } o { content: "texto" }
  const raw = data.message ?? data.content ?? data.text ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    // Si no es JSON puro, intentar extraer el bloque JSON
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    // Fallback: generar estructura básica con el texto recibido
    return buildFallbackContent(curso, raw);
  }
}

/**
 * Genera preguntas de examen para un curso (5-10 preguntas múltiple opción).
 */
export async function generateExamen(curso, contenido) {
  const resumen = contenido?.lecciones?.map(l => `${l.titulo}: ${l.puntosClave?.join(", ")}`).join("\n") ?? curso.descripcion;

  const systemPrompt = `Eres un evaluador experto en ganadería bovina. Creas exámenes rigurosos pero justos.
Responde ÚNICAMENTE con un objeto JSON válido.`;

  const userPrompt = `Crea un examen de 8 preguntas para el curso "${curso.titulo}" (nivel: ${curso.nivel}).

Contenido del curso:
${resumen}

Responde con este JSON:
{
  "titulo": "Examen: ${curso.titulo}",
  "instrucciones": "Selecciona la respuesta correcta para cada pregunta.",
  "preguntas": [
    {
      "id": "p1",
      "pregunta": "texto de la pregunta",
      "opciones": ["opción A", "opción B", "opción C", "opción D"],
      "correcta": 0,
      "explicacion": "explicación de por qué esta es la respuesta correcta"
    }
  ],
  "tiempoLimiteMins": 20,
  "puntajeAprobacion": 70
}`;

  const res = await fetch(`${API_URL}/ia/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      maxTokens: 2500,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const raw  = data.message ?? data.content ?? data.text ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return buildFallbackExamen(curso);
  }
}

/**
 * Genera contenido educativo en modo libre (streaming via SSE).
 * `onChunk(text)` recibe fragmentos de texto en tiempo real.
 * `onDone(fullText)` recibe el texto completo al finalizar.
 */
export async function generateLearningContent({ tema, modo, nivel = "intermedio", especialista, onChunk, onDone, onError }) {
  const modePrompts = {
    explicame:    `Explica de forma clara, completa y con ejemplos prácticos para ganaderos colombianos:`,
    imagenes:     `Describe visualmente, como si crearas imágenes educativas, paso a paso con detalle visual:`,
    paso_a_paso:  `Enseña paso a paso con numeración clara, tiempos y detalles prácticos:`,
    curso:        `Crea un curso estructurado con introducción, lecciones numeradas y resumen:`,
    infografia:   `Crea el contenido de una infografía: título principal, 5-7 puntos clave con iconos emoji, datos importantes y conclusión:`,
    pdf:          `Crea un documento formal completo con: portada, índice, secciones detalladas, tablas, recomendaciones y bibliografía:`,
    examen:       `Crea 5 preguntas de selección múltiple con 4 opciones cada una, indicando la correcta y una explicación:`,
    principiante: `Explica de forma muy sencilla, sin tecnicismos, con analogías simples, como si se lo explicaras a alguien que nunca ha tenido ganado:`,
    experto:      `Explica con profundidad técnica, referencias científicas, dosis exactas, protocolos clínicos y evidencia basada en investigación:`,
  };

  const basePrompt = modePrompts[modo] ?? modePrompts.explicame;
  const systemPrompt = `Eres un especialista ganadero experto en ${especialista ?? "ganadería bovina"}.
Generas contenido educativo práctico, preciso y adaptado al productor latinoamericano.
Nivel del contenido: ${nivel}.
Responde en español de Colombia. Usa markdown con títulos, listas y ejemplos.`;

  const body = JSON.stringify({
    messages: [{ role: "user", content: `${basePrompt}\n\n**TEMA:** ${tema}` }],
    systemPrompt,
    specialistId: especialista ?? "veterinario",
    stream: true,
  });

  try {
    const res = await fetch(`${API_URL}/ia/stream`, {
      method: "POST",
      headers: getAuthHeaders(),
      body,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") { onDone?.(full); return; }
        try {
          const parsed = JSON.parse(payload);
          const text = parsed.text ?? parsed.delta ?? parsed.content ?? "";
          if (text) { full += text; onChunk?.(text); }
        } catch {}
      }
    }
    onDone?.(full);
  } catch (err) {
    onError?.(err.message);
  }
}

/**
 * Genera un protocolo/guía/checklist como texto markdown.
 */
export async function generateDocumento({ tipo, tema, categoria, nivel }) {
  const tipoPrompts = {
    protocolo:  "Crea un protocolo técnico formal con pasos numerados, responsables, materiales y criterios de evaluación:",
    guia:       "Crea una guía práctica completa con introducción, procedimiento paso a paso, consejos y errores comunes:",
    checklist:  "Crea un checklist detallado con categorías, ítems verificables y observaciones:",
    cronograma: "Crea un cronograma anual de actividades con meses, tareas específicas, frecuencia y responsables:",
    faq:        "Crea las 10 preguntas más frecuentes con respuestas completas y basadas en evidencia:",
    resumen:    "Crea un resumen ejecutivo completo con puntos clave, datos importantes y recomendaciones:",
  };

  const prompt = tipoPrompts[tipo] ?? tipoPrompts.guia;

  const res = await fetch(`${API_URL}/ia/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      messages: [{ role: "user", content: `${prompt}\n\n**Tema:** ${tema}\n**Categoría:** ${categoria}\n**Nivel:** ${nivel ?? "intermedio"}` }],
      systemPrompt: "Eres un experto en ganadería bovina. Creas documentos técnicos precisos, prácticos y adaptados al productor latinoamericano. Usa markdown con estructura clara.",
      maxTokens: 3000,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.message ?? data.content ?? data.text ?? "";
}

// ── Fallbacks ─────────────────────────────────────────────────────────────

function buildFallbackContent(curso, rawText) {
  return {
    introduccion: `Bienvenido al curso "${curso.titulo}". ${curso.descripcion}`,
    lecciones: Array.from({ length: curso.lecciones }, (_, i) => ({
      id: `leccion-${i + 1}`,
      numero: i + 1,
      titulo: `Lección ${i + 1}: ${curso.objetivos[i] ?? "Contenido del curso"}`,
      contenido: rawText || `Contenido de la lección ${i + 1}.\n\n${curso.descripcion}`,
      puntosClave: curso.objetivos,
      duracionMins: Math.round(curso.duracionMins / curso.lecciones),
      tipo: "teoria",
    })),
    resumen: curso.descripcion,
    glosario: [],
    consejosPracticos: curso.objetivos,
  };
}

function buildFallbackExamen(curso) {
  return {
    titulo: `Examen: ${curso.titulo}`,
    instrucciones: "Selecciona la respuesta correcta.",
    preguntas: [
      {
        id: "p1",
        pregunta: `¿Cuál es el objetivo principal del curso "${curso.titulo}"?`,
        opciones: [curso.objetivos[0], "Ninguna de las anteriores", "Solo la producción de leche", "Solo el manejo financiero"],
        correcta: 0,
        explicacion: `El objetivo principal es: ${curso.objetivos[0]}`,
      },
    ],
    tiempoLimiteMins: 15,
    puntajeAprobacion: 70,
  };
}
