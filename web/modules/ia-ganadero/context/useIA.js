"use client";
import { useContext } from "react";
import { IAContext }  from "./IAContext.js";

/**
 * Hook principal del módulo IA Ganadero.
 * Úsalo en cualquier componente dentro de <IAProvider>.
 *
 * @returns {{
 *   state:               import('../types').IAState,
 *   dispatch:            Function,
 *   selectConversation:  (id: string) => void,
 *   newConversation:     () => void,
 *   deleteConversation:  (id: string) => void,
 *   renameConversation:  (id: string, title: string) => void,
 *   sendMessage:         (specialistId?: string) => Promise<void>,
 *   setInput:            (text: string) => void,
 *   addAttachment:       (attachment: import('../types').Attachment) => void,
 *   removeAttachment:    (id: string) => void,
 *   setProvider:         (providerId: string) => void,
 *   setSpecialist:       (id: string) => void,
 *   engine:              import('../../ai-engine').AIEngine,
 * }}
 */
export function useIA() {
  const ctx = useContext(IAContext);
  if (!ctx) throw new Error("useIA debe usarse dentro de <IAProvider>");
  return ctx;
}
