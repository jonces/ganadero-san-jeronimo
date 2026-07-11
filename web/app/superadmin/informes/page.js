"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

export default function SuperAdminInformesPage() {
  const [fincas, setFincas] = useState([]);
  const [generando, setGenerando] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api("/superadmin/fincas").then(setFincas).catch(e => setError(e.message));
  }, []);

  async function generarInforme(finca) {
    setGenerando(finca.id);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const data = await api(`/superadmin/fincas/${finca.id}`);

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const fecha = new Date().toLocaleDateString("es", { dateStyle: "long" });
      const adminNombre = finca.usuarios?.[0]?.nombre || "—";
      const adminEmail = finca.usuarios?.[0]?.email || "—";

      function drawHeader(titulo, cDark, cMid, cAccent) {
        doc.setFillColor(...cDark);
        doc.rect(0, 0, W, 44, "F");
        doc.setFillColor(...cMid);
        doc.rect(0, 40, W, 5, "F");
        doc.setFillColor(...cAccent);
        doc.rect(0, 45, 5, H - 53, "F");

        const inicial = (data.finca.nombre || "F").charAt(0).toUpperCase();
        doc.setFillColor(255, 255, 255);
        doc.circle(20, 20, 10, "F");
        doc.setFillColor(...cMid);
        doc.circle(20, 20, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(inicial, 20, 24, { align: "center" });

        const fnLen = (data.finca.nombre||"").length;
        doc.setFontSize(fnLen > 22 ? 11 : fnLen > 16 ? 13 : 15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text((data.finca.nombre||"").toUpperCase(), 36, 14, {maxWidth: W - 80});
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(210, 235, 210);
        if (data.finca.ubicacion) doc.text("Ubicacion: " + data.finca.ubicacion, 36, 21);
        doc.text("Administrador: " + adminNombre + "  |  " + adminEmail, 36, 27);
        doc.setFontSize(7);
        doc.setTextColor(180, 220, 180);
        doc.text("Generado: " + fecha, W - 10, 10, { align: "right" });

        doc.setFillColor(220, 245, 225);
        doc.roundedRect(8, 52, W - 16, 11, 2, 2, "F");
        doc.setTextColor(...cDark);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(titulo, W / 2, 59, { align: "center" });
      }

      function drawFooters(cDark, pageCount) {
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          if (i > 1) { doc.setFillColor(...cDark); doc.rect(0, 0, 5, H, "F"); }
          doc.setFillColor(...cDark);
          doc.rect(0, H - 12, W, 12, "F");
          doc.setFontSize(7);
          doc.setTextColor(200, 230, 200);
          doc.setFont("helvetica", "normal");
          doc.text(data.finca.nombre + "  |  Pagina " + i + " de " + pageCount + "  |  " + fecha, 10, H - 4);
          doc.text("Ganadero SG", W - 10, H - 4, { align: "right" });
        }
      }

      const green = { dark: [15, 74, 30], mid: [34, 139, 60], accent: [52, 168, 83] };

      // ── PÁGINA 1: RESUMEN GENERAL ─────────────────────────────
      drawHeader("INFORME GENERAL DE FINCA", green.dark, green.mid, green.accent);

      // Tarjetas de resumen
      const cards = [
        { label: "Animales", valor: String(data.animales.length), color: [15, 74, 30] },
        { label: "Ventas", valor: String(data.ventas.length), color: [90, 50, 10] },
        { label: "Gastos", valor: String(data.gastos.length), color: [50, 30, 100] },
        { label: "Equipo", valor: String(data.equipo.length), color: [20, 60, 120] },
        { label: "Incidentes", valor: String(data.incidentes.length), color: [140, 20, 20] },
      ];
      const cw = (W - 20) / 5 - 1.5;
      cards.forEach((c, i) => {
        const cx = 10 + i * (cw + 2);
        doc.setFillColor(...c.color);
        doc.roundedRect(cx, 68, cw, 16, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(c.valor, cx + cw / 2, 76, { align: "center" });
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "normal");
        doc.text(c.label, cx + cw / 2, 81, { align: "center" });
      });

      // Datos de registro
      let y = 92;
      doc.setFillColor(245, 255, 248);
      doc.roundedRect(8, y, W - 16, 38, 2, 2, "F");
      doc.setDrawColor(52, 168, 83);
      doc.setLineWidth(0.5);
      doc.roundedRect(8, y, W - 16, 38, 2, 2, "D");
      doc.setTextColor(15, 74, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DE REGISTRO", 14, y + 8);
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      const regRows = [
        ["Nombre de finca:", data.finca.nombre],
        ["Ubicacion:", data.finca.ubicacion || "—"],
        ["Administrador:", adminNombre],
        ["Correo:", adminEmail],
        ["Plan:", data.finca.plan || "GRATUITO"],
        ["Registro:", new Date(data.finca.createdAt).toLocaleDateString("es", { dateStyle: "long" })],
        ["Estado:", data.finca.activa ? "ACTIVA" : "SUSPENDIDA"],
      ];
      regRows.forEach(([label, val], i) => {
        const col = i < 4 ? 0 : 1;
        const row = col === 0 ? i : i - 4;
        const bx = col === 0 ? 14 : W / 2 + 4;
        const by = y + 16 + row * 7;
        doc.setFont("helvetica", "bold");
        doc.text(label, bx, by);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), bx + 34, by);
      });
      y += 44;

      // Resumen financiero
      const totalVentasNIO = data.ventas.reduce((s, v) => s + (v.precioNIO || 0), 0);
      const totalGastos = data.gastos.reduce((s, g) => s + (g.monto || 0), 0);
      const activos = data.animales.filter(a => a.estado === "ACTIVO").length;
      doc.setFillColor(15, 74, 30);
      doc.roundedRect(8, y, W - 16, 24, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMEN FINANCIERO", 14, y + 8);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Total ingresos ventas: C$ " + totalVentasNIO.toLocaleString("es"), 14, y + 15);
      doc.text("Total gastos: C$ " + totalGastos.toLocaleString("es"), 14, y + 21);
      doc.text("Animales activos: " + activos + " / " + data.animales.length, W / 2 + 4, y + 15);
      doc.text("Balance estimado: C$ " + (totalVentasNIO - totalGastos).toLocaleString("es"), W / 2 + 4, y + 21);
      y += 30;

      // Tabla animales en página 1
      if (data.animales.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 74, 30);
        doc.text("INVENTARIO ANIMAL", 10, y + 5);
        autoTable(doc, {
          startY: y + 8,
          margin: { left: 10, right: 10 },
          head: [["Arete/ID", "Nombre", "Raza", "Sexo", "Peso (kg)", "Estado"]],
          body: data.animales.map(a => [
            a.identificador, a.nombre || "—", a.raza || "—",
            a.sexo === "HEMBRA" ? "Hembra" : "Macho",
            a.pesoActual ? a.pesoActual + " kg" : "—", a.estado,
          ]),
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [15, 74, 30], textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [220, 245, 225] },
        });
      }

      // ── PÁGINA 2: VENTAS ─────────────────────────────────────
      if (data.ventas.length > 0) {
        doc.addPage();
        drawHeader("REPORTE DE VENTAS", [90, 50, 10], [180, 100, 20], [210, 140, 40]);
        autoTable(doc, {
          startY: 68,
          margin: { left: 10, right: 10 },
          head: [["Fecha", "Tipo", "Animal", "Peso", "Precio NIO", "Estado pago"]],
          body: data.ventas.map(v => [
            new Date(v.fecha || v.createdAt).toLocaleDateString("es"),
            v.tipoVenta === "EN_PIE" ? "En pie" : "Por peso",
            v.animal?.nombre || v.animal?.identificador || "—",
            v.pesoVenta ? v.pesoVenta + " kg" : "—",
            "C$ " + (v.precioNIO || 0).toLocaleString("es"),
            v.estadoPago || "—",
          ]),
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [90, 50, 10], textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [255, 248, 225] },
        });
      }

      // ── PÁGINA 3: GASTOS ─────────────────────────────────────
      if (data.gastos.length > 0) {
        doc.addPage();
        drawHeader("REPORTE DE GASTOS", [50, 30, 100], [110, 70, 200], [140, 90, 230]);
        autoTable(doc, {
          startY: 68,
          margin: { left: 10, right: 10 },
          head: [["Fecha", "Descripcion", "Categoria", "Monto NIO"]],
          body: data.gastos.map(g => [
            new Date(g.fecha || g.createdAt).toLocaleDateString("es"),
            g.descripcion, g.categoria || "—",
            "C$ " + (g.monto || 0).toLocaleString("es"),
          ]),
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [50, 30, 100], textColor: [255,255,255], fontStyle: "bold" },
          alternateRowStyles: { fillColor: [240, 232, 255] },
        });
      }

      // ── PÁGINA 4: EQUIPO E INCIDENTES ─────────────────────────
      if (data.equipo.length > 0 || data.incidentes.length > 0) {
        doc.addPage();
        drawHeader("EQUIPO E INCIDENTES", [20, 60, 120], [40, 100, 180], [60, 130, 210]);
        let py = 68;
        if (data.equipo.length > 0) {
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 60, 120);
          doc.text("EQUIPO / USUARIOS", 10, py);
          autoTable(doc, {
            startY: py + 4,
            margin: { left: 10, right: 10 },
            head: [["Nombre", "Correo", "Rol", "Fecha registro"]],
            body: data.equipo.map(u => [u.nombre, u.email, u.role, new Date(u.createdAt).toLocaleDateString("es")]),
            styles: { fontSize: 7.5, cellPadding: 2 },
            headStyles: { fillColor: [20, 60, 120], textColor: [255,255,255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [225, 235, 255] },
          });
          py = doc.lastAutoTable.finalY + 10;
        }
        if (data.incidentes.length > 0) {
          doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(140, 20, 20);
          doc.text("INCIDENTES REGISTRADOS", 10, py);
          autoTable(doc, {
            startY: py + 4,
            margin: { left: 10, right: 10 },
            head: [["Fecha", "Tipo", "Gravedad", "Animal", "Descripcion"]],
            body: data.incidentes.map(i => [
              new Date(i.fecha || i.createdAt).toLocaleDateString("es"),
              i.tipo || "—", i.gravedad || "—",
              i.animal?.nombre || i.animal?.identificador || "—",
              (i.descripcion || "").substring(0, 50),
            ]),
            styles: { fontSize: 7.5, cellPadding: 2 },
            headStyles: { fillColor: [140, 20, 20], textColor: [255,255,255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [255, 230, 230] },
          });
        }
      }

      drawFooters(green.dark, doc.internal.getNumberOfPages());
      const nombreArchivo = data.finca.nombre.replace(/\s+/g, "-").toLowerCase();
      doc.save("informe-" + nombreArchivo + "-" + new Date().toISOString().slice(0, 10) + ".pdf");
    } catch (e) {
      setError("Error generando informe: " + e.message);
    } finally {
      setGenerando(null);
    }
  }

  const glass = { background: "rgba(5,25,12,0.65)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)" };
  const fincasFiltradas = fincas.filter(f =>
    f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (f.usuarios?.[0]?.email || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AppLayout title="Informes por Finca" subtitle="Super Administrador">
      {error && (
        <p className="text-red-300 mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>
          {error}
        </p>
      )}

      {/* Banner */}
      <div className="rounded-3xl p-5 mb-6 flex items-center gap-4 shadow-2xl"
        style={{ background: "linear-gradient(135deg,rgba(15,74,30,0.9),rgba(34,139,60,0.7))", border: "1px solid rgba(52,168,83,0.4)", backdropFilter: "blur(20px)" }}>
        <div className="text-4xl">📋</div>
        <div className="flex-1">
          <h2 className="text-white font-black text-xl">Informes Completos por Finca</h2>
          <p className="text-white/60 text-sm mt-0.5">Descarga el informe PDF de cada finca con animales, ventas, gastos, equipo e incidentes.</p>
        </div>
        <div className="text-white/40 text-sm font-bold">{fincas.length} fincas</div>
      </div>

      {/* Buscador */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar finca o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full md:w-80 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
      </div>

      {/* Grid de fincas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fincasFiltradas.map(f => {
          const admin = f.usuarios?.[0];
          const isGen = generando === f.id;
          return (
            <div key={f.id} className="rounded-2xl overflow-hidden shadow-xl" style={glass}>
              <div className="h-1.5" style={{ background: f.activa ? "linear-gradient(90deg,#34a853,#1a6b2a)" : "linear-gradient(90deg,#ef4444,#b91c1c)" }} />
              <div className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-xl text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg,#1a6b2a,#34a853)" }}>
                  {f.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-black text-base truncate">{f.nombre}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${f.activa ? "text-green-300 bg-green-900/40" : "text-red-300 bg-red-900/40"}`}>
                      {f.activa ? "Activa" : "Suspendida"}
                    </span>
                  </div>
                  {f.ubicacion && <p className="text-white/50 text-xs mb-0.5">📍 {f.ubicacion}</p>}
                  {admin && <p className="text-white/50 text-xs mb-2">👤 {admin.nombre} · {admin.email}</p>}
                  <div className="flex gap-3 text-white/40 text-xs mb-3">
                    <span>🐄 {f._count.animales} animales</span>
                    <span>💰 {f._count.ventas} ventas</span>
                    <span>👥 {f._count.usuarios} usuarios</span>
                  </div>
                  <button
                    onClick={() => generarInforme(f)}
                    disabled={!!generando}
                    className="w-full text-white font-bold py-2.5 rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                    style={{ background: isGen ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    {isGen ? "⏳ Generando informe..." : "⬇️ Descargar Informe Completo"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {fincasFiltradas.length === 0 && !error && (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">📂</p>
          <p>No se encontraron fincas</p>
        </div>
      )}
    </AppLayout>
  );
}
