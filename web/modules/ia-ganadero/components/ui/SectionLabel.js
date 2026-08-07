"use client";
import { T } from "../../constants/theme.js";

/**
 * Etiqueta de sección en CAPS, usada en ambos paneles lateral y derecho.
 * action + onAction = botón opcional a la derecha.
 */
export function SectionLabel({ label, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 8px" }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", userSelect: "none" }}>
        {label}
      </p>
      {action && (
        <button
          onClick={onAction}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.accent, fontWeight: 700, padding: 0 }}
        >
          {action} →
        </button>
      )}
    </div>
  );
}
