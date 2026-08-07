// API pública del módulo Centro IA Ganadero.
// Importar siempre desde aquí, nunca desde subcarpetas directamente.

// Context
export { IAProvider }     from "./context/IAContext.js";
export { useIA }          from "./context/useIA.js";

// Hooks
export { useConversation } from "./hooks/useConversation.js";
export { useMessages }     from "./hooks/useMessages.js";
export { useProvider }     from "./hooks/useProvider.js";

// Componentes
export { IALayout }           from "./components/IALayout.js";
export { ChatWindow }         from "./components/ChatWindow.js";
export { ConversationList }   from "./components/ConversationList.js";
export { MessageInput }       from "./components/MessageInput.js";
export { MessageBubble }      from "./components/MessageBubble.js";
export { TypingIndicator }    from "./components/TypingIndicator.js";
export { QuickQueries }       from "./components/QuickQueries.js";
export { AttachmentPreview }  from "./components/AttachmentPreview.js";
export { ProviderBadge }      from "./components/ProviderBadge.js";

// Constantes y tipos (para uso externo si se necesita)
export * from "./constants/index.js";
