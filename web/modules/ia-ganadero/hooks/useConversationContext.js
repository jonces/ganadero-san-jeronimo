import { useContext } from "react";
import { ConversationContextCtx } from "../context/ConversationContextContext.js";
import { ROL_LABELS, IDIOMA_LABELS, MONEDA_CONFIG } from "../constants/context.js";

/**
 * Accede al contexto de conversación resuelto.
 *
 * @example
 * const { context, loading, switchFinca } = useConversationContext();
 * if (loading) return <Spinner />;
 * console.log(context.finca.nombre);  // "Finca San Jerónimo"
 * console.log(context.usuario.roles); // ["admin", "veterinario"]
 *
 * @returns {{
 *   context:      import('../types/conversation-context').ConversationContext | null,
 *   fincas:       import('../types/conversation-context').FincaContext[],
 *   loading:      boolean,
 *   error:        string | null,
 *   switchFinca:  (fincaId: string) => Promise<void>,
 *   refresh:      () => Promise<void>,
 *   // Helpers derivados:
 *   finca:        import('../types/conversation-context').FincaContext | null,
 *   empresa:      import('../types/conversation-context').EmpresaContext | null,
 *   usuario:      import('../types/conversation-context').UsuarioContext | null,
 *   localizacion: import('../types/conversation-context').LocalizacionContext | null,
 *   rolLabel:     string,
 *   idiomaLabel:  string,
 *   monedaConfig: object | null,
 * }}
 */
export function useConversationContext() {
  const ctx = useContext(ConversationContextCtx);

  if (!ctx) {
    throw new Error(
      "useConversationContext debe usarse dentro de <ConversationContextProvider>.\n" +
      "Asegúrate de que ConversationContextProvider envuelva el árbol del módulo IA."
    );
  }

  const { context, fincas, loading, error, switchFinca, refresh } = ctx;

  // Atajos derivados para no tener que escribir context?.finca?.nombre etc.
  const finca        = context?.finca        ?? null;
  const empresa      = context?.empresa      ?? null;
  const usuario      = context?.usuario      ?? null;
  const localizacion = context?.localizacion ?? null;

  const rolLabel    = usuario ? (ROL_LABELS[usuario.rolPrincipal]?.label ?? usuario.rolPrincipal) : "";
  const idiomaLabel = localizacion ? (IDIOMA_LABELS[localizacion.idioma]?.label ?? localizacion.idioma) : "";
  const monedaConfig= localizacion ? (MONEDA_CONFIG[localizacion.moneda] ?? null) : null;

  return {
    // Estado raw
    context,
    fincas,
    loading,
    error,
    // Acciones
    switchFinca,
    refresh,
    // Atajos
    finca,
    empresa,
    usuario,
    localizacion,
    rolLabel,
    idiomaLabel,
    monedaConfig,
  };
}
