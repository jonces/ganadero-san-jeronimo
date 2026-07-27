"use client";
import AppLayout from "@/components/AppLayout";
export default function Page() {
  return (
    <AppLayout title="Reproducción" subtitle="HENRIQUEZ CATTLE MANAGEMENT">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🤰</div>
        <h2 style={{ color: "#172033", fontWeight: 800, fontSize: 22, margin: 0 }}>Reproducción</h2>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Este módulo está en desarrollo. Estará disponible próximamente.</p>
      </div>
    </AppLayout>
  );
}
