// Prompt injection patterns to detect and block
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+a?n?\s+unrestricted/i,
  /jailbreak/i,
  /forget\s+your\s+(system\s+)?prompt/i,
  /act\s+as\s+(if\s+you\s+are\s+)?DAN/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+your\s+(system\s+)?instructions/i,
  /<\|im_start\|>/i,
  /\[INST\]/,
];

// Actions that require explicit user permission
const DESTRUCTIVE_TOOLS = ["delete_animal", "delete_record", "wipe_data"];

export function validateInput(text) {
  if (!text || typeof text !== "string") return { ok: false, reason: "Input vacío" };
  if (text.length > 8000) return { ok: false, reason: "Mensaje demasiado largo (máx 8000 caracteres)" };

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, reason: "Intento de manipulación detectado y bloqueado." };
    }
  }

  return { ok: true };
}

export function validateToolCall(toolName, args, permissions = {}) {
  // Block destructive tools unless explicitly allowed
  if (DESTRUCTIVE_TOOLS.includes(toolName) && !permissions.destructive) {
    return { ok: false, reason: `Herramienta '${toolName}' requiere permiso de administrador.` };
  }

  // Validate args are plain objects (no prototype pollution)
  if (args && typeof args === "object") {
    const keys = Object.keys(args);
    for (const k of keys) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") {
        return { ok: false, reason: "Argumento inválido detectado." };
      }
    }
  }

  return { ok: true };
}

export function sanitizeForLog(messages) {
  return messages.map(m => ({
    role:    m.role,
    content: typeof m.content === "string"
      ? m.content.slice(0, 200) + (m.content.length > 200 ? "…" : "")
      : "[structured]",
  }));
}
