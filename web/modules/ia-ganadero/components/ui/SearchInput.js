"use client";
import { useRef } from "react";
import { T } from "../../constants/theme.js";

/**
 * Campo de búsqueda reutilizable con icono lupa y botón limpiar.
 *
 * @param {{
 *   value:       string,
 *   onChange:    (val: string) => void,
 *   placeholder: string,
 *   size?:       "sm" | "md" | "lg"
 * }} props
 */
export function SearchInput({ value, onChange, placeholder, size = "md" }) {
  const inputRef = useRef(null);

  const pad = size === "sm" ? "6px 28px 6px 26px"
            : size === "lg" ? "11px 36px 11px 40px"
            : "7px 28px 7px 28px";

  const iconSize = size === "lg" ? 15 : 13;
  const iconLeft = size === "lg" ? 14 : 9;
  const fontSize = size === "lg" ? 14 : 12;

  return (
    <div style={{ position: "relative" }}>
      {/* Lupa */}
      <svg
        width={iconSize} height={iconSize}
        viewBox="0 0 24 24" fill="none"
        stroke={T.muted} strokeWidth="2.2" strokeLinecap="round"
        aria-hidden="true"
        style={{ position: "absolute", left: iconLeft, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      >
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>

      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          width: "100%", padding: pad, borderRadius: 8,
          border: `1px solid ${T.border}`, background: T.panel,
          fontSize, color: T.text, outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s",
          fontFamily: "inherit",
        }}
        onFocus={e  => e.target.style.borderColor = T.accent}
        onBlur={e   => e.target.style.borderColor = T.border}
      />

      {/* Limpiar */}
      {value && (
        <button
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          aria-label="Limpiar búsqueda"
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: T.muted, fontSize: 14, lineHeight: 1, padding: 2,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
