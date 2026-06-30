"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }

const ESTADOS_REPRO = ["PREÑADA", "LACTANCIA", "PARIDA", "SECA", "VACIA"];
const REPRO_CONFIG = {
  PREÑADA:   { label: "Preñada",   color: "#e53e3e", bg: "rgba(229,62,62,0.2)",   icon: "🤰" },
  LACTANCIA: { label: "Lactancia", color: "#38a169", bg: "rgba(56,161,105,0.2)",  icon: "🍼" },
  PARIDA:    { label: "Parida",    color: "#d69e2e", bg: "rgba(214,158,46,0.2)",  icon: "🐮" },
  SECA:      { label: "Seca",      color: "#718096", bg: "rgba(113,128,150,0.2)", icon: "🌵" },
  VACIA:     { label: "Vacía",     color: "#805ad5", bg: "rgba(128,90,213,0.2)",  icon: "⬜" },
};

export default function InventarioPage() {
  const router = useRouter();
  const [animales, setAnimales] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showParto, setShowParto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [filtro, setFiltro] = useState("TODOS");
  const [form, setForm] = useState({ identificador:"",nombre:"",raza:"",fierro:"",sexo:"HEMBRA",pesoActual:"",observacion:"",estadoReproductivo:"",madreId:"" });
  const [formParto, setFormParto] = useState({ identificadorCria:"",nombreCria:"",sexoCria:"HEMBRA",pesoNacimiento:"" });

  async function load() {
    try {
      const data = await api("/animales");
      setAnimales(Array.isArray(data) ? data : []);
    } catch(err) {
      setError(err.message);
      if(err.message.includes("autenticado")||err.message.includes("inválido")) router.push("/");
    }
  }

  useEffect(() => { load(); const i=setInterval(load,15000); return ()=>clearInterval(i); }, []);

  async function handleCreate(e) {
    e.preventDefault(); setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales`, {
        method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
        body: JSON.stringify({...form, estadoReproductivo: form.sexo==="HEMBRA"?form.estadoReproductivo:undefined }),
      });
      const animal = await res.json();
      if(!res.ok) throw new Error(animal.error||"Error");
      if(archivos.length>0){
        const fd=new FormData(); Array.from(archivos).forEach(f=>fd.append("archivos",f));
        await fetch(`${API_URL}/animales/${animal.id}/media`,{method:"POST",headers:{Authorization:`Bearer ${getToken()}`},body:fd});
      }
      setForm({identificador:"",nombre:"",raza:"",fierro:"",sexo:"HEMBRA",pesoActual:"",observacion:"",estadoReproductivo:"",madreId:""});
      setArchivos([]); setShowForm(false); load();
    } catch(err){ setError(err.message); } finally{ setEnviando(false); }
  }

  async function handleParto(e) {
    e.preventDefault(); setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/animales/${showParto}/parto`,{
        method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
        body:JSON.stringify(formParto),
      });
      const d = await res.json();
      if(!res.ok) throw new Error(d.error||"Error");
      setShowParto(null); setFormParto({identificadorCria:"",nombreCria:"",sexoCria:"HEMBRA",pesoNacimiento:""}); load();
    } catch(err){ setError(err.message); } finally{ setEnviando(false); }
  }

  const activos=animales.filter(a=>a.estado==="ACTIVO");
  const vendidos=animales.filter(a=>a.estado==="VENDIDO");
  const hembras=activos.filter(a=>a.sexo==="HEMBRA");
  const crias=activos.filter(a=>a.madreId);

  const METRICAS=[
    {label:"Preñadas",valor:hembras.filter(a=>a.estadoReproductivo==="PREÑADA").length,img:"https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=120&q=70",color:"#e53e3e",filtroKey:"PREÑADA"},
    {label:"Paridas",valor:hembras.filter(a=>a.estadoReproductivo==="PARIDA").length,img:"https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=120&q=70",color:"#d69e2e",filtroKey:"PARIDA"},
    {label:"Crías",valor:crias.length,img:"https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=120&q=70",color:"#38b2ac",filtroKey:"CRIAS"},
    {label:"Lactancia",valor:hembras.filter(a=>a.estadoReproductivo==="LACTANCIA").length,img:"https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=120&q=70",color:"#38a169",filtroKey:"LACTANCIA"},
    {label:"Secas",valor:hembras.filter(a=>a.estadoReproductivo==="SECA").length,img:"https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=120&q=70",color:"#718096",filtroKey:"SECA"},
    {label:"Sementales",valor:activos.filter(a=>a.sexo==="MACHO").length,img:"https://images.unsplash.com/photo-1527153098-02c5b5b29c9d?w=120&q=70",color:"#3182ce",filtroKey:"SEMENTALES"},
    {label:"Activos",valor:activos.length,img:"https://images.unsplash.com/photo-1493962853295-0fd70327578a?w=120&q=70",color:"#2d9e3f",filtroKey:"ACTIVOS"},
    {label:"Total",valor:animales.length,img:"https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=120&q=70",color:"#553c9a",filtroKey:"TODOS"},
    {label:"Vendidos",valor:vendidos.length,img:"https://images.unsplash.com/photo-1472396961693-142e6e269027?w=120&q=70",color:"#b7791f",filtroKey:"VENDIDOS"},
  ];

  const filtrados=animales.filter(a=>{
    if(filtro==="TODOS") return true;
    if(filtro==="ACTIVOS") return a.estado==="ACTIVO";
    if(filtro==="VENDIDOS") return a.estado==="VENDIDO";
    if(filtro==="SEMENTALES") return a.sexo==="MACHO"&&a.estado==="ACTIVO";
    if(filtro==="CRIAS") return !!a.madreId&&a.estado==="ACTIVO";
    return a.estadoReproductivo===filtro&&a.estado==="ACTIVO";
  });

  const hembrasActivas=animales.filter(a=>a.sexo==="HEMBRA"&&a.estado==="ACTIVO");
  const glass={background:"rgba(5,25,12,0.65)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.12)"};
  const gi={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff"};

  function etiqueta(a){
    if(a.madreId&&a.madre) return `Cría de ${a.madre.nombre||a.madre.identificador}`;
    if((a.estadoReproductivo==="LACTANCIA"||a.estadoReproductivo==="PARIDA")&&a.crias?.length>0){
      const c=a.crias[a.crias.length-1];
      return `${a.estadoReproductivo==="LACTANCIA"?"Lactancia":"Parida"} - Cría ${c.nombre||c.identificador}`;
    }
    if(a.estadoReproductivo==="PREÑADA"&&a.fechaParto){
      return `Preñada - Prev. ${new Date(a.fechaParto).toLocaleDateString("es",{month:"long",year:"numeric"})}`;
    }
    return null;
  }

  const conFoto=filtrados.filter(a=>a.media?.some(m=>m.tipo==="FOTO")).slice(0,3);
  const resto=filtrados.filter(a=>!conFoto.includes(a));

  return (
    <AppLayout title="Inventario Animal" subtitle="Gestión de Ganado">
      {error&&<div className="mb-4 text-red-300 text-sm p-3 rounded-xl flex items-center justify-between" style={{background:"rgba(220,38,38,0.2)",border:"1px solid rgba(220,38,38,0.4)"}}>
        {error}<button onClick={()=>setError("")} className="text-red-400 ml-4">✕</button></div>}

      {/* MÉTRICAS — 3 columnas en móvil, scroll horizontal en tablet/desktop */}
      <div className="grid grid-cols-3 gap-2 mb-5 md:flex md:gap-3 md:overflow-x-auto md:pb-2">
        {METRICAS.map(m=>(
          <button key={m.filtroKey} onClick={()=>setFiltro(m.filtroKey)}
            className="rounded-2xl overflow-hidden transition-all active:scale-95 relative"
            style={{
              minHeight:90,
              border:filtro===m.filtroKey?`3px solid ${m.color}`:"2px solid rgba(255,255,255,0.15)",
              flex:"0 0 auto",
            }}>
            <img src={m.img} alt={m.label} className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{background:filtro===m.filtroKey?`${m.color}aa`:"rgba(0,0,0,0.6)"}}/>
            <div className="relative z-10 flex flex-col items-center justify-center h-full py-3 px-1">
              <p className="text-white font-black leading-none" style={{fontSize:28,textShadow:"0 2px 8px rgba(0,0,0,0.9)"}}>{m.valor}</p>
              <p className="text-white font-bold text-center leading-tight mt-1" style={{fontSize:9,textShadow:"0 1px 4px rgba(0,0,0,0.9)"}}>{m.label}</p>
              {filtro===m.filtroKey&&<div className="mt-1 rounded-full px-1.5 py-0.5" style={{background:m.color,fontSize:7,color:"white",fontWeight:900}}>✓ activo</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Botón */}
      <button onClick={()=>setShowForm(s=>!s)}
        className="w-full text-white rounded-2xl py-3 font-black text-lg mb-4 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] transition-transform"
        style={{background:showForm?"rgba(100,100,100,0.4)":"linear-gradient(135deg,#1a6b2a,#2d9e3f)",border:"1px solid rgba(255,255,255,0.2)"}}>
        {showForm?"✕ Cancelar":"+ Registrar Animal"}
      </button>

      {/* Formulario */}
      {showForm&&(
        <form onSubmit={handleCreate} className="rounded-3xl p-5 mb-4 space-y-3" style={glass}>
          <h3 className="text-white font-black text-lg">Nuevo Animal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-white/50 text-xs">Arete/ID *</label><input className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} placeholder="M001" value={form.identificador} onChange={e=>setForm({...form,identificador:e.target.value})} required/></div>
            <div><label className="text-white/50 text-xs">Nombre</label><input className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} placeholder="Paloma" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
            <div><label className="text-white/50 text-xs">Sexo *</label><select className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} value={form.sexo} onChange={e=>setForm({...form,sexo:e.target.value})}><option value="HEMBRA">Hembra</option><option value="MACHO">Macho</option></select></div>
            <div><label className="text-white/50 text-xs">Raza</label><input className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} placeholder="Brahman" value={form.raza} onChange={e=>setForm({...form,raza:e.target.value})}/></div>
            <div><label className="text-white/50 text-xs">Fierro</label><input className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} placeholder="M20" value={form.fierro} onChange={e=>setForm({...form,fierro:e.target.value})}/></div>
            <div><label className="text-white/50 text-xs">Peso (kg)</label><input type="number" className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} placeholder="350" value={form.pesoActual} onChange={e=>setForm({...form,pesoActual:e.target.value})}/></div>
            {form.sexo==="HEMBRA"&&<div className="sm:col-span-2"><label className="text-white/50 text-xs">Estado reproductivo</label><select className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} value={form.estadoReproductivo} onChange={e=>setForm({...form,estadoReproductivo:e.target.value})}><option value="">Sin definir</option>{ESTADOS_REPRO.map(e=><option key={e} value={e}>{REPRO_CONFIG[e].icon} {REPRO_CONFIG[e].label}</option>)}</select></div>}
            <div className="sm:col-span-2"><label className="text-white/50 text-xs">Madre (si es cría)</label><select className="w-full rounded-xl px-3 py-3 text-base mt-0.5" style={gi} value={form.madreId} onChange={e=>setForm({...form,madreId:e.target.value})}><option value="">Sin madre</option>{hembrasActivas.map(h=><option key={h.id} value={h.id}>{h.nombre||h.identificador}</option>)}</select></div>
          </div>
          <textarea className="w-full rounded-xl px-3 py-2 text-sm" style={gi} placeholder="Observación..." rows={2} value={form.observacion} onChange={e=>setForm({...form,observacion:e.target.value})}/>
          <input type="file" accept="image/*,video/*" multiple className="w-full text-white/60 text-sm" onChange={e=>setArchivos(e.target.files)}/>
          <button type="submit" disabled={enviando} className="w-full text-white font-black py-3 rounded-2xl disabled:opacity-50" style={{background:"linear-gradient(135deg,#1a6b2a,#2d9e3f)"}}>
            {enviando?"Guardando...":"✅ Registrar Animal"}
          </button>
        </form>
      )}

      {/* Modal Parto */}
      {showParto&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}>
          <form onSubmit={handleParto} className="w-full max-w-sm rounded-3xl p-6 space-y-3 shadow-2xl" style={glass}>
            <h3 className="text-white font-black text-xl">Registrar Parto</h3>
            <p className="text-white/50 text-sm">La madre pasará automáticamente a Lactancia.</p>
            <div><label className="text-white/50 text-xs">Arete/ID de la cría *</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} placeholder="C001" required value={formParto.identificadorCria} onChange={e=>setFormParto({...formParto,identificadorCria:e.target.value})}/></div>
            <div><label className="text-white/50 text-xs">Nombre de la cría</label><input className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} placeholder="Opcional" value={formParto.nombreCria} onChange={e=>setFormParto({...formParto,nombreCria:e.target.value})}/></div>
            <div><label className="text-white/50 text-xs">Sexo *</label><select className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} value={formParto.sexoCria} onChange={e=>setFormParto({...formParto,sexoCria:e.target.value})}><option value="HEMBRA">Hembra</option><option value="MACHO">Macho</option></select></div>
            <div><label className="text-white/50 text-xs">Peso al nacer (kg)</label><input type="number" className="w-full rounded-xl px-3 py-2 text-sm mt-0.5" style={gi} placeholder="Opcional" value={formParto.pesoNacimiento} onChange={e=>setFormParto({...formParto,pesoNacimiento:e.target.value})}/></div>
            <div className="flex gap-3"><button type="button" onClick={()=>setShowParto(null)} className="flex-1 text-white/50 py-2 rounded-xl" style={{border:"1px solid rgba(255,255,255,0.2)"}}>Cancelar</button>
            <button type="submit" disabled={enviando} className="flex-1 text-white font-black py-2 rounded-xl disabled:opacity-50" style={{background:"linear-gradient(135deg,#1a6b2a,#2d9e3f)"}}>{enviando?"...":"Registrar"}</button></div>
          </form>
        </div>
      )}

      <p className="text-white/30 text-xs mb-3">{METRICAS.find(m=>m.filtroKey===filtro)?.label||"Todos"} — {filtrados.length} registros</p>

      {/* Tarjetas grandes */}
      {conFoto.length>0&&(
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {conFoto.map(a=>{
            const foto=a.media?.find(m=>m.tipo==="FOTO");
            const et=etiqueta(a); const repro=a.estadoReproductivo?REPRO_CONFIG[a.estadoReproductivo]:null;
            return (
              <div key={a.id} className="rounded-2xl overflow-hidden shadow-xl relative cursor-pointer hover:scale-[1.02] transition-all" onClick={()=>router.push(`/inventario/${a.id}`)}>
                {foto&&<img src={foto.url} className="w-full h-44 object-cover"/>}
                {a.estado==="VENDIDO"&&<div className="absolute top-3 right-3 text-white text-xs font-black px-3 py-1 rounded-full" style={{background:"#d69e2e"}}>VENDIDO</div>}
                <div className="p-4" style={{background:"rgba(5,20,10,0.88)",backdropFilter:"blur(8px)"}}>
                  <div className="flex items-start justify-between">
                    <div><p className="text-white font-black text-lg">{a.nombre||a.identificador}</p>
                    <p className="text-white/40 text-xs">{a.raza||""} · Tag: {a.identificador}</p></div>
                    <span style={{color:a.sexo==="HEMBRA"?"#f687b3":"#63b3ed",fontSize:18}}>{a.sexo==="HEMBRA"?"♀":"♂"}</span>
                  </div>
                  {a.fierro&&<p className="text-white/40 text-xs mt-1">Fierro: {a.fierro}</p>}
                  {a.pesoActual&&<p className="text-green-400 text-sm font-bold mt-1">⚖️ {a.pesoActual} kg</p>}
                  {(et||repro)&&<p className="text-xs mt-2 px-2 py-1 rounded-lg font-semibold inline-block" style={{background:repro?.bg||"rgba(255,255,255,0.1)",color:repro?.color||"white"}}>{repro?.icon} {et||repro?.label}</p>}
                  {a.sexo==="HEMBRA"&&a.estado==="ACTIVO"&&a.estadoReproductivo==="PREÑADA"&&(
                    <button onClick={ev=>{ev.stopPropagation();setShowParto(a.id);}} className="mt-2 text-xs px-3 py-1 rounded-lg font-bold w-full" style={{background:"rgba(229,62,62,0.3)",border:"1px solid rgba(229,62,62,0.5)",color:"#fc8181"}}>
                      Registrar Parto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tarjetas — lista en móvil, grid en desktop */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-3 lg:grid-cols-4">
        {resto.map(a=>{
          const et=etiqueta(a); const repro=a.estadoReproductivo?REPRO_CONFIG[a.estadoReproductivo]:null;
          const foto=a.media?.find(m=>m.tipo==="FOTO");
          return (
            <div key={a.id} className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all flex md:flex-col"
              style={{background:"rgba(5,25,12,0.65)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.12)"}}
              onClick={()=>router.push(`/inventario/${a.id}`)}>
              {/* Foto — izquierda en móvil, arriba en desktop */}
              {foto
                ? <img src={foto.url} className="w-20 h-20 md:w-full md:h-36 object-cover shrink-0"/>
                : <div className="w-20 h-20 md:w-full md:h-28 shrink-0 flex items-center justify-center text-3xl"
                    style={{background:"rgba(45,158,63,0.15)"}}>
                    {a.sexo==="HEMBRA"?"🐄":"🐂"}
                  </div>
              }
              {/* Info */}
              <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white font-black text-base truncate">{a.nombre||a.identificador}</p>
                  <span className="shrink-0 font-bold text-base" style={{color:a.sexo==="HEMBRA"?"#f687b3":"#63b3ed"}}>{a.sexo==="HEMBRA"?"♀":"♂"}</span>
                </div>
                <p className="text-white/40 text-xs">{a.raza||"Sin raza"} · {a.identificador}</p>
                {a.pesoActual&&<p className="text-green-400 text-sm font-bold mt-1">⚖️ {a.pesoActual} kg</p>}
                {repro&&<p className="text-xs mt-1 font-semibold" style={{color:repro.color}}>{repro.icon} {repro.label}</p>}
                {et&&!repro&&<p className="text-white/40 text-xs mt-1 truncate">{et}</p>}
                {a.estado==="VENDIDO"&&<span className="text-xs font-black px-2 py-0.5 rounded-full mt-1 inline-block" style={{background:"rgba(214,158,46,0.3)",color:"#d69e2e"}}>💰 Vendido</span>}
                {a.sexo==="HEMBRA"&&a.estado==="ACTIVO"&&a.estadoReproductivo==="PREÑADA"&&(
                  <button onClick={ev=>{ev.stopPropagation();setShowParto(a.id);}}
                    className="mt-2 text-xs px-3 py-1.5 rounded-xl font-bold"
                    style={{background:"rgba(229,62,62,0.3)",border:"1px solid rgba(229,62,62,0.5)",color:"#fc8181"}}>
                    Registrar Parto
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtrados.length===0&&(
          <div className="col-span-4 text-center py-20 text-white/30">
            <p className="text-6xl mb-4">🐄</p>
            <p className="text-lg font-bold text-white/40">Aún no hay animales registrados</p>
            <p className="text-sm mt-1">Toca el botón verde de arriba para agregar tu primer animal</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
