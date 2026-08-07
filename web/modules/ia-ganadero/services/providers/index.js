import { MockProvider,       MOCK_CONFIG }        from "./mock.js";
import { ClaudeProvider,    CLAUDE_CONFIG }       from "./claude.js";
import { OpenAICoreProvider, OPENAI_CORE_CONFIG } from "./openai-core.js";
import { PROVIDER_ID }                            from "../../constants/index.js";

export const PROVIDERS = {
  [PROVIDER_ID.OPENAI]: {
    config:  OPENAI_CORE_CONFIG,
    factory: () => new OpenAICoreProvider(),
  },
  [PROVIDER_ID.MOCK]: {
    config:  MOCK_CONFIG,
    factory: () => new MockProvider(),
  },
  [PROVIDER_ID.CLAUDE]: {
    config:  CLAUDE_CONFIG,
    factory: (opts) => new ClaudeProvider(opts),
  },
};

/** Devuelve la lista de configs de todos los providers registrados */
export function getAvailableProviders() {
  return Object.values(PROVIDERS).map(p => p.config);
}

/**
 * Instancia y retorna el client del provider solicitado.
 * @param {string} providerId - PROVIDER_ID
 * @returns {import('../ia-client').IAClient}
 */
export function createProvider(providerId) {
  const entry = PROVIDERS[providerId];
  if (!entry) throw new Error(`Provider "${providerId}" no registrado.`);
  return entry.factory();
}
