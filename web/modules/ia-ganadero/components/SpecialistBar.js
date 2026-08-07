"use client";
import { T } from "../constants/theme.js";
import { ESPECIALISTAS } from "../constants/specialists.js";

/**
 * Barra horizontal de selección de especialista.
 * @param {{ active: string, onChange: (id: string) => void }} props
 */
export function SpecialistBar({ active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Seleccionar especialista"
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.panel,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        overflowX: "auto",
        flexShrink: 0,
        height: 52,
        scrollbarWidth: "none",
      }}
    >
      <style>{`.ia-spec-bar::-webkit-scrollbar{display:none}`}</style>

      <span
        aria-hidden="true"
        style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", marginRight: 6 }}
      >
        Especialista:
      </span>

      {ESPECIALISTAS.map(e => {
        const isActive = e.id === active;
        return (
          <button
            key={e.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(e.id)}
            title={e.label}
            aria-label={`Especialista: ${e.label}`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              borderRadius: 30,
              border: isActive ? `2px solid ${e.badge}` : `1px solid ${T.border}`,
              background: isActive ? e.bg : T.panel,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={ev => {
              if (!isActive) {
                ev.currentTarget.style.background = e.bg;
                ev.currentTarget.style.borderColor = e.border;
              }
            }}
            onMouseLeave={ev => {
              if (!isActive) {
                ev.currentTarget.style.background = T.panel;
                ev.currentTarget.style.borderColor = T.border;
              }
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 15 }}>{e.icono}</span>
            <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? e.badge : T.muted }}>
              {e.label}
            </span>
            {isActive && (
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: e.badge, flexShrink: 0 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
