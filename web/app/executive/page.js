import { Suspense } from "react";
import ExecutiveShell from "../../modules/executive-intelligence/components/ExecutiveShell.js";

export const metadata = {
  title:       "Executive Intelligence Center — GanaderoSG",
  description: "Centro Ejecutivo de Business Intelligence para ganadería. KPIs, scores, benchmark y análisis IA.",
};

export default function ExecutivePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f8fafc" }}>
      <Suspense fallback={
        <div style={{ textAlign: "center", paddingTop: 100, fontFamily: "system-ui,sans-serif" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>📊</p>
          <p style={{ color: "#6b7280", fontWeight: 700, fontSize: 16 }}>Cargando Executive Intelligence Center…</p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Analizando datos de la operación…</p>
        </div>
      }>
        <ExecutiveShell />
      </Suspense>
    </div>
  );
}
