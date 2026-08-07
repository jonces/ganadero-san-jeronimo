"use client";
import { useState } from "react";
import { saveExamen } from "../services/academia-storage.js";

/**
 * Panel de examen interactivo con retroalimentación por pregunta.
 */
export function ExamenPanel({ examen, cursoId, onAprobado, onVolver }) {
  const [respuestas,  setRespuestas]  = useState({});
  const [enviado,     setEnviado]     = useState(false);
  const [calificacion,setCalificacion]= useState(null);
  const [tiempo,      setTiempo]      = useState(0); // segundos transcurridos

  const total      = examen.preguntas?.length ?? 0;
  const respondidas = Object.keys(respuestas).length;

  const responder = (pregId, opcionIdx) => {
    if (enviado) return;
    setRespuestas(prev => ({ ...prev, [pregId]: opcionIdx }));
  };

  const enviar = () => {
    if (respondidas < total) return;
    let correctas = 0;
    for (const p of examen.preguntas) {
      if (respuestas[p.id] === p.correcta) correctas++;
    }
    const pct = Math.round((correctas / total) * 100);
    const aprobado = pct >= (examen.puntajeAprobacion ?? 70);
    setCalificacion({ correctas, pct, aprobado });
    setEnviado(true);
    saveExamen(cursoId, { preguntas: examen.preguntas, respuestas, calificacion: pct, aprobado });
    if (aprobado) onAprobado?.({ correctas, total, pct });
  };

  if (!examen?.preguntas) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
        <p>No se encontró el examen. Intenta generarlo de nuevo.</p>
        <button onClick={onVolver} style={btnStyle("#6366F1")}>Volver al curso</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header del examen */}
      <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#3730A3" }}>{examen.titulo}</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#4F46E5" }}>{examen.instrucciones}</p>
        {!enviado && (
          <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 12, color: "#6B7280" }}>
            <span>📝 {total} preguntas</span>
            <span>✅ Aprobación: {examen.puntajeAprobacion ?? 70}%</span>
            <span>⏱️ {examen.tiempoLimiteMins} min</span>
            <span style={{ marginLeft: "auto", fontWeight: 700, color: respondidas === total ? "#059669" : "#374151" }}>
              {respondidas}/{total} respondidas
            </span>
          </div>
        )}
      </div>

      {/* Resultado */}
      {enviado && calificacion && (
        <div style={{
          background: calificacion.aprobado ? "#F0FDF4" : "#FEF2F2",
          border: `1px solid ${calificacion.aprobado ? "#BBF7D0" : "#FECACA"}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{calificacion.aprobado ? "🏆" : "📚"}</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: calificacion.aprobado ? "#059669" : "#DC2626" }}>
            {calificacion.pct}% — {calificacion.aprobado ? "¡Aprobado!" : "No aprobado"}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#374151" }}>
            {calificacion.correctas} de {total} respuestas correctas
          </p>
          {!calificacion.aprobado && (
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#6B7280" }}>
              Necesitas {examen.puntajeAprobacion ?? 70}% para aprobar. Revisa las lecciones y vuelve a intentarlo.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            {calificacion.aprobado && (
              <button onClick={onAprobado} style={btnStyle("#059669")}>🏆 Ver certificado</button>
            )}
            <button onClick={onVolver} style={btnStyle("#6366F1")}>↩ Volver al curso</button>
          </div>
        </div>
      )}

      {/* Preguntas */}
      {examen.preguntas.map((preg, idx) => {
        const seleccionada = respuestas[preg.id];
        const correcta     = preg.correcta;
        const isCorrect    = seleccionada === correcta;

        return (
          <div key={preg.id} style={{
            background: "#FFF", border: `1px solid ${enviado ? (isCorrect ? "#BBF7D0" : "#FECACA") : "#E5E7EB"}`,
            borderRadius: 12, padding: "16px 20px", marginBottom: 16,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.5 }}>
              <span style={{ color: "#6B7280", marginRight: 6 }}>{idx + 1}.</span>{preg.pregunta}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {preg.opciones.map((op, oi) => {
                const isSelected = seleccionada === oi;
                const isCorrectOpt = oi === correcta;
                let bg = "#F9FAFB", border = "#E5E7EB", color = "#374151";

                if (enviado) {
                  if (isCorrectOpt)          { bg = "#F0FDF4"; border = "#BBF7D0"; color = "#059669"; }
                  else if (isSelected)        { bg = "#FEF2F2"; border = "#FECACA"; color = "#DC2626"; }
                } else if (isSelected)        { bg = "#EEF2FF"; border = "#6366F1"; color = "#4F46E5"; }

                return (
                  <button
                    key={oi}
                    onClick={() => responder(preg.id, oi)}
                    disabled={enviado}
                    style={{
                      padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${border}`,
                      background: bg, color, fontSize: 13, textAlign: "left",
                      cursor: enviado ? "default" : "pointer", fontFamily: "inherit",
                      fontWeight: isSelected ? 700 : 400,
                      transition: "all 0.12s",
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>
                    {op}
                    {enviado && isCorrectOpt && " ✓"}
                    {enviado && isSelected && !isCorrectOpt && " ✗"}
                  </button>
                );
              })}
            </div>

            {/* Retroalimentación */}
            {enviado && preg.explicacion && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#EEF2FF", borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#4F46E5" }}>
                  💡 <strong>Explicación:</strong> {preg.explicacion}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Botón enviar */}
      {!enviado && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={enviar}
            disabled={respondidas < total}
            style={btnStyle("#6366F1", respondidas < total)}
          >
            📝 Enviar examen ({respondidas}/{total})
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg, disabled = false) => ({
  padding: "10px 28px", borderRadius: 30, border: "none",
  background: disabled ? "#E5E7EB" : bg, color: disabled ? "#9CA3AF" : "#FFF",
  fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
});
