"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const CATEGORIAS = [
  { value: "ALIMENTACION", label: "🌾 Alimentación", color: "#2d9e3f" },
  { value: "MEDICAMENTO",  label: "💊 Medicamentos", color: "#3182ce" },
  { value: "MANTENIMIENTO",label: "🔧 Mantenimiento",color: "#718096" },
  { value: "SALARIO",      label: "👷 Salarios",     color: "#805ad5" },
  { value: "COMBUSTIBLE",  label: "⛽ Combustible",  color: "#ed8936" },
  { value: "OTRO",         label: "📋 Otro",         color: "#a0aec0" },
];

const PERIODOS = [
  { value: "", label: "📅 Todos" },
  { value: "DIARIO",    label: "☀️ Hoy" },
  { value: "SEMANAL",   label: "📆 Esta semana" },
  { value: "QUINCENAL", label: "🗓️ Últimos 15 días" },
  { value: "MENSUAL",   label: "📊 Este mes" },
];

const PERIODICIDADES = [
  { value: "UNICO",     label: "1️⃣ Único / puntual" },
  { value: "DIARIO",    label: "☀️ Diario" },
  { value: "SEMANAL",   label: "📆 Semanal" },
  { value: "QUINCENAL", label: "🗓️ Cada 15 días" },
  { value: "MENSUAL",   label: "📊 Mensual" },
];

const FORM_VACIO = {
  descripcion: "", categoria: "ALIMENTACION", monto: "",
  moneda: "NIO", periodicidad: "UNICO",
  fecha: new Date().toISOString().slice(0, 10),
  notas: "", responsable: "",
};

export default function GastosPage() {
  const [data,     setData]     = useState({ gastos: [], total: 0 });
  const [periodo,  setPeriodo]  = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error,    setError]    = useState("");
  const [user,     setUser]     = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [finca,    setFinca]    = useState(null);
  const [form,     setForm]     = useState(FORM_VACIO);
  const [formEdit, setFormEdit] = useState(FORM_VACIO);

  async function load() {
    try {
      const q = periodo ? `?periodo=${periodo}` : "";
      const [res, me, fi] = await Promise.all([
        api(`/gastos${q}`),
        api("/usuarios/perfil").catch(() => null),
        api("/fincas/mi-finca").catch(() => null),
      ]);
      setData(res);
      setUser(me);
      setFinca(fi);
      if (me?.role === "ADMIN" || me?.role === "SUPER_ADMIN") {
        const u = await api("/gastos/usuarios-finca").catch(() => []);
        setUsuarios(Array.isArray(u) ? u : []);
      }
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, [periodo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true); setError("");
    try {
      await api("/gastos", { method: "POST", body: form });
      setForm(FORM_VACIO); setShowForm(false); load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  function abrirEditar(g) {
    setFormEdit({
      descripcion:  g.descripcion  || "",
      categoria:    g.categoria    || "ALIMENTACION",
      monto:        g.monto        || "",
      moneda:       g.moneda       || "NIO",
      periodicidad: g.periodicidad || "UNICO",
      fecha:        g.fecha ? g.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notas:        g.notas        || "",
      responsable:  g.responsable  || "",
    });
    setEditando(g);
  }

  async function handleEditar(e) {
    e.preventDefault();
    setEnviando(true); setError("");
    try {
      await api(`/gastos/${editando.id}`, { method: "PATCH", body: formEdit });
      setEditando(null); load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await api(`/gastos/${id}`, { method: "DELETE" });
    load();
  }

  // ── Comprobante PDF ──────────────────────────────────────────────────────────
  async function generarComprobante(g) {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [148, 210] }); // A5
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const cat = CATEGORIAS.find(c => c.value === g.categoria) || CATEGORIAS[5];
      const per = PERIODICIDADES.find(p => p.value === g.periodicidad);
      const num = `COMP-${new Date(g.fecha||g.createdAt).getFullYear()}-${String(Math.floor(Math.random()*9000)+1000).padStart(5,"0")}`;
      const fecha = new Date(g.fecha||g.createdAt).toLocaleDateString("es",{dateStyle:"long"});

      // Encabezado
      doc.setFillColor(107,33,168); doc.rect(0,0,W,38,"F");
      // Logo (si disponible)
      try {
        const logoB64 = await new Promise(res=>{
          const img=new Image(); img.crossOrigin="anonymous";
          img.onload=()=>{
            const rh=Math.floor(img.naturalHeight*0.52);
            const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=rh;
            const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,rh); ctx.drawImage(img,0,0);
            res(c.toDataURL("image/jpeg",0.88));
          };
          img.onerror=()=>res(null);
          img.src="/logo-base.jpg?r="+Math.random();
        });
        if(logoB64) doc.addImage(logoB64,"JPEG",5,4,18,18*0.52);
      } catch(_){}

      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(220,180,255);
      doc.text("GANADERÍA", 27, 11);
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text((finca?.nombre||"Mi Finca").toUpperCase(), 27, 19);
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(200,160,255);
      doc.text("CATTLE MANAGEMENT", 27, 25);

      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,220,255);
      doc.text("COMPROBANTE DE PAGO", W-6, 12, {align:"right"});
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(num, W-6, 20, {align:"right"});
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(200,160,255);
      doc.text(fecha, W-6, 27, {align:"right"});

      // Franja categoría
      doc.setFillColor(245,240,255); doc.rect(0,38,W,10,"F");
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(107,33,168);
      doc.text(cat.label.replace(/[^\x00-\x7F]/g,"").trim() || cat.value, 8, 45);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(126,34,206);
      doc.text(per?.label.replace(/[^\x00-\x7F]/g,"").trim() || g.periodicidad, W-6, 45, {align:"right"});

      let y = 56;

      // Monto grande
      doc.setFillColor(240,235,255); doc.roundedRect(6,y,W-12,22,3,3,"F");
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(130,100,180);
      doc.text("MONTO TOTAL", W/2, y+7, {align:"center"});
      doc.setFontSize(22); doc.setFont("helvetica","bold"); doc.setTextColor(107,33,168);
      doc.text(`C$ ${Math.round(g.monto).toLocaleString("es-NI")}`, W/2, y+18, {align:"center"});
      y += 27;

      // Detalle en filas
      const filas = [
        ["Descripcion", g.descripcion],
        ["Responsable", g.responsable || g.usuario?.nombre || "—"],
        ["Registrado por", g.usuario?.nombre || "—"],
        ["Finca", finca?.nombre || "—"],
        ["Categoria", cat.value],
        ["Periodicidad", g.periodicidad],
        ...(g.notas ? [["Notas", g.notas]] : []),
      ];

      filas.forEach((f, i) => {
        if(i%2===0){doc.setFillColor(248,245,255);}else{doc.setFillColor(255,255,255);}
        doc.rect(6, y, W-12, 9, "F");
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,100,150);
        doc.text(f[0].toUpperCase(), 10, y+6);
        doc.setFont("helvetica","bold"); doc.setTextColor(40,20,70);
        const val = String(f[1]||"—").slice(0,40);
        doc.text(val, W-8, y+6, {align:"right"});
        y += 9;
      });

      y += 8;

      // Línea de firma
      doc.setDrawColor(200,180,230); doc.setLineWidth(0.3);
      doc.line(10, y, W/2-4, y);
      doc.line(W/2+4, y, W-10, y);
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(150,120,190);
      doc.text("Firma del Responsable", W/4, y+5, {align:"center"});
      doc.text("Firma del Administrador", 3*W/4, y+5, {align:"center"});
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(107,33,168);
      doc.text(g.responsable||g.usuario?.nombre||"_______________", W/4, y+11, {align:"center"});
      doc.text(user?.nombre||"_______________", 3*W/4, y+11, {align:"center"});

      // Footer
      doc.setFillColor(107,33,168); doc.rect(0,H-8,W,8,"F");
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(200,160,255);
      doc.text("Henriquez Cattle Management ERP  •  Documento Oficial", W/2, H-3, {align:"center"});

      doc.save(`${num}.pdf`);
    } catch(e) { setError("Error generando comprobante: "+e.message); }
  }

  const esAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    total: data.gastos.filter((g) => g.categoria === c.value).reduce((s, g) => s + g.monto, 0),
    count: data.gastos.filter((g) => g.categoria === c.value).length,
  })).filter((c) => c.count > 0);

  // ── Formulario reutilizable ──────────────────────────────────────────────────
  function FormGasto({ values, onChange, onSubmit, titulo, onCancel }) {
    return (
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl mb-5 overflow-hidden">
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#553c9a,#805ad5)" }}>
          <h2 className="text-white font-black text-lg">{titulo}</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CATEGORIAS.map((c) => (
                <button type="button" key={c.value} onClick={() => onChange({ ...values, categoria: c.value })}
                  className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all text-left"
                  style={{ background: values.categoria === c.value ? c.color : "#fff", color: values.categoria === c.value ? "#fff" : c.color, borderColor: c.color }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Responsable del pago</label>
            <div className="mt-2 space-y-2">
              {/* Opciones predefinidas como tarjetas */}
              {[
                ...usuarios.map(u => ({
                  valor: `${u.nombre} — ${u.role === "ADMIN" ? "Administrador" : u.role === "TRABAJADOR" ? "Trabajador" : u.role} de ${finca?.nombre || "la Finca"}`,
                  etiqueta: u.nombre,
                  sub: `${u.role === "ADMIN" ? "Administrador" : u.role === "TRABAJADOR" ? "Trabajador" : u.role} · ${finca?.nombre || ""}`,
                  initials: u.nombre.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase(),
                })),
                { valor: "__otro__", etiqueta: "Otro", sub: "Escribir nombre manualmente", initials: "+" },
              ].map((op) => {
                const seleccionado = values.responsable === op.valor || (op.valor === "__otro__" && values.responsable && !usuarios.find(u=>`${u.nombre} — ${u.role === "ADMIN" ? "Administrador" : u.role === "TRABAJADOR" ? "Trabajador" : u.role} de ${finca?.nombre || "la Finca"}` === values.responsable));
                return (
                  <button type="button" key={op.valor}
                    onClick={() => onChange({ ...values, responsable: op.valor === "__otro__" ? "" : op.valor })}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: seleccionado ? "#805ad5" : "#e5e7eb",
                      background: seleccionado ? "#f5f0ff" : "#fff",
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                      style={{ background: seleccionado ? "#805ad5" : "#e5e7eb", color: seleccionado ? "#fff" : "#6b7280" }}>
                      {op.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm" style={{ color: seleccionado ? "#553c9a" : "#374151" }}>{op.etiqueta}</p>
                      <p className="text-xs" style={{ color: seleccionado ? "#805ad5" : "#9ca3af" }}>{op.sub}</p>
                    </div>
                    {seleccionado && <span className="ml-auto text-purple-600">✓</span>}
                  </button>
                );
              })}
            </div>
            {/* Campo manual si no coincide con ninguna opción predefinida */}
            {values.responsable !== "" && !usuarios.find(u=>`${u.nombre} — ${u.role === "ADMIN" ? "Administrador" : u.role === "TRABAJADOR" ? "Trabajador" : u.role} de ${finca?.nombre || "la Finca"}` === values.responsable) && (
              <input
                className="w-full border-2 border-purple-300 rounded-xl p-3 mt-2 focus:border-purple-400 focus:outline-none bg-gray-50"
                placeholder="Nombre del responsable..."
                value={values.responsable}
                onChange={(e) => onChange({ ...values, responsable: e.target.value })}
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Descripción *</label>
            <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
              placeholder="Ej: Compra de concentrado, sal mineral..." value={values.descripcion}
              onChange={(e) => onChange({ ...values, descripcion: e.target.value })} required />
          </div>

          {/* Monto y Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Monto (C$) *</label>
              <input type="number" step="0.01"
                className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                placeholder="0.00" value={values.monto}
                onChange={(e) => onChange({ ...values, monto: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
              <input type="date"
                className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                value={values.fecha} onChange={(e) => onChange({ ...values, fecha: e.target.value })} />
            </div>
          </div>

          {/* Periodicidad */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Periodicidad</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PERIODICIDADES.map((p) => (
                <button type="button" key={p.value} onClick={() => onChange({ ...values, periodicidad: p.value })}
                  className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all"
                  style={{ background: values.periodicidad === p.value ? "#805ad5" : "#fff", color: values.periodicidad === p.value ? "#fff" : "#805ad5", borderColor: "#805ad5" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Notas</label>
            <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none resize-none bg-gray-50"
              placeholder="Detalles adicionales..." rows={2} value={values.notas}
              onChange={(e) => onChange({ ...values, notas: e.target.value })} />
          </div>

          <div className="flex gap-3">
            <button disabled={enviando} type="submit"
              className="flex-1 text-white rounded-2xl py-4 font-black disabled:opacity-50"
              style={{ background: "#805ad5" }}>
              {enviando ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onCancel}
              className="px-6 rounded-2xl py-4 font-black border-2 border-gray-200 text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <AppLayout title="💸 Control de Gastos" subtitle="Registro de gastos de la finca">
      <div className="max-w-2xl mx-auto">
        {/* Total */}
        <div className="rounded-2xl text-white text-center py-6 shadow-lg mb-4"
          style={{ background: "linear-gradient(135deg,#553c9a,#805ad5)" }}>
          <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Total de gastos</p>
          <p className="text-4xl font-black mt-1">C$ {data.total.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
          <p className="text-purple-200 text-sm mt-1">≈ USD $ {(data.total / 36.5).toLocaleString("es", { maximumFractionDigits: 0 })}</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {PERIODOS.map((p) => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold border-2 transition-all"
              style={{ background: periodo === p.value ? "#805ad5" : "#fff", color: periodo === p.value ? "#fff" : "#805ad5", borderColor: "#805ad5" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Resumen por categoría */}
        {porCategoria.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {porCategoria.map((c) => (
              <div key={c.value} className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
                <span className="text-2xl">{c.label.split(" ")[0]}</span>
                <div>
                  <p className="font-black text-gray-800 text-sm">C$ {c.total.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-gray-400">{c.label.split(" ").slice(1).join(" ")} · {c.count} registro{c.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        <button onClick={() => { setShowForm(s => !s); setEditando(null); }}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-lg"
          style={{ background: showForm ? "#718096" : "#805ad5" }}>
          {showForm ? "✕ Cancelar" : "+ Registrar Gasto"}
        </button>

        {showForm && !editando && (
          <FormGasto values={form} onChange={setForm} onSubmit={handleSubmit}
            titulo="Nuevo Gasto" onCancel={() => setShowForm(false)} />
        )}

        {/* Modal editar */}
        {editando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
              <FormGasto values={formEdit} onChange={setFormEdit} onSubmit={handleEditar}
                titulo="Editar Gasto" onCancel={() => setEditando(null)} />
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-3">
          {data.gastos.map((g) => {
            const cat = CATEGORIAS.find((c) => c.value === g.categoria) || CATEGORIAS[5];
            const per = PERIODICIDADES.find((p) => p.value === g.periodicidad);
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: cat.color }}>
                  <span className="text-white font-bold text-sm">{cat.label}</span>
                  <span className="text-white text-xs opacity-80">{per?.label}</span>
                </div>
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{g.descripcion}</p>
                    {g.responsable && (
                      <p className="text-xs font-semibold mt-1" style={{ color: "#805ad5" }}>
                        👤 Responsable: {g.responsable}
                      </p>
                    )}
                    {g.notas && <p className="text-xs text-gray-400 mt-1">📝 {g.notas}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(g.fecha).toLocaleDateString("es", { dateStyle: "medium" })} · {g.usuario?.nombre}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2 ml-3 shrink-0">
                    <p className="font-black text-xl" style={{ color: "#805ad5" }}>
                      C$ {g.monto.toLocaleString("es", { maximumFractionDigits: 0 })}
                    </p>
                    <button onClick={() => generarComprobante(g)}
                      className="text-white text-xs px-3 py-1 rounded-xl font-bold"
                      style={{ background: "#553c9a" }}>
                      🧾 Comprobante
                    </button>
                    {esAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => abrirEditar(g)}
                          className="text-white text-xs px-3 py-1 rounded-xl font-bold"
                          style={{ background: "#805ad5" }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => eliminar(g.id)}
                          className="text-white text-xs px-3 py-1 rounded-xl font-bold"
                          style={{ background: "#e53e3e" }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.gastos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">💸</div>
            <p className="text-gray-500 text-lg font-bold">Sin gastos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Registra los gastos diarios de tu finca</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
