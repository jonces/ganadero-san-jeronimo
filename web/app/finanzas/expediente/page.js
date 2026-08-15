"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const cardGlass = { background:"rgba(255,255,255,0.55)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", border:"1px solid rgba(0,0,0,0.10)", borderRadius:14, padding:"16px 20px", marginBottom:16 };
const inputS = { background:"rgba(255,255,255,0.70)", border:"1px solid rgba(0,0,0,0.15)", borderRadius:8, padding:"8px 12px", fontSize:13, color:"#111", outline:"none", width:"100%", boxSizing:"border-box" };
const labelS = { fontSize:11, color:"#6b7280", fontWeight:600, display:"block", marginBottom:4 };
const stepBtn = (active, done) => ({
  width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, border:"none", cursor:"pointer",
  background: done ? "#15803d" : active ? "#1d4ed8" : "rgba(255,255,255,0.50)",
  color: (done || active) ? "#fff" : "#6b7280",
});

const PASOS = ["Datos generales","Documentos","Parámetros","Generar"];

const TIPOS = ["BALANCE_GENERAL","ESTADO_RESULTADOS","FLUJO_EFECTIVO","EXPEDIENTE_BANCARIO","PAQUETE_COMPLETO"];
const DOCUMENTOS_SUGERIDOS = [
  "Balance General",
  "Estado de Resultados",
  "Flujo de Efectivo",
  "Indicadores financieros",
  "Inventario de ganado",
  "Registro de activos fijos",
  "Estado de deudas y préstamos",
  "Cierres mensuales (últimos 12 meses)",
];

export default function ExpedientePage() {
  const [paso, setPaso] = useState(0);
  const [dbListo, setDbListo] = useState(true);
  const [informes, setInformes] = useState([]);
  const [loadingInformes, setLoadingInformes] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [informeCreado, setInformeCreado] = useState(null);
  const [informeGenerado, setInformeGenerado] = useState(null);
  const [balance, setBalance] = useState(null);

  const [form, setForm] = useState({
    tipo: "EXPEDIENTE_BANCARIO",
    empresa: "Henriquez Cattle Management",
    institucion: "",
    montoSolicitado: "",
    plazoMeses: "",
    destinoCredito: "",
    periodoDesde: "",
    periodoHasta: "",
    moneda: "NIO",
    notas: "",
  });

  const [docsIncluidos, setDocsIncluidos] = useState(
    Object.fromEntries(DOCUMENTOS_SUGERIDOS.map(d => [d, true]))
  );

  useEffect(() => {
    Promise.all([
      api("/informes-financieros").then(setInformes).catch(e => {
        setInformes([]);
        if (e?.message?.includes("does not exist")) setDbListo(false);
      }),
      api("/estados-financieros/resumen").then(setBalance).catch(()=>null),
    ]).finally(() => setLoadingInformes(false));
  }, []);

  async function crearBorrador() {
    setEnviando(true); setError("");
    try {
      const docs = Object.entries(docsIncluidos).filter(([,v])=>v).map(([k])=>k);
      const payload = {
        ...form,
        montoSolicitado: form.montoSolicitado ? parseFloat(form.montoSolicitado) : null,
        plazoMeses: form.plazoMeses ? parseInt(form.plazoMeses) : null,
        documentosIncluidos: docs,
      };
      const r = await api("/informes-financieros", { method:"POST", body: payload });
      setInformeCreado(r);
      setPaso(3);
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  async function generarInforme() {
    if (!informeCreado) return;
    setGenerando(true); setError("");
    try {
      const r = await api(`/informes-financieros/${informeCreado.id}/generar`, { method:"POST", body:{} });
      setInformeGenerado(r);
      // refresh list
      api("/informes-financieros").then(setInformes).catch(()=>{});
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  }

  const pasoValido = (p) => {
    if (p === 0) return form.empresa && form.tipo && form.periodoDesde && form.periodoHasta;
    if (p === 1) return Object.values(docsIncluidos).some(Boolean);
    return true;
  };

  return (
    <div>
      {error && <div style={{ background:"#fee2e2", color:"#dc2626", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13 }}>{error}<button onClick={()=>setError("")} style={{ float:"right", background:"none", border:"none", cursor:"pointer", color:"#dc2626" }}>✕</button></div>}

      {!dbListo && (
        <div style={{ background:"rgba(254,243,199,0.90)", border:"1px solid #fcd34d", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#92400e" }}>
          ⏳ <strong>Base de datos actualizando…</strong> El servidor está aplicando las tablas nuevas (1-3 min). Puedes llenar el formulario mientras esperas — al hacer clic en "Crear borrador" se guardará cuando esté listo. Recarga la página en unos minutos.
        </div>
      )}

      {/* Balance rápido */}
      {balance && (
        <div style={{ ...cardGlass, marginBottom:20, background:"rgba(255,255,255,0.42)" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:8 }}>Resumen para incluir en expediente</div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12 }}>
            <span>Total activos: <strong style={{ color:"#15803d" }}>C$ {Number(balance.totalActivos||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
            <span>Patrimonio neto: <strong style={{ color:"#1d4ed8" }}>C$ {Number(balance.patrimonioNeto||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
            <span>Deudas activas: <strong style={{ color:"#dc2626" }}>C$ {Number(balance.totalDeudas||0).toLocaleString("es-NI",{maximumFractionDigits:0})}</strong></span>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:24 }}>
        {PASOS.map((p,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", flex:i<PASOS.length-1?1:"none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <button onClick={()=>i<paso && setPaso(i)} style={stepBtn(paso===i, i<paso)}>
                {i<paso ? "✓" : i+1}
              </button>
              <span style={{ fontSize:10, color:paso===i?"#1d4ed8":"#6b7280", fontWeight:paso===i?700:400, whiteSpace:"nowrap" }}>{p}</span>
            </div>
            {i<PASOS.length-1 && <div style={{ flex:1, height:2, background:i<paso?"#15803d":"rgba(0,0,0,0.12)", margin:"0 4px 18px" }} />}
          </div>
        ))}
      </div>

      {/* Paso 0: Datos generales */}
      {paso === 0 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Datos generales del expediente</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><label style={labelS}>Empresa / Razón social *</label><input style={inputS} value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})} /></div>
            <div><label style={labelS}>Tipo de informe *</label>
              <select style={inputS} value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>
                {TIPOS.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div><label style={labelS}>Institución destino</label><input style={inputS} placeholder="Banco, institución..." value={form.institucion} onChange={e=>setForm({...form,institucion:e.target.value})} /></div>
            <div><label style={labelS}>Monto solicitado (si aplica)</label><input style={inputS} type="number" placeholder="0.00" value={form.montoSolicitado} onChange={e=>setForm({...form,montoSolicitado:e.target.value})} /></div>
            <div><label style={labelS}>Plazo (meses)</label><input style={inputS} type="number" placeholder="12" value={form.plazoMeses} onChange={e=>setForm({...form,plazoMeses:e.target.value})} /></div>
            <div style={{ gridColumn:"1/-1" }}><label style={labelS}>Destino del crédito</label><input style={inputS} placeholder="Compra de ganado, mejora de instalaciones..." value={form.destinoCredito} onChange={e=>setForm({...form,destinoCredito:e.target.value})} /></div>
            <div><label style={labelS}>Período desde *</label><input style={inputS} type="date" value={form.periodoDesde} onChange={e=>setForm({...form,periodoDesde:e.target.value})} /></div>
            <div><label style={labelS}>Período hasta *</label><input style={inputS} type="date" value={form.periodoHasta} onChange={e=>setForm({...form,periodoHasta:e.target.value})} /></div>
            <div><label style={labelS}>Moneda</label>
              <select style={inputS} value={form.moneda} onChange={e=>setForm({...form,moneda:e.target.value})}>
                <option value="NIO">NIO — Córdoba</option>
                <option value="USD">USD — Dólar</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:16, textAlign:"right" }}>
            <button disabled={!pasoValido(0)} onClick={()=>setPaso(1)} style={{ padding:"10px 24px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:pasoValido(0)?1:0.5 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* Paso 1: Documentos */}
      {paso === 1 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Selecciona los documentos a incluir</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {DOCUMENTOS_SUGERIDOS.map(doc => (
              <label key={doc} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 12px", background:"rgba(255,255,255,0.40)", borderRadius:8, border:`1px solid ${docsIncluidos[doc]?"#93c5fd":"rgba(0,0,0,0.08)"}` }}>
                <input type="checkbox" checked={!!docsIncluidos[doc]} onChange={e=>setDocsIncluidos({...docsIncluidos,[doc]:e.target.checked})} style={{ width:16, height:16 }} />
                <span style={{ fontSize:13, color:"#111", fontWeight:docsIncluidos[doc]?600:400 }}>{doc}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop:16, display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setPaso(0)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>← Atrás</button>
            <button disabled={!pasoValido(1)} onClick={()=>setPaso(2)} style={{ padding:"10px 24px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:pasoValido(1)?1:0.5 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* Paso 2: Parámetros / notas */}
      {paso === 2 && (
        <div style={cardGlass}>
          <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:16 }}>Parámetros adicionales</div>
          <div style={{ marginBottom:12 }}>
            <label style={labelS}>Notas o instrucciones especiales</label>
            <textarea style={{ ...inputS, resize:"vertical" }} rows={4} placeholder="Indicaciones para el receptor, contexto adicional..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} />
          </div>
          {/* Resumen checklist */}
          <div style={{ background:"rgba(255,255,255,0.40)", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:12 }}>
            <div style={{ fontWeight:700, marginBottom:8, color:"#111" }}>Resumen del expediente:</div>
            <div style={{ color:"#374151" }}>Empresa: <strong>{form.empresa}</strong></div>
            <div style={{ color:"#374151" }}>Tipo: <strong>{form.tipo.replace(/_/g," ")}</strong></div>
            {form.institucion && <div style={{ color:"#374151" }}>Institución: <strong>{form.institucion}</strong></div>}
            {form.montoSolicitado && <div style={{ color:"#374151" }}>Monto: <strong>C$ {Number(form.montoSolicitado).toLocaleString("es-NI")}</strong></div>}
            <div style={{ color:"#374151" }}>Período: <strong>{form.periodoDesde} al {form.periodoHasta}</strong></div>
            <div style={{ color:"#374151" }}>Documentos: <strong>{Object.values(docsIncluidos).filter(Boolean).length} seleccionados</strong></div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setPaso(1)} style={{ padding:"10px 20px", background:"rgba(255,255,255,0.60)", border:"1px solid rgba(0,0,0,0.12)", borderRadius:8, fontWeight:600, cursor:"pointer", color:"#111" }}>← Atrás</button>
            <button disabled={enviando} onClick={crearBorrador} style={{ padding:"10px 28px", background:"#15803d", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", opacity:enviando?0.6:1 }}>{enviando?"Creando...":"Crear borrador →"}</button>
          </div>
        </div>
      )}

      {/* Paso 3: Generar */}
      {paso === 3 && informeCreado && (
        <div>
          <div style={{ ...cardGlass, borderColor:"#86efac", background:"rgba(220,252,231,0.55)" }}>
            <div style={{ fontWeight:700, fontSize:14, color:"#15803d", marginBottom:8 }}>✅ Borrador creado — {informeCreado.codigo}</div>
            <div style={{ fontSize:12, color:"#374151", marginBottom:16 }}>El expediente fue registrado con código único. Ahora puedes generarlo para obtener el PDF con código QR de verificación.</div>

            {!informeGenerado ? (
              <button disabled={generando} onClick={generarInforme}
                style={{ padding:"12px 28px", background:"#1d4ed8", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer", opacity:generando?0.6:1 }}>
                {generando ? "Generando expediente..." : "🏦 Generar expediente bancario"}
              </button>
            ) : (
              <div style={{ background:"rgba(255,255,255,0.55)", borderRadius:10, padding:"16px 20px", border:"1px solid rgba(0,0,0,0.10)" }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#111", marginBottom:10 }}>Expediente generado</div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:"#374151", marginBottom:12 }}>
                  <div>Código: <strong style={{ fontFamily:"monospace" }}>{informeGenerado.codigo}</strong></div>
                  <div>Estado: <strong style={{ color:"#15803d" }}>{informeGenerado.estado}</strong></div>
                  <div>Versión: <strong>{informeGenerado.versiones?.[0]?.version ?? 1}</strong></div>
                </div>
                {/* Token QR */}
                {informeGenerado.token && (
                  <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:8, padding:"12px 16px", marginBottom:12 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:"#15803d", marginBottom:4 }}>Código de verificación QR</div>
                    <div style={{ fontFamily:"monospace", fontSize:11, color:"#374151", wordBreak:"break-all", marginBottom:8 }}>{informeGenerado.token}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>La institución puede verificar la autenticidad del informe en: <strong>/verify/report/{informeGenerado.token}</strong></div>
                  </div>
                )}
                <div style={{ fontSize:12, color:"#6b7280" }}>
                  💡 La generación de PDF con firma digital y el envío de Excel están disponibles en la próxima versión. El snapshot financiero fue guardado con este expediente.
                </div>
              </div>
            )}
          </div>

          {/* Expedientes anteriores */}
          {informes.length > 0 && (
            <div style={cardGlass}>
              <div style={{ fontWeight:700, fontSize:13, color:"#111", marginBottom:12 }}>Expedientes anteriores</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {informes.slice(0,5).map(inf => (
                  <div key={inf.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.40)", borderRadius:8, border:"1px solid rgba(0,0,0,0.08)", fontSize:12 }}>
                    <div>
                      <span style={{ fontWeight:700, fontFamily:"monospace", color:"#111" }}>{inf.codigo}</span>
                      <span style={{ marginLeft:10, color:"#6b7280" }}>{inf.tipo?.replace(/_/g," ")}</span>
                      {inf.empresa && <span style={{ marginLeft:10, color:"#374151" }}>{inf.empresa}</span>}
                    </div>
                    <span style={{ fontWeight:700, fontSize:11, background:inf.estado==="GENERADO"?"#dcfce7":inf.estado==="BORRADOR"?"#fef3c7":"#fee2e2", color:inf.estado==="GENERADO"?"#15803d":inf.estado==="BORRADOR"?"#92400e":"#dc2626", padding:"2px 8px", borderRadius:20 }}>{inf.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de expedientes si no está en wizard */}
      {paso < 3 && !loadingInformes && informes.length > 0 && (
        <div style={{ ...cardGlass, marginTop:24 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#111", marginBottom:12 }}>Expedientes generados</div>
          {informes.map(inf => (
            <div key={inf.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.40)", borderRadius:8, border:"1px solid rgba(0,0,0,0.08)", marginBottom:6, fontSize:12 }}>
              <div>
                <span style={{ fontWeight:700, fontFamily:"monospace", color:"#111" }}>{inf.codigo}</span>
                <span style={{ marginLeft:10, color:"#6b7280" }}>{inf.tipo?.replace(/_/g," ")}</span>
              </div>
              <span style={{ fontWeight:700, fontSize:11, background:inf.estado==="GENERADO"?"#dcfce7":inf.estado==="BORRADOR"?"#fef3c7":"#fee2e2", color:inf.estado==="GENERADO"?"#15803d":inf.estado==="BORRADOR"?"#92400e":"#dc2626", padding:"2px 8px", borderRadius:20 }}>{inf.estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
