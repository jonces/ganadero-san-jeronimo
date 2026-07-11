"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";

const TIPOS_LABEL = { OBSERVACION:"Observacion", VACUNACION:"Vacunacion", TRATAMIENTO:"Tratamiento", PESAJE:"Pesaje", PARTO:"Parto", MOVIMIENTO:"Movimiento" };
const TIPOS_COLOR = { VACUNACION:[49,130,206], TRATAMIENTO:[229,62,62], PESAJE:[214,158,46], PARTO:[128,90,213], MOVIMIENTO:[45,158,63], OBSERVACION:[113,128,150] };

async function generarInformeAnimal(animal, finca) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const GD=[20,100,40], GM=[45,158,63], GL=[232,245,233], GR=[100,100,110];
  let y = 0;

  // ── HEADER ────────────────────────────────────────────────────────────────
  doc.setFillColor(...GD); doc.rect(0,0,W,48,"F");
  doc.setFillColor(255,255,255); doc.circle(22,24,14,"F");
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(...GD);
  doc.text((animal.nombre||animal.identificador).slice(0,2).toUpperCase(),22,27,{align:"center"});
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
  doc.text("GANADERIA",42,14);
  doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text((finca?.nombre||"MI FINCA").toUpperCase(),42,24);
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
  doc.text("CATTLE MANAGEMENT",42,31);
  doc.setDrawColor(255,255,255); doc.setLineWidth(0.3); doc.line(120,8,120,40);
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text("INFORME DE ANIMAL",163,18,{align:"center"});
  doc.setDrawColor(255,255,255); doc.setLineWidth(0.4); doc.roundedRect(125,22,76,8,2,2,"D");
  doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text(`Arete: ${animal.identificador}`,163,27.5,{align:"center"});
  doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
  doc.text(new Date().toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"}),163,35,{align:"center"});

  // ── BARRA INFO ─────────────────────────────────────────────────────────────
  doc.setFillColor(245,250,245); doc.rect(0,48,W,14,"F");
  doc.setDrawColor(...GM); doc.setLineWidth(0.3); doc.line(0,48,W,48); doc.line(0,62,W,62);
  [{icon:"F",label:"FINCA",val:finca?.nombre||"—"},{icon:"U",label:"UBICACION",val:finca?.ubicacion||"—"},{icon:"S",label:"SEXO",val:animal.sexo==="HEMBRA"?"Hembra":"Macho"},{icon:"E",label:"ESTADO",val:animal.estado||"ACTIVO"}].forEach(({icon,label,val},i)=>{
    const x=12+i*50;
    doc.setFillColor(...GM); doc.circle(x,55,3.5,"F");
    doc.setFontSize(5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255); doc.text(icon,x,56.5,{align:"center"});
    doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(...GR); doc.text(label,x+6,52.5);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...GD); doc.text(String(val).slice(0,20),x+6,58);
  });
  y = 70;

  const secTitulo = (txt,yy) => {
    doc.setFillColor(...GL); doc.roundedRect(8,yy,W-16,8,2,2,"F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...GD); doc.text(txt,12,yy+5.5);
    return yy+12;
  };

  // ── DATOS GENERALES ─────────────────────────────────────────────────────────
  y = secTitulo("DATOS GENERALES DEL ANIMAL",y);
  const edad = animal.fechaNacimiento ? (()=>{const d=Math.floor((Date.now()-new Date(animal.fechaNacimiento))/86400000);return d>=365?`${Math.floor(d/365)} año(s) ${Math.floor((d%365)/30)} mes(es)`:`${d} dias`;})() : "No registrada";
  const colW2=(W-20)/2;
  [["Nombre",animal.nombre||"Sin nombre"],["Arete / ID",animal.identificador],["Raza",animal.raza||"No registrada"],["Sexo",animal.sexo==="HEMBRA"?"Hembra":"Macho"],["Fecha de nacimiento",animal.fechaNacimiento?new Date(animal.fechaNacimiento).toLocaleDateString("es",{dateStyle:"long"}):"No registrada"],["Edad aproximada",edad],["Peso actual",animal.pesoActual?`${animal.pesoActual} kg`:"No registrado"],["Fierro / marca",animal.fierro||"Sin fierro"],["Estado",animal.estado||"ACTIVO"],["Estado reproductivo",animal.estadoReproductivo||"—"],["Observaciones",animal.observacion||"—"]].forEach(([lbl,val],i)=>{
    const col=i%2,row=Math.floor(i/2),cx=10+col*(colW2+4),cy=y+row*10;
    if(col===0){doc.setFillColor(248,252,248);doc.rect(10,cy-1,W-20,9,"F");}
    doc.setFontSize(5.5);doc.setFont("helvetica","bold");doc.setTextColor(...GR);doc.text(lbl.toUpperCase(),cx+1,cy+3);
    doc.setFontSize(7.5);doc.setFont("helvetica","bold");doc.setTextColor(20,60,20);doc.text(String(val).slice(0,28),cx+1,cy+8);
  });
  y += Math.ceil(11/2)*10+6;

  // ── MADRE ──────────────────────────────────────────────────────────────────
  if(animal.madre){
    y = secTitulo("INFORMACION DE LA MADRE",y);
    [["Nombre de la madre",animal.madre.nombre||"Sin nombre"],["Arete / ID de la madre",animal.madre.identificador],["Raza",animal.madre.raza||"No registrada"]].forEach(([lbl,val],i)=>{
      const col=i%2,row=Math.floor(i/2),cx=10+col*(colW2+4),cy=y+row*10;
      doc.setFontSize(5.5);doc.setFont("helvetica","bold");doc.setTextColor(...GR);doc.text(lbl.toUpperCase(),cx+1,cy+3);
      doc.setFontSize(7.5);doc.setFont("helvetica","bold");doc.setTextColor(20,60,20);doc.text(String(val).slice(0,28),cx+1,cy+8);
    });
    y += 2*10+6;
  }

  // ── VACUNACIONES RESUMEN ────────────────────────────────────────────────────
  const vacunas=(animal.eventos||[]).filter(ev=>ev.tipo==="VACUNACION");
  if(vacunas.length>0){
    if(y>H-50){doc.addPage();y=15;}
    y = secTitulo(`VACUNACIONES APLICADAS (${vacunas.length})`,y);
    vacunas.forEach((v,i)=>{
      if(y>H-20){doc.addPage();y=15;}
      const fechaV=new Date(v.fecha).toLocaleDateString("es",{dateStyle:"medium"});
      doc.setFillColor(232,240,255);doc.setDrawColor(49,130,206);doc.setLineWidth(0.3);doc.roundedRect(8,y,W-16,10,2,2,"FD");
      doc.setFontSize(6);doc.setFont("helvetica","bold");doc.setTextColor(49,130,206);doc.text(`${i+1}.`,13,y+6.5);
      doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(20,40,80);doc.text(String(v.descripcion||"Vacunacion sin detalle").slice(0,65),20,y+6.5);
      doc.setFontSize(6.5);doc.setFont("helvetica","normal");doc.setTextColor(100,120,140);doc.text(fechaV,W-12,y+6.5,{align:"right"});
      y+=13;
    });
  }

  // ── HISTORIAL COMPLETO ──────────────────────────────────────────────────────
  if((animal.eventos||[]).length>0){
    if(y>H-50){doc.addPage();y=15;}
    y = secTitulo(`HISTORIAL COMPLETO DE EVENTOS (${animal.eventos.length})`,y);
    // Resumen por tipo
    const res={};(animal.eventos||[]).forEach(ev=>{res[ev.tipo]=(res[ev.tipo]||0)+1;});
    Object.entries(res).forEach(([tipo,cnt],i)=>{
      const col=i%4,row=Math.floor(i/4),bx=10+col*48,by=y+row*14;
      const c=TIPOS_COLOR[tipo]||[100,100,100];
      doc.setFillColor(...c);doc.roundedRect(bx,by,44,11,2,2,"F");
      doc.setFontSize(6);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);doc.text(TIPOS_LABEL[tipo]||tipo,bx+22,by+4.5,{align:"center"});
      doc.setFontSize(10);doc.setFont("helvetica","bold");doc.text(String(cnt),bx+22,by+10,{align:"center"});
    });
    y += Math.ceil(Object.keys(res).length/4)*14+6;
    // Listado
    (animal.eventos||[]).forEach(ev=>{
      if(y>H-25){doc.addPage();y=15;}
      const c=TIPOS_COLOR[ev.tipo]||[113,128,150];
      const fechaEv=new Date(ev.fecha).toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"});
      const descLines=doc.splitTextToSize(ev.descripcion||"Sin descripcion",W-50);
      const evH=Math.max(12,descLines.length*4+8);
      doc.setFillColor(248,252,248);doc.setDrawColor(200,230,200);doc.setLineWidth(0.3);doc.roundedRect(8,y,W-16,evH,2,2,"FD");
      doc.setFillColor(...c);doc.roundedRect(10,y+2,28,7,1,1,"F");
      doc.setFontSize(5.5);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);doc.text(TIPOS_LABEL[ev.tipo]||ev.tipo,24,y+6.5,{align:"center"});
      doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(...GR);doc.text(fechaEv,W-12,y+6,{align:"right"});
      doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(30,60,30);doc.text(descLines,42,y+6);
      if(ev.peso){doc.setFontSize(6.5);doc.setFont("helvetica","bold");doc.setTextColor(...GM);doc.text(`Peso: ${ev.peso} kg`,42,y+evH-3);}
      if(ev.usuario?.nombre){doc.setFontSize(5.5);doc.setFont("helvetica","normal");doc.setTextColor(...GR);doc.text(`Registrado por: ${ev.usuario.nombre}`,W-12,y+evH-3,{align:"right"});}
      y+=evH+3;
    });
  }

  // ── FOOTER EN CADA PÁGINA ──────────────────────────────────────────────────
  const totalPags=doc.getNumberOfPages();
  for(let p=1;p<=totalPags;p++){
    doc.setPage(p);
    doc.setFillColor(...GD);doc.rect(0,H-14,W,14,"F");
    doc.setDrawColor(...GM);doc.setLineWidth(0.5);doc.line(0,H-14,W,H-14);
    doc.setFontSize(6);doc.setFont("helvetica","bold");doc.setTextColor(180,220,180);
    doc.text("Henriquez Cattle Management ERP",12,H-7);
    doc.text(`Pag. ${p} / ${totalPags}`,W-12,H-7,{align:"right"});
    doc.setTextColor(255,255,255);
    doc.text(`Informe: ${animal.nombre||animal.identificador} | ${new Date().toLocaleDateString("es")}`,W/2,H-7,{align:"center"});
  }
  doc.save(`informe-${animal.identificador}-${new Date().toISOString().slice(0,10)}.pdf`);
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const REPRO_CONFIG = {
  PREÑADA:   { label: "Preñada",   color: "#e53e3e", bg: "rgba(229,62,62,0.2)",   icon: "🤰" },
  LACTANCIA: { label: "Lactancia", color: "#38a169", bg: "rgba(56,161,105,0.2)",  icon: "🍼" },
  PARIDA:    { label: "Parida",    color: "#d69e2e", bg: "rgba(214,158,46,0.2)",  icon: "🐮" },
  SECA:      { label: "Seca",      color: "#718096", bg: "rgba(113,128,150,0.2)", icon: "🌵" },
  VACIA:     { label: "Vacía",     color: "#805ad5", bg: "rgba(128,90,213,0.2)",  icon: "⬜" },
};
const ESTADOS_REPRO = ["PREÑADA", "LACTANCIA", "PARIDA", "SECA", "VACIA"];

const glass = { background: "rgba(5,25,12,0.70)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" };
const gi = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" };

export default function AnimalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [animal, setAnimal] = useState(null);
  const [finca,  setFinca]  = useState(null);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [nuevosArchivos, setNuevosArchivos] = useState([]);
  const [eliminandoMedia, setEliminandoMedia] = useState(null);
  const [form, setForm] = useState({});

  async function load() {
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No encontrado");
      setAnimal(data);
      setForm({
        nombre: data.nombre || "",
        raza: data.raza || "",
        fierro: data.fierro || "",
        pesoActual: data.pesoActual || "",
        observacion: data.observacion || "",
        estadoReproductivo: data.estadoReproductivo || "",
        estado: data.estado || "ACTIVO",
      });
      const fi = await api("/fincas/mi-finca").catch(()=>null);
      setFinca(fi);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);


  async function handleDescargar() {
    setGenerando(true);
    try { await generarInformeAnimal(animal, finca); }
    catch(e){ setError("Error generando informe: "+e.message); }
    finally { setGenerando(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          ...form,
          pesoActual: form.pesoActual ? Number(form.pesoActual) : null,
          estadoReproductivo: animal?.sexo === "HEMBRA" ? (form.estadoReproductivo || null) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      // Subir nuevos archivos si hay
      if (nuevosArchivos.length > 0) {
        const fd = new FormData();
        Array.from(nuevosArchivos).forEach(f => fd.append("archivos", f));
        await fetch(`${API_URL}/animales/${id}/media`, {
          method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
        });
        setNuevosArchivos([]);
      }
      await load();
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminarMedia(mediaId) {
    setEliminandoMedia(mediaId);
    try {
      await fetch(`${API_URL}/animales/${id}/media/${mediaId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
      });
      await load();
      setMediaIdx(0);
    } catch (err) {
      setError("No se pudo eliminar el archivo");
    } finally {
      setEliminandoMedia(null);
    }
  }

  async function handleDelete() {
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        // Si no hay DELETE, marcar como VENDIDO/eliminado lógicamente
        await fetch(`${API_URL}/animales/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ estado: "ELIMINADO" }),
        });
      }
      router.push("/inventario");
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  const todosMedia = animal?.media || [];
  const fotos = todosMedia.filter(m => m.tipo === "FOTO");
  const mediaActual = todosMedia[mediaIdx];
  const repro = animal?.estadoReproductivo ? REPRO_CONFIG[animal.estadoReproductivo] : null;

  if (error) return (
    <AppLayout title="Animal" subtitle="Inventario">
      <div className="text-center py-20">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={() => router.push("/inventario")} className="text-green-400 underline">← Volver al inventario</button>
      </div>
    </AppLayout>
  );

  if (!animal) return (
    <AppLayout title="Cargando..." subtitle="Inventario">
      <div className="text-center py-20 text-white/40 text-lg animate-pulse">Cargando animal...</div>
    </AppLayout>
  );

  return (
    <AppLayout title={animal.nombre || animal.identificador} subtitle="Perfil del Animal">

      {error && (
        <div className="mb-4 text-red-300 text-sm p-3 rounded-xl flex items-center justify-between"
          style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}>
          {error}<button onClick={() => setError("")} className="ml-4">✕</button>
        </div>
      )}

      {/* Galería de fotos y videos */}
      {todosMedia.length > 0 && (
        <div className="rounded-3xl overflow-hidden mb-4 shadow-2xl relative" style={{ background: "#000" }}>
          {/* Visor principal */}
          {mediaActual?.tipo === "VIDEO" ? (
            <video
              key={mediaActual.url}
              src={mediaActual.url}
              controls
              playsInline
              className="w-full"
              style={{ maxHeight: 320, background: "#000", display: "block" }}
            />
          ) : (
            <img src={mediaActual?.url} className="w-full object-cover" style={{ maxHeight: 280 }}
              onError={e => { e.target.style.display="none"; }} />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="text-white font-black px-3 py-1 rounded-full text-sm"
              style={{ background: animal.sexo === "HEMBRA" ? "rgba(246,135,179,0.85)" : "rgba(99,179,237,0.85)" }}>
              {animal.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho"}
            </span>
          </div>
          {animal.estado === "VENDIDO" && (
            <div className="absolute top-3 right-3 text-white font-black px-3 py-1 rounded-full text-sm"
              style={{ background: "#d69e2e" }}>💰 Vendido</div>
          )}
          {mediaActual?.tipo === "VIDEO" && (
            <div className="absolute top-3" style={{ left: "50%", transform: "translateX(-50%)" }}>
              <span className="text-white font-black px-3 py-1 rounded-full text-xs"
                style={{ background: "rgba(0,0,0,0.6)" }}>🎬 Video</span>
            </div>
          )}

          {/* Miniaturas si hay más de 1 */}
          {todosMedia.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto" style={{ background: "rgba(0,0,0,0.6)" }}>
              {todosMedia.map((m, i) => (
                <button key={i} onClick={() => setMediaIdx(i)}
                  className="relative shrink-0 rounded-xl overflow-hidden transition-all hover:scale-105"
                  style={{ width: 60, height: 60, border: i === mediaIdx ? "2px solid #4ade80" : "2px solid transparent" }}>
                  {m.tipo === "VIDEO" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: "linear-gradient(135deg,#1a3a6c,#2d9e3f)" }}>
                      <span style={{ fontSize: 22 }}>▶️</span>
                      <span className="text-white font-black" style={{ fontSize: 9 }}>VIDEO</span>
                    </div>
                  ) : (
                    <img src={m.url} className="w-full h-full object-cover"
                      onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(45,158,63,0.2);font-size:20px">🐄</div>'; }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info principal */}
      <div className="rounded-3xl p-5 mb-4 shadow-xl" style={glass}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {fotos.length === 0 && (
              <div className="text-5xl mb-2">{animal.sexo === "HEMBRA" ? "🐄" : "🐂"}</div>
            )}
            <h2 className="text-white font-black text-2xl">{animal.nombre || "Sin nombre"}</h2>
            <p className="text-white/50 text-sm">Arete/ID: <span className="text-white font-bold">{animal.identificador}</span></p>
          </div>
          {repro && (
            <div className="px-3 py-2 rounded-2xl text-center shrink-0" style={{ background: repro.bg, border: `1px solid ${repro.color}` }}>
              <p className="text-2xl">{repro.icon}</p>
              <p className="font-black text-xs mt-0.5" style={{ color: repro.color }}>{repro.label}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Raza", value: animal.raza },
            { label: "Fierro", value: animal.fierro },
            { label: "Peso", value: animal.pesoActual ? `${animal.pesoActual} kg` : null },
            { label: "Estado", value: animal.estado },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40 text-xs">{f.label}</p>
              <p className="text-white font-bold text-sm mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>

        {animal.observacion && (
          <div className="mt-3 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="text-white/40 text-xs mb-1">Observación</p>
            <p className="text-white/80 text-sm">{animal.observacion}</p>
          </div>
        )}

        {/* Parentesco */}
        {animal.madre && (
          <div className="mt-3 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80"
            style={{ background: "rgba(56,161,105,0.15)", border: "1px solid rgba(56,161,105,0.3)" }}
            onClick={() => router.push(`/inventario/${animal.madre.id}`)}>
            <span className="text-2xl">🐄</span>
            <div>
              <p className="text-white/50 text-xs">Madre</p>
              <p className="text-white font-bold">{animal.madre.nombre || animal.madre.identificador}</p>
            </div>
            <span className="ml-auto text-white/30">→</span>
          </div>
        )}
        {animal.crias?.length > 0 && (
          <div className="mt-3">
            <p className="text-white/40 text-xs mb-2">Crías ({animal.crias.length})</p>
            <div className="flex flex-col gap-2">
              {animal.crias.map(c => (
                <div key={c.id} className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:opacity-80"
                  style={{ background: "rgba(56,161,105,0.1)", border: "1px solid rgba(56,161,105,0.2)" }}
                  onClick={() => router.push(`/inventario/${c.id}`)}>
                  <span className="text-xl">🐃</span>
                  <p className="text-white font-bold text-sm">{c.nombre || c.identificador}</p>
                  <span className="ml-auto text-white/30">→</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Últimos eventos */}
      {animal.eventos?.length > 0 && (
        <div className="rounded-3xl p-5 mb-4 shadow-xl" style={glass}>
          <h3 className="text-white font-black mb-3">📋 Últimos Eventos</h3>
          <div className="space-y-2">
            {animal.eventos.slice(0, 5).map(ev => (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "#2d9e3f" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{ev.tipo}</p>
                  {ev.descripcion && <p className="text-white/50 text-xs">{ev.descripcion}</p>}
                  {ev.peso && <p className="text-green-400 text-xs">⚖️ {ev.peso} kg</p>}
                </div>
                <p className="text-white/30 text-xs shrink-0">{new Date(ev.fecha).toLocaleDateString("es", { dateStyle: "short" })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      {!editando && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button onClick={() => setEditando(true)}
            className="text-white font-black py-4 rounded-2xl text-base shadow-xl hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)", border: "1px solid rgba(255,255,255,0.2)" }}>
            ✏️ Editar
          </button>
          <button onClick={() => setShowPreview(true)} disabled={generando}
            className="text-white font-black py-4 rounded-2xl text-base shadow-xl hover:scale-105 transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#1a3a6c,#2980b9)", border: "1px solid rgba(255,255,255,0.2)" }}>
            {generando ? "..." : "📋 Informe"}
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="text-white font-black py-4 rounded-2xl text-base shadow-xl hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#9b2626,#e53e3e)", border: "1px solid rgba(255,255,255,0.2)" }}>
            🗑️ Eliminar
          </button>
        </div>
      )}

      {/* Formulario de edición */}
      {editando && (
        <form onSubmit={handleEdit} className="rounded-3xl p-5 mb-4 space-y-4 shadow-xl" style={glass}>
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-lg">✏️ Editar Animal</h3>
            <button type="button" onClick={() => setEditando(false)} className="text-white/40 text-2xl leading-none">✕</button>
          </div>

          {/* Fotos y videos actuales */}
          {todosMedia.length > 0 && (
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Fotos y Videos actuales</p>
              <div className="flex gap-2 flex-wrap">
                {todosMedia.map((m) => (
                  <div key={m.id} className="relative rounded-xl overflow-hidden shrink-0" style={{ width: 72, height: 72 }}>
                    {m.tipo === "VIDEO"
                      ? <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{ background: "linear-gradient(135deg,#1a3a6c,#2d9e3f)" }}>
                          <span style={{ fontSize: 20 }}>▶️</span>
                          <span className="text-white font-black" style={{ fontSize: 8 }}>VIDEO</span>
                        </div>
                      : <img src={m.url} className="w-full h-full object-cover" onError={e => e.target.style.opacity=0.3} />
                    }
                    <button type="button" onClick={() => eliminarMedia(m.id)}
                      disabled={eliminandoMedia === m.id}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-black"
                      style={{ background: "rgba(220,38,38,0.9)", fontSize: 10 }}>
                      {eliminandoMedia === m.id ? "…" : "✕"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar nuevos archivos */}
          <div className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)" }}>
            <p className="text-white/50 text-xs mb-2">➕ Agregar fotos o videos nuevos</p>
            <input type="file" accept="image/*,video/*" multiple className="w-full text-white/60 text-sm"
              onChange={e => setNuevosArchivos(e.target.files)} />
            {nuevosArchivos.length > 0 && (
              <p className="text-green-400 text-xs mt-2 font-bold">✅ {nuevosArchivos.length} archivo{nuevosArchivos.length > 1 ? "s" : ""} listo{nuevosArchivos.length > 1 ? "s" : ""} para subir</p>
            )}
          </div>

          {/* Campos de info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs">Nombre</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Nombre del animal" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Raza</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: Brahman" value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Fierro</label>
              <input className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: M20" value={form.fierro} onChange={e => setForm({ ...form, fierro: e.target.value })} />
            </div>
            <div>
              <label className="text-white/50 text-xs">Peso (kg)</label>
              <input type="number" className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                placeholder="Ej: 350" value={form.pesoActual} onChange={e => setForm({ ...form, pesoActual: e.target.value })} />
            </div>
            {animal.sexo === "HEMBRA" && (
              <div className="sm:col-span-2">
                <label className="text-white/50 text-xs">Estado Reproductivo</label>
                <select className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                  value={form.estadoReproductivo} onChange={e => setForm({ ...form, estadoReproductivo: e.target.value })}>
                  <option value="">Sin definir</option>
                  {ESTADOS_REPRO.map(e => (
                    <option key={e} value={e}>{REPRO_CONFIG[e].icon} {REPRO_CONFIG[e].label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs">Estado</label>
              <select className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi}
                value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="ACTIVO">Activo</option>
                <option value="VENDIDO">Vendido</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs">Observación</label>
              <textarea className="w-full rounded-xl px-3 py-3 text-white text-base mt-0.5" style={gi} rows={3}
                placeholder="Notas sobre este animal..." value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={() => setEditando(false)}
              className="text-white/60 font-bold py-3 rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}
              className="text-white font-black py-3 rounded-2xl disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
              {enviando ? "Guardando..." : "✅ Guardar"}
            </button>
          </div>
        </form>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl" style={glass}>
            <div className="text-center">
              <p className="text-5xl mb-3">⚠️</p>
              <h3 className="text-white font-black text-xl">¿Eliminar animal?</h3>
              <p className="text-white/50 text-sm mt-2">
                Esta acción eliminará <span className="text-white font-bold">{animal.nombre || animal.identificador}</span> del inventario permanentemente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="text-white/60 font-bold py-3 rounded-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={enviando}
                className="text-white font-black py-3 rounded-2xl disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#9b2626,#e53e3e)" }}>
                {enviando ? "..." : "🗑️ Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL VISTA PREVIA DEL INFORME ── */}
      {showPreview && animal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full sm:max-w-lg max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
            style={{ background: "#0a1a0f" }}>

            {/* Header del modal */}
            <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between rounded-t-3xl"
              style={{ background: "linear-gradient(135deg,#1a6b2a,#2d9e3f)" }}>
              <div>
                <p className="text-green-200 text-xs font-bold uppercase tracking-widest">Vista previa del informe</p>
                <h2 className="text-white font-black text-xl">{animal.nombre || animal.identificador}</h2>
              </div>
              <button onClick={() => setShowPreview(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-lg"
                style={{ background: "rgba(0,0,0,0.3)" }}>✕</button>
            </div>

            <div className="p-5 space-y-4">

              {/* Datos generales */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(45,158,63,0.3)" }}>
                <div className="px-4 py-2" style={{ background: "rgba(45,158,63,0.2)" }}>
                  <p className="text-green-300 font-black text-xs uppercase tracking-widest">Datos Generales</p>
                </div>
                <div className="grid grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {[
                    ["Nombre",        animal.nombre || "Sin nombre"],
                    ["Arete / ID",    animal.identificador],
                    ["Raza",          animal.raza || "No registrada"],
                    ["Sexo",          animal.sexo === "HEMBRA" ? "♀ Hembra" : "♂ Macho"],
                    ["Fecha de nac.", animal.fechaNacimiento ? new Date(animal.fechaNacimiento).toLocaleDateString("es", { dateStyle: "medium" }) : "No registrada"],
                    ["Edad",          animal.fechaNacimiento ? (()=>{ const d=Math.floor((Date.now()-new Date(animal.fechaNacimiento))/86400000); return d>=365?`${Math.floor(d/365)} año(s)`:`${d} días`; })() : "—"],
                    ["Peso actual",   animal.pesoActual ? `${animal.pesoActual} kg` : "No registrado"],
                    ["Fierro",        animal.fierro || "Sin fierro"],
                    ["Estado",        animal.estado || "ACTIVO"],
                    ["Estado reprod.",animal.estadoReproductivo || "—"],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="px-3 py-2" style={{ background: "rgba(5,25,12,0.6)" }}>
                      <p className="text-white/40 text-xs">{lbl}</p>
                      <p className="text-white font-bold text-sm">{val}</p>
                    </div>
                  ))}
                </div>
                {animal.observacion && (
                  <div className="px-4 py-3" style={{ background: "rgba(5,25,12,0.4)" }}>
                    <p className="text-white/40 text-xs">Observaciones</p>
                    <p className="text-white text-sm mt-0.5">{animal.observacion}</p>
                  </div>
                )}
              </div>

              {/* Madre */}
              {animal.madre && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(214,158,46,0.3)" }}>
                  <div className="px-4 py-2" style={{ background: "rgba(214,158,46,0.15)" }}>
                    <p className="text-yellow-300 font-black text-xs uppercase tracking-widest">Información de la Madre</p>
                  </div>
                  <div className="grid grid-cols-2 gap-px">
                    {[
                      ["Nombre de la madre", animal.madre.nombre || "Sin nombre"],
                      ["Arete de la madre",  animal.madre.identificador],
                      ["Raza",               animal.madre.raza || "No registrada"],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="px-3 py-2" style={{ background: "rgba(5,25,12,0.6)" }}>
                        <p className="text-white/40 text-xs">{lbl}</p>
                        <p className="text-white font-bold text-sm">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vacunaciones */}
              {(animal.eventos||[]).filter(e=>e.tipo==="VACUNACION").length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(49,130,206,0.4)" }}>
                  <div className="px-4 py-2" style={{ background: "rgba(49,130,206,0.15)" }}>
                    <p className="text-blue-300 font-black text-xs uppercase tracking-widest">
                      Vacunaciones — {(animal.eventos||[]).filter(e=>e.tipo==="VACUNACION").length} aplicadas
                    </p>
                  </div>
                  <div className="divide-y" style={{ borderColor: "rgba(49,130,206,0.15)" }}>
                    {(animal.eventos||[]).filter(e=>e.tipo==="VACUNACION").map((v,i) => (
                      <div key={v.id} className="flex items-start gap-3 px-4 py-3" style={{ background: "rgba(5,25,12,0.6)" }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                          style={{ background: "rgba(49,130,206,0.3)", color: "#90cdf4" }}>{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{v.descripcion || "Sin detalle"}</p>
                          <p className="text-blue-300 text-xs mt-0.5">{new Date(v.fecha).toLocaleDateString("es", { dateStyle: "medium" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historial de eventos */}
              {(animal.eventos||[]).length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="px-4 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-white/60 font-black text-xs uppercase tracking-widest">
                      Historial completo — {animal.eventos.length} eventos
                    </p>
                  </div>
                  {/* Resumen por tipo */}
                  <div className="flex flex-wrap gap-2 px-4 py-3" style={{ background: "rgba(5,25,12,0.4)" }}>
                    {Object.entries((animal.eventos||[]).reduce((acc,ev)=>({...acc,[ev.tipo]:(acc[ev.tipo]||0)+1}),{})).map(([tipo,cnt])=>{
                      const cols={VACUNACION:"#3182ce",TRATAMIENTO:"#e53e3e",PESAJE:"#d69e2e",PARTO:"#805ad5",MOVIMIENTO:"#2d9e3f",OBSERVACION:"#718096"};
                      return (
                        <span key={tipo} className="px-2 py-1 rounded-lg text-white text-xs font-bold"
                          style={{ background: cols[tipo]||"#718096" }}>
                          {TIPOS_LABEL[tipo]||tipo}: {cnt}
                        </span>
                      );
                    })}
                  </div>
                  <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {(animal.eventos||[]).map(ev => {
                      const cols={VACUNACION:"#3182ce",TRATAMIENTO:"#e53e3e",PESAJE:"#d69e2e",PARTO:"#805ad5",MOVIMIENTO:"#2d9e3f",OBSERVACION:"#718096"};
                      return (
                        <div key={ev.id} className="flex items-start gap-3 px-4 py-3" style={{ background: "rgba(5,25,12,0.5)" }}>
                          <span className="px-2 py-0.5 rounded-md text-white text-xs font-black shrink-0 mt-0.5"
                            style={{ background: cols[ev.tipo]||"#718096" }}>
                            {TIPOS_LABEL[ev.tipo]||ev.tipo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">{ev.descripcion || "Sin descripcion"}</p>
                            {ev.peso && <p className="text-yellow-400 text-xs mt-0.5">Peso: {ev.peso} kg</p>}
                            <p className="text-white/30 text-xs mt-0.5">{new Date(ev.fecha).toLocaleDateString("es", { dateStyle: "medium" })}{ev.usuario?.nombre ? ` · ${ev.usuario.nombre}` : ""}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(animal.eventos||[]).length === 0 && !animal.madre && (
                <div className="text-center py-6 text-white/30">
                  <p className="text-4xl mb-2">📋</p>
                  <p>Este animal aún no tiene historial registrado</p>
                </div>
              )}
            </div>

            {/* Botones fijos abajo */}
            <div className="sticky bottom-0 px-5 py-4 flex gap-3"
              style={{ background: "#0a1a0f", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={() => setShowPreview(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-white/60 text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
                Cerrar
              </button>
              <button onClick={() => { setShowPreview(false); handleDescargar(); }}
                disabled={generando}
                className="flex-1 py-3 rounded-2xl font-black text-white text-sm disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#1a3a6c,#2980b9)" }}>
                {generando ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
