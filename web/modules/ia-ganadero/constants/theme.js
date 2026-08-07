// ── Design tokens del módulo Centro IA Ganadero ──────────────────────────────
// T es el único objeto de paleta — todos los componentes lo importan desde aquí.
// Los valores son CSS custom properties → dark mode automático vía media query.

/** CSS string que define las variables de color. Inyectar una sola vez en el shell. */
export const IA_THEME_CSS = `
  /* ── Variables de color del módulo IA ─────────────────────────────── */
  :root {
    --ia-bg:          #F7F7F8;
    --ia-panel:       #FFFFFF;
    --ia-sidebar:     #F0F0F0;
    --ia-border:      #E5E5E5;
    --ia-text:        #0D0D0D;
    --ia-muted:       #6E6E80;
    --ia-accent:      #10A37F;
    --ia-accent-dim:  #1A7F64;
    --ia-hover:       #EBEBEB;
    --ia-danger:      #EF4444;
    --ia-user-bub:    #10A37F;
    --ia-ai-bub:      #F7F7F8;
    --ia-ai-border:   #E5E5E5;
    --ia-overlay:     rgba(0,0,0,0.88);
    --ia-dark-panel:  #1A1A1A;
    --ia-selection:   #10A37F22;
  }

  /* ── Dark mode automático via media query ─────────────────────────── */
  @media (prefers-color-scheme: dark) {
    :root:not([data-ia-theme="light"]) {
      --ia-bg:          #111111;
      --ia-panel:       #1C1C1E;
      --ia-sidebar:     #161618;
      --ia-border:      #2C2C2E;
      --ia-text:        #F2F2F7;
      --ia-muted:       #8E8E93;
      --ia-accent:      #10A37F;
      --ia-accent-dim:  #0D8C6C;
      --ia-hover:       #2C2C2E;
      --ia-danger:      #FF453A;
      --ia-user-bub:    #10A37F;
      --ia-ai-bub:      #2C2C2E;
      --ia-ai-border:   #3A3A3C;
      --ia-selection:   #10A37F33;
    }
  }

  /* ── Forzar dark via atributo (toggle manual) ─────────────────────── */
  [data-ia-theme="dark"] {
    --ia-bg:          #111111;
    --ia-panel:       #1C1C1E;
    --ia-sidebar:     #161618;
    --ia-border:      #2C2C2E;
    --ia-text:        #F2F2F7;
    --ia-muted:       #8E8E93;
    --ia-accent:      #10A37F;
    --ia-accent-dim:  #0D8C6C;
    --ia-hover:       #2C2C2E;
    --ia-danger:      #FF453A;
    --ia-user-bub:    #10A37F;
    --ia-ai-bub:      #2C2C2E;
    --ia-ai-border:   #3A3A3C;
    --ia-selection:   #10A37F33;
  }

  /* ── Scrollbar sutil ──────────────────────────────────────────────── */
  [data-ia-shell] ::-webkit-scrollbar { width: 5px; height: 5px; }
  [data-ia-shell] ::-webkit-scrollbar-track { background: transparent; }
  [data-ia-shell] ::-webkit-scrollbar-thumb { background: var(--ia-border); border-radius: 4px; }
  [data-ia-shell] ::-webkit-scrollbar-thumb:hover { background: var(--ia-muted); }

  /* ── Animaciones compartidas ──────────────────────────────────────── */
  @keyframes ia-fade-in    { from { opacity:0 } to { opacity:1 } }
  @keyframes ia-slide-up   { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
  @keyframes ia-dot-bounce { 0%,60%,100%{transform:translateY(0);opacity:.35} 30%{transform:translateY(-5px);opacity:1} }
  @keyframes ia-rec-pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── Focus ring accesible ─────────────────────────────────────────── */
  [data-ia-shell] :focus-visible {
    outline: 2px solid var(--ia-accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  [data-ia-shell] :focus:not(:focus-visible) { outline: none; }

  /* ── Responsive helpers ───────────────────────────────────────────── */
  @media (max-width: 768px) {
    [data-ia-left-panel]   { display: none !important; }
    [data-ia-right-panel]  { display: none !important; }
    [data-ia-mobile-open]  { display: flex !important; }
  }
  @media (max-width: 480px) {
    [data-ia-welcome-grid] { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 481px) and (max-width: 768px) {
    [data-ia-welcome-grid] { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

/**
 * Paleta de tokens — valores son CSS custom properties.
 * Usable en inline styles: `style={{ background: T.panel }}` → "var(--ia-panel)"
 */
export const T = {
  bg:        "var(--ia-bg)",
  panel:     "var(--ia-panel)",
  sidebar:   "var(--ia-sidebar)",
  border:    "var(--ia-border)",
  text:      "var(--ia-text)",
  muted:     "var(--ia-muted)",
  accent:    "var(--ia-accent)",
  accentDim: "var(--ia-accent-dim)",
  hover:     "var(--ia-hover)",
  danger:    "var(--ia-danger)",
  userBub:   "var(--ia-user-bub)",
  aiBub:     "var(--ia-ai-bub)",
  aiBorder:  "var(--ia-ai-border)",
};
