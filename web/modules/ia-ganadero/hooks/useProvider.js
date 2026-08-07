"use client";
import { useIA }               from "../context/useIA.js";
import { getAvailableProviders } from "../services/providers/index.js";
import { CONVERSATION_STATUS } from "../constants/index.js";

/**
 * Información y control del provider IA activo.
 */
export function useProvider() {
  const { state, setProvider } = useIA();

  const allProviders      = getAvailableProviders();
  const activeConfig      = allProviders.find(p => p.id === state.providerId) ?? allProviders[0];
  const isLoading         = state.status === CONVERSATION_STATUS.LOADING;
  const isStreaming       = state.status === CONVERSATION_STATUS.STREAMING;
  const isBusy            = isLoading || isStreaming;

  return {
    providerId:    state.providerId,
    activeConfig,
    allProviders,
    setProvider,
    isLoading,
    isStreaming,
    isBusy,
    supportsVision:    activeConfig?.capabilities?.vision    ?? false,
    supportsDocuments: activeConfig?.capabilities?.documents ?? false,
    supportsAudio:     activeConfig?.capabilities?.audio     ?? false,
  };
}
