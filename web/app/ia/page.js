"use client";
import AppLayout          from "../../components/AppLayout.js";
import { IALayout }       from "../../modules/ia-ganadero/index.js";

export default function CentroIAPage() {
  return (
    <AppLayout>
      {/* El módulo ocupa toda la altura disponible dentro del layout */}
      <div style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
        <IALayout />
      </div>
    </AppLayout>
  );
}
