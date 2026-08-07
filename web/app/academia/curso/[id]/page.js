"use client";
import { useParams, useRouter } from "next/navigation";
import { getCursoById } from "../../../../modules/academia-ganadera/constants/catalog.js";
import { CursoViewer }  from "../../../../modules/academia-ganadera/components/CursoViewer.js";

export default function CursoPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const curso   = getCursoById(id);

  if (!curso) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100dvh", gap: 16 }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <h2 style={{ margin: 0, fontWeight: 700 }}>Curso no encontrado</h2>
        <button onClick={() => router.push("/academia")} style={{
          padding: "10px 24px", borderRadius: 30, border: "none",
          background: "#15803D", color: "#FFF", fontSize: 14,
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          ← Volver a la Academia
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Breadcrumb */}
      <div style={{
        padding: "10px 20px", borderBottom: "1px solid #E5E7EB",
        background: "#FFF", display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, color: "#6B7280", flexShrink: 0,
      }}>
        <button onClick={() => router.push("/academia")} style={{
          background: "none", border: "none", color: "#15803D", cursor: "pointer",
          fontSize: 13, fontWeight: 600, fontFamily: "inherit",
        }}>
          ← Academia
        </button>
        <span>/</span>
        <span style={{ color: "#111", fontWeight: 600 }}>{curso.titulo}</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <CursoViewer curso={curso} />
      </div>
    </div>
  );
}
