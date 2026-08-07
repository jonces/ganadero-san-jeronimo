"use client";
import { createContext, useReducer, useRef, useEffect, useCallback } from "react";
import { createContextResolver } from "../services/context-resolvers/index.js";
import { CONTEXT_ACTION }        from "../constants/context.js";

// ── Estado ────────────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  /** @type {import('../types/conversation-context').ConversationContext | null} */
  context:   null,
  /** @type {import('../types/conversation-context').FincaContext[]} */
  fincas:    [],
  loading:   true,
  error:     null,
};

// ── Reducer puro ──────────────────────────────────────────────────────────────
function contextReducer(state, action) {
  switch (action.type) {

    case CONTEXT_ACTION.SET_CONTEXT:
      return { ...state, context: action.payload.context, fincas: action.payload.fincas ?? state.fincas, loading: false, error: null };

    case CONTEXT_ACTION.SET_FINCA:
      if (!state.context) return state;
      return {
        ...state,
        context: {
          ...state.context,
          finca:      action.payload,
          resolvedAt: new Date().toISOString(),
        },
      };

    case CONTEXT_ACTION.SET_LOADING:
      return { ...state, loading: action.payload };

    case CONTEXT_ACTION.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}

// ── Contexto React ────────────────────────────────────────────────────────────
export const ConversationContextCtx = createContext(null);

/**
 * Proveedor del contexto de conversación.
 *
 * Colócalo por encima de <IAProvider> en el árbol para que los
 * componentes puedan acceder a finca, empresa, usuario y localización
 * antes de enviar cualquier mensaje.
 *
 * <ConversationContextProvider>
 *   <IAProvider>
 *     <CentroIAShell />
 *   </IAProvider>
 * </ConversationContextProvider>
 */
export function ConversationContextProvider({ children }) {
  const [state, dispatch] = useReducer(contextReducer, INITIAL_STATE);
  const resolverRef       = useRef(null);
  const mountedRef        = useRef(true);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      try {
        const resolver = createContextResolver();
        resolverRef.current = resolver;
        await resolver.initialize();

        const [context, fincas] = await Promise.all([
          resolver.resolve(),
          resolver.listFincas?.() ?? Promise.resolve([]),
        ]);

        if (!mountedRef.current) return;
        dispatch({ type: CONTEXT_ACTION.SET_CONTEXT, payload: { context, fincas } });
      } catch (err) {
        if (mountedRef.current) {
          dispatch({ type: CONTEXT_ACTION.SET_ERROR, payload: err.message });
        }
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      resolverRef.current?.destroy();
    };
  }, []);

  // ── Cambiar finca activa ─────────────────────────────────────────────────
  const switchFinca = useCallback(async (fincaId) => {
    const resolver = resolverRef.current;
    if (!resolver) return;
    dispatch({ type: CONTEXT_ACTION.SET_LOADING, payload: true });
    try {
      const newContext = await resolver.switchFinca(fincaId);
      dispatch({ type: CONTEXT_ACTION.SET_CONTEXT, payload: { context: newContext } });
    } catch (err) {
      dispatch({ type: CONTEXT_ACTION.SET_ERROR, payload: err.message });
    }
  }, []);

  // ── Refrescar contexto (ej. después de editar perfil) ────────────────────
  const refresh = useCallback(async () => {
    const resolver = resolverRef.current;
    if (!resolver) return;
    dispatch({ type: CONTEXT_ACTION.SET_LOADING, payload: true });
    try {
      const newContext = await resolver.resolve();
      dispatch({ type: CONTEXT_ACTION.SET_CONTEXT, payload: { context: newContext } });
    } catch (err) {
      dispatch({ type: CONTEXT_ACTION.SET_ERROR, payload: err.message });
    }
  }, []);

  return (
    <ConversationContextCtx.Provider value={{
      context:     state.context,
      fincas:      state.fincas,
      loading:     state.loading,
      error:       state.error,
      switchFinca,
      refresh,
    }}>
      {children}
    </ConversationContextCtx.Provider>
  );
}
