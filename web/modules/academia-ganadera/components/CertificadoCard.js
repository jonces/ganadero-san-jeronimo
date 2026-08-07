"use client";
import { getCertificadoByCurso } from "../services/academia-storage.js";
import { generateCertificado, printCertificado } from "../services/certificate-generator.js";

/**
 * Tarjeta del certificado digital, con botón de impresión.
 */
export function CertificadoCard({ curso, usuario, onGenerado }) {
  const [cert, setCert] = React.useState(() => getCertificadoByCurso(curso.id));
  const [generando, setGenerando] = React.useState(false);

  const generar = () => {
    setGenerando(true);
    try {
      const nuevo = generateCertificado({ curso, usuario });
      setCert(nuevo);
      onGenerado?.(nuevo);
    } finally {
      setGenerando(false);
    }
  };

  if (!cert) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>¡Curso completado!</h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B7280" }}>
          Genera tu certificado personalizado y compártelo.
        </p>
        <button onClick={generar} disabled={generando} style={{
          padding: "12px 32px", borderRadius: 30, border: "none",
          background: "#6366F1", color: "#FFF", fontSize: 15,
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          {generando ? "Generando…" : "✨ Generar certificado"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Vista previa del certificado */}
      <div style={{
        border: "8px solid #15803D", borderRadius: 12,
        padding: "24px 32px", background: "linear-gradient(135deg, #FAFFFE, #F0FDF4)",
        textAlign: "center", marginBottom: 20,
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🐄</div>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#15803D", textTransform: "uppercase", margin: "0 0 12px" }}>
          GanaderoSG — Academia Ganadera Inteligente
        </p>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#166534", margin: "0 0 16px" }}>
          Certificado de Finalización
        </h3>
        <p style={{ fontSize: 12, color: "#374151", margin: "0 0 4px" }}>Se certifica que</p>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
          {cert.nombre}
        </p>
        {cert.empresa && <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 16px" }}>{cert.empresa}</p>}
        <p style={{ fontSize: 12, color: "#374151", margin: "0 0 6px" }}>ha completado satisfactoriamente</p>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#15803D", margin: "0 0 8px" }}>{cert.cursoTitulo}</p>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 20px" }}>
          Nivel: {cert.nivel} · {cert.duracion} · {cert.fecha}
        </p>
        <div style={{ borderTop: "1px solid #D1FAE5", paddingTop: 12 }}>
          <p style={{ fontSize: 9, color: "#9CA3AF", margin: 0, letterSpacing: 1 }}>
            CÓDIGO DE VERIFICACIÓN: <strong style={{ color: "#374151" }}>{cert.codigo}</strong>
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={() => printCertificado(cert)}
          style={{
            padding: "10px 24px", borderRadius: 30, border: "none",
            background: "#15803D", color: "#FFF", fontSize: 14,
            fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          🖨️ Imprimir / PDF
        </button>
        {navigator?.share && (
          <button
            onClick={() => navigator.share({ title: cert.cursoTitulo, text: `Completé el curso "${cert.cursoTitulo}" en GanaderoSG. Código: ${cert.codigo}` })}
            style={{
              padding: "10px 24px", borderRadius: 30, border: "1px solid #E5E7EB",
              background: "#FFF", color: "#374151", fontSize: 14,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            📤 Compartir
          </button>
        )}
      </div>
    </div>
  );
}

// Necesitamos React para useState en este archivo
import React from "react";
