/**
 * Tipos de publicación, estados y configuración del Marketplace.
 */

export const LISTING_STATUS = {
  BORRADOR:   "borrador",
  ACTIVA:     "activa",
  PAUSADA:    "pausada",
  VENDIDA:    "vendida",
  EXPIRADA:   "expirada",
  ELIMINADA:  "eliminada",
};

export const LISTING_STATUS_CONFIG = {
  borrador:   { label: "Borrador",      color: "#6b7280", bg: "#f9fafb", icono: "✏️"  },
  activa:     { label: "Disponible",    color: "#16a34a", bg: "#f0fdf4", icono: "✅"  },
  pausada:    { label: "Pausada",       color: "#d97706", bg: "#fffbeb", icono: "⏸️"  },
  vendida:    { label: "Vendida",       color: "#2563eb", bg: "#eff6ff", icono: "🎉"  },
  expirada:   { label: "Expirada",      color: "#9ca3af", bg: "#f3f4f6", icono: "⏱️"  },
  eliminada:  { label: "Eliminada",     color: "#dc2626", bg: "#fef2f2", icono: "🗑️"  },
};

export const LISTING_TYPE = {
  ANIMAL:   "animal",
  PRODUCTO: "producto",
  SERVICIO: "servicio",
};

export const LISTING_TYPE_CONFIG = {
  animal:   { label: "Animal",   icono: "🐄", campos: ["especie", "raza", "sexo", "edad_meses", "peso_kg", "vacunas", "pedigri"] },
  producto: { label: "Producto", icono: "📦", campos: ["marca", "unidad", "cantidad_disponible", "vencimiento"] },
  servicio: { label: "Servicio", icono: "🤝", campos: ["especialidad", "zona_cobertura", "disponibilidad", "experiencia_anos"] },
};

export const CONDITION_CONFIG = {
  nuevo:     { label: "Nuevo",         icono: "✨" },
  usado:     { label: "Usado",         icono: "♻️"  },
  reacondicionado: { label: "Reacondicionado", icono: "🔧" },
};

export const UNIDADES = ["kg", "litro", "dosis", "unidad", "par", "metro", "rollo", "bulto", "tonelada", "gramo", "ml"];

/** Genera publicaciones demo para el catálogo inicial. */
export function generateDemoListings() {
  return [
    {
      id: "demo-1", tipo: "animal", categoria: "ganado", subcategoria: "toro",
      titulo: "Toro Brahman Puro Certificado PBU", precio: 28000000,
      descripcion: "Toro Brahman rojo, 3 años, 680 kg, excelente conformación, probado en monta. Pedigrí certificado ASOCEBU. Vacunas al día.",
      raza: "Brahman", edad_meses: 36, peso_kg: 680, ubicacion: "Córdoba, Colombia",
      empresa: "Ganadería El Palmar", empresa_id: "emp-demo-1",
      calificacion: 4.8, num_resenas: 23, vistas: 312, favoritos: 45,
      fotos: [], status: "activa", destacada: true, creadoTs: Date.now() - 86400000 * 5,
    },
    {
      id: "demo-2", tipo: "animal", categoria: "ganado", subcategoria: "vaca",
      titulo: "Vacas Girolando Preñadas — Lote de 20",
      precio: 7800000, precio_unidad: true, unidad_ref: "por animal",
      descripcion: "Lote de 20 vacas Girolando preñadas, 5-7 años, producción promedio 14 lt/día. Ubicadas en Montería. Entrega en la finca.",
      raza: "Girolando", edad_meses: 72, peso_kg: 480, ubicacion: "Montería, Córdoba",
      empresa: "Hato Los Samanes", empresa_id: "emp-demo-2",
      calificacion: 4.5, num_resenas: 11, vistas: 198, favoritos: 28,
      fotos: [], status: "activa", destacada: false, creadoTs: Date.now() - 86400000 * 3,
    },
    {
      id: "demo-3", tipo: "animal", categoria: "semen",
      titulo: "Dosis de Semen Congelado — Angus Negro Importado",
      precio: 180000, precio_unidad: true, unidad_ref: "por dosis",
      descripcion: "Semen congelado de Angus negro importado USA. Garantía de fertilidad ≥70%. Disponibles 50 dosis. Almacenamiento en nitrógeno líquido.",
      ubicacion: "Bogotá, Colombia",
      empresa: "Laboratorio Genética Bovina S.A.", empresa_id: "emp-demo-3",
      calificacion: 4.9, num_resenas: 67, vistas: 521, favoritos: 89,
      fotos: [], status: "activa", destacada: true, creadoTs: Date.now() - 86400000 * 10,
    },
    {
      id: "demo-4", tipo: "producto", categoria: "minerales",
      titulo: "Sal Mineralizada Premium Bovinos — Bulto 40kg",
      precio: 95000, precio_unidad: true, unidad_ref: "por bulto",
      descripcion: "Sal mineralizada completa para bovinos. Fósforo 6%, Calcio 12%, Zinc, Cobre, Selenio, Yodo. Presentación 40 kg. Mínimo 10 bultos.",
      marca: "MineBov", unidad: "bulto", cantidad_disponible: 500,
      ubicacion: "Medellín, Antioquia",
      empresa: "Agropecuaria del Norte", empresa_id: "emp-demo-1",
      calificacion: 4.6, num_resenas: 34, vistas: 287, favoritos: 41,
      fotos: [], status: "activa", destacada: false, creadoTs: Date.now() - 86400000 * 7,
    },
    {
      id: "demo-5", tipo: "servicio", categoria: "servicios", subcategoria: "veterinario",
      titulo: "Servicio de Inseminación Artificial en Campo",
      precio: 85000, precio_unidad: true, unidad_ref: "por animal",
      descripcion: "Inseminación artificial tiempo fijo (IATF) con diagnóstico de preñez. Cobertura departamentos Córdoba, Sucre y Bolívar. Más de 15 años de experiencia.",
      especialidad: "Inseminación Artificial", zona_cobertura: "Córdoba, Sucre, Bolívar",
      experiencia_anos: 15,
      empresa: "Vet. Campo Dr. Héctor Suárez", empresa_id: "emp-demo-4",
      calificacion: 4.9, num_resenas: 156, vistas: 743, favoritos: 112,
      fotos: [], status: "activa", destacada: true, creadoTs: Date.now() - 86400000 * 2,
    },
    {
      id: "demo-6", tipo: "producto", categoria: "concentrados",
      titulo: "Núcleo Proteico para Engorde — Saco 40kg",
      precio: 142000, precio_unidad: true, unidad_ref: "por saco",
      descripcion: "Núcleo proteico 36% para bovinos en engorde intensivo. Formulado con aminoácidos esenciales, ionóforos y búfer ruminal. Incremento GMD +150 g/día demostrado.",
      marca: "ProCampo", unidad: "saco", cantidad_disponible: 250,
      ubicacion: "Villavicencio, Meta",
      empresa: "Nutrición Animal SAS", empresa_id: "emp-demo-5",
      calificacion: 4.7, num_resenas: 45, vistas: 334, favoritos: 56,
      fotos: [], status: "activa", destacada: false, creadoTs: Date.now() - 86400000 * 8,
    },
    {
      id: "demo-7", tipo: "producto", categoria: "equipos",
      titulo: "Báscula Ganadera Electrónica 2000 kg",
      precio: 3800000,
      descripcion: "Báscula electrónica para pesaje de bovinos. Capacidad 2000 kg. Precisión ±0.5 kg. Panel LCD, batería recargable, conexión Bluetooth. Garantía 2 años.",
      marca: "PesoTec", unidad: "unidad", cantidad_disponible: 12,
      ubicacion: "Bogotá, Colombia",
      empresa: "Equipos Agro Colombia", empresa_id: "emp-demo-3",
      calificacion: 4.4, num_resenas: 18, vistas: 167, favoritos: 29,
      fotos: [], status: "activa", destacada: false, creadoTs: Date.now() - 86400000 * 15,
    },
    {
      id: "demo-8", tipo: "producto", categoria: "drones",
      titulo: "Drone Agrícola con Cámara Térmica",
      precio: 18500000,
      descripcion: "Drone profesional para ganadería. Cámara RGB + térmica. Autonomía 45 min. Software de conteo automático de animales con IA. Incluye capacitación.",
      marca: "AgroFly", unidad: "unidad", cantidad_disponible: 5,
      ubicacion: "Medellín, Antioquia",
      empresa: "Tech Agro S.A.S.", empresa_id: "emp-demo-5",
      calificacion: 4.6, num_resenas: 9, vistas: 234, favoritos: 38,
      fotos: [], status: "activa", destacada: true, creadoTs: Date.now() - 86400000 * 20,
    },
  ];
}
