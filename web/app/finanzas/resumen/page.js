"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

function fmt(v, moneda = "NIO") {
  if (v === null || v === undefined || isNaN(v)) return "—";
  const prefix = moneda === "USD" ? "$ " : "C$ ";
  return prefix + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const PERIODOS = [
  { value: "mes", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" },
  { value: "año", label: "Este año" },
];

const cardGlass = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 14,
  padding: "16px 20px",
};

export default function ResumenPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");

  async function cargar() {
    setLoading(true);
    try {
      const [fin, bal] = await Promise.all([
        api(`/finanzas?periodo=${periodo}`),
        api("/estados-financieros/resumen").catch(() => null),
      ]);
      setData(fin);
      setBalance(bal);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { cargar(); }, [periodo]);

  const meses = data?.meses || [];
  const maxVal = Math.max(...meses.flatMap(m => [m.ingresos, m.gastos]), 1);
  const BAR_H = 100;

  return (
    <div>
      {/* Selector período */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {PERIODOS.map(p => (
          <button key={p.value} onClick={() => setPeriodo(p.value)}
            style={{
              padding: "6px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${periodo === p.value ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.12)"}`,
              background: periodo === p.value ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)",
              color: "#000", fontWeight: periodo === p.value ? 700 : 500, fontSize: 13,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", padding: 48 }}>Cargando...</div>
      ) : (
        <>
          {/* KPIs principales */}
          {data && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Ingresos", value: fmt(data.ingresos), color: "#15803d" },
                { label: "Gastos", value: fmt(data.gastos), color: "#dc2626" },
                { label: "Flujo neto", value: fmt(data.flujoNeto), color: data.flujoNeto >= 0 ? "#15803d" : "#dc2626" },
                { label: "Margen", value: `${Number(data.margen || 0).toFixed(1)}%`, color: data.margen >= 0 ? "#1d4ed8" : "#dc2626" },
              ].map(c => (
                <div key={c.label} style={cardGlass}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Situación financiera (balance rápido) */}
          {balance && (
            <div style={{ ...cardGlass, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#111" }}>Situación Financiera</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                {[
                  { label: "Caja disponible", value: fmt(balance.caja), color: "#15803d" },
                  { label: "Bancos", value: fmt(balance.bancos), color: "#1d4ed8" },
                  { label: "Activos totales", value: fmt(balance.totalActivos), color: "#0f766e" },
                  { label: "Pasivos totales", value: fmt(balance.totalPasivos), color: "#dc2626" },
                  { label: "Patrimonio neto", value: fmt(balance.patrimonioNeto), color: balance.patrimonioNeto >= 0 ? "#15803d" : "#dc2626" },
                  { label: "Deudas activas", value: fmt(balance.totalDeudas), color: "#92400e" },
                ].map(c => (
                  <div key={c.label} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.40)", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{c.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
              {/* Accesos rápidos */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Ver Balance", path: "/finanzas/informes" },
                  { label: "Ver Flujo de Caja", path: "/finanzas/informes" },
                  { label: "Preparar Expediente", path: "/finanzas/expediente" },
                ].map(btn => (
                  <button key={btn.label} onClick={() => router.push(btn.path)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.18)", background: "rgba(255,255,255,0.60)", color: "#111", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gráfica barras 12 meses */}
          {meses.length > 0 && (
            <div style={{ ...cardGlass, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "#111" }}>Ingresos vs Gastos — Últimos 12 meses</div>
              <div style={{ overflowX: "auto" }}>
                <svg viewBox={`0 0 ${meses.length * 60} ${BAR_H + 40}`} style={{ width: "100%", minWidth: 500 }}>
                  {meses.map((m, i) => {
                    const x = i * 60 + 8;
                    const hI = (m.ingresos / maxVal) * BAR_H;
                    const hG = (m.gastos / maxVal) * BAR_H;
                    const label = m.mes.slice(5);
                    return (
                      <g key={m.mes}>
                        <rect x={x} y={BAR_H - hI} width={20} height={hI} fill="#16a34a" rx={3} opacity={0.85} />
                        <rect x={x + 22} y={BAR_H - hG} width={20} height={hG} fill="#dc2626" rx={3} opacity={0.75} />
                        <text x={x + 21} y={BAR_H + 16} textAnchor="middle" fontSize={9} fill="#374151">{label}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: "#16a34a", borderRadius: 2, display: "inline-block" }} />Ingresos</span>
                <span style={{ fontSize: 11, color: "#374151", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 12, background: "#dc2626", borderRadius: 2, display: "inline-block" }} />Gastos</span>
              </div>
            </div>
          )}

          {/* Gastos por categoría */}
          {data?.porCategoria && Object.keys(data.porCategoria).length > 0 && (
            <div style={cardGlass}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "#111" }}>Gastos por categoría</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(data.porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => {
                  const pct = data.gastos > 0 ? (monto / data.gastos) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontSize: 12, color: "#111", fontWeight: 700 }}>{fmt(monto)}</span>
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.08)", borderRadius: 4, height: 6 }}>
                        <div style={{ background: "#dc2626", borderRadius: 4, height: 6, width: `${pct}%`, transition: "width .3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
