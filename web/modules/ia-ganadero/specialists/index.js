/**
 * Índice de los 9 especialistas IA del Centro IA Ganadero.
 * Exporta todos los especialistas como array y como named exports.
 */
export { VETERINARIO }    from "./veterinario.js";
export { NUTRICIONISTA }  from "./nutricionista.js";
export { REPRODUCCION }   from "./reproduccion.js";
export { PASTURAS }       from "./pasturas.js";
export { INFRAESTRUCTURA } from "./infraestructura.js";
export { CORRALES }       from "./corrales.js";
export { FINANZAS }       from "./finanzas.js";
export { PRODUCCION }     from "./produccion.js";
export { BIENESTAR }      from "./bienestar.js";

import { VETERINARIO }    from "./veterinario.js";
import { NUTRICIONISTA }  from "./nutricionista.js";
import { REPRODUCCION }   from "./reproduccion.js";
import { PASTURAS }       from "./pasturas.js";
import { INFRAESTRUCTURA } from "./infraestructura.js";
import { CORRALES }       from "./corrales.js";
import { FINANZAS }       from "./finanzas.js";
import { PRODUCCION }     from "./produccion.js";
import { BIENESTAR }      from "./bienestar.js";

export const ESPECIALISTAS_IA = [
  VETERINARIO,
  NUTRICIONISTA,
  REPRODUCCION,
  PASTURAS,
  INFRAESTRUCTURA,
  CORRALES,
  FINANZAS,
  PRODUCCION,
  BIENESTAR,
];

export const ESPECIALISTAS_MAP = Object.fromEntries(
  ESPECIALISTAS_IA.map((e) => [e.id, e])
);

export function getEspecialista(id) {
  return ESPECIALISTAS_MAP[id] ?? ESPECIALISTAS_IA[0];
}
