"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

export default function ReportesPage() {
  const [stats, setStats] = useState(null);
  const [animales, setAnimales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [generando, setGenerando] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/ventas/stats").catch(() => null),
      api("/animales").catch(() => []),
      api("/ventas").catch(() => []),
      api("/gastos").catch(() => []),
    ]).then(([s, a, v, g]) => {
      setStats(s);
      setAnimales(Array.isArray(a) ? a : []);
      setVentas(Array.isArray(v) ? v : []);
      setGastos(Array.isArray(g) ? g : []);
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

      // Header
      // Header con gradiente verde
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 0, W, 36, "F");
      doc.setFillColor(45, 158, 63);
      doc.rect(0, 28, W, 4, "F");

      // Logo círculo
      doc.setFillColor(255, 255, 255, 0.2);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(22, 15, 8, "D");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("GSJ", 18, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Ganadero San Jeronimo", 34, 13);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 240, 200);
      doc.text(`Generado: ${fecha}`, 34, 22);

      doc.setTextColor(0, 0, 0);
      let y = 44;

      if (tipo === "animales") {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Inventario Animal", 14, y);
        y += 6;

        const activos = animales.filter(a => a.estado === "ACTIVO");
        const vendidos = animales.filter(a => a.estado === "VENDIDO");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total: ${animales.length}  |  Activos: ${activos.length}  |  Vendidos: ${vendidos.length}`, 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [["Arete/ID", "Nombre", "Raza", "Sexo", "Fierro", "Peso (kg)", "Estado"]],
          body: animales.map(a => [
            a.identificador,
            a.nombre || "—",
            a.raza || "—",
            a.sexo === "HEMBRA" ? "Hembra" : "Macho",
            a.fierro || "—",
            a.pesoActual ? `${a.pesoActual} kg` : "—",
            a.estado,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [26, 92, 42], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [240, 248, 240] },
        });
      }

      if (tipo === "ventas") {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Ventas", 14, y);
        y += 8;

        if (stats?.ventas) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(`Total histórico: C$ ${(stats.ventas.totalHistoricoNIO || 0).toLocaleString("es")}  |  Este mes: C$ ${(stats.ventas.totalMesNIO || 0).toLocaleString("es")}`, 14, y);
          y += 8;
        }

        autoTable(doc, {
          startY: y,
          head: [["Fecha", "Tipo", "Animal", "Peso", "Precio NIO", "Estado pago"]],
          body: ventas.map(v => [
            new Date(v.fecha || v.createdAt).toLocaleDateString("es"),
            v.tipoVenta === "EN_PIE" ? "En pie" : "Por peso",
            v.animal?.nombre || v.animal?.identificador || "—",
            v.pesoVenta ? `${v.pesoVenta} kg` : "—",
            `C$ ${(v.precioNIO || 0).toLocaleString("es")}`,
            v.estadoPago || "—",
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [123, 79, 18], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [255, 252, 235] },
        });
      }

      if (tipo === "gastos") {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Reporte de Gastos", 14, y);
        y += 8;

        const total = gastos.reduce((s, g) => s + (g.monto || 0), 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total de gastos: C$ ${total.toLocaleString("es")}`, 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [["Fecha", "Descripción", "Categoría", "Monto NIO"]],
          body: gastos.map(g => [
            new Date(g.fecha || g.createdAt).toLocaleDateString("es"),
            g.descripcion,
            g.categoria,
            `C$ ${(g.monto || 0).toLocaleString("es")}`,
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [68, 51, 122], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 240, 255] },
        });
      }

      // Footer y banda lateral decorativa
      const pageCount = doc.internal.getNumberOfPages();
      const H = doc.internal.pageSize.getHeight();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Banda lateral verde
        doc.setFillColor(26, 92, 42);
        doc.rect(0, 36, 3, H - 44, "F");
        // Footer
        doc.setFillColor(240, 248, 240);
        doc.rect(0, H - 14, W, 14, "F");
        doc.setFontSize(7);
        doc.setTextColor(80, 120, 80);
        doc.setFont("helvetica", "normal");
        doc.text(`Ganadero San Jeronimo  |  Pagina ${i} de ${pageCount}  |  ${fecha}`, 14, H - 5);
        doc.setTextColor(150, 200, 150);
        doc.text("ganaderosg.app", W - 35, H - 5);
      }

      doc.save(`${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      setError("Error generando PDF: " + e.message);
    } finally {
      setGenerando(null);
    }
  }

  const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)" };

  const REPORTES = [
    { tipo: "animales", icon: "🐄", titulo: "Inventario Animal", sub: `${animales.length} animales registrados`, grad: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" },
    { tipo: "ventas", icon: "💰", titulo: "Ventas", sub: `${ventas.length} ventas registradas`, grad: "linear-gradient(135deg,#7b4f12,#d69e2e)" },
    { tipo: "gastos", icon: "💸", titulo: "Control de Gastos", sub: `${gastos.length} gastos registrados`, grad: "linear-gradient(135deg,#44337a,#805ad5)" },
  ];

  return (
    <AppLayout title="Reportes PDF" subtitle="Exportar información">
      {error && <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>{error}</p>}

      {/* Banner */}
      <div className="rounded-3xl p-6 mb-8 flex items-center gap-5 shadow-2xl"
        style={{ background: "linear-gradient(135deg,rgba(20,60,100,0.8),rgba(10,40,80,0.8))", border: "1px solid rgba(49,130,206,0.3)", backdropFilter: "blur(20px)" }}>
        <div className="text-5xl">📊</div>
        <div>
          <h2 className="text-white font-black text-2xl">Reportes PDF</h2>
          <p className="text-white/60 text-sm mt-1">Descarga reportes completos de tu finca en formato PDF profesional.</p>
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
                {generando === r.tipo ? "⏳ Generando..." : "⬇️ Descargar PDF"}
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
              { label: "Ventas este mes", valor: `C$ ${(stats.ventas?.totalMesNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`, icon: "💰" },
              { label: "Histórico ventas", valor: `C$ ${(stats.ventas?.totalHistoricoNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`, icon: "📊" },
              { label: "Tipo de cambio", valor: `C$ ${stats.tipoCambio}`, icon: "💱" },
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
