import { MockContextResolver } from "./mock-resolver.js";

/**
 * Registro de resolvers de contexto disponibles.
 * Agrega aquí el ApiResolver cuando el backend esté listo.
 *
 * @type {Record<string, new() => import('../context-resolver').ContextResolver>}
 */
const CONTEXT_RESOLVERS = {
  mock: MockContextResolver,
  // api:   ApiContextResolver,   ← agregar cuando el backend esté listo
  // local: LocalContextResolver, ← alternativa que lee del store global
};

/**
 * Crea e instancia el resolver adecuado para el entorno.
 * Por ahora siempre devuelve MockContextResolver.
 * Al integrar el backend, cambiar la lógica de selección aquí.
 *
 * @returns {import('../context-resolver').ContextResolver}
 */
export function createContextResolver() {
  const id  = selectResolverId();
  const Cls = CONTEXT_RESOLVERS[id] ?? MockContextResolver;
  return new Cls();
}

/**
 * Determina qué resolver usar según el entorno.
 * Futura lógica: si hay token de sesión → "api", si no → "mock".
 */
function selectResolverId() {
  // TODO: reemplazar con detección real de sesión
  // if (typeof window !== "undefined" && sessionStorage.getItem("auth_token")) return "api";
  return "mock";
}

export { MockContextResolver };
