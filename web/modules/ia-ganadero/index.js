// ── API pública del módulo Centro IA Ganadero ────────────────────────────────
// Importar siempre desde aquí, nunca desde subcarpetas directamente.

// Context — IA
export { IAProvider }     from "./context/IAContext.js";
export { useIA }          from "./context/useIA.js";

// Context — Conversación (finca, empresa, usuario, idioma, moneda, zona horaria)
export { ConversationContextProvider } from "./context/ConversationContextContext.js";
export { useConversationContext }      from "./hooks/useConversationContext.js";

// Hooks
export { useConversation }  from "./hooks/useConversation.js";
export { useMessages }      from "./hooks/useMessages.js";
export { useProvider }      from "./hooks/useProvider.js";
export { useFileUpload }    from "./hooks/useFileUpload.js";
export { useMediaQuery, useBreakpoints, usePrefersDark } from "./hooks/useMediaQuery.js";

// Shell principal
export { CentroIAShell }    from "./components/CentroIAShell.js";

// Paneles
export { SpecialistBar }    from "./components/SpecialistBar.js";
export { LeftPanel }        from "./components/LeftPanel.js";
export { CenterPanel }      from "./components/CenterPanel.js";
export { RightPanel }       from "./components/RightPanel.js";

// Componentes de chat
export { WelcomeScreen }    from "./components/WelcomeScreen.js";
export { MessageRow }       from "./components/MessageRow.js";
export { TypingRow }        from "./components/TypingRow.js";

// Componentes de archivos
export { FileCard }         from "./components/FileCard.js";
export { FileUploadZone }   from "./components/FileUploadZone.js";
export { FilePreviewGrid }  from "./components/FilePreviewGrid.js";
export { FilePreviewModal } from "./components/FilePreviewModal.js";

// UI primitivos
export { SearchInput }   from "./components/ui/SearchInput.js";
export { SectionLabel }  from "./components/ui/SectionLabel.js";
export { IconButton, MicroButton } from "./components/ui/IconButton.js";

// Legado (mantener por compatibilidad)
export { IALayout }          from "./components/IALayout.js";
export { ChatWindow }        from "./components/ChatWindow.js";
export { ConversationList }  from "./components/ConversationList.js";
export { MessageInput }      from "./components/MessageInput.js";
export { MessageBubble }     from "./components/MessageBubble.js";
export { TypingIndicator }   from "./components/TypingIndicator.js";
export { QuickQueries }      from "./components/QuickQueries.js";
export { AttachmentPreview } from "./components/AttachmentPreview.js";
export { ProviderBadge }     from "./components/ProviderBadge.js";

// Constantes y tokens
export { T, IA_THEME_CSS }   from "./constants/theme.js";
export { ESPECIALISTAS, getEspecialista } from "./constants/specialists.js";
export { CATEGORIAS_IA, EMERGENCIAS_IA }  from "./constants/quick-queries.js";
export { DEMO_FINCA, DEMO_RECOMENDACIONES, DEMO_ACCIONES, DEMO_DOCS } from "./constants/demo-data.js";
export * from "./constants/index.js";
export * from "./constants/context.js";
export * from "./constants/files.js";

// Utilidades
export { uid }          from "./utils/id.js";
export { ts, groupByDate } from "./utils/date.js";
export { formatFileSize }  from "./utils/file-handler.js";
