"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const C = {
  primary: "#145A32", secondary: "#1E8449", text: "#2C3E50",
  textLight: "#7F8C8D", border: "#E2E8F0", white: "#FFFFFF", bg: "#F8F9FA",
};

const FOTO_HEADER = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=75";

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
      setGastos(Array.isArray(g) ? g : Array.isArray(g?.gastos) ? g.gastos : []);
      setFinca(f);
    }).catch(e => setError(e.message));
  }, []);

  // ── Dibujar QR simple (patrón decorativo) ──
  function drawQR(doc, x, y, size) {
    const cell = size / 21;
    const pattern = [
      [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
      [1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1,1],
      [0,1,0,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0],
      [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1],
      [1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,0,0,0],
      [1,0,0,0,0,0,1,0,1,1,1,0,1,0,1,0,1,1,1],
    ];
    doc.setFillColor(255, 255, 255);
    doc.rect(x - 1, y - 1, size + 2, size + 2, "F");
    pattern.forEach((row, ri) =>
      row.forEach((cell_val, ci) => {
        if (cell_val) {
          doc.setFillColor(20, 90, 50);
          doc.rect(x + ci * cell, y + ri * cell, cell, cell, "F");
        }
      })
    );
  }

  async function cargarImagenBase64(url) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  async function generarPDF(tipo) {
    setGenerando(tipo);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const fecha = new Date().toLocaleDateString("es", { dateStyle: "long" });
      const fechaCorta = new Date().toISOString().slice(0, 10);

      const fincaNombre = finca?.nombre || "Mi Finca";
      const fincaUbicacion = finca?.ubicacion || "Nicaragua";
      const adminNombre = finca?.usuarios?.[0]?.nombre || "";

      // Paleta por tipo
      const PALETA = {
        animales: { dark: [20, 90, 50], mid: [30, 132, 73], light: [235, 245, 235] },
        ventas:   { dark: [21, 101, 192], mid: [30, 136, 229], light: [227, 242, 253] },
        gastos:   { dark: [106, 27, 154], mid: [142, 36, 170], light: [243, 229, 245] },
      };
      const p = PALETA[tipo];

      // ── HEADER con foto ──
      const imgB64 = await cargarImagenBase64(FOTO_HEADER);
      if (imgB64) {
        doc.addImage(imgB64, "JPEG", 0, 0, W, 42);
      } else {
        doc.setFillColor(...p.dark);
        doc.rect(0, 0, W, 42, "F");
      }
      // Overlay oscuro sobre la foto
      doc.setFillColor(0, 0, 0);
      doc.setGState && doc.setGState(doc.GState({ opacity: 0.55 }));
      doc.rect(0, 0, W, 42, "F");
      doc.setGState && doc.setGState(doc.GState({ opacity: 1 }));

      // Banda de color debajo del header
      doc.setFillColor(...p.dark);
      doc.rect(0, 42, W, 14, "F");

      // Logo circular
      doc.setFillColor(255, 255, 255);
      doc.circle(22, 21, 12, "F");
      doc.setFillColor(...p.mid);
      doc.circle(22, 21, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const inicial = fincaNombre.charAt(0).toUpperCase();
      doc.text(inicial, 22, 25, { align: "center" });

      // Nombre de la finca
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(fincaNombre, 40, 16);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(210, 240, 210);
      if (fincaUbicacion) doc.text("Ubicación: " + fincaUbicacion, 40, 24);
      if (adminNombre) doc.text("Administrador: " + adminNombre, 40, 30);

      // Fecha arriba derecha
      doc.setFontSize(8);
      doc.setTextColor(200, 230, 200);
      doc.text("Generado: " + fecha, W - 10, 10, { align: "right" });

      // QR (esquina derecha del header)
      drawQR(doc, W - 32, 3, 28);

      // Banda verde: título del reporte
      const titulos = {
        animales: "REPORTE DE INVENTARIO ANIMAL",
        ventas:   "REPORTE DE VENTAS",
        gastos:   "REPORTE DE CONTROL DE GASTOS",
      };
      doc.setFillColor(...p.dark);
      doc.rect(0, 42, W, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(titulos[tipo], W / 2, 51, { align: "center" });

      // ── TARJETAS RESUMEN ──
      let y = 64;
      function drawCards(cards) {
        const n = cards.length;
        const cardW = (W - 16 - (n - 1) * 3) / n;
        cards.forEach((c, i) => {
          const cx = 8 + i * (cardW + 3);
          doc.setFillColor(...c.bg);
          doc.roundedRect(cx, y, cardW, 18, 3, 3, "F");
          // Borde inferior de acento
          doc.setFillColor(...c.accent);
          doc.rect(cx, y + 15, cardW, 3, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(c.valor.length > 8 ? 7 : 13);
          doc.setFont("helvetica", "bold");
          doc.text(c.valor, cx + cardW / 2, y + 9, { align: "center" });
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(220, 240, 220);
          doc.text(c.label, cx + cardW / 2, y + 14, { align: "center" });
        });
        y += 26;
      }

      if (tipo === "animales") {
        const activos = animales.filter(a => a.estado === "ACTIVO").length;
        const hembras = animales.filter(a => a.sexo === "HEMBRA").length;
        const machos = animales.filter(a => a.sexo === "MACHO").length;
        const prenadas = animales.filter(a => a.estadoReproductivo === "PREÑADA").length;
        drawCards([
          { label: "Total", valor: String(animales.length), bg: [20, 90, 50], accent: [30, 180, 80] },
          { label: "Activos", valor: String(activos), bg: [25, 110, 60], accent: [40, 200, 90] },
          { label: "Hembras", valor: String(hembras), bg: [150, 50, 130], accent: [180, 70, 160] },
          { label: "Machos", valor: String(machos), bg: [25, 80, 160], accent: [40, 110, 200] },
          { label: "Preñadas", valor: String(prenadas), bg: [100, 40, 120], accent: [140, 60, 160] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 8, right: 8 },
          head: [["#", "ID/Arete", "Nombre", "Raza", "Sexo", "Fierro", "Peso", "Estado", "Rep."]],
          body: animales.map((a, idx) => [
            idx + 1,
            a.identificador,
            a.nombre || "—",
            a.raza || "—",
            a.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho",
            a.fierro || "—",
            a.pesoActual ? `${a.pesoActual} kg` : "—",
            a.estado,
            a.estadoReproductivo ? a.estadoReproductivo.replace("PREÑADA", "Preñada").replace("VACIA", "Vacía").replace("LACTANCIA", "Lact.") : "—",
          ]),
          styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            textColor: [44, 62, 80],
            font: "helvetica",
          },
          headStyles: {
            fillColor: p.dark,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            7: { fontStyle: "bold" },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 7) {
              const val = data.cell.raw;
              if (val === "ACTIVO") data.cell.styles.textColor = [20, 90, 50];
              if (val === "MUERTO") data.cell.styles.textColor = [231, 76, 60];
              if (val === "VENDIDO") data.cell.styles.textColor = [21, 101, 192];
            }
          },
        });
      }

      if (tipo === "ventas") {
        const totalNIO = ventas.reduce((s, v) => s + (v.precioNIO || 0), 0);
        const totalUSD = ventas.reduce((s, v) => s + (v.precioUSD || 0), 0);
        const pagadas = ventas.filter(v => v.estadoPago === "PAGADO").length;
        const pendientes = ventas.filter(v => v.estadoPago === "PENDIENTE").length;
        drawCards([
          { label: "Total ventas", valor: String(ventas.length), bg: [21, 101, 192], accent: [30, 136, 229] },
          { label: "Ingresos C$", valor: "C$ " + totalNIO.toLocaleString("es", { maximumFractionDigits: 0 }), bg: [25, 120, 60], accent: [40, 180, 90] },
          { label: "Ingresos USD", valor: "$ " + totalUSD.toLocaleString("es", { maximumFractionDigits: 0 }), bg: [16, 80, 150], accent: [25, 120, 220] },
          { label: "Pagadas", valor: String(pagadas), bg: [25, 130, 70], accent: [40, 200, 100] },
          { label: "Pendientes", valor: String(pendientes), bg: [180, 50, 50], accent: [220, 70, 70] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 8, right: 8 },
          head: [["#", "Fecha", "Tipo", "Animal", "Peso", "Precio C$", "Precio USD", "Estado"]],
          body: ventas.map((v, idx) => [
            idx + 1,
            new Date(v.fecha || v.createdAt).toLocaleDateString("es"),
            v.tipoVenta === "EN_PIE" ? "En pie" : "Por peso",
            v.animal?.nombre || v.animal?.identificador || "—",
            v.pesoVenta ? `${v.pesoVenta} kg` : "—",
            "C$ " + (v.precioNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 }),
            "$ " + (v.precioUSD || 0).toLocaleString("es", { maximumFractionDigits: 2 }),
            v.estadoPago || "—",
          ]),
          styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [44, 62, 80] },
          headStyles: { fillColor: p.dark, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            5: { fontStyle: "bold", textColor: [20, 90, 50] },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 7) {
              const val = data.cell.raw;
              if (val === "PAGADO") data.cell.styles.textColor = [20, 90, 50];
              if (val === "PENDIENTE") data.cell.styles.textColor = [231, 76, 60];
            }
          },
        });
        // Totales
        const finalY = doc.lastAutoTable.finalY + 3;
        doc.setFillColor(...p.dark);
        doc.roundedRect(8, finalY, W - 16, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL: C$ " + totalNIO.toLocaleString("es", { maximumFractionDigits: 0 }) + "   |   USD $ " + totalUSD.toLocaleString("es", { maximumFractionDigits: 2 }), W / 2, finalY + 6.5, { align: "center" });
      }

      if (tipo === "gastos") {
        const total = gastos.reduce((s, g) => s + (g.monto || 0), 0);
        const categorias = [...new Set(gastos.map(g => g.categoria).filter(Boolean))];
        const esteMes = gastos.filter(g => {
          const d = new Date(g.fecha || g.createdAt);
          const n = new Date();
          return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
        });
        const totalMes = esteMes.reduce((s, g) => s + (g.monto || 0), 0);
        drawCards([
          { label: "Registros", valor: String(gastos.length), bg: [106, 27, 154], accent: [142, 36, 170] },
          { label: "Total C$", valor: "C$ " + total.toLocaleString("es", { maximumFractionDigits: 0 }), bg: [120, 30, 80], accent: [160, 50, 110] },
          { label: "Este mes C$", valor: "C$ " + totalMes.toLocaleString("es", { maximumFractionDigits: 0 }), bg: [80, 20, 120], accent: [120, 40, 160] },
          { label: "Categorías", valor: String(categorias.length), bg: [40, 70, 150], accent: [60, 100, 200] },
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: 8, right: 8 },
          head: [["#", "Fecha", "Descripción", "Categoría", "Monto C$"]],
          body: gastos.map((g, idx) => [
            idx + 1,
            new Date(g.fecha || g.createdAt).toLocaleDateString("es"),
            g.descripcion,
            g.categoria || "—",
            "C$ " + (g.monto || 0).toLocaleString("es", { maximumFractionDigits: 0 }),
          ]),
          styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [44, 62, 80] },
          headStyles: { fillColor: p.dark, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            4: { fontStyle: "bold", textColor: [106, 27, 154] },
          },
        });
        const finalY = doc.lastAutoTable.finalY + 3;
        doc.setFillColor(...p.dark);
        doc.roundedRect(8, finalY, W - 16, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL GASTOS: C$ " + total.toLocaleString("es", { maximumFractionDigits: 0 }), W / 2, finalY + 6.5, { align: "center" });
      }

      // ── FOOTER EN CADA PÁGINA ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Línea separadora
        doc.setFillColor(...p.dark);
        doc.rect(0, H - 14, W, 14, "F");
        // Banda de acento
        doc.setFillColor(...p.mid);
        doc.rect(0, H - 14, 4, 14, "F");

        doc.setFontSize(7);
        doc.setTextColor(200, 235, 210);
        doc.setFont("helvetica", "normal");
        doc.text(fincaNombre + "  ·  " + fincaUbicacion, 10, H - 6);
        doc.text("Página " + i + " de " + pageCount, W / 2, H - 6, { align: "center" });
        doc.text(fechaCorta, W - 10, H - 6, { align: "right" });
        doc.setFontSize(6);
        doc.setTextColor(140, 200, 160);
        doc.text("Sistema Ganadero · Henriquez Cattle Management · ganaderosg.app", W / 2, H - 2, { align: "center" });
      }

      doc.save(`${tipo}-${fincaNombre.replace(/\s+/g, "-").toLowerCase()}-${fechaCorta}.pdf`);
    } catch (e) {
      setError("Error generando PDF: " + e.message);
      console.error(e);
    } finally {
      setGenerando(null);
    }
  }

  const cardStyle = { background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

  const REPORTES = [
    {
      tipo: "animales", emoji: "🐄",
      titulo: "Inventario Animal",
      sub: `${animales.length} animales registrados`,
      grad: `linear-gradient(135deg,${C.primary},${C.secondary})`,
      lightColor: "#EBF5EB",
      items: [
        `Total: ${animales.length} animales`,
        `Activos: ${animales.filter(a => a.estado === "ACTIVO").length}`,
        `Hembras: ${animales.filter(a => a.sexo === "HEMBRA").length}`,
        `Preñadas: ${animales.filter(a => a.estadoReproductivo === "PREÑADA").length}`,
      ],
    },
    {
      tipo: "ventas", emoji: "💰",
      titulo: "Ventas",
      sub: `${ventas.length} ventas registradas`,
      grad: "linear-gradient(135deg,#1565C0,#1E88E5)",
      lightColor: "#E3F2FD",
      items: [
        `Ventas: ${ventas.length}`,
        `Pagadas: ${ventas.filter(v => v.estadoPago === "PAGADO").length}`,
        `Total C$: ${ventas.reduce((s,v)=>s+(v.precioNIO||0),0).toLocaleString("es",{maximumFractionDigits:0})}`,
        `Total USD: ${ventas.reduce((s,v)=>s+(v.precioUSD||0),0).toLocaleString("es",{maximumFractionDigits:2})}`,
      ],
    },
    {
      tipo: "gastos", emoji: "💸",
      titulo: "Control de Gastos",
      sub: `${gastos.length} gastos registrados`,
      grad: "linear-gradient(135deg,#6A1B9A,#8E24AA)",
      lightColor: "#F3E5F5",
      items: [
        `Registros: ${gastos.length}`,
        `Categorías: ${[...new Set(gastos.map(g=>g.categoria).filter(Boolean))].length}`,
        `Total C$: ${gastos.reduce((s,g)=>s+(g.monto||0),0).toLocaleString("es",{maximumFractionDigits:0})}`,
      ],
    },
  ];

  return (
    <AppLayout title="Reportes PDF" subtitle="Exportar información">

      {error && (
        <div className="rounded-xl p-3 mb-4 text-sm font-medium" style={{ background: "#FDEDEC", border: "1px solid #FADBD8", color: "#C0392B" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Banner */}
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-5 shadow-md"
        style={{ background: `linear-gradient(135deg,${C.primary},${C.secondary})` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
          style={{ background: "rgba(255,255,255,0.2)" }}>
          📊
        </div>
        <div>
          <h2 className="text-white font-black text-2xl" style={{ fontFamily: "var(--font-poppins)" }}>Reportes Profesionales</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
            {finca ? `${finca.nombre}${finca.ubicacion ? " · " + finca.ubicacion : ""}` : "Descarga reportes completos en formato PDF"}
          </p>
        </div>
        <div className="ml-auto hidden md:block text-right">
          <p className="text-white font-black text-sm" style={{ fontFamily: "var(--font-poppins)" }}>3 reportes</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>disponibles</p>
        </div>
      </div>

      {/* Cards de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {REPORTES.map((r) => (
          <div key={r.tipo} className="rounded-2xl overflow-hidden shadow" style={cardStyle}>
            {/* Header de color */}
            <div className="h-1.5" style={{ background: r.grad }} />

            <div className="p-6">
              {/* Icono */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                style={{ background: r.lightColor }}>
                {r.emoji}
              </div>

              <h3 className="font-black text-lg mb-1" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>{r.titulo}</h3>
              <p className="text-sm mb-4" style={{ color: C.textLight }}>{r.sub}</p>

              {/* Bullet items */}
              <ul className="space-y-1.5 mb-5">
                {r.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: C.textLight }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.grad.split(",")[1] || C.primary }} />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => generarPDF(r.tipo)}
                disabled={generando === r.tipo}
                className="w-full text-white font-bold py-3 rounded-xl shadow transition-all hover:opacity-90 hover:shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: r.grad, fontFamily: "var(--font-inter)" }}>
                {generando === r.tipo
                  ? <><span className="animate-spin">⏳</span> Generando...</>
                  : <><span>⬇</span> Descargar PDF</>
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen financiero */}
      {stats && (
        <div className="rounded-2xl p-6 shadow" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-base" style={{ color: C.text, fontFamily: "var(--font-poppins)" }}>Resumen Financiero</h3>
            <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#EBF5EB", color: C.primary }}>Este mes</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total animales", valor: stats.animales?.total || 0, emoji: "🐄", color: C.primary, bg: "#EBF5EB" },
              { label: "Ventas del mes", valor: "C$ " + (stats.ventas?.totalMesNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 }), emoji: "💰", color: "#1565C0", bg: "#E3F2FD" },
              { label: "Histórico ventas", valor: "C$ " + (stats.ventas?.totalHistoricoNIO || 0).toLocaleString("es", { maximumFractionDigits: 0 }), emoji: "📊", color: "#6A1B9A", bg: "#F3E5F5" },
              { label: "Tipo de cambio", valor: "C$ " + stats.tipoCambio, emoji: "💱", color: "#E65100", bg: "#FBE9E7" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${C.border}` }}>
                <div className="text-2xl mb-2">{s.emoji}</div>
                <p className="font-black text-lg leading-tight" style={{ color: s.color, fontFamily: "var(--font-poppins)" }}>{s.valor}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: C.textLight }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </AppLayout>
  );
}
