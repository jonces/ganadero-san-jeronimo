"use client";
import { getCertificados, getHistorial } from "../services/academia-storage.js";
import { getCursoById } from "../constants/catalog.js";
import { getCategoriaConfig } from "../constants/categories.js";

/**
 * Panel de progreso global del usuario en la Academia.
 */
export function ProgresoDashboard({ estadisticas, enProgreso, completados }) {
  const certificados = getCertificados();
  const historial    = getHistorial(10);

  const stats = [
    { label: "Completados",    value: estadisticas?.cursosCompletados ?? 0, icono: "✅", color: "#059669" },
    { label: "En progreso",    value: estadisticas?.cursosEnProgreso  ?? 0, icono: "📚", color: "#6366F1" },
    { label: "Certificados",   value: estadisticas?.certificados      ?? 0, icono: "🏆", color: "#D97706" },
    { label: "Tiempo estudio", value: estadisticas?.tiempoLabel       ?? "0 min", icono: "⏱️", color: "#0E7490" },
  ];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: "#FFF", border: "1px solid #E5E7EB",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ fontSize: 28 }}>{s.icono}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* En progreso */}
      {enProgreso.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111" }}>📚 Continuar aprendiendo</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {enProgreso.map(({ curso, progreso: prog }) => {
              const cat = getCategoriaConfig(curso.categoria);
              return (
                <a key={curso.id} href={`/academia/curso/${curso.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#FFF", border: "1px solid #E5E7EB",
                    borderRadius: 12, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "border-color 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#E5E7EB"}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{curso.icono}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{curso.titulo}</p>
                      <div style={{ height: 4, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${prog?.pct ?? 0}%`, background: cat.color, transition: "width 0.4s" }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.color, flexShrink: 0 }}>{prog?.pct ?? 0}%</span>
                    <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>Continuar →</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificados */}
      {certificados.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111" }}>🏆 Mis certificados</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {certificados.map(cert => (
              <div key={cert.id} style={{
                background: "linear-gradient(135deg, #FAFFFE, #F0FDF4)",
                border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>🏆</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111" }}>{cert.cursoTitulo}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{cert.fecha} · Código: {cert.codigo}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#DCFCE7", padding: "3px 10px", borderRadius: 20 }}>
                  CERTIFICADO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111" }}>🕐 Actividad reciente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {historial.map((h, i) => {
              const curso = getCursoById(h.cursoId);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{curso?.icono ?? "📚"}</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#374151" }}>{curso?.titulo ?? h.cursoId}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{new Date(h.ts).toLocaleDateString("es-CO")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {enProgreso.length === 0 && completados.length === 0 && certificados.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#6B7280" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Tu perfil de aprendizaje está vacío</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Comienza un curso para ver tu progreso aquí.</p>
        </div>
      )}
    </div>
  );
}
