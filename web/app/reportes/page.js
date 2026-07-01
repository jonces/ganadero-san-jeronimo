"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

export default function ReportesPage() {
  const [stats, setStats] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [finca, setFinca] = useState(null);
  const [generando, setGenerando] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/ventas/stats").catch(() => null),
      api("/animales").catch(() => []),
      api("/ventas").catch(() => []),
      api("/gastos").catch(() => ({ gastos: [] })),
      api("/fincas/mi-finca").catch(() => null),
    ]).then(([s, a, v, g, f]) => {
      setStats(s);
      setAnimales(Array.isArray(a) ? a : []);
      setVentas(Array.isArray(v) ? v : []);
      const listaGastos = Array.isArray(g) ? g : Array.isArray(g?.gastos) ? g.gastos : [];
      setGastos(listaGastos);
      setFinca(f);
    }).catch(e => setError(e.message));
  }, []);

  async function generarPDF(tipo) {
    setGenerando(tipo);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const fecha = new Date().toLocaleDateString("es", { dateStyle: "long" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const fincaNombre = finca?.nombre || "Mi Finca";
      const fincaUbicacion = finca?.ubicacion || "";
      const adminNombre = finca?.usuarios?.[0]?.nombre || "";

      // Paleta de colores por tipo
      const paleta = {
        animales: { dark: [15, 74, 30], mid: [34, 139, 60], light: [220, 245, 225], accent: [52, 168, 83] },
        ventas:   { dark: [90, 50, 10], mid: [180, 100, 20], light: [255, 248, 225], accent: [210, 140, 40] },
        gastos:   { dark: [50, 30, 100], mid: [110, 70, 200], light: [240, 232, 255], accent: [140, 90, 230] },
      };
      const p = paleta[tipo];

      // HEADER PRINCIPAL
      doc.setFillColor(...p.dark);
      doc.rect(0, 0, W, 42, "F");
      doc.setFillColor(...p.mid);
      doc.rect(0, 38, W, 6, "F");
      doc.setFillColor(...p.accent);
      doc.rect(0, 44, 5, H - 52, "F");

      // Circulo logo
      doc.setFillColor(255, 255, 255);
      doc.circle(22, 19, 11, "F");
      doc.setFillColor(...p.mid);
      doc.circle(22, 19, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const inicial = fincaNombre.charAt(0).toUpperCase();
      doc.text(inicial, 22, 22.5, { align: "center" });

      // Nombre de la finca
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.text(fincaNombre, 38, 16);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(210, 235, 210);
      let infoY = 23;
      if (fincaUbicacion) {
        doc.text("Ubicacion: " + fincaUbicacion, 38, infoY);
        infoY += 6;
      }
      if (adminNombre) {
        doc.text("Administrador: " + adminNombre, 38, infoY);
      }

      doc.setFontSize(7);
      doc.setTextColor(180, 220, 180);
      doc.text("Generado: " + fecha, W - 10, 10, { align: "right" });

      // TITULO DEL REPORTE
      const titulos = {
        animales: "REPORTE DE INVENTARIO ANIMAL",
        ventas:   "REPORTE DE VENTAS",
        gastos:   "REPORTE DE CONTROL DE GASTOS",
      };
      let y = 54;

      doc.setFillColor(...p.light);
      doc.roundedRect(8, y - 6, W - 16, 12, 2, 2, "F");
      doc.setTextColor(...p.dark);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(titulos[tipo], W / 2, y + 1, { align: "center" });
      y += 14;

      // TARJETAS RESUMEN
      function drawCards(cards) {
        const cardW = (W - 20) / 4 - 2;
        cards.forEach((c, i) => {
          const cx = 10 + i * (cardW + 2.5);
          doc.setFillColor(...c.color);
          doc.roundedRect(cx, y, cardW, 16, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(c.valor.length > 8 ? 7.5 : 13);
          doc.setFont("helvetica", "bold");
          doc.text(c.valor, cx + cardW / 2, y + 8, { align: "center" });
          doc.setFontSize(6);
          doc.setFont("helvetica", "normal");
          doc.text(c.label, cx + cardW / 2, y + 13.5, { align: "center" });
        });
        y += 22;
      }

      if (tipo === "animales") {
        const activos = animales.filter(a => a.estado === "ACTIVO");
        const hembras = animales.filter(a => a.sexo === "HEMBRA");
        const machos = animales.filter(a => a.sexo === "MACHO");
        drawCards([
          { label: "Total", valor: String(animales.length), color: p.dark },
          { label: "Activos", valor: String(activos.length), color: [20, 100, 40] },
          { label: "Hembras", valor: String(hembras.length), color: [160, 60, 140] },
          { label: "Machos", valor: String(machos.length), color: [30, 80, 180] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 10, right: 10 },
          head: [["Arete/ID", "Nombre", "Raza", "Sexo", "Fierro", "Peso (kg)", "Estado"]],
          body: animales.map(a => [
            a.identificador,
            a.nombre || "-",
            a.raza || "-",
            a.sexo === "HEMBRA" ? "Hembra" : "Macho",
            a.fierro || "-",
            a.pesoActual ? (a.pesoActual + " kg") : "-",
            a.estado,
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: p.dark, textColor: [255,255,255], fontStyle: "bold", fontSize: 8.5 },
          alternateRowStyles: { fillColor: p.light },
          columnStyles: { 6: { fontStyle: "bold" } },
        });
      }

      if (tipo === "ventas") {
        const totalNIO = ventas.reduce((s, v) => s + (v.precioNIO || 0), 0);
        const pagadas = ventas.filter(v => v.estadoPago === "PAGADO").length;
        const pendientes = ventas.filter(v => v.estadoPago === "PENDIENTE").length;
        drawCards([
          { label: "Total ventas", valor: String(ventas.length), color: p.dark },
          { label: "Ingresos NIO", valor: "C$ " + totalNIO.toLocaleString("es", { maximumFractionDigits: 0 }), color: [20, 100, 40] },
          { label: "Pagadas", valor: String(pagadas), color: [140, 80, 10] },
          { label: "Pendientes", valor: String(pendientes), color: [180, 40, 40] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 10, right: 10 },
          head: [["Fecha", "Tipo", "Animal", "Peso", "Precio NIO", "Estado pago"]],
          body: ventas.map(v => [
            new Date(v.fecha || v.createdAt).toLocaleDateString("es"),
            v.tipoVenta === "EN_PIE" ? "En pie" : "Por peso",
            v.animal?.nombre || v.animal?.identificador || "-",
            v.pesoVenta ? (v.pesoVenta + " kg") : "-",
            "C$ " + (v.precioNIO || 0).toLocaleString("es"),
            v.estadoPago || "-",
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: p.dark, textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: p.light },
          columnStyles: { 4: { fontStyle: "bold" } },
        });
      }

      if (tipo === "gastos") {
        const total = gastos.reduce((s, g) => s + (g.monto || 0), 0);
        const categorias = [...new Set(gastos.map(g => g.categoria).filter(Boolean))];
        const now = new Date();
        const esteMes = gastos.filter(g => {
          const d = new Date(g.fecha || g.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const totalMes = esteMes.reduce((s, g) => s + (g.monto || 0), 0);
        drawCards([
          { label: "Total gastos", valor: String(gastos.length), color: p.dark },
          { label: "Total NIO", valor: "C$ " + total.toLocaleString("es", { maximumFractionDigits: 0 }), color: [80, 40, 140] },
          { label: "Este mes", valor: "C$ " + totalMes.toLocaleString("es", { maximumFractionDigits: 0 }), color: [140, 40, 100] },
          { label: "Categorias", valor: String(categorias.length), color: [40, 80, 160] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 10, right: 10 },
          head: [["Fecha", "Descripcion", "Categoria", "Monto NIO"]],
          body: gastos.map(g => [
            new Date(g.fecha || g.createdAt).toLocaleDateString("es"),
            g.descripcion,
            g.categoria || "-",
            "C$ " + (g.monto || 0).toLocaleString("es"),
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: p.dark, textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: p.light },
          columnStyles: { 3: { fontStyle: "bold" } },
        });
      }

      // FOOTER EN CADA PAGINA
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        if (i > 1) {
          doc.setFillColor(...p.accent);
          doc.rect(0, 0, 5, H, "F");
        }
        doc.setFillColor(...p.dark);
        doc.rect(0, H - 12, W, 12, "F");
        doc.setFontSize(7);
        doc.setTextColor(200, 230, 200);
        doc.setFont("helvetica", "normal");
        doc.text(fincaNombre + "  |  Pagina " + i + " de " + pageCount + "  |  " + fecha, 10, H - 4);
        if (adminNombre) {
          doc.text("Adm: " + adminNombre, W - 10, H - 4, { align: "right" });
        }
      }

      doc.save(tipo + "-" + fincaNombre.replace(/\s+/g, "-").toLowerCase() + "-" + new Date().toISOString().slice(0, 10) + ".pdf");
    } catch (e) {
      setError("Error generando PDF: " + e.message);
    } finally {
      setGenerando(null);
    }
  }

  const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)" };

  const REPORTES = [
    { tipo: "animales", icon: "🐄", titulo: "Inventario Animal", sub: animales.length + " animales registrados", grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
    { tipo: "ventas", icon: "💰", titulo: "Ventas", sub: ventas.length + " ventas registradas", grad: "linear-gradient(135deg,#7b4f12,#d69e2e)" },
    { tipo: "gastos", icon: "💸", titulo: "Control de Gastos", sub: gastos.length + " gastos registrados", grad: "linear-gradient(135deg,#44337a,#805ad5)" },
  ];

  return (
    <AppLayout title="Reportes PDF" subtitle="Exportar informacion">
      {error && <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</p>}

      {/* Banner */}
      <div className="rounded-3xl p-6 mb-8 flex items-center gap-5 shadow-2xl"
        style={{ background: "linear-gradient(135deg,rgba(20,60,100,0.8),rgba(10,40,80,0.8))", border: "1px solid rgba(49,130,206,0.3)", backdropFilter: "blur(20px)" }}>
        <div className="text-5xl">📊</div>
        <div>
          <h2 className="text-white font-black text-2xl">Reportes PDF</h2>
          <p className="text-white/60 text-sm mt-1">
            {finca ? (finca.nombre + (finca.ubicacion ? " · " + finca.ubicacion : "")) : "Descarga reportes completos de tu finca en formato PDF profesional."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {REPORTES.map((r) => (
          <div key={r.tipo} className="rounded-2xl overflow-hidden shadow-2xl" style={glass}>
            <div className="h-2" style={{ background: r.grad }} />
            <div className="p-6">
              <div className="text-5xl mb-4">{r.icon}</div>
              <h3 className="text-white font-black text-xl">{r.titulo}</h3>
              <p className="text-white/50 text-sm mt-1 mb-6">{r.sub}</p>
              <button
                onClick={() => generarPDF(r.tipo)}
                disabled={generando === r.tipo}
                className="w-full text-white font-bold py-3 rounded-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                style={{ background: r.grad, border: "1px solid rgba(255,255,255,0.2)" }}>
                {generando === r.tipo ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen financiero */}
      {stats && (
        <div className="rounded-2xl p-6 shadow-2xl" style={glass}>
          <h3 className="text-white font-black text-lg mb-4">📈 Resumen Financiero</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total animales", valor: stats.animales?.total || 0, icon: "🐄" },
              { label: "Ventas este mes", valor: "C$ " + (stats.ventas?.totalMesNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 }), icon: "💰" },
              { label: "Historico ventas", valor: "C$ " + (stats.ventas?.totalHistoricoNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 }), icon: "📊" },
              { label: "Tipo de cambio", valor: "C$ " + stats.tipoCambio, icon: "💱" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-white font-black text-lg">{s.valor}</p>
                <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
