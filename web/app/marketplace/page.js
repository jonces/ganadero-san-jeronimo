import { Suspense } from "react";
import MarketplaceShell from "../../modules/marketplace-ganadero/components/MarketplaceShell.js";

export const metadata = {
  title:       "Marketplace Ganadero — GanaderoSG",
  description: "Compra y vende ganado, genética, insumos, equipos y servicios ganaderos en Colombia.",
};

export default function MarketplacePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb" }}>
      <Suspense fallback={
        <div style={{ textAlign: "center", paddingTop: 80, fontFamily: "system-ui,sans-serif" }}>
          <p style={{ fontSize: 36, margin: "0 0 10px" }}>🏪</p>
          <p style={{ color: "#6b7280", fontWeight: 600 }}>Cargando Marketplace Ganadero…</p>
        </div>
      }>
        <MarketplaceShell />
      </Suspense>
    </div>
  );
}
