/**
 * Motor predictivo de sanidad.
 * Analiza hato, incidentes, mortalidad e historial para anticipar riesgos sanitarios.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";

const AREA = "sanidad";

export function runSanidadEngine(data, extras = {}) {
  const predictions = [];
  const hato        = data?.hato ?? {};
  const stats       = data?.stats ?? {};
  const incidentes  = extras.incidentes ?? [];
  const insumos     = extras.insumos ?? [];
  const eventos     = extras.eventos ?? [];

  const totalAnimales = (hato.vacas ?? 0) + (hato.novillos ?? 0) + (hato.terneros ?? 0) + (hato.toros ?? 0);
  const mortalidad    = stats?.mortalidadMes ?? 0;
  const mortalidadPct = totalAnimales > 0 ? (mortalidad / totalAnimales) * 100 : 0;
  const incidentesAbiertos = incidentes.filter(i => i.estado === "abierto" || !i.estado).length;

  // ── 1. Riesgo de brote infeccioso ─────────────────────────────────────────
  if (mortalidadPct > 0 || incidentesAbiertos > 0) {
    const prob = Math.min(95, mortalidadPct * 12 + incidentesAbiertos * 15);
    const datos = [];
    if (mortalidadPct > 0) datos.push(`Mortalidad del mes: ${mortalidadPct.toFixed(1)}%`);
    if (incidentesAbiertos > 0) datos.push(`${incidentesAbiertos} incidente(s) abierto(s)`);

    predictions.push({
      id:          "san-brote",
      area:        AREA,
      titulo:      "Riesgo de brote infeccioso",
      descripcion: mortalidadPct > 3
        ? `La mortalidad actual (${mortalidadPct.toFixed(1)}%) supera el umbral aceptable (3%). Alta probabilidad de enfermedad infecciosa activa.`
        : `Se detectan incidentes sanitarios abiertos que pueden derivar en brote si no se controlan.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "7d",
      confianza:    getConfidence(datos.length + 1, 4),
      datosUtilizados:      datos,
      variablesConsideradas:["mortalidad mensual", "incidentes abiertos", "tamaño del hato"],
      limitaciones:         ["Sin datos de diagnóstico clínico específico", "Sin historial de vacunación en sistema"],
      acciones: [
        "Revisar animales con signos clínicos en las próximas 24 h",
        "Consultar al veterinario si hay más de 2 animales afectados",
        "Activar protocolo de cuarentena si se confirma agente infeccioso",
      ],
      tendencia: prob > 50 ? "subiendo" : "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Riesgo parasitario estacional ────────────────────────────────────
  const mesActual = new Date().getMonth(); // 0-11
  const esEpocaLluvia = mesActual >= 3 && mesActual <= 9; // Abr–Oct aprox. Colombia
  if (esEpocaLluvia && totalAnimales > 0) {
    const prob = totalAnimales > 100 ? 65 : 45;
    predictions.push({
      id:           "san-parasitos",
      area:         AREA,
      titulo:       "Riesgo parasitario estacional",
      descripcion:  "La época de lluvias favorece la proliferación de garrapatas, gusanos y moscas. Revisar calendario de desparasitación.",
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 5),
      datosUtilizados:      [`Época del año: lluvias`, `Hato: ${totalAnimales} animales`],
      variablesConsideradas:["estacionalidad", "tamaño del hato", "historial parasitario"],
      limitaciones:         ["Sin datos de carga parasitaria específica", "Sin registros de tratamientos previos"],
      acciones: [
        "Revisar calendario de desparasitación y actualizar si es necesario",
        "Aplicar desparasitante estratégico si no se ha hecho en los últimos 3 meses",
        "Inspeccionar carga de garrapatas semanalmente",
      ],
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 3. Riesgo nutricional/condición corporal ─────────────────────────────
  const vacas = hato.vacas ?? 0;
  if (vacas > 0) {
    const prob = esEpocaLluvia ? 25 : 55; // Mayor riesgo en sequía
    predictions.push({
      id:           "san-condicion-corporal",
      area:         AREA,
      titulo:       "Riesgo de pérdida de condición corporal",
      descripcion:  esEpocaLluvia
        ? "En época de lluvias hay buena disponibilidad de forraje, pero el riesgo de parasitismo puede afectar la CC."
        : "La época seca reduce la disponibilidad de forraje, aumentando el riesgo de pérdida de condición corporal.",
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "30d",
      confianza:    getConfidence(2, 6),
      datosUtilizados:      [`Vacas en hato: ${vacas}`, `Época: ${esEpocaLluvia ? "lluvias" : "seca"}`],
      variablesConsideradas:["época del año", "número de vacas", "disponibilidad de forraje estimada"],
      limitaciones:         ["Sin registros de BCS individuales", "Sin datos de producción de forraje por potrero"],
      acciones: [
        "Evaluar condición corporal (BCS) del 20% del hato este mes",
        "Ajustar suplementación si BCS < 2.5 en vacas en producción",
        esEpocaLluvia ? "Monitorear carga parasitaria" : "Garantizar fuentes de suplemento energético",
      ],
      tendencia: esEpocaLluvia ? "estable" : "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Vacunaciones próximas ──────────────────────────────────────────────
  const vacunacionesProximas = eventos.filter(e =>
    (e.tipo === "vacunacion" || e.titulo?.toLowerCase().includes("vacun")) &&
    new Date(e.fecha) <= new Date(Date.now() + 30 * 86400000)
  );
  if (vacunacionesProximas.length > 0) {
    predictions.push({
      id:           "san-vacunacion",
      area:         AREA,
      titulo:       `${vacunacionesProximas.length} vacunación(es) próxima(s)`,
      descripcion:  `Hay ${vacunacionesProximas.length} evento(s) de vacunación programados en los próximos 30 días. Verificar disponibilidad de biológicos y personal.`,
      probabilidad: 90,
      nivel:        "bajo",
      horizonte:    "30d",
      confianza:    getConfidence(3, 3),
      datosUtilizados:      vacunacionesProximas.map(e => e.titulo ?? "Vacunación"),
      variablesConsideradas:["eventos calendario", "fechas programadas"],
      limitaciones:         ["Requiere stock de biológicos confirmado"],
      acciones: [
        "Confirmar stock de vacunas con 2 semanas de anticipación",
        "Programar personal para el día de vacunación",
        "Registrar aplicación en el sistema",
      ],
      tendencia: "estable",
      disclaimer: DISCLAIMER,
    });
  }

  // ── 5. Medicamentos por agotarse ──────────────────────────────────────────
  const medicamentosAgotando = insumos.filter(i =>
    i.categoria === "medicamento" && i.existencia <= (i.stockMinimo ?? 2)
  );
  if (medicamentosAgotando.length > 0) {
    const prob = 85;
    predictions.push({
      id:           "san-medicamentos",
      area:         AREA,
      titulo:       `${medicamentosAgotando.length} medicamento(s) próximos a agotarse`,
      descripcion:  `Stock crítico detectado: ${medicamentosAgotando.map(m => m.nombre).join(", ")}. Sin reposición, puede verse afectada la capacidad de respuesta ante enfermedades.`,
      probabilidad: prob,
      nivel:        getRiskLevel(prob),
      horizonte:    "7d",
      confianza:    getConfidence(3, 3),
      datosUtilizados:      medicamentosAgotando.map(m => `${m.nombre}: ${m.existencia} unidades`),
      variablesConsideradas:["stock actual", "stock mínimo definido"],
      limitaciones:         ["Sin datos de consumo histórico para estimar días restantes exactos"],
      acciones: medicamentosAgotando.map(m => `Reponer ${m.nombre} — stock actual: ${m.existencia}`),
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  return predictions;
}
