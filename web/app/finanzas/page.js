"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  red: "#DC2626", redBg: "#FEF2F2", orange: "#EA580C", orangeBg: "#FFF7ED",
  blue: "#2563EB", blueBg: "#EFF6FF",
};

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const PERIODOS = [
  { value: "mes", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "año", label: "Este año" },
];

export default function FinanzasPage() {
  const [data, setData] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");

  async function cargar() {
    setLoading(true);
    try {
      const [fin, mov] = await Promise.all([
        api(`/finanzas?periodo=${periodo}`),
        api("/finanzas/movimientos?limit=30"),
      ]);
      setData(fin);
      setMovimientos(mov.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [periodo]);

  const meses = data?.meses || [];
  const maxVal = Math.max(...meses.flatMap(m => [m.ingresos, m.gastos]), 1);
  const BAR_H = 120;

  return (
    <AppLayout title="Finanzas" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      {/* Selector de periodo */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, gap: 6, flexWrap: "wrap" }}>
        {PERIODOS.map(p => (
          <button key={p.value} onClick={() => setPeriodo(p.value)}
            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${periodo === p.value ? T.blue : T.border}`, background: periodo === p.value ? T.blueBg : T.white, color: periodo === p.value ? T.blue : T.text, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Ingresos", value: fmt(data.ingresos), color: T.green },
            { label: "Gastos", value: fmt(data.gastos), color: T.red },
            { label: "Flujo neto", value: fmt(data.flujoNeto), color: data.flujoNeto >= 0 ? T.green : T.red },
            { label: "Margen", value: `${Number(data.margen || 0).toFixed(1)}%`, color: data.margen >= 0 ? T.blue : T.red },
          ].map(c => (
            <div key={c.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textSec, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfica de barras SVG */}
      {meses.length > 0 && (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 16 }}>Ingresos vs. Gastos — Últimos 12 meses</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSec }}>
              <span style={{ width: 12, height: 12, background: T.blue, borderRadius: 3, display: "inline-block" }} /> Ingresos
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSec }}>
              <span style={{ width: 12, height: 12, background: T.red, borderRadius: 3, display: "inline-block" }} /> Gastos
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <svg viewBox={`0 0 ${meses.length * 56} ${BAR_H + 30}`} style={{ width: "100%", minWidth: meses.length * 56 }}>
              {meses.map((m, i) => {
                const x = i * 56 + 4;
                const ingH = Math.round((m.ingresos / maxVal) * BAR_H);
                const gasH = Math.round((m.gastos / maxVal) * BAR_H);
                const mes = m.mes.slice(5);
                return (
                  <g key={m.mes}>
                    <rect x={x} y={BAR_H - ingH} width={20} height={ingH} fill={T.blue} rx={3} opacity={.85} />
                    <rect x={x + 22} y={BAR_H - gasH} width={20} height={gasH} fill={T.red} rx={3} opacity={.85} />
                    <text x={x + 21} y={BAR_H + 16} textAnchor="middle" fontSize={9} fill={T.textSec}>{mes}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 15, color: T.text }}>
          Movimientos recientes
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Cargando...</div>
        ) : movimientos.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textSec }}>Sin movimientos registrados.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {["Fecha", "Tipo", "Descripción", "Categoría", "Monto"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map(m => (
                  <tr key={m.id + m.tipo} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec, whiteSpace: "nowrap" }}>
                      {new Date(m.fecha).toLocaleDateString("es-NI")}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        background: m.tipo === "INGRESO" ? T.greenBg : T.redBg,
                        color: m.tipo === "INGRESO" ? T.green : T.red,
                        padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      }}>{m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: T.text, maxWidth: 220 }}>{m.descripcion}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: T.textSec }}>{m.categoria}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: m.tipo === "INGRESO" ? T.green : T.red }}>
                      {m.tipo === "INGRESO" ? "+" : "-"}{fmt(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
