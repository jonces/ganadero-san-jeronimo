"use client";
import { T } from "../../constants/theme.js";

/** Botón icono cuadrado sutil — usado en cabeceras de panel, etc. */
export function IconButton({ onClick, title, children, size = 30 }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: size, height: size, borderRadius: 8, border: "none",
        background: "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s", flexShrink: 0, color: T.muted,
      }}
      onMouseEnter={e => e.currentTarget.style.background = T.hover}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {children}
    </button>
  );
}

/** Botón micro (22px) para acciones inline en listas. */
export function MicroButton({ onClick, title, children, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 22, height: 22, borderRadius: 5, border: `1px solid ${T.border}`,
        background: T.panel, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: danger ? T.danger : T.muted, flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
