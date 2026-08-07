"use client";
import { useState } from "react";
import { simular, ESCENARIOS_RAPIDOS } from "../services/simulator.js";

/**
 * Panel simulador de escenarios "¿Qué pasa si…?"
 */
export function SimuladorPanel({ dashData }) {
  const [escenarioActivo, setEscenarioActivo] = useState(null);
  const [resultado,       setResultado]       = useState(null);
  const [parametros,      setParametros]      = useState({});

  const seleccionar = (esc) => {
    setEscenarioActivo(esc);
    setParametros({ ...esc.params });
    setResultado(null);
  };

  const ejecutar = () => {
    if (!escenarioActivo) return;
    const res = simular(dashData ?? {}, { tipo: escenarioActivo.tipo, params: parametros });
    setResultado(res);
  };

  const fmtVal = (val, formato) => {
    if (val == null) return "—";
    switch (formato) {
      case "moneda":     return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
      case "porcentaje": return `${val.toFixed(1)}%`;
      case "gramos":     return `${val} g/día`;
      default:           return String(val);
    }
  };

  return (
    <div style={{ padding: "0 0 24px" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111" }}>
        🔮 Simulador de Escenarios
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
        Proyecta el impacto de decisiones clave antes de tomarlas.
      </p>

      {/* Escenarios rápidos */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {ESCENARIOS_RAPIDOS.map(esc => (
          <button
            key={esc.tipo}
            onClick={() => seleccionar(esc)}
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              padding:      "8px 16px",
              borderRadius: 30,
              border:       escenarioActivo?.tipo === esc.tipo
                ? "2px solid #6366F1"
                : "1px solid #E5E7EB",
              background:   escenarioActivo?.tipo === esc.tipo ? "#EEF2FF" : "#F9FAFB",
              color:        escenarioActivo?.tipo === esc.tipo ? "#4F46E5" : "#374151",
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            <span>{esc.icono}</span>
            {esc.label}
          </button>
        ))}
      </div>

      {/* Formulario de parámetros */}
      {escenarioActivo && (
        <div style={{
          background:   "#F9FAFB",
          border:       "1px solid #E5E7EB",
          borderRadius: 14,
          padding:      20,
          marginBottom: 20,
        }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#111" }}>
            {escenarioActivo.icono} {escenarioActivo.label}
          </h4>
          <ParametroForm
            tipo={escenarioActivo.tipo}
            params={parametros}
            onChange={setParametros}
          />
          <button
            onClick={ejecutar}
            style={{
              marginTop:    14,
              padding:      "10px 24px",
              borderRadius: 30,
              border:       "none",
              background:   "#6366F1",
              color:        "#FFF",
              fontSize:     14,
              fontWeight:   700,
              cursor:       "pointer",
              fontFamily:   "inherit",
            }}
          >
            ▶ Simular
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && !resultado.error && (
        <div style={{
          background:   "#FFF",
          border:       "1px solid #E5E7EB",
          borderRadius: 14,
          padding:      20,
        }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>
            {resultado.titulo}
          </h4>

          {/* Proyecciones */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
            {resultado.proyecciones.map((p, i) => (
              <div key={i} style={{
                background:   p.positivo === true ? "#F0FDF4" : p.positivo === false ? "#FEF2F2" : "#F9FAFB",
                border:       `1px solid ${p.positivo === true ? "#BBF7D0" : p.positivo === false ? "#FECACA" : "#E5E7EB"}`,
                borderRadius: 10,
                padding:      "12px 14px",
              }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {p.label}
                </p>
                {p.actual != null && (
                  <p style={{ margin: "0 0 2px", fontSize: 11, color: "#9CA3AF" }}>
                    Actual: {fmtVal(p.actual, p.formato)}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: p.positivo === true ? "#059669" : p.positivo === false ? "#DC2626" : "#374151" }}>
                  {fmtVal(p.proyectado, p.formato)}
                </p>
              </div>
            ))}
          </div>

          {/* Análisis */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#374151" }}>Análisis:</p>
            {resultado.analisis.filter(Boolean).map((a, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>• {a}</p>
            ))}
          </div>

          {/* Recomendaciones */}
          {resultado.recomendaciones?.length > 0 && (
            <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase" }}>
                💡 Recomendaciones
              </p>
              {resultado.recomendaciones.map((r, i) => (
                <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: "#374151" }}>{r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParametroForm({ tipo, params, onChange }) {
  const set = (k, v) => onChange({ ...params, [k]: v });

  const field = (label, key, type = "number", min, step = 1) => (
    <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
      <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
      <input
        type={type}
        value={params[key] ?? ""}
        min={min}
        step={step}
        onChange={e => set(key, type === "number" ? parseFloat(e.target.value) : e.target.value)}
        style={{
          padding: "7px 10px", borderRadius: 8, border: "1px solid #E5E7EB",
          background: "#FFF", color: "#111", fontSize: 13, fontFamily: "inherit",
        }}
      />
    </label>
  );

  const selectField = (label, key, options) => (
    <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
      <span style={{ fontWeight: 600, color: "#374151" }}>{label}</span>
      <select
        value={params[key] ?? ""}
        onChange={e => set(key, e.target.value)}
        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#FFF", color: "#111", fontSize: 13, fontFamily: "inherit" }}
      >
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );

  const FORMS = {
    vender_animales: [
      field("Cantidad a vender", "cantidad", "number", 1),
      field("Precio por kg (COP)", "precioKg", "number", 0, 500),
      field("Peso promedio (kg)", "pesoPromedio", "number", 200, 10),
    ],
    comprar_animales: [
      field("Cantidad a comprar", "cantidad", "number", 1),
      field("Precio por animal (COP)", "precioUnidad", "number", 0, 100000),
      selectField("Categoría", "categoria", [
        { v: "novillas", l: "Novillas" }, { v: "vacas", l: "Vacas" },
        { v: "toros", l: "Toros" }, { v: "terneros", l: "Terneros" },
      ]),
    ],
    cambiar_sistema: [
      selectField("Sistema productivo", "sistema", [
        { v: "extensivo",    l: "Extensivo (pastoreo libre)" },
        { v: "semi",         l: "Semi-intensivo (rotación simple)" },
        { v: "intensivo",    l: "Intensivo (suplementado)" },
        { v: "silvopastoril",l: "Silvopastoril (SSP)" },
      ]),
    ],
    aumentar_potreros: [
      field("Hectáreas nuevas", "hectareasNuevas", "number", 1, 1),
      selectField("Tipo de gramínea", "tipoGraminea", [
        { v: "brachiaria", l: "Brachiaria brizantha" },
        { v: "kikuyu",     l: "Kikuyu" },
        { v: "estrella",   l: "Pasto estrella" },
        { v: "guinea",     l: "Guinea / Mombasa" },
      ]),
    ],
    cambiar_alimentacion: [
      selectField("Tipo de suplemento", "cambio", [
        { v: "suplementacion", l: "Suplementación estratégica" },
        { v: "bloque_mineral", l: "Bloque mineral" },
        { v: "silo",           l: "Ensilaje de reserva" },
      ]),
    ],
    aumentar_precio: [
      field("Aumento de precio (%)", "pctAumento", "number", 1, 1),
    ],
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {(FORMS[tipo] ?? []).map((f, i) => <div key={i}>{f}</div>)}
    </div>
  );
}
