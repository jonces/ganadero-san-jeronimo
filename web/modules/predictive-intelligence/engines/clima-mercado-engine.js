/**
 * Motor predictivo de Clima y Mercado.
 * Arquitectura preparada para integración con APIs externas e IoT.
 * Actualmente genera predicciones basadas en estacionalidad y tendencias referenciales.
 */
import { getRiskLevel, getConfidence, DISCLAIMER } from "../constants/risk-levels.js";
import { IoTRegistry, IOT_ADAPTER_TYPE } from "../constants/iot-adapters.js";

const AREA_CLIMA   = "clima";
const AREA_MERCADO = "mercado";

export function runClimaEngine(data, extras = {}) {
  const predictions = [];
  const climaAdapter = IoTRegistry.get(IOT_ADAPTER_TYPE.CLIMA);
  const hayClima     = climaAdapter?.isDisponible() ?? false;
  const mes = new Date().getMonth();

  // ── Alertas estacionales (sin API de clima conectada) ─────────────────────
  const esEpocaLluvia = mes >= 3 && mes <= 9;
  const esEpocaSeca   = mes < 2 || mes > 10;

  predictions.push({
    id:           "clima-estacional",
    area:         AREA_CLIMA,
    titulo:       esEpocaLluvia ? "Época de lluvias activa" : esEpocaSeca ? "Época seca activa" : "Transición climática",
    descripcion:  esEpocaLluvia
      ? "La época de lluvias favorece el crecimiento forrajero pero aumenta el riesgo de parasitismo, enfermedades respiratorias y anegamiento de potreros."
      : esEpocaSeca
      ? "La época seca reduce disponibilidad de forraje y agua. Mayor riesgo de estrés calórico, pérdida de condición corporal y problemas reproductivos."
      : "Período de transición climática. Preparar finca para el cambio de estación.",
    probabilidad: 80,
    nivel:        esEpocaSeca ? getRiskLevel(60) : "bajo",
    horizonte:    "30d",
    confianza:    getConfidence(1, 4),
    datosUtilizados:      [`Mes actual: ${new Date().toLocaleString("es-CO", { month: "long" })}`],
    variablesConsideradas:["estacionalidad Colombia (lluvias: Abr-Oct, seca: Nov-Mar)"],
    limitaciones:         [
      "Sin integración con API de clima (OpenWeatherMap u otro)",
      "Predicción basada en estacionalidad histórica general, no en datos meteorológicos reales",
      hayClima ? "" : "🔌 Conectar API de clima para predicciones precisas",
    ].filter(Boolean),
    acciones: esEpocaLluvia
      ? ["Revisar drenajes de potreros y corrales", "Activar protocolo antiparasitario", "Asegurar techo en áreas de alimentación"]
      : ["Garantizar agua permanente en todos los potreros", "Activar suplementación energética", "Implementar sombra artificial si es posible"],
    iotReady:   true,
    iotTipo:    IOT_ADAPTER_TYPE.CLIMA,
    iotLabel:   "Conectar API de clima para activar predicciones en tiempo real",
    tendencia:  "estable",
    disclaimer: DISCLAIMER,
  });

  // Estrés calórico
  if (esEpocaSeca) {
    predictions.push({
      id:           "clima-estres-calorico",
      area:         AREA_CLIMA,
      titulo:       "Riesgo de estrés calórico en época seca",
      descripcion:  "Las altas temperaturas en época seca pueden generar estrés calórico, reducir el consumo de alimento, bajar la producción de leche hasta un 20% y afectar la fertilidad.",
      probabilidad: 65,
      nivel:        getRiskLevel(65),
      horizonte:    "30d",
      confianza:    getConfidence(1, 4),
      datosUtilizados:      ["Época seca activa"],
      variablesConsideradas:["temperatura ambiental estacional", "humedad relativa", "índice THI estimado"],
      limitaciones:         ["Sin sensor de temperatura en finca", "Sin datos de THI (Temperatura-Humedad)"],
      acciones: [
        "Garantizar disponibilidad de agua fresca y limpia (> 60 lt/vaca/día en calor)",
        "Instalar sombra artificial o seleccionar potreros con árboles",
        "Mover animales en las horas más frescas (mañana/tarde)",
        "Reducir manejo/procedimientos en horas de mayor calor (10am-4pm)",
      ],
      iotReady: true,
      iotTipo:  IOT_ADAPTER_TYPE.SENSOR,
      iotLabel: "Conectar sensor de temperatura/humedad para monitoreo de THI en tiempo real",
      tendencia: "subiendo",
      disclaimer: DISCLAIMER,
    });
  }

  return predictions;
}

export function runMercadoEngine(data, extras = {}) {
  const predictions = [];
  const mercadoAdapter = IoTRegistry.get(IOT_ADAPTER_TYPE.MERCADO);
  const hayMercado     = mercadoAdapter?.isDisponible() ?? false;
  const fin = data?.finanzas ?? {};

  // Predicciones de mercado basadas en tendencias referenciales
  const precioKgRef = 8500; // COP/kg en pie referencia 2024
  const precioLecheRef = 1200; // COP/lt referencia 2024

  predictions.push({
    id:           "merc-precio-carne",
    area:         AREA_MERCADO,
    titulo:       `Precio de referencia: $${precioKgRef.toLocaleString("es-CO")}/kg en pie`,
    descripcion:  `El precio referencial de ganado en pie es de $${precioKgRef.toLocaleString("es-CO")}/kg. Los precios varían por región, categoría y época. Conectar API de mercado para precios en tiempo real de tu zona.`,
    probabilidad: 50,
    nivel:        "bajo",
    horizonte:    "30d",
    confianza:    getConfidence(1, 5),
    datosUtilizados:      ["Precio referencial nacional 2024"],
    variablesConsideradas:["precio promedio nacional", "estacionalidad de demanda"],
    limitaciones:         [
      "Sin integración con subasta o plataforma de precios regional",
      hayMercado ? "" : "🔌 Conectar API de mercado para precios locales en tiempo real",
    ].filter(Boolean),
    acciones: [
      "Consultar precios locales antes de cada venta",
      "Registrar precios de venta históricos en el sistema para análisis de tendencia",
      "Comparar con precio de referencia al momento de negociar",
    ],
    iotReady: true,
    iotTipo:  IOT_ADAPTER_TYPE.MERCADO,
    iotLabel: "Conectar API de mercado ganadero colombiano",
    tendencia: "estable",
    disclaimer: DISCLAIMER,
  });

  predictions.push({
    id:           "merc-precio-insumos",
    area:         AREA_MERCADO,
    titulo:       "Riesgo de alza en precios de insumos",
    descripcion:  "Los precios de concentrados, medicamentos y materiales están sujetos a inflación y tasas de cambio. Un incremento del 10% en insumos puede impactar significativamente el margen de la finca.",
    probabilidad: 55,
    nivel:        getRiskLevel(55),
    horizonte:    "90d",
    confianza:    getConfidence(1, 5),
    datosUtilizados:      ["Tendencia inflacionaria general Colombia 2024"],
    variablesConsideradas:["inflación", "tasa de cambio USD/COP", "precios históricos de insumos"],
    limitaciones:         ["Sin datos de precios históricos de insumos en el sistema", "Sin integración con proveedores"],
    acciones: [
      "Comprar insumos de alta rotación en volumen cuando el precio esté bajo",
      "Evaluar producción propia de forraje para reducir dependencia de concentrados",
      "Solicitar cotizaciones a mínimo 3 proveedores antes de cada compra",
    ],
    iotReady: true,
    iotTipo:  IOT_ADAPTER_TYPE.MERCADO,
    iotLabel: "Conectar API de precios de insumos para alertas automáticas",
    tendencia: "subiendo",
    disclaimer: DISCLAIMER,
  });

  return predictions;
}
