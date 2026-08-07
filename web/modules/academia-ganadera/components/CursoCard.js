"use client";
import { useRouter } from "next/navigation";
import { getCategoriaConfig } from "../constants/categories.js";
import { getNivelConfig } from "../constants/levels.js";

/**
 * Tarjeta de curso con anillo de progreso y metadata.
 */
export function CursoCard({ curso, progreso, razon, compact = false, onClick }) {
  const router  = useRouter();
  const catCfg  = getCategoriaConfig(curso.categoria);
  const nivCfg  = getNivelConfig(curso.nivel);
  const pct     = progreso?.pct ?? 0;
  const completed = progreso?.completado ?? false;

  const handleClick = onClick ?? (() => router.push(`/academia/curso/${curso.id}`));

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#FFF",
        border: `1px solid ${completed ? "#BBF7D0" : "#E5E7EB"}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
    >
      {/* Header coloreado */}
      <div style={{
        background: catCfg.bg,
        padding: compact ? "14px 16px" : "18px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        borderBottom: `1px solid ${catCfg.color}22`,
      }}>
        <div style={{
          width: compact ? 40 : 48, height: compact ? 40 : 48,
          borderRadius: 12,
          background: catCfg.color + "22",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: compact ? 20 : 24, flexShrink: 0,
        }}>
          {curso.icono}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: catCfg.color, background: catCfg.color + "18",
              padding: "2px 8px", borderRadius: 20,
            }}>
              {catCfg.label}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: nivCfg.color, background: nivCfg.bg,
              padding: "2px 8px", borderRadius: 20,
            }}>
              {nivCfg.icono} {nivCfg.label}
            </span>
          </div>
          <h3 style={{
            margin: 0, fontSize: compact ? 13 : 15, fontWeight: 800,
            color: "#111", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {curso.titulo}
          </h3>
        </div>

        {/* Anillo de progreso */}
        <ProgressRing pct={pct} completed={completed} size={compact ? 36 : 44} />
      </div>

      {/* Cuerpo */}
      {!compact && (
        <div style={{ padding: "12px 20px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
            {curso.descripcion}
          </p>

          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#9CA3AF" }}>
            <span>📚 {curso.lecciones} lecciones</span>
            <span>⏱️ {formatDur(curso.duracionMins)}</span>
          </div>

          {razon && (
            <div style={{
              marginTop: 10, padding: "6px 10px",
              background: "#EEF2FF", borderRadius: 8,
              fontSize: 11, color: "#4F46E5", fontWeight: 600,
            }}>
              💡 {razon}
            </div>
          )}

          {pct > 0 && !completed && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
                <span>Progreso</span><span>{pct}%</span>
              </div>
              <div style={{ height: 4, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: catCfg.color, borderRadius: 4, transition: "width 0.4s" }} />
              </div>
            </div>
          )}

          {completed && (
            <div style={{
              marginTop: 10, padding: "6px 12px", borderRadius: 8,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              fontSize: 11, color: "#059669", fontWeight: 700,
            }}>
              ✅ Completado — Ver certificado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function ProgressRing({ pct, completed, size = 44 }) {
  const r       = (size - 6) / 2;
  const circum  = 2 * Math.PI * r;
  const offset  = circum - (pct / 100) * circum;
  const color   = completed ? "#059669" : "#6366F1";

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={4} />
      {pct > 0 && (
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circum} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      )}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size < 40 ? 9 : 11} fontWeight="700" fill={color}>
        {completed ? "✓" : pct > 0 ? `${pct}%` : ""}
      </text>
    </svg>
  );
}

function formatDur(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  return `${m} min`;
}
