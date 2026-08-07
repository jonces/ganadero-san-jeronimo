"use client";
import { useState, useCallback } from "react";
import { T, IA_THEME_CSS }  from "../constants/theme.js";
import { SpecialistBar }    from "./SpecialistBar.js";
import { LeftPanel }        from "./LeftPanel.js";
import { CenterPanel }      from "./CenterPanel.js";
import { RightPanel }       from "./RightPanel.js";
import { useIA }            from "../context/useIA.js";

/**
 * Shell del Centro IA — tres paneles + barra de especialistas.
 * Solo maneja estado de layout; toda la lógica está en los paneles.
 */
export function CentroIAShell() {
  const [leftOpen,   setLeftOpen]   = useState(true);
  const [rightOpen,  setRightOpen]  = useState(true);
  const [specialist, setSpecialistLocal] = useState("veterinario");

  // Sincroniza el especialista activo con IAContext para el system prompt
  const { setSpecialist: setCtxSpecialist } = useIA();
  const setSpecialist = useCallback((id) => {
    setSpecialistLocal(id);
    setCtxSpecialist?.(id);
  }, [setCtxSpecialist]);

  return (
    <>
      {/* Inyección de variables CSS y animaciones del módulo */}
      <style>{IA_THEME_CSS}</style>

      <div
        data-ia-shell
        style={{
          display: "flex", flexDirection: "column",
          height: "100vh", width: "100%",
          overflow: "hidden",
          background: T.bg,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Barra de especialistas — anchura completa */}
        <SpecialistBar active={specialist} onChange={setSpecialist} />

        {/* Tres paneles */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
          <LeftPanel
            collapsed={!leftOpen}
            onToggle={() => setLeftOpen(v => !v)}
          />

          <CenterPanel
            sidebarCollapsed={!leftOpen}
            onToggleSidebar={() => setLeftOpen(v => !v)}
            specialist={specialist}
          />

          <RightPanel
            collapsed={!rightOpen}
            onToggle={() => setRightOpen(v => !v)}
          />

          {/* Pestaña flotante para reabrir el panel derecho */}
          {!rightOpen && (
            <button
              onClick={() => setRightOpen(true)}
              title="Abrir panel de finca"
              aria-label="Abrir panel de finca"
              style={{
                position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)",
                width: 20, height: 60, borderRadius: "8px 0 0 8px",
                border: `1px solid ${T.border}`, borderRight: "none",
                background: T.panel, cursor: "pointer", color: T.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, zIndex: 10,
              }}
            >
              ‹
            </button>
          )}
        </div>
      </div>
    </>
  );
}
