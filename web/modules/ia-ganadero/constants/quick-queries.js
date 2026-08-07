/**
 * Consultas rápidas por especialista — generadas dinámicamente desde los especialistas IA.
 * Mantiene también las categorías genéricas legacy para compatibilidad.
 */
import { ESPECIALISTAS_IA } from "../specialists/index.js";

/** Genera las consultas rápidas dinámicamente a partir de los especialistas. */
export function getConsultasEjemplo(specialistId) {
  const especialista = ESPECIALISTAS_IA.find(e => e.id === specialistId);
  return especialista?.consultasEjemplo ?? EMERGENCIAS_IA;
}

// Categorías genéricas legacy — se mantienen por compatibilidad con código existente
export const CATEGORIAS_IA = [
  {
    id: "alimentacion", titulo: "Mi vaca no quiere comer", icono: "🐄",
    color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", hoverBg: "#FEF3C7",
    descripcion: "Diagnóstico de inapetencia y problemas digestivos",
    sugerencias: ["Mi vaca no ha comido en 24 horas","La vaca rechaza el concentrado","Animal con pérdida de peso repentina","Vaca con timpanismo o distensión"],
  },
  {
    id: "mastitis", titulo: "Tengo mastitis", icono: "🩺",
    color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", hoverBg: "#FEE2E2",
    descripcion: "Manejo, tratamiento y prevención de mastitis",
    sugerencias: ["Leche con grumos o sangre","Ubre caliente e inflamada","¿Qué antibiótico usar?","¿Cómo hacer el California Mastitis Test?"],
  },
  {
    id: "desparasitacion", titulo: "¿Cómo desparasito?", icono: "💊",
    color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", hoverBg: "#EDE9FE",
    descripcion: "Protocolos de desparasitación interna y externa",
    sugerencias: ["¿Cada cuánto desparasito el hato?","Dosis de ivermectina por peso","Garrapatas resistentes al baño","Desparasitación en vacas preñadas"],
  },
  {
    id: "potreros", titulo: "Diseñar potreros", icono: "🌿",
    color: "#10A37F", bg: "#F0FDF4", border: "#BBF7D0", hoverBg: "#DCFCE7",
    descripcion: "Rotación, carga animal y manejo de pasturas",
    sugerencias: ["Plan de rotación para 40 animales","¿Cuántos potreros necesito?","Carga animal por hectárea","Período de descanso del pasto"],
  },
  {
    id: "vacunacion", titulo: "Plan de vacunación", icono: "💉",
    color: "#0EA5E9", bg: "#F0F9FF", border: "#BAE6FD", hoverBg: "#E0F2FE",
    descripcion: "Calendario sanitario y protocolos de inmunización",
    sugerencias: ["Vacunas obligatorias en Colombia","Esquema para terneros recién nacidos","¿Cuándo vacunar contra fiebre aftosa?","Vacunación en época lluviosa"],
  },
  {
    id: "reproduccion", titulo: "Reproducción", icono: "🤰",
    color: "#EC4899", bg: "#FDF2F8", border: "#FBCFE8", hoverBg: "#FCE7F3",
    descripcion: "Celo, inseminación, gestación y partos",
    sugerencias: ["Cómo detectar el celo","Inseminación artificial — pasos","Gestación: ¿qué revisar cada mes?","Vaca con parto difícil o distócico"],
  },
  {
    id: "nutricion", titulo: "Nutrición", icono: "🌾",
    color: "#F97316", bg: "#FFF7ED", border: "#FED7AA", hoverBg: "#FFEDD5",
    descripcion: "Dietas, suplementación y requerimientos nutricionales",
    sugerencias: ["Ración diaria para vaca lechera","Sales minerales: ¿cuánto y cuál?","Suplementación en época seca","Concentrado vs. pasto: balanceo"],
  },
  {
    id: "pasturas", titulo: "Pasturas", icono: "🌱",
    color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", hoverBg: "#DCFCE7",
    descripcion: "Establecimiento, manejo y mejoramiento de gramíneas",
    sugerencias: ["¿Qué pasto sembrar en verano?","Brachiaria vs. Marandú — cuál elegir","Fertilización de pasturas degradadas","Control de maleza en potreros nuevos"],
  },
  {
    id: "medicamentos", titulo: "Medicamentos", icono: "🔬",
    color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE", hoverBg: "#E0E7FF",
    descripcion: "Dosificación, vías de administración y tiempos de retiro",
    sugerencias: ["Dosis de oxitocina en bovinos","¿Qué antiinflamatorio usar?","Tiempo de retiro de antibióticos en leche","Vitaminas inyectables: dosis y frecuencia"],
  },
];

export const EMERGENCIAS_IA = [
  "Animal caído sin poder levantarse",
  "Vaca con fiebre alta",
  "Diarrea en ternero recién nacido",
  "Parto con complicaciones",
  "Herida profunda o fractura",
  "Intoxicación por planta o químico",
  "Animal con dificultad para respirar",
  "Aborto espontáneo en la manada",
];
