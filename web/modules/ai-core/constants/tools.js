// OpenAI-format tool definitions for function calling
export const TOOL_DEFS = [
  // ── Query tools ──────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "get_animals",
      description: "Consulta los animales del hato ganadero. Filtra por especie, categoría, estado sanitario o raza.",
      parameters: {
        type: "object",
        properties: {
          filtro:    { type: "string", description: "Filtro opcional: especie, categoría, estado" },
          limite:    { type: "integer", description: "Máximo de registros a retornar", default: 50 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory",
      description: "Consulta el inventario de insumos, medicamentos, alimentos y equipos.",
      parameters: {
        type: "object",
        properties: {
          categoria: { type: "string", description: "Categoría: medicamentos, alimentos, equipos, minerales" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_events",
      description: "Consulta eventos del calendario: vacunaciones, pesajes, partos, destetes.",
      parameters: {
        type: "object",
        properties: {
          tipo:       { type: "string", description: "Tipo de evento" },
          dias_futuros: { type: "integer", description: "Días hacia adelante a consultar", default: 30 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_incidents",
      description: "Consulta incidentes sanitarios, enfermedades y tratamientos activos.",
      parameters: {
        type: "object",
        properties: {
          estado: { type: "string", enum: ["activo", "resuelto", "todos"], default: "activo" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard",
      description: "Obtiene el resumen general del dashboard: KPIs, alertas, totales financieros.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_production",
      description: "Consulta producción de leche, carne, pesos y ganancias diarias.",
      parameters: {
        type: "object",
        properties: {
          periodo: { type: "string", description: "Período: hoy, semana, mes, año" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial",
      description: "Consulta ingresos, gastos, utilidades y flujo de caja.",
      parameters: {
        type: "object",
        properties: {
          periodo: { type: "string", description: "Período: mes_actual, trimestre, año" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_rag",
      description: "Busca en la biblioteca veterinaria, academia ganadera y documentación interna.",
      parameters: {
        type: "object",
        properties: {
          query:     { type: "string", description: "Consulta a buscar en el conocimiento interno" },
          categoria: { type: "string", description: "Categoría: veterinaria, nutricion, reproduccion, pastura, normativas" },
        },
        required: ["query"],
      },
    },
  },
  // ── Action tools ─────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "register_birth",
      description: "Registra el nacimiento de un animal en el sistema.",
      parameters: {
        type: "object",
        properties: {
          fecha:     { type: "string", description: "Fecha del nacimiento (YYYY-MM-DD)" },
          madre_id:  { type: "string", description: "ID de la madre" },
          sexo:      { type: "string", enum: ["macho", "hembra"] },
          peso_kg:   { type: "number", description: "Peso al nacer en kg" },
          raza:      { type: "string" },
          observaciones: { type: "string" },
        },
        required: ["fecha", "sexo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_treatment",
      description: "Registra un tratamiento veterinario o medicación a un animal.",
      parameters: {
        type: "object",
        properties: {
          animal_id:    { type: "string" },
          diagnostico:  { type: "string" },
          medicamento:  { type: "string" },
          dosis:        { type: "string" },
          fecha:        { type: "string" },
          veterinario:  { type: "string" },
        },
        required: ["diagnostico", "medicamento"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Crea un evento en el calendario ganadero (vacunación, pesaje, revisión, etc).",
      parameters: {
        type: "object",
        properties: {
          tipo:        { type: "string" },
          titulo:      { type: "string" },
          fecha:       { type: "string" },
          descripcion: { type: "string" },
          animales:    { type: "array", items: { type: "string" }, description: "IDs de animales involucrados" },
        },
        required: ["tipo", "titulo", "fecha"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_alert",
      description: "Crea una alerta de seguimiento para el propietario.",
      parameters: {
        type: "object",
        properties: {
          titulo:      { type: "string" },
          mensaje:     { type: "string" },
          prioridad:   { type: "string", enum: ["baja", "media", "alta", "critica"] },
          fecha_limite:{ type: "string" },
        },
        required: ["titulo", "mensaje", "prioridad"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Genera un reporte ejecutivo en el formato solicitado.",
      parameters: {
        type: "object",
        properties: {
          tipo:    { type: "string", description: "sanitario, financiero, reproductivo, ejecutivo, potrero" },
          formato: { type: "string", enum: ["html", "csv", "texto"] },
          periodo: { type: "string" },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Genera una imagen usando IA cuando el usuario lo solicita o cuando una imagen aporta más valor que el texto.",
      parameters: {
        type: "object",
        properties: {
          prompt:  { type: "string", description: "Descripción detallada de la imagen a generar" },
          style:   { type: "string", enum: ["photo", "diagram", "infographic", "illustration"], default: "photo" },
          size:    { type: "string", enum: ["1024x1024", "1792x1024", "1024x1792"], default: "1024x1024" },
        },
        required: ["prompt"],
      },
    },
  },
];

export const TOOL_NAMES = TOOL_DEFS.map(t => t.function.name);
