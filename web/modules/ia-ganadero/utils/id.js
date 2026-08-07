/** Generador de ID único — fuente única para todo el módulo. */
export function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}
