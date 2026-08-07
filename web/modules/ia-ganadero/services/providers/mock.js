import { IAClient }    from "../ia-client.js";
import { PROVIDER_ID } from "../../constants/index.js";

/** @type {import('../../types').ProviderConfig} */
export const MOCK_CONFIG = {
  id:          PROVIDER_ID.MOCK,
  name:        "Demo (sin IA)",
  icon:        "🤖",
  description: "Respuestas simuladas para desarrollo. Sin conexión a ningún modelo.",
  available:   true,
  capabilities: {
    streaming:  true,
    vision:     false,
    documents:  false,
    audio:      false,
    maxTokens:  512,
  },
};

const MOCK_RESPONSES = [
  "Esta funcionalidad estará disponible cuando se conecte un modelo de IA. Por ahora estoy en modo demostración.",
  "Entendido. Cuando se active la IA, analizaré los datos de tu finca para darte una respuesta precisa.",
  "Buena pregunta. El módulo de IA está en construcción. Pronto podrás recibir análisis inteligentes aquí.",
  "Eso requiere acceso a los datos de tu hato. La integración con IA se configurará próximamente.",
  "Anotado. En la versión con IA real, procesaré esta consulta y te daré recomendaciones personalizadas.",
];

let _responseIndex = 0;
function nextMockResponse() {
  const resp = MOCK_RESPONSES[_responseIndex % MOCK_RESPONSES.length];
  _responseIndex++;
  return resp;
}

export class MockProvider extends IAClient {
  constructor() {
    super(MOCK_CONFIG);
    this._abortController = null;
  }

  async initialize() {
    // Sin setup necesario
    await new Promise(r => setTimeout(r, 200));
  }

  async sendMessage(_payload) {
    await new Promise(r => setTimeout(r, 1200));
    return nextMockResponse();
  }

  streamMessage(_payload, onChunk, onDone, _onError) {
    const fullText = nextMockResponse();
    const words    = fullText.split(" ");
    let   i        = 0;
    let   cancelled = false;

    this._timer = setInterval(() => {
      if (cancelled || i >= words.length) {
        clearInterval(this._timer);
        if (!cancelled) onDone();
        return;
      }
      onChunk((i === 0 ? "" : " ") + words[i]);
      i++;
    }, 80);

    return () => { cancelled = true; clearInterval(this._timer); };
  }

  abort() {
    clearInterval(this._timer);
  }

  destroy() {
    this.abort();
  }
}
