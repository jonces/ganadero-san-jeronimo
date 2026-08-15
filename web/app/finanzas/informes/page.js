"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

function fmt(v) { if (v === null || v === undefined) return "—"; return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function pct(v) { if (!v && v !== 0) return "—"; return Number(v).toFixed(1) + "%"; }

const cardGlass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,0,0,0.10)", borderRadius:14, padding:"16px 20px", marginBottom:16 };
const tabBtn = (active) => ({ padding:"8px 16px", borderRadius:8, border:`1px solid ${active?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.12)"}`, background:active?"rgba(255,255,255,0.80)":"rgba(255,255,255,0.35)", color:"#000", fontWeight:active?700:500, fontSize:13, cursor:"pointer" });
const sectionTitle = { fontWeight:700, fontSize:15, color:"#111", marginBottom:12, borderBottom:"2px solid rgba(0,0,0,0.10)", paddingBottom:8 };
const rowStyle = { display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.06)", fontSize:13 };

const TABS = ["Balance General","Estado de Resultados","Flujo de Efectivo","Indicadores"];

export default function InformesPage() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ENDPOINTS = ["/estados-financieros/balance", "/estados-financieros/resultados", "/estados-financieros/flujo-efectivo", "/estados-financieros/indicadores"];

  async function cargar(idx) {
    setLoading(true); setError("");
    try {
      const r = await api(ENDPOINTS[idx]);
      setData(d => ({ ...d, [idx]: r }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (!data[tab]) cargar(tab); }, [tab]);

  const d = data[tab];

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {TABS.map((t,i) => <button key={i} style={tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>{error}</div>}
      {loading && <div style={{ textAlign:"center", color:"rgba(255,255,255,0.7)", padding:48 }}>Calculando...</div>}

      {!loading && d && (
        <>
          {/* ── Balance General ── */}
          {tab === 0 && (
            <div>
              <div style={cardGlass}>
                <div style={sectionTitle}>Activos</div>
                {d.activos?.grupos?.map(g => (
                  <div key={g.nombre} style={{ marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:"#374151", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.04em" }}>{g.nombre}</div>
                    {g.items?.map(item => <div key={item.label} style={rowStyle}><span style={{ color:"#374151" }}>{item.label}</span><span style={{ fontWeight:600, color:"#111" }}>{fmt(item.valor)}</span></div>)}
                    <div style={{ ...rowStyle, borderTop:"2px solid rgba(0,0,0,0.08)", marginTop:4, fontWeight:700 }}><span>Total {g.nombre}</span><span style={{ color:"#15803d" }}>{fmt(g.total)}</span></div>
                  </div>
                ))}
                <div style={{ ...rowStyle, fontWeight:800, fontSize:15, borderTop:"2px solid rgba(0,0,0,0.20)", paddingTop:10, marginTop:8 }}><span>TOTAL ACTIVOS</span><span style={{ color:"#15803d" }}>{fmt(d.activos?.total)}</span></div>
              </div>

              <div style={cardGlass}>
                <div style={sectionTitle}>Pasivos y Patrimonio</div>
                {d.pasivos?.grupos?.map(g => (
                  <div key={g.nombre} style={{ marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:"#374151", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.04em" }}>{g.nombre}</div>
                    {g.items?.map(item => <div key={item.label} style={rowStyle}><span style={{ color:"#374151" }}>{item.label}</span><span style={{ fontWeight:600, color:"#111" }}>{fmt(item.valor)}</span></div>)}
                    <div style={{ ...rowStyle, borderTop:"2px solid rgba(0,0,0,0.08)", marginTop:4, fontWeight:700 }}><span>Total {g.nombre}</span><span style={{ color:"#dc2626" }}>{fmt(g.total)}</span></div>
                  </div>
                ))}
                <div style={{ ...rowStyle, fontWeight:800, fontSize:15, borderTop:"2px solid rgba(0,0,0,0.20)", paddingTop:10, marginTop:8 }}><span>TOTAL PASIVOS</span><span style={{ color:"#dc2626" }}>{fmt(d.pasivos?.total)}</span></div>
                {d.patrimonio !== undefined && <div style={{ ...rowStyle, fontWeight:800, fontSize:15, marginTop:4 }}><span>PATRIMONIO NETO</span><span style={{ color:d.patrimonio>=0?"#1d4ed8":"#dc2626" }}>{fmt(d.patrimonio)}</span></div>}
              </div>

              {d.ecuacionCuadra !== undefined && (
                <div style={{ ...cardGlass, background: d.ecuacionCuadra ? "rgba(220,252,231,0.55)" : "rgba(254,226,226,0.55)", border:`1px solid ${d.ecuacionCuadra?"#86efac":"#fca5a5"}` }}>
                  {d.ecuacionCuadra ? "✅ Ecuación contable cuadra: Activos = Pasivos + Patrimonio" : "⚠️ La ecuación contable no cuadra. Revise los datos."}
                </div>
              )}
            </div>
          )}

          {/* ── Estado de Resultados ── */}
          {tab === 1 && (
            <div style={cardGlass}>
              <div style={sectionTitle}>Estado de Resultados</div>
              {[
                { label:"Ingreso por ventas", value: d.ingresoVentas, color:"#15803d" },
                { label:"Costos directos", value: d.costosDirectos, color:"#dc2626" },
                { label:"Margen bruto", value: d.margenBruto, color: d.margenBruto >= 0 ? "#0f766e" : "#dc2626", bold:true },
                { label:"Gastos operativos", value: d.gastosOp, color:"#dc2626" },
                { label:"Resultado operativo", value: d.resultadoOperativo, color: d.resultadoOperativo >= 0 ? "#15803d" : "#dc2626", bold:true },
              ].map(r => (
                r.value !== undefined && r.value !== null &&
                <div key={r.label} style={{ ...rowStyle, fontWeight:r.bold?700:400, borderBottom:r.bold?"2px solid rgba(0,0,0,0.15)":"1px solid rgba(0,0,0,0.06)", paddingBottom:r.bold?8:6, marginBottom:r.bold?4:0 }}>
                  <span style={{ color:"#374151" }}>{r.label}</span>
                  <span style={{ color:r.color, fontWeight:r.bold?700:600 }}>{fmt(r.value)}</span>
                </div>
              ))}

              {d.porCategoriaGastos && Object.keys(d.porCategoriaGastos).length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.04em" }}>Gastos por categoría</div>
                  {Object.entries(d.porCategoriaGastos).sort((a,b)=>b[1]-a[1]).map(([cat,monto]) => (
                    <div key={cat} style={rowStyle}><span style={{ color:"#374151" }}>{cat}</span><span style={{ color:"#dc2626", fontWeight:600 }}>{fmt(monto)}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Flujo de Efectivo ── */}
          {tab === 2 && (
            <div style={cardGlass}>
              <div style={sectionTitle}>Flujo de Efectivo — 12 meses</div>
              {!d.meses || d.meses.length === 0 ? (
                <div style={{ textAlign:"center", color:"#6b7280", padding:32 }}>Datos insuficientes para calcular flujo de efectivo</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"rgba(255,255,255,0.40)" }}>
                        <th style={{ padding:"8px 10px", textAlign:"left", fontWeight:700, color:"#374151", fontSize:11, textTransform:"uppercase", letterSpacing:"0.04em" }}>Mes</th>
                        <th style={{ padding:"8px 10px", textAlign:"right", fontWeight:700, color:"#374151", fontSize:11 }}>Ingresos</th>
                        <th style={{ padding:"8px 10px", textAlign:"right", fontWeight:700, color:"#374151", fontSize:11 }}>Egresos</th>
                        <th style={{ padding:"8px 10px", textAlign:"right", fontWeight:700, color:"#374151", fontSize:11 }}>Flujo neto</th>
                        <th style={{ padding:"8px 10px", textAlign:"right", fontWeight:700, color:"#374151", fontSize:11 }}>Saldo acum.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.meses.map((m,i) => (
                        <tr key={m.mes} style={{ background:i%2===0?"transparent":"rgba(255,255,255,0.20)" }}>
                          <td style={{ padding:"7px 10px", color:"#374151" }}>{m.mes}</td>
                          <td style={{ padding:"7px 10px", textAlign:"right", color:"#15803d", fontWeight:600 }}>{fmt(m.ingresos)}</td>
                          <td style={{ padding:"7px 10px", textAlign:"right", color:"#dc2626", fontWeight:600 }}>{fmt(m.egresos)}</td>
                          <td style={{ padding:"7px 10px", textAlign:"right", fontWeight:700, color:m.flujoNeto>=0?"#15803d":"#dc2626" }}>{fmt(m.flujoNeto)}</td>
                          <td style={{ padding:"7px 10px", textAlign:"right", color:"#111" }}>{fmt(m.saldoAcumulado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Indicadores ── */}
          {tab === 3 && (
            <div>
              <div style={cardGlass}>
                <div style={sectionTitle}>Indicadores Financieros</div>
                {!d || Object.keys(d).length === 0 ? (
                  <div style={{ textAlign:"center", color:"#6b7280", padding:32 }}>Datos insuficientes para calcular indicadores</div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                    {[
                      { label:"Liquidez corriente", value:d.liquidez, formato:"ratio", desc:"Capacidad de pagar deudas a corto plazo" },
                      { label:"Ratio de endeudamiento", value:d.ratioEndeudamiento, formato:"pct", desc:"Proporción de deuda sobre activos totales" },
                      { label:"Margen neto", value:d.margenNeto, formato:"pct", desc:"Utilidad como % de ingresos" },
                      { label:"ROA", value:d.roa, formato:"pct", desc:"Retorno sobre activos totales" },
                      { label:"ROE", value:d.roe, formato:"pct", desc:"Retorno sobre patrimonio" },
                      { label:"Capital de trabajo", value:d.capitalTrabajo, formato:"moneda", desc:"Activo corriente menos pasivo corriente" },
                    ].map(ind => {
                      const val = ind.value;
                      const display = val === null || val === undefined ? "Datos insuficientes"
                        : ind.formato === "moneda" ? fmt(val)
                        : ind.formato === "pct" ? pct(val)
                        : Number(val).toFixed(2);
                      const isInsuficiente = display === "Datos insuficientes";
                      return (
                        <div key={ind.label} style={{ background:"rgba(255,255,255,0.40)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(0,0,0,0.08)" }}>
                          <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:4 }}>{ind.label}</div>
                          <div style={{ fontSize:18, fontWeight:800, color:isInsuficiente?"#9ca3af":"#111", marginBottom:4 }}>{display}</div>
                          <div style={{ fontSize:11, color:"#9ca3af" }}>{ind.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ ...cardGlass, background:"rgba(255,255,255,0.35)", fontSize:12, color:"#6b7280" }}>
                💡 Los indicadores requieren datos completos de activos, pasivos e ingresos. Si aparece "Datos insuficientes" registre transacciones y activos primero.
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !d && !error && (
        <div style={{ ...cardGlass, textAlign:"center", padding:"48px 24px" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
          <div style={{ fontWeight:700, color:"#111", marginBottom:6 }}>Calculando informe...</div>
        </div>
      )}
    </div>
  );
}
