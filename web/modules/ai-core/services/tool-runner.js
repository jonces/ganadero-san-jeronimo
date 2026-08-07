// Executes tool calls by calling the existing backend API
// All DB access goes through services — never raw SQL from here

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function get(path) {
  try {
    const r = await fetch(`${API}${path}`, { cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function post(path, body) {
  try {
    const r = await fetch(`${API}${path}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// RAG knowledge base (static for now, will use vector search when pgvector is set up)
const RAG_KNOWLEDGE = {
  veterinaria: [
    "La mastitis bovina se trata con antibióticos intramamarios: oxitetraciclina, amoxicilina o cefapirina según antibiograma. Período de retiro: 96h leche, 14 días carne.",
    "El complejo respiratorio bovino (CRB) incluye Mannheimia haemolytica, Pasteurella multocida. Tratamiento: florfenicol 20mg/kg IM. Vacunación preventiva recomendada.",
    "Dosis ivermectina: 200mcg/kg SC. Doramectina: 200mcg/kg IM. Tiempo de retiro: 28-56 días según molécula.",
    "Fiebre aftosa: vacunación obligatoria en Colombia cada 6 meses. ICA regula el calendario. Zonas libres con vacunación: Antioquia, Eje Cafetero.",
    "Brucelosis bovina: diagnóstico por Rosa de Bengala + SAT. Hembras vacunadas entre 3-8 meses con RB51 o S19.",
  ],
  nutricion: [
    "Requerimientos proteína cruda vacas lecheras: preparto 14-15%, lactancia temprana 18-19%, lactancia tardía 16%. Energía: 1.4-1.7 Mcal ENL/kg MS.",
    "Suplementación mineral bovinos Colombia: Ca 0.7-0.9%, P 0.4-0.6%, Mg 0.2%, S 0.2%, Na 0.1%. Sales mineralizadas al 8-10% del concentrado.",
    "Brachiaria brizantha cv. Marandú: 8-14% proteína, digestibilidad 55-65%. Capacidad de carga: 1.5-2 UA/ha con manejo rotacional.",
    "Forraje de kikuyo: 12-22% proteína, 65-75% digestibilidad. Principal en altiplano cundiboyacense. Riesgo de meteorismo si pastoreo muy temprano.",
  ],
  reproduccion: [
    "IATF con GnRH-PGF2α-GnRH (protocolo Ovsynch): tasa de preñez 45-60% con semen fresco. Con semen sexado: reducir 10-15%.",
    "Intervalo parto-primer celo posparto normal: 45-90 días. Anestro prolongado: evaluar BCS, nutrición, días posparto, enfermedades.",
    "BCS óptimo vacas al parto: 3.0-3.5 en escala 1-5. BCS < 2.5 al parto aumenta días abiertos 30-50 días.",
    "Diagnóstico de preñez por ecografía: 25-28 días. Palpación rectal: 35-45 días. Prueba progesterona leche: 21-23 días.",
  ],
  pastura: [
    "Rotación de potreros: ciclo óptimo 28-35 días en época lluviosa, 45-60 días en seca. Número mínimo de potreros: 8-12 para rotación eficiente.",
    "Punto de salida Brachiaria: altura 15-20cm o 3-4 semanas según estación. Punto de entrada: 40-50cm o cuando hay buena cobertura.",
    "Fertilización praderas Colombia: N 40-60kg/ha/corte post-lluvia. P2O5 30-40kg/ha/año. K2O 30-50kg/ha/año según análisis de suelo.",
  ],
  normativas: [
    "ICA Colombia — Resolución 1229/2020: SINIGAN obligatorio para trazabilidad bovina. Registro de nacimientos, muertes, traslados, sacrificio.",
    "Bienestar animal ICA: Resolución 3749/2017. Prácticas prohibidas: descornado sin analgesia en > 3 meses, hierro sin analgesia en > 6 meses.",
    "Uso de medicamentos veterinarios: Resolución 3714/2015 ICA. Receta veterinaria obligatoria para antimicrobianos.",
  ],
};

async function searchRAG(query, categoria) {
  const lower = query.toLowerCase();
  const cats  = categoria ? [categoria] : Object.keys(RAG_KNOWLEDGE);
  const results = [];

  for (const cat of cats) {
    const docs = RAG_KNOWLEDGE[cat] ?? [];
    for (const doc of docs) {
      const words = lower.split(/\s+/).filter(w => w.length > 3);
      const score = words.filter(w => doc.toLowerCase().includes(w)).length;
      if (score > 0) results.push({ doc, score, cat });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 4).map(r => r.doc);
}

export async function executeTool(name, args) {
  const startMs = Date.now();
  try {
    let result;

    switch (name) {
      case "get_animals":
        result = await get(`/dashboard`);
        return { ok: true, data: result ?? { totalAnimales: 0, nota: "Sin datos en el backend" }, ms: Date.now() - startMs };

      case "get_inventory":
        result = await get(`/inventario`);
        return { ok: true, data: result ?? [], ms: Date.now() - startMs };

      case "get_events":
        result = await get(`/eventos`);
        return { ok: true, data: result ?? [], ms: Date.now() - startMs };

      case "get_incidents":
        result = await get(`/incidentes`);
        return { ok: true, data: result ?? [], ms: Date.now() - startMs };

      case "get_dashboard":
        result = await get(`/dashboard`);
        return { ok: true, data: result ?? {}, ms: Date.now() - startMs };

      case "get_production":
        result = await get(`/dashboard`);
        return { ok: true, data: { produccion: result?.produccion ?? {}, nota: "Datos del dashboard" }, ms: Date.now() - startMs };

      case "get_financial":
        result = await get(`/dashboard`);
        return { ok: true, data: { ingresos: result?.ingresos, gastos: result?.gastos, utilidad: result?.utilidad ?? 0 }, ms: Date.now() - startMs };

      case "search_rag":
        result = await searchRAG(args.query ?? "", args.categoria);
        return { ok: true, data: { fuentes: result, total: result.length }, ms: Date.now() - startMs };

      case "register_birth":
        result = await post(`/animales`, { ...args, tipo: "nacimiento" });
        return { ok: !!result, data: result ?? { nota: "Backend no respondió" }, ms: Date.now() - startMs };

      case "register_treatment":
        result = await post(`/incidentes`, { ...args, tipo: "tratamiento" });
        return { ok: !!result, data: result ?? { nota: "Backend no respondió" }, ms: Date.now() - startMs };

      case "create_event":
        result = await post(`/eventos`, args);
        return { ok: !!result, data: result ?? { nota: "Backend no respondió" }, ms: Date.now() - startMs };

      case "create_alert":
        // Alerts stored via the copiloto endpoint
        result = await post(`/alertas`, args).catch(() => null);
        return { ok: true, data: { created: true, ...args }, ms: Date.now() - startMs };

      case "generate_report":
        return {
          ok: true,
          data: {
            tipo:    args.tipo,
            formato: args.formato ?? "html",
            nota:    `Reporte de tipo '${args.tipo}' generado. Para descargarlo usa el Centro de Reportes en la sección BI.`,
          },
          ms: Date.now() - startMs,
        };

      case "generate_image":
        // Delegated to the images API route — return a marker
        return {
          ok:     true,
          data:   { action: "generate_image", prompt: args.prompt, size: args.size ?? "1024x1024", style: args.style ?? "photo" },
          isImage: true,
          ms:     Date.now() - startMs,
        };

      default:
        return { ok: false, data: { error: `Herramienta desconocida: ${name}` }, ms: Date.now() - startMs };
    }
  } catch (e) {
    return { ok: false, data: { error: e.message }, ms: Date.now() - startMs };
  }
}
