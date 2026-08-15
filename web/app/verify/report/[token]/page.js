"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ganaderosg-backend.up.railway.app/api";

export default function VerifyReportPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/informes-financieros/verificar/${token}`)
      .then(r => r.json())
      .then(r => { if (r.error) setError(r.error); else setData(r); })
      .catch(() => setError("No se pudo verificar el informe."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e3a5f,#2d6a4f)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:20, padding:36, maxWidth:480, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:48 }}>🏦</div>
          <div style={{ fontWeight:900, fontSize:22, color:"#111", marginBottom:4 }}>Verificación de Informe</div>
          <div style={{ fontSize:13, color:"#6b7280" }}>Henriquez Cattle Management — Sistema de verificación</div>
        </div>

        {loading && <div style={{ textAlign:"center", color:"#6b7280", padding:24 }}>Verificando...</div>}

        {error && (
          <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>❌</div>
            <div style={{ fontWeight:700, color:"#dc2626", marginBottom:4 }}>Informe no válido</div>
            <div style={{ fontSize:13, color:"#991b1b" }}>{error}</div>
          </div>
        )}

        {data && (
          <div>
            {data.valido ? (
              <div style={{ background:"#f0fdf4", border:"2px solid #86efac", borderRadius:12, padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:28 }}>✅</span>
                  <div><div style={{ fontWeight:800, fontSize:16, color:"#15803d" }}>Informe Verificado</div><div style={{ fontSize:12, color:"#166534" }}>Documento auténtico</div></div>
                </div>
              </div>
            ) : (
              <div style={{ background:"#fee2e2", border:"2px solid #fca5a5", borderRadius:12, padding:20, marginBottom:16 }}>
                <div style={{ fontWeight:800, color:"#dc2626" }}>⚠️ Informe anulado o no válido</div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Código", value: data.codigo },
                { label:"Empresa", value: data.empresa },
                { label:"Tipo", value: data.tipo?.replace(/_/g," ") },
                { label:"Período", value: data.periodo },
                { label:"Fecha emisión", value: data.fechaEmision ? new Date(data.fechaEmision).toLocaleDateString("es-NI") : null },
                { label:"Estado", value: data.estado },
              ].filter(f=>f.value).map(f => (
                <div key={f.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", background:"rgba(0,0,0,0.04)", borderRadius:8, fontSize:13 }}>
                  <span style={{ color:"#6b7280", fontWeight:600 }}>{f.label}</span>
                  <span style={{ color:"#111", fontWeight:700 }}>{f.value}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop:20, padding:"12px 16px", background:"rgba(0,0,0,0.04)", borderRadius:10, fontSize:11, color:"#9ca3af", textAlign:"center" }}>
              Token de verificación: <span style={{ fontFamily:"monospace" }}>{token?.slice(0,16)}...</span>
            </div>
          </div>
        )}

        <div style={{ marginTop:24, textAlign:"center", fontSize:12, color:"#9ca3af" }}>
          ganaderosg.app · Sistema financiero ganadero
        </div>
      </div>
    </div>
  );
}
