// API pública del módulo Centro IA Ganadero.
// Importar siempre desde aquí, nunca desde subcarpetas directamente.

// Context — IA
export { IAProvider }     from "./context/IAContext.js";
export { useIA }          from "./context/useIA.js";

// Context — Conversación (finca, empresa, usuario, idioma, moneda, zona horaria)
export { ConversationContextProvider } from "./context/ConversationContextContext.js";
export { useConversationContext }      from "./hooks/useConversationContext.js";

// Hooks
export { useConversation }     from "./hooks/useConversation.js";
export { useMessages }         from "./hooks/useMessages.js";
export { useProvider }         from "./hooks/useProvider.js";
export { useFileUpload }       from "./hooks/useFileUpload.js";

// Componentes
export { IALayout }           from "./components/IALayout.js";
export { ChatWindow }         from "./components/ChatWindow.js";
export { ConversationList }   from "./components/ConversationList.js";
export { MessageInput }       from "./components/MessageInput.js";
export { MessageBubble }      from "./components/MessageBubble.js";
export { TypingIndicator }    from "./components/TypingIndicator.js";
export { QuickQueries }       from "./components/QuickQueries.js";
export { AttachmentPreview }  from "./components/AttachmentPreview.js";
export { FileCard }           from "./components/FileCard.js";
export { FileUploadZone }     from "./components/FileUploadZone.js";
export { FilePreviewGrid }    from "./components/FilePreviewGrid.js";
export { ProviderBadge }      from "./components/ProviderBadge.js";

// Constantes y tipos (para uso externo si se necesita)
export * from "./constants/index.js";
export * from "./constants/context.js";
