/**
 * Biblioteca de prompts optimizados para DALL-E 3 por especialista.
 * Cada especialista tiene un prefijo de contexto y plantillas predefinidas.
 */

export const SPECIALIST_PROMPT_PREFIXES = {
  veterinario: "Detailed technical veterinary illustration for cattle farmers in Colombia. " +
    "Professional medical/veterinary style. Clear anatomical accuracy. Educational purpose. ",

  nutricionista: "Technical nutritional illustration for cattle farming education. " +
    "Clean infographic style with charts, nutrition labels and food items. " +
    "Professional agricultural educational material. ",

  reproduccion: "Technical reproductive veterinary illustration for cattle farmers. " +
    "Clean anatomical diagrams, professional educational style. " +
    "Clear step-by-step visual guides. ",

  pasturas: "Aerial and ground-level agricultural illustration of tropical pastures and grazing systems. " +
    "Lush green Colombian landscape, rotational grazing systems, silvopastoral setups. " +
    "Professional agricultural technical drawing style. ",

  infraestructura: "Professional technical blueprint and architectural illustration of cattle farm infrastructure. " +
    "Top-down plan view and 3D perspective renders. Clean lines, labeled dimensions. " +
    "Modern cattle farming facilities in Colombia. ",

  corrales: "Technical illustration of cattle handling facilities and stockmanship. " +
    "Clear diagrams of animal flow, handling systems, safety setups. " +
    "Professional livestock management visual guide. ",

  finanzas: "Professional financial infographic and chart illustration for cattle farming economics. " +
    "Clean data visualization, charts, tables. Agricultural business style. ",

  produccion: "Technical cattle breed comparison and production system illustration. " +
    "Realistic cattle photography style, breed characteristics, production metrics visualization. " +
    "Professional cattle industry publication style. ",

  bienestar: "Animal welfare educational illustration for cattle farming. " +
    "Compassionate, clear diagrams showing proper animal handling, five freedoms, behavioral indicators. " +
    "Professional veterinary welfare assessment visual guide. ",

  default: "Professional technical illustration for cattle farming in Colombia and Latin America. " +
    "Educational, clear, high quality. Clean background. ",
};

/**
 * Plantillas de prompts predefinidos por categoría y tema.
 * Acceso: PROMPT_TEMPLATES[specialistId][keyword]
 */
export const PROMPT_TEMPLATES = {
  veterinario: {
    "inyección intramuscular": "Step-by-step technical diagram showing intramuscular injection technique in cattle. " +
      "Shows correct injection site on the neck muscle (cervical triangle), needle angle 90 degrees, " +
      "hand position, cattle restraint in a chute/brete. Numbered steps 1-4. Spanish labels. Educational veterinary poster.",

    "vacuna": "Educational poster showing cattle vaccination procedure in Colombia. " +
      "Correct injection sites marked on cattle silhouette, subcutaneous vs intramuscular diagram, " +
      "dosage table, vaccination calendar wheel. Clean medical illustration style.",

    "mastitis": "Veterinary diagnostic poster for bovine mastitis. Shows: " +
      "4 udder quarters with infection stages, CMT test procedure, teat scoring, " +
      "healthy vs infected milk comparison. Professional dairy veterinary illustration.",

    "parto": "Step-by-step bovine calving (parturition) educational diagram. " +
      "Shows: normal calf presentation, stages of labor, obstetric assistance techniques, " +
      "when to intervene. Professional veterinary obstetrics illustration.",

    "condición corporal": "Bovine body condition scoring chart (BCS 1-5 scale). " +
      "Side profile silhouettes of cattle at each BCS level with key anatomical landmarks highlighted. " +
      "Reference table with production recommendations. Professional livestock assessment chart.",

    "desparasitación": "Cattle deworming and parasite control educational diagram. " +
      "Life cycle of Rhipicephalus microplus tick, internal parasite diagram, " +
      "rotation of antiparasitic products chart, application sites on cattle body. Educational poster.",
  },

  infraestructura: {
    "corral": "Professional top-down architectural blueprint of a cattle handling corral system for 100 animals. " +
      "Shows: collection pen, crowd pen, curved single-file alley, squeeze chute (brete), loading ramp. " +
      "Dimensions labeled in meters, material list, flow arrows. Technical drawing style.",

    "manga": "Technical blueprint of a cattle handling chute (manga ganadera) for Colombian cattle farm. " +
      "Side view and top view. Dimensions: 0.75m wide, 20m long, solid walls. " +
      "Anti-slip floor detail, rounded corners, entry and exit gates. Engineering drawing.",

    "brete": "Detailed technical diagram of a cattle squeeze chute (brete/cepo) for Colombian farm. " +
      "Front elevation, side view, isometric 3D view. Adjustable width 0.65-0.75m, " +
      "head gate mechanism, self-catching feature. Labeled parts in Spanish. Engineering blueprint.",

    "embarcadero": "Technical blueprint of a cattle loading ramp (embarcadero). " +
      "Side profile showing 30-35 degree angle, anti-slip steps, 0.82m width, 5m length, " +
      "truck docking side view. Solid wall design, loading gate. Labeled engineering drawing.",

    "bebedero": "Technical design diagram of cattle water trough (bebedero) system. " +
      "Shows: concrete trough with float valve, dimensions 3m x 0.6m x 0.3m, " +
      "water line connection, drainage, anti-algae features. Isometric and cross-section views.",

    "saladero": "Technical design of covered cattle mineral salt station (saladero techado). " +
      "Shows: wood/metal roof structure, trough dimensions, placement relative to water source, " +
      "foundation detail. Suitable for high-rainfall Colombia. Blueprint style.",

    "lechería": "Professional blueprint of a small dairy farm milking facility (lechería) for 30 cows. " +
      "Shows: herringbone parlor layout 2x4, waiting area, milk storage room, wash area, " +
      "dimensions labeled, hygiene flow arrows. Top-down architectural plan.",

    "bodega": "Technical blueprint of a farm storage building (bodega) for cattle farm inputs. " +
      "Floor plan showing: dry storage, mineral storage, equipment area, office nook. " +
      "Simple steel/wood structure, dimensions, ventilation. Agricultural building plan.",

    "sistema de agua": "Technical diagram of a cattle farm water distribution system. " +
      "Shows: water source (well/spring/tank), pump, pipeline, water tank, " +
      "distribution to multiple watering points across pastures. Isometric farm layout view.",
  },

  pasturas: {
    "rotación de potreros": "Aerial illustration of a rotational grazing system for Colombian cattle farm. " +
      "Shows: 8 paddocks in keyhole pattern around central water point, cattle in one paddock, " +
      "rotation arrows, days-to-rest labels, Brachiaria grass. Professional agricultural illustration.",

    "sistema silvopastoril": "Aerial illustration of a silvopastoral system (SSP) on a Colombian cattle farm. " +
      "Shows: scattered timber/fruit trees across Brachiaria pasture, living fences with Gliricidia, " +
      "Leucaena protein bank strip, cattle grazing. Lush tropical landscape. Agricultural illustration.",

    "distribución de potreros": "Aerial farm map illustration showing optimal paddock layout for rotational grazing. " +
      "Irregular terrain, water access points, internal fences, central corral, access roads. " +
      "Labeled paddock numbers with hectares. Colombian tropical landscape.",

    "tipos de pasto": "Educational comparison chart of main tropical grasses in Colombia. " +
      "Side-by-side illustrations of: Brachiaria brizantha, Brachiaria decumbens, Pasto estrella, " +
      "Guinea grass, Kikuyu, King Grass. Each with growth habit, leaf shape, color. " +
      "Nutritional value table below. Professional agricultural illustration.",
  },

  corrales: {
    "flujo de animales": "Technical diagram showing low-stress cattle flow through a handling system. " +
      "Top-down view of: collection pen → crowd pen → curved alley → squeeze chute. " +
      "Flow arrows, pressure zone indicators, Temple Grandin design principles labeled. " +
      "Professional livestock handling engineering diagram.",

    "plan de trabajo": "Infographic showing cattle working day organization for a Colombian ranch. " +
      "Timeline chart with activities: collection, weighing, vaccination, parasite treatment, ID tagging. " +
      "Personnel positions, equipment list, safety zones. Professional farm management infographic.",
  },

  reproduccion: {
    "inseminación artificial": "Step-by-step technical diagram of bovine artificial insemination (AI) procedure. " +
      "Shows: thawing straw in warm water, loading AI gun, rectal palpation approach, " +
      "cervical penetration to uterine body, semen deposition site. " +
      "Professional veterinary reproductive diagram. Numbered steps 1-6.",

    "sincronización": "Technical diagram of Ovsynch cattle estrus synchronization protocol. " +
      "Timeline chart showing: Day 0 GnRH, Day 7 PGF2α, Day 9 GnRH, Day 10 TAFI. " +
      "Hormonal events, follicle development curve, corpus luteum regression. " +
      "Professional reproductive physiology educational diagram.",

    "detección de celo": "Educational diagram for heat detection in cattle. " +
      "Shows: standing heat behavior, secondary signs (mucus, red vulva, restlessness), " +
      "detection aids (chin-ball marker, Kamartec patch), AM-PM rule diagram. " +
      "Cattle silhouettes with behavioral indicators. Professional educational poster.",
  },

  bienestar: {
    "cinco libertades": "Professional infographic showing the Five Freedoms of animal welfare applied to cattle. " +
      "Five sections with icons: freedom from hunger, discomfort, pain, to express behavior, from fear. " +
      "Each with visual examples showing good vs poor conditions on cattle farm. " +
      "Clean, modern infographic design.",

    "condición corporal": "Comprehensive bovine body condition scoring (BCS) visual reference chart. " +
      "Five cattle silhouettes (BCS 1-5) with palpation areas circled: spine, ribs, hooks, pins. " +
      "Color coded: red (1-2), orange (2.5), green (3-3.5), yellow (4), red (5). " +
      "Management recommendations table. Professional livestock assessment chart.",
  },

  default: {},
};

/**
 * Retorna el prefijo de contexto para el especialista dado.
 * @param {string} specialistId
 * @returns {string}
 */
export function getSpecialistPrefix(specialistId) {
  return SPECIALIST_PROMPT_PREFIXES[specialistId] ?? SPECIALIST_PROMPT_PREFIXES.default;
}

/**
 * Busca una plantilla predefinida que coincida con el texto del usuario.
 * @param {string} specialistId
 * @param {string} userText
 * @returns {string|null}
 */
export function findMatchingTemplate(specialistId, userText) {
  const lower = userText.toLowerCase();
  const templates = PROMPT_TEMPLATES[specialistId] ?? {};

  for (const [keyword, template] of Object.entries(templates)) {
    if (lower.includes(keyword)) return template;
  }

  // Buscar en default si no hay match en el especialista
  for (const [keyword, template] of Object.entries(PROMPT_TEMPLATES.default ?? {})) {
    if (lower.includes(keyword)) return template;
  }

  // Buscar en otros especialistas si hay coincidencia fuerte
  for (const [, templateMap] of Object.entries(PROMPT_TEMPLATES)) {
    for (const [keyword, template] of Object.entries(templateMap)) {
      if (lower.includes(keyword)) return template;
    }
  }

  return null;
}
