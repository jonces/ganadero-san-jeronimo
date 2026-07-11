"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

const TIPOS = [
  { value: "OBSERVACION", label: "Observacion",  color: "#718096" },
  { value: "VACUNACION",  label: "Vacunacion",   color: "#3182ce" },
  { value: "TRATAMIENTO", label: "Tratamiento",  color: "#e53e3e" },
  { value: "PESAJE",      label: "Pesaje",       color: "#d69e2e" },
  { value: "PARTO",       label: "Parto",        color: "#805ad5" },
  { value: "MOVIMIENTO",  label: "Movimiento",   color: "#2d9e3f" },
];

const TIPOS_LABEL = {
  OBSERVACION: "Observacion", VACUNACION: "Vacunacion",
  TRATAMIENTO: "Tratamiento", PESAJE: "Pesaje",
  PARTO: "Parto", MOVIMIENTO: "Movimiento",
};

async function generarInformeAnimal(animal, finca) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const GD = [20, 100, 40], GM = [45, 158, 63], GL = [232, 245, 233];
  const GR = [100, 100, 110];
  let y = 0;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...GD); doc.rect(0, 0, W, 48, "F");
  // Logo/iniciales círculo
  doc.setFillColor(255,255,255); doc.circle(22, 24, 14, "F");
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(...GD);
  const ini = (animal.nombre||animal.identificador).slice(0,2).toUpperCase();
  doc.text(ini, 22, 27, { align: "center" });
  // Nombre finca — tamaño adaptativo, sin "GANADERIA"
  const fNombre = (finca?.nombre || "MI FINCA").toUpperCase();
  const fSz = fNombre.length > 22 ? 12 : fNombre.length > 16 ? 14 : 17;
  doc.setFontSize(fSz); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text(fNombre, 42, 24, { maxWidth: 72 });
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
  doc.text("CATTLE MANAGEMENT", 42, 33);
  // Separador vertical
  doc.setDrawColor(255,255,255); doc.setLineWidth(0.3); doc.line(120, 8, 120, 40);
  // Título derecha
  doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text("INFORME DE ANIMAL", 163, 18, { align: "center" });
  doc.setDrawColor(255,255,255); doc.setLineWidth(0.4);
  doc.roundedRect(125, 22, 76, 8, 2, 2, "D");
  doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text(`Arete: ${animal.identificador}`, 163, 27.5, { align: "center" });
  const fechaDoc = new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
  doc.text(fechaDoc, 163, 35, { align: "center" });

  // ── BARRA INFO ─────────────────────────────────────────────────────────────
  doc.setFillColor(245,250,245); doc.rect(0, 48, W, 14, "F");
  doc.setDrawColor(...GM); doc.setLineWidth(0.3); doc.line(0, 48, W, 48); doc.line(0, 62, W, 62);
  const infoBar = [
    { icon: "F", label: "FINCA", val: finca?.nombre || "—" },
    { icon: "U", label: "UBICACION", val: finca?.ubicacion || "—" },
    { icon: "S", label: "SEXO", val: animal.sexo === "HEMBRA" ? "Hembra" : "Macho" },
    { icon: "E", label: "ESTADO", val: animal.estado || "ACTIVO" },
  ];
  infoBar.forEach(({ icon, label, val }, i) => {
    const x = 12 + i * 50;
    doc.setFillColor(...GM); doc.circle(x, 55, 3.5, "F");
    doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(icon, x, 56.5, { align: "center" });
    doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...GR);
    doc.text(label, x + 6, 52.5);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...GD);
    doc.text(String(val).slice(0, 20), x + 6, 58);
  });
  y = 70;

  // ── DATOS GENERALES ─────────────────────────────────────────────────────────
  const secTitulo = (txt, yy) => {
    doc.setFillColor(...GL); doc.roundedRect(8, yy, W - 16, 8, 2, 2, "F");
    doc.setDrawColor(...GM); doc.setLineWidth(0.4); doc.line(8, yy, 16, yy);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...GD);
    doc.text(txt, 12, yy + 5.5);
    return yy + 12;
  };

  y = secTitulo("DATOS GENERALES DEL ANIMAL", y);

  const edad = animal.fechaNacimiento
    ? (() => { const d = Math.floor((Date.now() - new Date(animal.fechaNacimiento)) / 86400000); return d >= 365 ? `${Math.floor(d/365)} año(s) ${Math.floor((d%365)/30)} mes(es)` : `${d} dias`; })()
    : "No registrada";

  const camposGenerales = [
    ["Nombre",            animal.nombre || "Sin nombre"],
    ["Arete / ID",        animal.identificador],
    ["Raza",              animal.raza || "No registrada"],
    ["Sexo",              animal.sexo === "HEMBRA" ? "Hembra" : "Macho"],
    ["Fecha de nacimiento", animal.fechaNacimiento ? new Date(animal.fechaNacimiento).toLocaleDateString("es", { dateStyle: "long" }) : "No registrada"],
    ["Edad aproximada",   edad],
    ["Peso actual",       animal.pesoActual ? `${animal.pesoActual} kg` : "No registrado"],
    ["Fierro / marca",    animal.fierro || "Sin fierro"],
    ["Estado",            animal.estado || "ACTIVO"],
    ["Estado reproductivo", animal.estadoReproductivo || "—"],
    ["Observaciones",     animal.observacion || "—"],
  ];

  const colW2 = (W - 20) / 2;
  camposGenerales.forEach(([lbl, val], i) => {
    const col = i % 2; const row = Math.floor(i / 2);
    const cx = 10 + col * (colW2 + 4);
    const cy = y + row * 10;
    if (col === 0) {
      doc.setFillColor(col % 2 === 0 ? 248 : 255, 252, 248);
      doc.rect(10, cy - 1, W - 20, 9, "F");
    }
    doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...GR);
    doc.text(lbl.toUpperCase(), cx + 1, cy + 3);
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(20, 60, 20);
    doc.text(String(val).slice(0, 28), cx + 1, cy + 8);
  });
  y += Math.ceil(camposGenerales.length / 2) * 10 + 6;

  // ── MADRE ──────────────────────────────────────────────────────────────────
  if (animal.madre) {
    y = secTitulo("INFORMACION DE LA MADRE", y);
    const madreEdad = animal.madre.fechaNacimiento
      ? (() => { const d = Math.floor((Date.now() - new Date(animal.madre.fechaNacimiento)) / 86400000); return d >= 365 ? `${Math.floor(d/365)} año(s)` : `${d} dias`; })()
      : "—";
    const camposMadre = [
      ["Nombre de la madre", animal.madre.nombre || "Sin nombre"],
      ["Arete / ID de la madre", animal.madre.identificador],
      ["Raza", animal.madre.raza || "No registrada"],
      ["Edad", madreEdad],
    ];
    camposMadre.forEach(([lbl, val], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const cx = 10 + col * (colW2 + 4), cy = y + row * 10;
      doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...GR);
      doc.text(lbl.toUpperCase(), cx + 1, cy + 3);
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(20, 60, 20);
      doc.text(String(val).slice(0, 28), cx + 1, cy + 8);
    });
    y += Math.ceil(camposMadre.length / 2) * 10 + 6;
  }

  // ── HISTORIAL DE EVENTOS ────────────────────────────────────────────────────
  if (animal.eventos?.length > 0) {
    // Nueva página si no hay espacio
    if (y > H - 60) { doc.addPage(); y = 15; }
    y = secTitulo(`HISTORIAL DE EVENTOS (${animal.eventos.length})`, y);

    // Resumen por tipo
    const resumen = {};
    animal.eventos.forEach(ev => { resumen[ev.tipo] = (resumen[ev.tipo] || 0) + 1; });
    const tipos = Object.entries(resumen);
    tipos.forEach(([tipo, cnt], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const bx = 10 + col * 48, by = y + row * 14;
      const colores = { VACUNACION:[49,130,206], TRATAMIENTO:[229,62,62], PESAJE:[214,158,46], PARTO:[128,90,213], MOVIMIENTO:[45,158,63], OBSERVACION:[113,128,150] };
      const c = colores[tipo] || [100,100,100];
      doc.setFillColor(...c); doc.roundedRect(bx, by, 44, 11, 2, 2, "F");
      doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(TIPOS_LABEL[tipo] || tipo, bx + 22, by + 4.5, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.text(String(cnt), bx + 22, by + 10, { align: "center" });
    });
    y += Math.ceil(tipos.length / 4) * 14 + 6;

    // Listado detallado
    animal.eventos.forEach((ev) => {
      if (y > H - 30) { doc.addPage(); y = 15; }
      const colores = { VACUNACION:[49,130,206], TRATAMIENTO:[229,62,62], PESAJE:[214,158,46], PARTO:[128,90,213], MOVIMIENTO:[45,158,63], OBSERVACION:[113,128,150] };
      const c = colores[ev.tipo] || [113,128,150];
      const fechaEv = new Date(ev.fecha).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
      const descLines = doc.splitTextToSize(ev.descripcion || "Sin descripcion", W - 50);
      const evH = Math.max(12, descLines.length * 4 + 8);

      doc.setFillColor(248, 252, 248); doc.setDrawColor(200, 230, 200); doc.setLineWidth(0.3);
      doc.roundedRect(8, y, W - 16, evH, 2, 2, "FD");
      // Badge tipo
      doc.setFillColor(...c); doc.roundedRect(10, y + 2, 28, 7, 1, 1, "F");
      doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(TIPOS_LABEL[ev.tipo] || ev.tipo, 24, y + 6.5, { align: "center" });
      // Fecha
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(...GR);
      doc.text(fechaEv, W - 12, y + 6, { align: "right" });
      // Descripcion
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(30, 60, 30);
      doc.text(descLines, 42, y + 6);
      // Peso si aplica
      if (ev.peso) {
        doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...GM);
        doc.text(`Peso: ${ev.peso} kg`, 42, y + evH - 3);
      }
      // Registrado por
      if (ev.usuario?.nombre) {
        doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(...GR);
        doc.text(`Registrado por: ${ev.usuario.nombre}`, W - 12, y + evH - 3, { align: "right" });
      }
      y += evH + 3;
    });
  }

  // ── VACUNACIONES RESALTADAS ─────────────────────────────────────────────────
  const vacunas = animal.eventos?.filter(ev => ev.tipo === "VACUNACION") || [];
  if (vacunas.length > 0) {
    if (y > H - 40) { doc.addPage(); y = 15; }
    y = secTitulo(`RESUMEN DE VACUNACIONES (${vacunas.length})`, y);
    vacunas.forEach((v, i) => {
      if (y > H - 20) { doc.addPage(); y = 15; }
      const fechaV = new Date(v.fecha).toLocaleDateString("es", { dateStyle: "medium" });
      doc.setFillColor(232, 240, 255); doc.setDrawColor(49,130,206); doc.setLineWidth(0.3);
      doc.roundedRect(8, y, W - 16, 10, 2, 2, "FD");
      doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(49,130,206);
      doc.text(`${i + 1}.`, 13, y + 6.5);
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(20,40,80);
      doc.text(String(v.descripcion || "Vacunacion sin detalle").slice(0, 60), 20, y + 6.5);
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(100,120,140);
      doc.text(fechaV, W - 12, y + 6.5, { align: "right" });
      y += 13;
    });
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const totalPags = doc.getNumberOfPages();
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p);
    doc.setFillColor(...GD); doc.rect(0, H - 14, W, 14, "F");
    doc.setDrawColor(...GM); doc.setLineWidth(0.5); doc.line(0, H - 14, W, H - 14);
    doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(180,220,180);
    doc.text("Henriquez Cattle Management ERP", 12, H - 7);
    doc.text(`Pag. ${p} / ${totalPags}`, W - 12, H - 7, { align: "right" });
    doc.setTextColor(255,255,255);
    doc.text(`Informe de: ${animal.nombre || animal.identificador} | Generado: ${new Date().toLocaleDateString("es")}`, W / 2, H - 7, { align: "center" });
  }

  const nombreArchivo = `informe-${animal.identificador}-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(nombreArchivo);
}

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [animal, setAnimal] = useState(null);
  const [finca,  setFinca]  = useState(null);
  const [error, setError] = useState("");
  const [tipo, setTipo] = useState("OBSERVACION");
  const [descripcion, setDescripcion] = useState("");
  const [peso, setPeso] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const [data, fi] = await Promise.all([
        api(`/animales/${id}`),
        api("/fincas/mi-finca").catch(() => null),
      ]);
      setAnimal(data);
      setFinca(fi);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleInforme() {
    setGenerando(true);
    try { await generarInformeAnimal(animal, finca); }
    catch (e) { setError("Error generando informe: " + e.message); }
    finally { setGenerando(false); }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("animalId", id);
      formData.append("tipo", tipo);
      formData.append("descripcion", descripcion);
      if (peso) formData.append("peso", peso);
      Array.from(archivos).forEach((f) => formData.append("archivos", f));

      await api("/eventos", { method: "POST", body: formData, isForm: true });
      setDescripcion("");
      setPeso("");
      setArchivos([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-md">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={() => router.push("/animales")} className="mt-4 text-green-700 underline">Volver</button>
      </div>
    </div>
  );

  if (!animal) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-bounce">🐄</div>
        <p className="text-gray-500 mt-3">Cargando...</p>
      </div>
    </div>
  );

  const tipoInfo = TIPOS.find((t) => t.value === tipo);
  const fotoPortada = animal.media?.find((m) => m.tipo === "FOTO") || animal.media?.[0];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#2d9e3f" }}>
        <button onClick={() => router.push("/animales")} className="text-white text-xl">←</button>
        <span className="font-bold text-lg">{animal.nombre || animal.identificador}</span>
        <span className="text-2xl">{animal.sexo === "HEMBRA" ? "🐄" : "🐂"}</span>
      </header>

      {/* Foto de portada */}
      {fotoPortada ? (
        fotoPortada.tipo === "FOTO"
          ? <img src={fotoPortada.url} alt={animal.identificador} className="w-full h-56 object-cover" />
          : <video src={fotoPortada.url} className="w-full h-56 object-cover" muted autoPlay loop />
      ) : (
        <div className="w-full h-40 flex items-center justify-center text-8xl" style={{ background: "#e8f5e9" }}>🐄</div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Info del animal */}
        <div className="bg-white rounded-2xl shadow-md p-5">
          <h1 className="text-2xl font-bold text-gray-800">{animal.nombre || animal.identificador}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: "#2d9e3f" }}>
              {animal.raza || "Sin raza"}
            </span>
            <span className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ background: animal.sexo === "HEMBRA" ? "#e53e3e" : "#3182ce" }}>
              {animal.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho"}
            </span>
            {animal.pesoActual && (
              <span className="px-3 py-1 rounded-full text-white text-sm font-medium" style={{ background: "#d69e2e" }}>
                ⚖️ {animal.pesoActual} kg
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">Arete: {animal.identificador}</p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex-1 text-white rounded-xl py-3 font-bold text-base flex items-center justify-center gap-2"
            style={{ background: showForm ? "#718096" : "#2d9e3f" }}
          >
            {showForm ? "✕ Cancelar" : "+ Nuevo Reporte"}
          </button>
          <button
            onClick={handleInforme}
            disabled={generando}
            className="flex items-center gap-2 px-5 rounded-xl py-3 font-bold text-base text-white disabled:opacity-60"
            style={{ background: "#1a3a6c" }}
          >
            {generando ? "..." : "Informe PDF"}
          </button>
        </div>

        {/* Formulario de reporte */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-5 space-y-4">
            <h2 className="font-bold text-gray-700">Registrar evento</h2>

            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map((t) => (
                <button type="button" key={t.value}
                  onClick={() => setTipo(t.value)}
                  className="rounded-xl py-2 px-3 text-sm font-medium text-white transition-opacity"
                  style={{ background: t.color, opacity: tipo === t.value ? 1 : 0.4 }}>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none resize-none"
              placeholder="Descripción del evento..."
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />

            {tipo === "PESAJE" && (
              <input
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:outline-none"
                type="number" placeholder="Peso en kg"
                value={peso} onChange={(e) => setPeso(e.target.value)}
              />
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">📷 Fotos y videos</p>
              <input type="file" multiple accept="image/*,video/*"
                onChange={(e) => setArchivos(e.target.files)}
                className="text-sm text-gray-500" />
            </div>

            <button disabled={enviando}
              className="w-full text-white rounded-xl py-3 font-bold disabled:opacity-50"
              style={{ background: "#2d9e3f" }}>
              {enviando ? "Guardando..." : "Guardar Reporte"}
            </button>
          </form>
        )}

        {/* Historial */}
        <h2 className="font-bold text-gray-700 text-lg px-1">📋 Historial ({animal.eventos.length})</h2>
        <div className="space-y-3">
          {animal.eventos.map((ev) => {
            const tipoEv = TIPOS.find((t) => t.value === ev.tipo);
            return (
              <div key={ev.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between text-white text-sm font-medium"
                  style={{ background: tipoEv?.color || "#718096" }}>
                  <span>{tipoEv?.label || ev.tipo}</span>
                  <span className="opacity-80 text-xs">{new Date(ev.fecha).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div className="p-4">
                  {ev.descripcion && <p className="text-gray-700 mb-2">{ev.descripcion}</p>}
                  {ev.peso && (
                    <p className="text-sm font-medium mb-2" style={{ color: "#d69e2e" }}>⚖️ Peso registrado: {ev.peso} kg</p>
                  )}
                  {ev.usuario?.nombre && (
                    <p className="text-xs text-gray-400 mb-2">👤 {ev.usuario.nombre}</p>
                  )}
                  {ev.media?.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {ev.media.map((m) => (
                        m.tipo === "FOTO" ? (
                          <a key={m.id} href={m.url} target="_blank" rel="noreferrer">
                            <img src={m.url} className="w-full h-24 object-cover rounded-xl" />
                          </a>
                        ) : (
                          <video key={m.id} src={m.url} className="w-full h-24 object-cover rounded-xl" controls />
                        )
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {animal.eventos.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>Sin reportes todavía</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
