"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const T = {
  bg: "#F8FAFC", white: "#ffffff", text: "#172033", textSec: "#475569",
  textLight: "#94A3B8", border: "#E2E8F0", green: "#16a34a", greenBg: "#F0FDF4",
  blue: "#2563EB", blueBg: "#EFF6FF", orange: "#EA580C", orangeBg: "#FFF7ED",
  purple: "#7C3AED", purpleBg: "#F5F3FF", red: "#DC2626",
};

function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return "C$ " + Number(v).toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

async function getNombreFinca() {
  try {
    const stats = await api("/dashboard");
    return stats?.nombreFinca || "Mi Finca";
  } catch {
    return "Mi Finca";
  }
}

function addHeader(doc, title, nombreFinca) {
  doc.setFillColor(23, 32, 51);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("HENRIQUEZ CATTLE MANAGEMENT", 14, 9);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text((nombreFinca || "Mi Finca").toUpperCase(), 14, 15);
  doc.setFontSize(8);
  doc.text(title, 14, 22);
  const fecha = new Date().toLocaleDateString("es-NI", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Generado: ${fecha}`, 196, 9, { align: "right" });
  doc.setTextColor(23, 32, 51);
}

function addFooter(doc, nombreFinca) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, 196, 288, { align: "right" });
    doc.text(`${(nombreFinca || "Mi Finca").toUpperCase()} — Confidencial`, 14, 288);
  }
}

async function urlToBase64(url) {
  try {
    const resp = await fetch(url, { mode: "cors" });
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getAnimalFoto(animal) {
  if (!animal.media || !Array.isArray(animal.media)) return null;
  const img = animal.media.find(m => m.tipo === "imagen" || m.url?.match(/\.(jpg|jpeg|png|webp)/i));
  return img?.url || null;
}

const REPORTES = [
  {
    id: "inventario",
    icono: "🐄",
    titulo: "Inventario del hato",
    descripcion: "Lista completa de todos los animales activos con foto, peso, raza y estado.",
    color: T.green,
    bg: T.greenBg,
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [animalesRes, nombreFinca] = await Promise.all([api("/animales"), getNombreFinca()]);
      const activos = (Array.isArray(animalesRes) ? animalesRes : (animalesRes.items || [])).filter(a => a.estado !== "ELIMINADO");

      // Pre-cargar fotos
      const fotos = {};
      await Promise.all(activos.map(async (a) => {
        const url = getAnimalFoto(a);
        if (url) {
          const b64 = await urlToBase64(url);
          if (b64) fotos[a.id] = b64;
        }
      }));

      const hasFotos = Object.keys(fotos).length > 0;
      const doc = new jsPDF();
      addHeader(doc, "Inventario del Hato", nombreFinca);

      const head = hasFotos
        ? [["Foto", "Arete", "Sexo", "Raza", "Peso (lb)", "Potrero", "Estado"]]
        : [["Arete", "Sexo", "Raza", "Peso (lb)", "Potrero", "Estado"]];

      const body = activos.map(a => {
        const row = hasFotos
          ? ["", a.identificador, a.sexo === "MACHO" ? "Macho" : "Hembra", a.raza || "—", a.pesoActual ? Number(a.pesoActual).toLocaleString("es-NI") : "—", a.potrero || "—", a.estadoComercial || a.estado]
          : [a.identificador, a.sexo === "MACHO" ? "Macho" : "Hembra", a.raza || "—", a.pesoActual ? Number(a.pesoActual).toLocaleString("es-NI") : "—", a.potrero || "—", a.estadoComercial || a.estado];
        return row;
      });

      const COL_FOTO = 18;
      const ROW_H = hasFotos ? 18 : 10;

      autoTable(doc, {
        startY: 28,
        head,
        body,
        styles: { fontSize: 7, cellPadding: 2, minCellHeight: hasFotos ? ROW_H : undefined },
        headStyles: { fillColor: [22, 163, 74] },
        columnStyles: hasFotos ? { 0: { cellWidth: COL_FOTO } } : {},
        didDrawCell(data) {
          if (!hasFotos) return;
          if (data.section === "body" && data.column.index === 0) {
            const animal = activos[data.row.index];
            const b64 = fotos[animal?.id];
            if (b64) {
              const pad = 1;
              doc.addImage(b64, "JPEG", data.cell.x + pad, data.cell.y + pad, COL_FOTO - pad * 2, data.cell.height - pad * 2);
            }
          }
        },
      });

      addFooter(doc, nombreFinca);
      doc.save("inventario-hato.pdf");
    },
  },
  {
    id: "finanzas",
    icono: "💰",
    titulo: "Resumen financiero",
    descripcion: "Ingresos, gastos, flujo neto y margen del mes actual.",
    color: T.blue,
    bg: T.blueBg,
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [fin, nombreFinca] = await Promise.all([api("/finanzas?periodo=mes"), getNombreFinca()]);
      const doc = new jsPDF();
      addHeader(doc, "Resumen Financiero — Este mes", nombreFinca);
      autoTable(doc, {
        startY: 28,
        head: [["Concepto", "Monto (C$)"]],
        body: [
          ["Ingresos totales", fmt(fin.ingresos)],
          ["Gastos totales", fmt(fin.gastos)],
          ["Flujo neto", fmt(fin.flujoNeto)],
          ["Margen de ganancia", `${Number(fin.margen || 0).toFixed(1)}%`],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      if (fin.porCategoria && Object.keys(fin.porCategoria).length > 0) {
        doc.setFontSize(11);
        doc.text("Gastos por categoría", 14, doc.lastAutoTable.finalY + 12);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 18,
          head: [["Categoría", "Total (C$)"]],
          body: Object.entries(fin.porCategoria).map(([k, v]) => [k, fmt(v)]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [37, 99, 235] },
        });
      }
      addFooter(doc, nombreFinca);
      doc.save("resumen-financiero.pdf");
    },
  },
  {
    id: "ventas",
    icono: "🤝",
    titulo: "Ventas del período",
    descripcion: "Historial de todas las ventas de animales registradas.",
    color: T.purple,
    bg: T.purpleBg,
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [ventasRes, nombreFinca] = await Promise.all([api("/ventas?limit=1000"), getNombreFinca()]);
      const ventas = Array.isArray(ventasRes) ? ventasRes : (ventasRes.items || ventasRes.ventas || []);
      const doc = new jsPDF({ orientation: "landscape" });
      addHeader(doc, "Reporte de Ventas", nombreFinca);
      autoTable(doc, {
        startY: 28,
        head: [["Fecha", "Animal", "Comprador", "Tipo", "Precio (C$)", "Estado pago", "Estado venta"]],
        body: ventas.map(v => [
          new Date(v.fecha).toLocaleDateString("es-NI"),
          v.animal?.nombre || v.animal?.identificador || "—",
          v.comprador || "—",
          v.tipoVenta,
          fmt(v.precioNIO),
          v.estadoPago,
          v.estadoVenta,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [124, 58, 237] },
      });
      addFooter(doc, nombreFinca);
      doc.save("reporte-ventas.pdf");
    },
  },
  {
    id: "gastos",
    icono: "📊",
    titulo: "Gastos por categoría",
    descripcion: "Todos los gastos registrados agrupados por categoría.",
    color: T.orange,
    bg: T.orangeBg,
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [gastosRes, nombreFinca] = await Promise.all([api("/gastos?limit=1000"), getNombreFinca()]);
      const gastos = Array.isArray(gastosRes) ? gastosRes : (gastosRes.gastos || gastosRes.items || []);
      const doc = new jsPDF();
      addHeader(doc, "Reporte de Gastos", nombreFinca);
      autoTable(doc, {
        startY: 28,
        head: [["Fecha", "Descripción", "Categoría", "Periodicidad", "Monto (C$)"]],
        body: gastos.map(g => [
          new Date(g.fecha).toLocaleDateString("es-NI"),
          g.descripcion,
          g.categoria,
          g.periodicidad,
          fmt(g.monto),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [234, 88, 12] },
      });
      addFooter(doc, nombreFinca);
      doc.save("reporte-gastos.pdf");
    },
  },
  {
    id: "en-venta",
    icono: "🏷️",
    titulo: "Animales en venta",
    descripcion: "Lista de animales con estado comercial EN_VENTA.",
    color: "#0369A1",
    bg: "#F0F9FF",
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [enVentaRes, nombreFinca] = await Promise.all([api("/animales?estadoComercial=EN_VENTA"), getNombreFinca()]);
      const animalesEnVenta = Array.isArray(enVentaRes) ? enVentaRes : (enVentaRes.items || []);

      // Pre-cargar fotos
      const fotos = {};
      await Promise.all(animalesEnVenta.map(async (a) => {
        const url = getAnimalFoto(a);
        if (url) {
          const b64 = await urlToBase64(url);
          if (b64) fotos[a.id] = b64;
        }
      }));

      const hasFotos = Object.keys(fotos).length > 0;
      const doc = new jsPDF();
      addHeader(doc, "Animales en Venta", nombreFinca);

      const head = hasFotos
        ? [["Foto", "Arete", "Sexo", "Raza", "Peso (lb)", "Precio venta (C$)", "Potrero"]]
        : [["Arete", "Sexo", "Raza", "Peso (lb)", "Precio venta (C$)", "Potrero"]];

      const body = animalesEnVenta.map(a => hasFotos
        ? ["", a.identificador, a.sexo === "MACHO" ? "Macho" : "Hembra", a.raza || "—", a.pesoActual ? Number(a.pesoActual).toLocaleString("es-NI") : "—", a.precioVenta ? fmt(a.precioVenta) : "—", a.potrero || "—"]
        : [a.identificador, a.sexo === "MACHO" ? "Macho" : "Hembra", a.raza || "—", a.pesoActual ? Number(a.pesoActual).toLocaleString("es-NI") : "—", a.precioVenta ? fmt(a.precioVenta) : "—", a.potrero || "—"]
      );

      const COL_FOTO = 18;

      autoTable(doc, {
        startY: 28,
        head,
        body,
        styles: { fontSize: 7, cellPadding: 2, minCellHeight: hasFotos ? 18 : undefined },
        headStyles: { fillColor: [3, 105, 161] },
        columnStyles: hasFotos ? { 0: { cellWidth: COL_FOTO } } : {},
        didDrawCell(data) {
          if (!hasFotos) return;
          if (data.section === "body" && data.column.index === 0) {
            const animal = animalesEnVenta[data.row.index];
            const b64 = fotos[animal?.id];
            if (b64) {
              const pad = 1;
              doc.addImage(b64, "JPEG", data.cell.x + pad, data.cell.y + pad, COL_FOTO - pad * 2, data.cell.height - pad * 2);
            }
          }
        },
      });

      addFooter(doc, nombreFinca);
      doc.save("animales-en-venta.pdf");
    },
  },
  {
    id: "reproduccion",
    icono: "🤰",
    titulo: "Reproducción",
    descripcion: "Estado reproductivo de todas las hembras del hato.",
    color: "#9333EA",
    bg: "#FAF5FF",
    async generar() {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const [repRes, nombreFinca] = await Promise.all([api("/reproduccion"), getNombreFinca()]);
      const animales = Array.isArray(repRes) ? repRes : (repRes.items || []);
      const doc = new jsPDF();
      addHeader(doc, "Reporte de Reproducción", nombreFinca);
      autoTable(doc, {
        startY: 28,
        head: [["Arete", "Nombre", "Raza", "Estado reproductivo", "Fecha parto probable", "Potrero"]],
        body: animales.map(a => [
          a.identificador,
          a.nombre || "—",
          a.raza || "—",
          a.estadoReproductivo || "Desconocido",
          a.fechaParto ? new Date(a.fechaParto).toLocaleDateString("es-NI") : "—",
          a.potrero || "—",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [147, 51, 234] },
      });
      addFooter(doc, nombreFinca);
      doc.save("reporte-reproduccion.pdf");
    },
  },
];

export default function ReportesPage() {
  const [generando, setGenerando] = useState(null);

  async function exportar(reporte) {
    setGenerando(reporte.id);
    try {
      await reporte.generar();
    } catch (e) {
      console.error(e);
      alert("Error al generar el reporte: " + e.message);
    } finally {
      setGenerando(null);
    }
  }

  return (
    <AppLayout title="Reportes" subtitle="Exporta datos de tu finca en PDF">
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: T.textSec, fontSize: 14 }}>
          Exporta reportes en PDF con los datos reales de tu finca.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {REPORTES.map(r => (
          <div key={r.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                {r.icono}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{r.titulo}</div>
              </div>
            </div>
            <div style={{ color: T.textSec, fontSize: 13, lineHeight: 1.5 }}>{r.descripcion}</div>
            <button
              onClick={() => exportar(r)}
              disabled={generando === r.id}
              style={{
                marginTop: "auto",
                padding: "10px 0",
                borderRadius: 8,
                border: `1px solid ${r.color}`,
                background: generando === r.id ? T.bg : r.bg,
                color: r.color,
                fontWeight: 700,
                fontSize: 14,
                cursor: generando === r.id ? "not-allowed" : "pointer",
                transition: "opacity .15s",
              }}>
              {generando === r.id ? "Generando PDF..." : "Exportar PDF"}
            </button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
