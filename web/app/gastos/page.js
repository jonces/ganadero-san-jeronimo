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
  notas: "", responsable: "", receptor: "",
};

function notaAutomatica(categoria, fecha) {
  const f = fecha ? new Date(fecha + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "";
  const notas = {
    SALARIO: `Por medio del presente comprobante se hace constar que se realiza el pago de salario correspondiente al trabajador que firma el presente documento, conforme al acuerdo laboral establecido entre las partes y en pleno cumplimiento de las políticas internas de la empresa. El pago se entrega en la fecha indicada (${f}) como reconocimiento de los servicios prestados durante el período acordado. Ambas partes confirman estar de acuerdo con el monto recibido.`,
    ALIMENTACION: `Pago realizado el ${f} por concepto de adquisición de insumos de alimentación para el ganado, conforme al plan de nutrición establecido por la administración de la finca.`,
    MEDICAMENTO: `Compra de medicamentos y/o insumos veterinarios realizada el ${f}, conforme al protocolo de salud animal vigente aprobado por la administración.`,
    MANTENIMIENTO: `Pago efectuado el ${f} por concepto de mantenimiento de instalaciones y/o equipos de la finca, según programa de mantenimiento aprobado por la administración.`,
    COMBUSTIBLE: `Pago por adquisición de combustible realizado el ${f} para uso exclusivo de maquinaria y vehículos de la finca, conforme a las necesidades operativas autorizadas.`,
    OTRO: `Gasto registrado el ${f} conforme a las políticas internas de la empresa y debidamente autorizado por la administración de la finca.`,
  };
  return notas[categoria] || notas.OTRO;
}

function numToWords(n) {
  n = Math.round(n || 0);
  if (!n) return "CERO CORDOBAS NETOS";
  const ones = ["","UNO","DOS","TRES","CUATRO","CINCO","SEIS","SIETE","OCHO","NUEVE",
    "DIEZ","ONCE","DOCE","TRECE","CATORCE","QUINCE","DIECISEIS","DIECISIETE","DIECIOCHO","DIECINUEVE"];
  const tens = ["","DIEZ","VEINTE","TREINTA","CUARENTA","CINCUENTA","SESENTA","SETENTA","OCHENTA","NOVENTA"];
  const hundreds = ["","CIENTO","DOSCIENTOS","TRESCIENTOS","CUATROCIENTOS","QUINIENTOS",
    "SEISCIENTOS","SETECIENTOS","OCHOCIENTOS","NOVECIENTOS"];
  function t2(n){if(n<20)return ones[n];const d=Math.floor(n/10),u=n%10;return tens[d]+(u?" Y "+ones[u]:"");}
  function t3(n){if(n===100)return "CIEN";const c=Math.floor(n/100),r=n%100;return(c?hundreds[c]+(r?" ":""):""+(r?t2(r):""));}
  let r="";
  if(n>=1000){const m=Math.floor(n/1000);r+=(m===1?"MIL":t3(m)+" MIL");n=n%1000;if(n)r+=" ";}
  if(n>0)r+=t3(n);
  return r+" CORDOBAS NETOS";
}

// ── Formulario reutilizable (FUERA del componente para evitar remontaje) ─────
function FormGasto({ values, onChange, onSubmit, titulo, onCancel, usuarios, finca, enviando }) {
  const roleLabel = (r) => r === "ADMIN" ? "Administrador" : r === "SUPER_ADMIN" ? "Super Admin" : "Trabajador";

  const opcionesUsuario = usuarios.map(u => ({
    valor: `${u.nombre} — ${roleLabel(u.role)} de ${finca?.nombre || "la Finca"}`,
    etiqueta: u.nombre,
    sub: `${roleLabel(u.role)} · ${finca?.nombre || ""}`,
    initials: u.nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase(),
  }));

  const esOpcionConocida = (val) => opcionesUsuario.some(o => o.valor === val);
  const esOtroSeleccionado = values.responsable !== "" && !esOpcionConocida(values.responsable);

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
              <button type="button" key={c.value}
                onClick={() => onChange({ ...values, categoria: c.value, descripcion: c.label.replace(/[^\w\s]/gu,"").trim(), notas: notaAutomatica(c.value, values.fecha) })}
                className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all text-left"
                style={{ background: values.categoria === c.value ? c.color : "#fff", color: values.categoria === c.value ? "#fff" : c.color, borderColor: c.color }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsable del pago */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Responsable del pago</label>
          <div className="mt-2 space-y-2">
            {opcionesUsuario.map((op) => {
              const sel = values.responsable === op.valor;
              return (
                <button type="button" key={op.valor}
                  onClick={() => onChange({ ...values, responsable: op.valor })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                  style={{ borderColor: sel ? "#805ad5" : "#e5e7eb", background: sel ? "#f5f0ff" : "#fff" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: sel ? "#805ad5" : "#e5e7eb", color: sel ? "#fff" : "#6b7280" }}>
                    {op.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: sel ? "#553c9a" : "#374151" }}>{op.etiqueta}</p>
                    <p className="text-xs" style={{ color: sel ? "#805ad5" : "#9ca3af" }}>{op.sub}</p>
                  </div>
                  {sel && <span className="ml-auto text-purple-600 font-bold">✓</span>}
                </button>
              );
            })}
            {/* Opción "Otro" */}
            <button type="button"
              onClick={() => onChange({ ...values, responsable: esOtroSeleccionado ? values.responsable : "" })}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
              style={{ borderColor: esOtroSeleccionado ? "#805ad5" : "#e5e7eb", background: esOtroSeleccionado ? "#f5f0ff" : "#fff" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                style={{ background: esOtroSeleccionado ? "#805ad5" : "#e5e7eb", color: esOtroSeleccionado ? "#fff" : "#6b7280" }}>
                +
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: esOtroSeleccionado ? "#553c9a" : "#374151" }}>Otro</p>
                <p className="text-xs" style={{ color: esOtroSeleccionado ? "#805ad5" : "#9ca3af" }}>Escribir nombre manualmente</p>
              </div>
              {esOtroSeleccionado && <span className="ml-auto text-purple-600 font-bold">✓</span>}
            </button>
          </div>
          {/* Campo manual si se eligió "Otro" o no hay usuarios cargados */}
          {(esOtroSeleccionado || (opcionesUsuario.length === 0)) && (
            <input
              className="w-full border-2 border-purple-300 rounded-xl p-3 mt-2 focus:border-purple-400 focus:outline-none bg-gray-50"
              placeholder="Nombre del responsable..."
              value={values.responsable}
              onChange={(e) => onChange({ ...values, responsable: e.target.value })}
            />
          )}
        </div>

        {/* Texto del comprobante — el empleado lo lee antes de firmar */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Texto del comprobante</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">El empleado leerá este texto antes de firmar. Puedes editarlo.</p>
          {values.notas ? (
            <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "#805ad5" }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#553c9a" }}>
                <span className="text-white text-xs font-black uppercase tracking-wide">Texto que aparecera en el PDF</span>
                <span className="ml-auto text-purple-200 text-xs">Editable</span>
              </div>
              <textarea
                className="w-full p-4 text-sm leading-relaxed focus:outline-none resize-none"
                style={{ background: "#faf8ff", color: "#2d1b69", minHeight: "120px" }}
                rows={6}
                value={values.notas}
                onChange={(e) => onChange({ ...values, notas: e.target.value })}
              />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-purple-200 p-6 text-center"
              style={{ background: "#faf8ff" }}>
              <p className="text-purple-400 text-sm font-semibold">Selecciona una categoría arriba</p>
              <p className="text-purple-300 text-xs mt-1">El texto se generará automáticamente</p>
            </div>
          )}
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

        {/* Receptor del pago */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">
            Nombre completo de quien recibe el pago
          </label>
          <p className="text-xs text-gray-400 mb-1">Esta persona colocará su firma en el comprobante</p>
          <input
            className="w-full border-2 border-purple-200 rounded-xl p-3 focus:border-purple-400 focus:outline-none bg-gray-50 font-semibold text-gray-800"
            placeholder="Ej: Juan Carlos Pérez García"
            value={values.receptor}
            onChange={(e) => onChange({ ...values, receptor: e.target.value })}
          />
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
      receptor:     g.receptor     || "",
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
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, H = 297;
      const PD = [107,33,168], PM = [126,34,206], PL = [245,240,255];
      const cat = CATEGORIAS.find(c => c.value === g.categoria) || CATEGORIAS[5];
      const per = PERIODICIDADES.find(p => p.value === g.periodicidad);
      const yr  = new Date(g.fecha||g.createdAt).getFullYear();
      const num = `COMP-${yr}-${String(Math.floor(Math.random()*90000)+10000)}`;
      const fechaLarga = new Date(g.fecha||g.createdAt).toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"});
      const adminNombre = user?.nombre || "Administrador";
      const fincaNombre = (finca?.nombre||"Mi Finca").toUpperCase();
      const responsable = g.responsable || adminNombre;
      const receptor    = g.receptor    || "";
      const monto = Math.round(g.monto||0);

      // ── Logo ──────────────────────────────────────────────────────────────────
      let logoB64 = null;
      try {
        logoB64 = await new Promise(res=>{
          const img=new Image(); img.crossOrigin="anonymous";
          img.onload=()=>{
            const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight;
            const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,0,0);
            res(c.toDataURL("image/jpeg",0.9));
          };
          img.onerror=()=>res(null);
          img.src="/logo-base.jpg?r="+Math.random();
        });
      } catch(_){}

      // ── ENCABEZADO ───────────────────────────────────────────────────────────
      doc.setFillColor(...PD); doc.rect(0,0,W,58,"F");
      // Marca de agua tenue (círculos)
      doc.setFillColor(126,34,206); doc.setGState && doc.setGState(doc.GState({opacity:0.15}));
      for(let i=0;i<4;i++){doc.circle(W-18+i*2,30+i*8,18,"F");}
      try{ doc.setGState(doc.GState({opacity:1})); }catch(_){}

      // Logo (círculo blanco + imagen)
      doc.setFillColor(255,255,255); doc.circle(20,28,16,"F");
      if(logoB64) doc.addImage(logoB64,"JPEG",6,14,28,28);

      // Badge nombre finca bajo logo
      doc.setFillColor(...PM); doc.roundedRect(5,46,30,8,2,2,"F");
      doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(fincaNombre.slice(0,12),20,51,{align:"center"});
      doc.setFontSize(4.5); doc.setFont("helvetica","normal");
      doc.text("CATTLE MANAGEMENT",20,54.5,{align:"center"});

      // Nombre finca grande
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(220,180,255);
      doc.text("GANADERIA",42,16);
      doc.setFontSize(22); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(fincaNombre.slice(0,16),42,30);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(200,160,255);
      doc.text("CATTLE MANAGEMENT",42,37);

      // Línea divisoria vertical
      doc.setDrawColor(126,34,206); doc.setLineWidth(0.5);
      doc.line(100,6,100,52);

      // Título comprobante
      doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("COMPROBANTE DE PAGO",106,18);
      // Badge número
      doc.setFillColor(255,255,255); doc.roundedRect(106,21,66,8,3,3,"F");
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
      doc.text(num,139,26.5,{align:"center"});
      // Fecha
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(220,200,255);
      doc.text("  "+fechaLarga,106,37);

      // QR (simulado)
      const qrX=W-24, qrY=8, qrS=18;
      doc.setFillColor(255,255,255); doc.rect(qrX-1,qrY-1,qrS+2,qrS+2,"F");
      const qCell=qrS/12;
      const qPat=[[1,1,1,1,1,0,1,1,0,1,1,1],[1,0,1,0,1,0,0,0,0,1,0,1],[1,0,1,0,1,0,1,1,0,1,0,1],[1,0,1,0,1,0,0,1,0,1,0,1],[1,1,1,1,1,0,1,0,0,1,1,1],[0,0,0,0,0,0,1,1,0,0,0,0],[1,0,1,1,0,1,0,1,1,0,1,1],[0,1,0,0,1,0,1,0,0,1,0,0],[1,1,1,0,1,0,1,1,0,1,1,0],[1,0,1,1,1,0,0,1,0,1,0,1],[0,0,1,0,0,0,1,0,1,0,1,1],[1,1,1,1,1,0,0,1,0,1,1,1]];
      qPat.forEach((row,ri)=>row.forEach((v,ci)=>{if(v){doc.setFillColor(...PD);doc.rect(qrX+ci*qCell,qrY+ri*qCell,qCell,qCell,"F");}}));
      doc.setFontSize(4); doc.setFont("helvetica","normal"); doc.setTextColor(200,160,255);
      doc.text("Verificar documento",qrX+qrS/2,qrY+qrS+4,{align:"center"});

      // ── BARRA INFO ─────────────────────────────────────────────────────────
      doc.setFillColor(240,235,255); doc.rect(0,58,W,18,"F");
      doc.setDrawColor(...PD); doc.setLineWidth(0.8); doc.line(0,58,W,58);
      const infoItems=[
        ["FINCA",fincaNombre.slice(0,16),"house"],
        ["UBICACION",(finca?.ubicacion||"Nicaragua").slice(0,20),"pin"],
        ["ADMINISTRADOR",adminNombre.slice(0,20),"person"],
      ];
      infoItems.forEach(([label,val,icon],i)=>{
        const ix=14+i*(W/3);
        // Icono círculo
        doc.setFillColor(...PL); doc.circle(ix,67,5,"F");
        doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
        doc.text(icon==="house"?"H":icon==="pin"?"P":"A",ix,69,{align:"center"});
        doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
        doc.text(label,ix+8,64);
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,10,60);
        doc.text(val,ix+8,70);
      });

      // ── MONTO TOTAL ────────────────────────────────────────────────────────
      let y=82;
      doc.setFillColor(255,255,255); doc.setDrawColor(...PL); doc.setLineWidth(1.5);
      doc.roundedRect(8,y,W-16,36,4,4,"FD");
      // Puntos decorativos
      for(let r=0;r<6;r++) for(let c=0;c<4;c++){doc.setFillColor(...PL);doc.circle(13+c*4,y+4+r*5.5,0.8,"F");}
      // Sello PAGADO
      doc.setFillColor(255,255,255); doc.setDrawColor(...PD); doc.setLineWidth(1.2);
      doc.circle(W-20,y+18,12,"FD");
      doc.setFillColor(...PD); doc.circle(W-20,y+18,9,"F");
      doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("PAGADO",W-20,y+16,{align:"center"});
      doc.setFontSize(9); doc.text("OK",W-20,y+21,{align:"center"});
      // Texto monto
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...PM);
      doc.text("MONTO TOTAL",W/2-10,y+9,{align:"center"});
      doc.setFontSize(28); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
      doc.text(`C$ ${monto.toLocaleString("es-NI")}`,W/2-10,y+24,{align:"center"});
      doc.setDrawColor(...PL); doc.setLineWidth(0.5); doc.line(30,y+27,W-38,y+27);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...PM);
      doc.text(numToWords(monto),W/2-10,y+33,{align:"center"});
      y+=42;

      // ── DOS COLUMNAS: DETALLE GASTO | DETALLE DE PAGO ─────────────────────
      const colL=8, colR=W/2+4, colW=(W-16)/2-2;
      const detH=80;

      // Columna izquierda
      doc.setFillColor(255,255,255); doc.setDrawColor(230,220,245); doc.setLineWidth(0.3);
      doc.roundedRect(colL,y,colW,detH,3,3,"FD");
      const filasDet=[
        ["DESCRIPCION",   g.descripcion||"—"],
        ["RESPONSABLE",   responsable.split(" — ")[0]||"—"],
        ["REGISTRADO POR",g.usuario?.nombre||"—"],
        ["FINCA",         finca?.nombre||"—"],
        ["CATEGORIA",     cat.value],
        ["PERIODICIDAD",  g.periodicidad],
        ...(g.notas?[["NOTA / OBSERVACIONES", g.notas]]:[]),
      ];
      let fy=y+8;
      filasDet.slice(0,7).forEach(([lbl,val])=>{
        doc.setFillColor(...PL); doc.circle(colL+6,fy,3.5,"F");
        doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
        doc.text(lbl,colL+12,fy-2.5);
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(25,10,50);
        doc.text(String(val||"—").slice(0,28),colL+12,fy+3);
        fy+=11;
      });

      // Columna derecha "DETALLE DE PAGO"
      doc.setFillColor(255,255,255); doc.roundedRect(colR,y,colW,detH,3,3,"FD");
      doc.setFillColor(...PD); doc.roundedRect(colR,y,colW,9,3,3,"F");
      doc.rect(colR,y+4,colW,5,"F");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("DETALLE DE PAGO",colR+colW/2,y+6.5,{align:"center"});
      let ry2=y+15;
      [
        ["METODO DE PAGO","EFECTIVO"],
        ["FECHA DE PAGO",  fechaLarga],
        ["REFERENCIA",     g.id?.slice(0,8).toUpperCase()||"N/A"],
        ["ESTADO",         "PAGADO"],
      ].forEach(([lbl,val])=>{
        doc.setFillColor(...PL); doc.circle(colR+6,ry2,3.5,"F");
        doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
        doc.text(lbl,colR+12,ry2-2.5);
        if(val==="PAGADO"){
          doc.setFillColor(220,252,231); doc.setDrawColor(21,128,61); doc.setLineWidth(0.3);
          doc.roundedRect(colR+12,ry2+0.5,18,5,2,2,"FD");
          doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(21,128,61);
          doc.text("PAGADO",colR+21,ry2+4,{align:"center"});
        } else {
          doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(25,10,50);
          doc.text(String(val).slice(0,26),colR+12,ry2+3);
        }
        ry2+=13;
      });
      y+=detH+6;

      // ── FIRMAS ─────────────────────────────────────────────────────────────
      doc.setFillColor(...PL); doc.roundedRect(8,y,W-16,62,4,4,"F");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
      doc.text("FIRMAS Y AUTORIZACIONES",16,y+8);
      doc.setDrawColor(...PM); doc.setLineWidth(0.4); doc.line(16,y+10,W-16,y+10);

      const firmas=[
        ["FIRMA DEL RESPONSABLE", responsable.split(" — ")[0]||adminNombre],
        ["FIRMA DEL TRABAJADOR",  receptor||"_______________"],
        ["FIRMA DEL ADMINISTRADOR",adminNombre],
      ];
      const fW3=(W-32)/4;
      firmas.forEach(([titulo,nombre],i)=>{
        const fx=12+i*(fW3+2);
        doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...PM);
        doc.text(titulo,fx+fW3/2,y+16,{align:"center"});
        // Zona firma
        doc.setFillColor(255,255,255); doc.roundedRect(fx,y+18,fW3,20,2,2,"F");
        // Nombre en cursiva simulada
        doc.setFontSize(10); doc.setFont("helvetica","bolditalic"); doc.setTextColor(50,20,100);
        doc.text(nombre.split(" ").slice(0,2).join(" "),fx+fW3/2,y+32,{align:"center"});
        // Línea bajo firma
        doc.setDrawColor(180,160,220); doc.setLineWidth(0.4);
        doc.line(fx+3,y+40,fx+fW3-3,y+40);
        doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(30,10,60);
        doc.text(nombre.slice(0,20),fx+fW3/2,y+45,{align:"center"});
        doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(150,130,180);
        doc.text("C.I: ___________",fx+fW3/2,y+51,{align:"center"});
      });
      // Caja "DOCUMENTO OFICIAL"
      const ox=12+3*(fW3+2);
      doc.setFillColor(255,255,255); doc.setDrawColor(...PD); doc.setLineWidth(0.5);
      doc.roundedRect(ox,y+14,fW3,46,3,3,"FD");
      // Escudo
      doc.setFillColor(...PL); doc.setDrawColor(...PD); doc.setLineWidth(0.5);
      doc.roundedRect(ox+fW3/2-6,y+18,12,12,2,2,"FD");
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
      doc.text("OK",ox+fW3/2,y+26,{align:"center"});
      doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(...PD);
      doc.text("DOCUMENTO OFICIAL",ox+fW3/2,y+35,{align:"center"});
      doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(100,80,140);
      doc.text("Este comprobante es un",ox+fW3/2,y+42,{align:"center"});
      doc.text("documento oficial de la",ox+fW3/2,y+47,{align:"center"});
      doc.text("empresa y tiene validez",ox+fW3/2,y+52,{align:"center"});
      doc.text("legal y contable.",ox+fW3/2,y+57,{align:"center"});
      y+=68;

      // ── FOOTER ─────────────────────────────────────────────────────────────
      doc.setFillColor(...PD); doc.rect(0,H-16,W,16,"F");
      doc.setDrawColor(...PM); doc.setLineWidth(0.6); doc.line(0,H-16,W,H-16);
      // Secciones footer
      const footItems=[
        {icon:"S",label:"Documento generado por",val:"Henriquez Cattle Management ERP",x:12},
        {icon:"V",label:"VERSION",val:"2.0",x:W*0.38},
        {icon:"D",label:"DOCUMENTO",val:"OFICIAL",x:W*0.54},
        {icon:"P",label:"PAGINA",val:"1 de 1",x:W*0.68},
        {icon:"B",label:"",val:"Gracias por su compromiso con la excelencia ganadera!",x:W*0.80},
      ];
      footItems.forEach(({icon,label,val,x})=>{
        doc.setFillColor(...PM); doc.circle(x,H-9,3,"F");
        doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text(icon,x,H-8,{align:"center"});
        doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(200,160,255);
        if(label) doc.text(label,x+5,H-12);
        doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text(val.slice(0,24),x+5,H-6);
      });

      doc.save(`${num}.pdf`);
    } catch(e) { setError("Error generando comprobante: "+e.message); console.error(e); }
  }

  const esAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    total: data.gastos.filter((g) => g.categoria === c.value).reduce((s, g) => s + g.monto, 0),
    count: data.gastos.filter((g) => g.categoria === c.value).length,
  })).filter((c) => c.count > 0);

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
            titulo="Nuevo Gasto" onCancel={() => setShowForm(false)}
            usuarios={usuarios} finca={finca} enviando={enviando} />
        )}

        {/* Modal editar */}
        {editando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
              <FormGasto values={formEdit} onChange={setFormEdit} onSubmit={handleEditar}
                titulo="Editar Gasto" onCancel={() => setEditando(null)}
                usuarios={usuarios} finca={finca} enviando={enviando} />
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
