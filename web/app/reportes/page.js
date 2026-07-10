"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

// ── Paletas institucionales por tipo ─────────────────────────────────────────
const PALETAS = {
  animales: { dark:[20,83,45],   mid:[21,128,61],  light:[240,253,244], hex:"#14532D" },
  ventas:   { dark:[30,64,175],  mid:[37,99,235],  light:[239,246,255], hex:"#1E40AF" },
  gastos:   { dark:[107,33,168], mid:[126,34,206], light:[250,240,255], hex:"#6B21A8" },
};

const CHART_PAL = [
  [20,83,45],[30,64,175],[107,33,168],[194,65,12],[15,118,110],
  [133,77,14],[159,18,57],[3,105,161],[67,20,140],[6,78,59],
  [55,65,81],[120,53,15],[161,16,20],[3,76,140],[47,97,35],
];

const fmtN = n => "C$ " + Math.round(n||0).toLocaleString("es-NI");
const fmtU = n => "$ " + Number(n||0).toFixed(2);

export default function ReportesPage() {
  const [stats,    setStats]    = useState(null);
  const [animales, setAnimales] = useState([]);
  const [ventas,   setVentas]   = useState([]);
  const [gastos,   setGastos]   = useState([]);
  const [finca,    setFinca]    = useState(null);
  const [generando,setGenerando]= useState(null);
  const [error,    setError]    = useState("");

  useEffect(() => {
    Promise.all([
      api("/ventas/stats").catch(()=>null),
      api("/animales").catch(()=>[]),
      api("/ventas").catch(()=>[]),
      api("/gastos").catch(()=>({gastos:[]})),
      api("/fincas/mi-finca").catch(()=>null),
    ]).then(([s,a,v,g,f])=>{
      setStats(s);
      setAnimales(Array.isArray(a)?a:[]);
      setVentas(Array.isArray(v)?v:[]);
      setGastos(Array.isArray(g)?g:Array.isArray(g?.gastos)?g.gastos:[]);
      setFinca(f);
    }).catch(e=>setError(e.message));
  },[]);

  // ── Cargar imagen vía canvas → JPEG (evita errores de firma PNG en jsPDF) ─
  async function cargarImg(url, recorte=1) {
    return new Promise(res=>{
      const img=new Image(); img.crossOrigin="anonymous";
      img.onload=()=>{
        const h=Math.floor(img.naturalHeight*recorte);
        const c=document.createElement("canvas");
        c.width=img.naturalWidth; c.height=h;
        const ctx=c.getContext("2d");
        ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,c.width,h);
        ctx.drawImage(img,0,0);
        res(c.toDataURL("image/jpeg",0.92));
      };
      img.onerror=()=>res(null);
      img.src=url+"?r="+Math.random();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GRÁFICOS (Canvas 2D → JPEG base64)
  // ═══════════════════════════════════════════════════════════════════════════

  function graficoPie(datos, p, aw=300, ah=180) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,aw,ah);
    const total=datos.reduce((s,d)=>s+(d.valor||0),0);
    if(!total) return null;
    const cx=aw*0.37, cy=ah/2, r=Math.min(cx,cy)-14;
    let angle=-Math.PI/2;
    datos.forEach((d,i)=>{
      const slice=(d.valor/total)*2*Math.PI;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,angle,angle+slice); ctx.closePath();
      const col=CHART_PAL[i%CHART_PAL.length];
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fill();
      ctx.strokeStyle="#ffffff"; ctx.lineWidth=1.5; ctx.stroke();
      angle+=slice;
    });
    // Donut
    ctx.beginPath(); ctx.arc(cx,cy,r*0.5,0,2*Math.PI);
    ctx.fillStyle="#ffffff"; ctx.fill();
    // Centro
    ctx.fillStyle="#111827"; ctx.font="bold 12px Arial"; ctx.textAlign="center";
    ctx.fillText(total.toLocaleString("es"),cx,cy+4);
    ctx.font="7px Arial"; ctx.fillStyle="#9ca3af"; ctx.fillText("TOTAL",cx,cy+14);
    // Leyenda
    const lx=aw*0.67;
    datos.slice(0,7).forEach((d,i)=>{
      const col=CHART_PAL[i%CHART_PAL.length];
      const pct=((d.valor/total)*100).toFixed(1);
      const ly=16+i*22;
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fillRect(lx,ly,9,9);
      ctx.fillStyle="#374151"; ctx.font="8.5px Arial"; ctx.textAlign="left";
      ctx.fillText((d.label||"").slice(0,14),lx+13,ly+8);
      ctx.fillStyle="#9ca3af"; ctx.textAlign="right";
      ctx.fillText(pct+"%",aw-4,ly+8);
    });
    return c.toDataURL("image/jpeg",0.95);
  }

  function graficoBarras(datos, p, aw=300, ah=170) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,aw,ah);
    const pad={t:18,r:12,b:42,l:48};
    const w=aw-pad.l-pad.r, h=ah-pad.t-pad.b;
    const max=Math.max(...datos.map(d=>d.valor||0),1);
    // Grid
    for(let i=0;i<=4;i++){
      const y=pad.t+h-(h*i/4);
      ctx.strokeStyle="#f3f4f6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+w,y); ctx.stroke();
      const v=(max*i/4)|0;
      ctx.fillStyle="#9ca3af"; ctx.font="7.5px Arial"; ctx.textAlign="right";
      ctx.fillText(v>=1000?(v/1000).toFixed(1)+"k":v,pad.l-3,y+3);
    }
    const bw=Math.max(6,w/Math.max(datos.length,1)*0.55);
    const gap=w/Math.max(datos.length,1);
    datos.forEach((d,i)=>{
      const x=pad.l+i*gap+(gap-bw)/2;
      const bh=((d.valor||0)/max)*h;
      const y=pad.t+h-bh;
      const col=d.color||p.dark;
      ctx.fillStyle=`rgb(${(d.col||col).join(",")})`;
      ctx.fillRect(x,y,bw,bh);
      if(bh>12){
        const v=d.valor>=1000?(d.valor/1000).toFixed(1)+"k":(d.valor||0).toLocaleString("es");
        ctx.fillStyle="#374151"; ctx.font="bold 7px Arial"; ctx.textAlign="center";
        ctx.fillText(v,x+bw/2,y-3);
      }
      ctx.fillStyle="#6b7280"; ctx.font="7px Arial"; ctx.textAlign="center";
      ctx.fillText((d.label||"").slice(0,7),x+bw/2,pad.t+h+12);
    });
    ctx.strokeStyle="#d1d5db"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
    return c.toDataURL("image/jpeg",0.95);
  }

  function graficoLinea(datos, p, aw=300, ah=150) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,aw,ah);
    const pad={t:18,r:12,b:32,l:50};
    const w=aw-pad.l-pad.r, h=ah-pad.t-pad.b;
    const max=Math.max(...datos.map(d=>d.valor||0),1);
    for(let i=0;i<=4;i++){
      const y=pad.t+h-(h*i/4);
      ctx.strokeStyle="#f3f4f6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+w,y); ctx.stroke();
      const v=(max*i/4)|0;
      ctx.fillStyle="#9ca3af"; ctx.font="7.5px Arial"; ctx.textAlign="right";
      ctx.fillText(v>=1000?(v/1000).toFixed(0)+"k":v,pad.l-3,y+3);
    }
    const pts=datos.map((d,i)=>({
      x:pad.l+(i/Math.max(datos.length-1,1))*w,
      y:pad.t+h-((d.valor||0)/max)*h,
    }));
    // Área
    const col=p.dark;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pad.t+h);
    pts.forEach(pt=>ctx.lineTo(pt.x,pt.y));
    ctx.lineTo(pts[pts.length-1].x,pad.t+h); ctx.closePath();
    ctx.fillStyle=`rgba(${col.join(",")},0.07)`; ctx.fill();
    // Línea
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){
      const cpx=(pts[i-1].x+pts[i].x)/2;
      ctx.bezierCurveTo(cpx,pts[i-1].y,cpx,pts[i].y,pts[i].x,pts[i].y);
    }
    ctx.strokeStyle=`rgb(${col.join(",")})`; ctx.lineWidth=2.5; ctx.stroke();
    // Puntos y etiquetas
    pts.forEach((pt,i)=>{
      ctx.beginPath(); ctx.arc(pt.x,pt.y,3.5,0,2*Math.PI);
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fill();
      ctx.strokeStyle="#ffffff"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle="#6b7280"; ctx.font="7px Arial"; ctx.textAlign="center";
      ctx.fillText((datos[i].label||"").slice(0,5),pt.x,pad.t+h+12);
    });
    ctx.strokeStyle="#d1d5db"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
    return c.toDataURL("image/jpeg",0.95);
  }

  function graficoComparacion(datos, p, aw=300, ah=170) {
    // datos: [{label, v1, v2}]
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,aw,ah);
    const pad={t:28,r:12,b:38,l:48};
    const w=aw-pad.l-pad.r, h=ah-pad.t-pad.b;
    const max=Math.max(...datos.flatMap(d=>[d.v1||0,d.v2||0]),1);
    for(let i=0;i<=4;i++){
      const y=pad.t+h-(h*i/4);
      ctx.strokeStyle="#f3f4f6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+w,y); ctx.stroke();
    }
    const col1=p.dark; const col2=[156,163,175];
    // Leyenda
    ctx.fillStyle=`rgb(${col1.join(",")})`; ctx.fillRect(pad.l,6,10,10);
    ctx.fillStyle="#374151"; ctx.font="8px Arial"; ctx.textAlign="left";
    ctx.fillText(datos[0]?.l1||"Período actual",pad.l+14,15);
    ctx.fillStyle=`rgb(${col2.join(",")})`; ctx.fillRect(pad.l+85,6,10,10);
    ctx.fillStyle="#374151"; ctx.fillText(datos[0]?.l2||"Período anterior",pad.l+99,15);
    const gw=w/Math.max(datos.length,1);
    const bw=gw*0.28;
    datos.forEach((d,i)=>{
      const gx=pad.l+i*gw+gw*0.09;
      const h1=((d.v1||0)/max)*h, h2=((d.v2||0)/max)*h;
      ctx.fillStyle=`rgb(${col1.join(",")})`; ctx.fillRect(gx,pad.t+h-h1,bw,h1);
      ctx.fillStyle=`rgb(${col2.join(",")})`; ctx.fillRect(gx+bw+2,pad.t+h-h2,bw,h2);
      ctx.fillStyle="#6b7280"; ctx.font="7px Arial"; ctx.textAlign="center";
      ctx.fillText((d.label||"").slice(0,5),gx+bw,pad.t+h+12);
    });
    ctx.strokeStyle="#d1d5db"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
    return c.toDataURL("image/jpeg",0.95);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENTES PDF
  // ═══════════════════════════════════════════════════════════════════════════

  function drawQR(doc, x, y, size, p) {
    const cell=size/19;
    const PAT=[
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
    doc.setFillColor(255,255,255);
    doc.rect(x-0.5,y-0.5,size+1,size+1,"F");
    PAT.forEach((row,ri)=>row.forEach((v,ci)=>{
      if(v){ doc.setFillColor(...p.dark); doc.rect(x+ci*cell,y+ri*cell,cell,cell,"F"); }
    }));
  }

  function encabezado(doc, {logo, fincaNombre, adminNombre, ubicacion, empresa, fecha, hora, numReporte, tipo, p, W}) {
    const HH=60;
    // Fondo blanco
    doc.setFillColor(255,255,255); doc.rect(0,0,W,HH,"F");
    // Franja superior (4mm)
    doc.setFillColor(...p.dark); doc.rect(0,0,W,4,"F");
    // Franja secundaria (1mm)
    doc.setFillColor(...p.mid); doc.rect(0,4,W,1,"F");

    // Logo (izquierda)
    if(logo) doc.addImage(logo,"JPEG",7,7,34,34*0.52);

    // Separador vertical
    doc.setDrawColor(...p.dark); doc.setLineWidth(0.5);
    doc.line(47,7,47,HH-5);

    // Empresa
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text("HENRIQUEZ CATTLE MANAGEMENT",52,16);
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...p.mid);
    doc.text("SISTEMA DE GESTIÓN GANADERA EMPRESARIAL",52,22);

    // Línea divisoria
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.25);
    doc.line(52,25,W-40,25);

    // Info finca
    doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(50,50,50);
    doc.text(`Empresa / Finca:`,52,32); doc.setFont("helvetica","bold");
    doc.text(fincaNombre.toUpperCase(),52+28,32);
    doc.setFont("helvetica","normal");
    doc.text(`Administrador:`,52,38); doc.setFont("helvetica","bold");
    doc.text(adminNombre,52+26,38);
    doc.setFont("helvetica","normal");
    if(ubicacion){ doc.text(`Ubicación:`,52,44); doc.text(ubicacion,52+19,44); }

    // Panel derecho: metadata
    const RX=W-38;
    doc.setFillColor(...p.light); doc.roundedRect(RX-2,6,36,HH-12,2,2,"F");
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text("N° REPORTE",RX+16,13,{align:"center"});
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text(numReporte.split("-").slice(-1)[0],RX+16,20,{align:"center"});
    doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
    doc.text("FECHA",RX+16,27,{align:"center"});
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(50,50,50);
    doc.text(fecha,RX+16,33,{align:"center"});
    doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
    doc.text("HORA",RX+16,39,{align:"center"});
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(50,50,50);
    doc.text(hora,RX+16,45,{align:"center"});
    // QR
    drawQR(doc,RX,48,10,p);

    // Franja inferior del header
    doc.setFillColor(...p.mid); doc.rect(0,HH-1.5,W,1.5,"F");
    return HH+2;
  }

  function pie(doc, pg, totalPags, numReporte, fincaNombre, p, W, H) {
    doc.setDrawColor(...p.mid); doc.setLineWidth(0.3);
    doc.line(15,H-13,W-15,H-13);
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(130,130,130);
    doc.text(`Henriquez Cattle Management  •  ${fincaNombre}  •  ${numReporte}`,15,H-9);
    doc.text(`Página ${pg} de ${totalPags}`,W/2,H-9,{align:"center"});
    doc.text("Documento confidencial — uso exclusivo interno",W-15,H-9,{align:"right"});
    doc.setFillColor(...p.dark); doc.rect(0,H-5,W,5,"F");
  }

  function kpi(doc, x, y, w, h, titulo, valor, sub, p) {
    doc.setFillColor(232,232,232); doc.roundedRect(x+0.7,y+0.7,w,h,2,2,"F");
    doc.setFillColor(255,255,255); doc.roundedRect(x,y,w,h,2,2,"F");
    doc.setFillColor(...p.dark); doc.roundedRect(x,y,2.5,h,1,1,"F");
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text(titulo.toUpperCase(),x+6,y+8);
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text(String(valor),x+6,y+19);
    if(sub){ doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160); doc.text(String(sub),x+6,y+26); }
  }

  function tituloSeccion(doc, x, y, texto, p, W) {
    doc.setFillColor(...p.dark); doc.rect(x,y,3,9,"F");
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text(texto,x+6,y+7.5);
    doc.setDrawColor(...p.mid); doc.setLineWidth(0.3);
    doc.line(x+6+doc.getTextWidth(texto)+3,y+4,W-15,y+4);
    return y+14;
  }

  function firmas(doc, y, roles, p, W) {
    const fw=(W-45)/roles.length;
    roles.forEach((rol,i)=>{
      const fx=15+i*(fw+15/roles.length);
      doc.setDrawColor(180,180,180); doc.setLineWidth(0.4);
      doc.line(fx,y+26,fx+fw,y+26);
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
      doc.text(rol,fx+fw/2,y+32,{align:"center"});
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160);
      doc.text("Firma y Sello Oficial",fx+fw/2,y+38,{align:"center"});
    });
  }

  function chartLabel(doc, texto, cx, y) {
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80);
    doc.text(texto,cx,y,{align:"center"});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTE INVENTARIO ANIMAL
  // ═══════════════════════════════════════════════════════════════════════════
  async function reporteAnimales(doc, {logo,animales,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const { default: autoTable } = await import("jspdf-autotable");
    const activos  = animales.filter(a=>a.estado==="ACTIVO");
    const vendidos = animales.filter(a=>a.estado==="VENDIDO");
    const muertos  = animales.filter(a=>a.estado==="MUERTO");
    const hembras  = activos.filter(a=>a.sexo==="HEMBRA");
    const machos   = activos.filter(a=>a.sexo==="MACHO");
    const conPeso  = activos.filter(a=>(a.pesoActual||0)>0);
    const pesoP    = conPeso.length?(conPeso.reduce((s,a)=>s+(a.pesoActual||0),0)/conPeso.length).toFixed(0):0;
    const valorHato= conPeso.reduce((s,a)=>s+(a.pesoActual||0)*1.2*(finca?.tipoCambio||36.5),0);

    const razas  = {}; activos.forEach(a=>{const r=a.raza||"Sin raza"; razas[r]=(razas[r]||0)+1;});
    const repro  = {}; hembras.forEach(a=>{const e=a.estadoReproductivo||"Sin dato"; repro[e]=(repro[e]||0)+1;});
    const estados= {ACTIVO:activos.length,VENDIDO:vendidos.length,MUERTO:muertos.length};

    const hdrY = encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});
    let y = hdrY+4;

    // Título
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text("REPORTE DE INVENTARIO ANIMAL",W/2,y+5,{align:"center"});
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text(`Generado el ${fecha} a las ${hora}`,W/2,y+12,{align:"center"});
    y+=18;

    // Sección 1: KPIs
    y=tituloSeccion(doc,15,y,"RESUMEN EJECUTIVO",p,W);
    const kW=(W-40)/4, kH=30;
    [
      ["Total Animales",animales.length,"en sistema"],
      ["Activos",activos.length,`${((activos.length/Math.max(animales.length,1))*100).toFixed(0)}% del hato`],
      ["Hembras",hembras.length,`${machos.length} machos activos`],
      ["Peso Promedio",pesoP+" kg",`${conPeso.length} con peso registrado`],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+5;
    [
      ["Vendidos",vendidos.length,"retirados del hato"],
      ["Fallecidos",muertos.length,"bajas registradas"],
      ["Preñadas",stats?.animales?.prenadas||0,"hembras gestantes"],
      ["Valor Est. Hato",fmtN(valorHato),"precio referencial"],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+10;

    // Sección 2: Gráficos fila 1
    y=tituloSeccion(doc,15,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-35)/2, ch=cw*(170/300);

    const pieSexo=graficoPie([{label:"Hembras",valor:hembras.length},{label:"Machos",valor:machos.length}],p);
    if(pieSexo){ doc.addImage(pieSexo,"JPEG",15,y,cw,ch); chartLabel(doc,"Distribución por Sexo",15+cw/2,y+ch+4); }

    const razaData=Object.entries(razas).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([label,valor])=>({label,valor,col:p.dark}));
    const barRaza=graficoBarras(razaData,p);
    if(barRaza){ doc.addImage(barRaza,"JPEG",15+cw+5,y,cw,ch); chartLabel(doc,"Distribución por Raza",15+cw+5+cw/2,y+ch+4); }
    y+=ch+9;

    // Fila 2 gráficos
    const reproData=Object.entries(repro).sort((a,b)=>b[1]-a[1]).map(([label,valor])=>({label,valor}));
    const pieRepro=graficoPie(reproData,p);
    if(pieRepro){ doc.addImage(pieRepro,"JPEG",15,y,cw,ch); chartLabel(doc,"Estado Reproductivo",15+cw/2,y+ch+4); }

    const estadoData=Object.entries(estados).map(([label,valor])=>({label,valor,col:label==="ACTIVO"?p.dark:label==="VENDIDO"?[30,64,175]:[153,27,27]}));
    const barEstado=graficoBarras(estadoData,p);
    if(barEstado){ doc.addImage(barEstado,"JPEG",15+cw+5,y,cw,ch); chartLabel(doc,"Estado del Hato",15+cw+5+cw/2,y+ch+4); }
    y+=ch+12;

    // Sección 3: Tabla
    if(y>H-90){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"INVENTARIO DETALLADO",p,W);

    autoTable(doc,{
      startY:y,
      head:[["#","ID/Arete","Nombre","Raza","Sexo","Fierro","Peso","Estado","Rep."]],
      body:animales.map((a,i)=>[i+1,a.identificador,a.nombre||"—",a.raza||"—",a.sexo==="HEMBRA"?"Hembra":"Macho",a.fierro||"—",a.pesoActual?(a.pesoActual+" kg"):"—",a.estado,a.estadoReproductivo||"—"]),
      margin:{left:15,right:15},
      styles:{fontSize:7.5,cellPadding:2.8,font:"helvetica",lineColor:[220,220,220],lineWidth:0.2},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:7.5,cellPadding:3.5},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{0:{cellWidth:8,halign:"center"},4:{halign:"center"},5:{halign:"center"},6:{halign:"right"},7:{halign:"center",fontStyle:"bold"},8:{halign:"center"}},
      willDrawCell(data){
        if(data.section==="body"&&data.column.index===7){
          const v=data.cell.raw;
          data.cell.styles.textColor=v==="ACTIVO"?p.dark:v==="VENDIDO"?[30,64,175]:[153,27,27];
        }
      },
      showHead:"everyPage",
      didDrawPage:()=>pie(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",numReporte,fincaNombre,p,W,H),
    });
    y=doc.lastAutoTable.finalY+10;

    // Sección 4: Indicadores
    if(y>H-60){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"INDICADORES Y ESTADÍSTICAS",p,W);
    const indicadores=[
      [`Tasa de actividad: ${((activos.length/Math.max(animales.length,1))*100).toFixed(1)}%`],
      [`Tasa de mortalidad: ${((muertos.length/Math.max(animales.length,1))*100).toFixed(1)}%`],
      [`Tasa de gestación: ${((stats?.animales?.prenadas||0)/Math.max(hembras.length,1)*100).toFixed(1)}%`],
      [`Relación macho/hembra: 1:${(hembras.length/Math.max(machos.length,1)).toFixed(1)}`],
    ];
    indicadores.forEach((ind,i)=>{
      const ix=15+i%2*(W/2-5);
      doc.setFillColor(...p.light); doc.roundedRect(ix,y,W/2-20,10,1,1,"F");
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(50,50,50);
      doc.text(ind[0],ix+5,y+7);
      if(i%2===1) y+=13;
    });
    y+=20;

    // Sección 5: Firmas
    if(y>H-55){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    firmas(doc,y,["Administrador","Médico Veterinario","Propietario / Dueño"],p,W);

    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTE VENTAS
  // ═══════════════════════════════════════════════════════════════════════════
  async function reporteVentas(doc, {logo,ventas,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const { default: autoTable } = await import("jspdf-autotable");
    const totalNIO=ventas.reduce((s,v)=>s+(v.precioNIO||0),0);
    const totalUSD=ventas.reduce((s,v)=>s+(v.precioUSD||0),0);
    const pagadas=ventas.filter(v=>v.estadoPago==="PAGADO");
    const pendientes=ventas.filter(v=>v.estadoPago!=="PAGADO");

    const metodos={}; ventas.forEach(v=>{const m=v.metodoPago||"EFECTIVO";metodos[m]=(metodos[m]||0)+1;});
    const tipos={}; ventas.forEach(v=>{const t=v.tipoVenta||"OTRO";tipos[t]=(tipos[t]||0)+(v.precioNIO||0);});
    const compradores={}; ventas.forEach(v=>{const c=v.comprador||"Sin nombre";compradores[c]=(compradores[c]||{n:0,t:0});compradores[c].n++;compradores[c].t+=(v.precioNIO||0);});
    const topComp=Object.entries(compradores).sort((a,b)=>b[1].t-a[1].t).slice(0,5);

    // Por mes
    const meses={}; ventas.forEach(v=>{const d=new Date(v.fecha);const k=d.toLocaleDateString("es",{month:"short",year:"2-digit"});meses[k]=(meses[k]||0)+(v.precioNIO||0);});
    const mesData=Object.entries(meses).slice(-6).map(([label,valor])=>({label,valor}));

    const hdrY=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});
    let y=hdrY+4;

    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text("REPORTE DE VENTAS",W/2,y+5,{align:"center"});
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text(`Generado el ${fecha} a las ${hora}`,W/2,y+12,{align:"center"});
    y+=18;

    y=tituloSeccion(doc,15,y,"RESUMEN EJECUTIVO",p,W);
    const kW=(W-40)/4, kH=30;
    [
      ["Total Ventas",ventas.length,"transacciones"],
      ["Total NIO",fmtN(totalNIO),"moneda local"],
      ["Total USD",fmtU(totalUSD),"dólares americanos"],
      ["Pagadas",pagadas.length,`${pendientes.length} pendientes`],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+5;
    [
      ["Prom./Venta",fmtN(ventas.length?totalNIO/ventas.length:0),"por transacción"],
      ["Ventas Mes",fmtN(stats?.ventas?.totalMesNIO||0),"mes actual"],
      ["Cant. Mes",stats?.ventas?.cantidadMes||0,"ventas este mes"],
      ["Histórico",fmtN(stats?.ventas?.totalHistoricoNIO||0),"total acumulado"],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+10;

    y=tituloSeccion(doc,15,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-35)/2, ch=cw*(170/300);

    const pieMet=graficoPie(Object.entries(metodos).map(([label,valor])=>({label,valor})),p);
    if(pieMet){doc.addImage(pieMet,"JPEG",15,y,cw,ch);chartLabel(doc,"Métodos de Pago",15+cw/2,y+ch+4);}

    const barMes=graficoBarras(mesData,p);
    if(barMes){doc.addImage(barMes,"JPEG",15+cw+5,y,cw,ch);chartLabel(doc,"Ventas Mensuales (NIO)",15+cw+5+cw/2,y+ch+4);}
    y+=ch+9;

    const pieTipo=graficoPie(Object.entries(tipos).map(([label,valor])=>({label,valor})),p);
    if(pieTipo){doc.addImage(pieTipo,"JPEG",15,y,cw,ch);chartLabel(doc,"Tipo de Venta",15+cw/2,y+ch+4);}

    const lineaMes=graficoLinea(mesData,p);
    if(lineaMes){doc.addImage(lineaMes,"JPEG",15+cw+5,y,cw,ch*(150/170));chartLabel(doc,"Tendencia de Ingresos",15+cw+5+cw/2,y+ch*(150/170)+4);}
    y+=ch+12;

    if(y>H-90){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"DETALLE DE VENTAS",p,W);
    autoTable(doc,{
      startY:y,
      head:[["#","Fecha","Animal","Comprador","Tipo","Método Pago","Estado","NIO","USD"]],
      body:ventas.map((v,i)=>[i+1,v.fecha?new Date(v.fecha).toLocaleDateString("es"):"—",(v.animal?.identificador||"—"),(v.comprador||"Sin nombre").slice(0,18),v.tipoVenta||"—",v.metodoPago||"—",v.estadoPago||"—",fmtN(v.precioNIO||0),fmtU(v.precioUSD||0)]),
      foot:[["","","","","","","TOTAL",fmtN(totalNIO),fmtU(totalUSD)]],
      margin:{left:15,right:15},
      styles:{fontSize:7,cellPadding:2.5,lineColor:[220,220,220],lineWidth:0.2},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:7.5},
      footStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold"},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{0:{cellWidth:8,halign:"center"},7:{halign:"right"},8:{halign:"right"}},
      willDrawCell(data){
        if(data.section==="body"&&data.column.index===6){
          const v=data.cell.raw;
          data.cell.styles.textColor=v==="PAGADO"?p.dark:v==="PARCIAL"?[133,77,14]:[153,27,27];
          data.cell.styles.fontStyle="bold";
        }
      },
      showHead:"everyPage",
      didDrawPage:()=>pie(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",numReporte,fincaNombre,p,W,H),
    });
    y=doc.lastAutoTable.finalY+10;

    // Ranking compradores
    if(topComp.length){
      if(y>H-70){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
      y=tituloSeccion(doc,15,y,"RANKING DE COMPRADORES",p,W);
      topComp.forEach(([nombre,data],i)=>{
        const pct=(data.t/(totalNIO||1));
        const blen=(W-65)*pct;
        doc.setFillColor(240,240,240); doc.roundedRect(15,y,W-30,12,1,1,"F");
        doc.setFillColor(...p.dark); doc.roundedRect(15,y,Math.max(blen*0.85,15),12,1,1,"F");
        doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
        doc.text(`${i+1}. ${nombre.slice(0,30)}`,20,y+8);
        doc.setTextColor(...p.dark); doc.setFont("helvetica","bold");
        doc.text(`${fmtN(data.t)}  (${data.n} ventas)`,W-18,y+8,{align:"right"});
        y+=15;
      });
      y+=5;
    }

    if(y>H-55){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    firmas(doc,y,["Administrador","Contador / Finanzas","Propietario / Dueño"],p,W);
    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTE GASTOS
  // ═══════════════════════════════════════════════════════════════════════════
  async function reporteGastos(doc, {logo,gastos,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const { default: autoTable } = await import("jspdf-autotable");
    const total=gastos.reduce((s,g)=>s+(g.monto||0),0);
    const promedio=gastos.length?total/gastos.length:0;
    const cats={}; gastos.forEach(g=>{const c=g.categoria||"Sin categoría";cats[c]=(cats[c]||0)+(g.monto||0);});
    const provs={}; gastos.forEach(g=>{const c=g.proveedor||"Sin proveedor";provs[c]=(provs[c]||0)+(g.monto||0);});
    const meses={}; gastos.forEach(g=>{const d=new Date(g.fecha);const k=d.toLocaleDateString("es",{month:"short",year:"2-digit"});meses[k]=(meses[k]||0)+(g.monto||0);});
    const mesData=Object.entries(meses).slice(-6).map(([label,valor])=>({label,valor}));
    const topCats=Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const topProvs=Object.entries(provs).sort((a,b)=>b[1]-a[1]).slice(0,5);

    const hdrY=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});
    let y=hdrY+4;

    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text("REPORTE DE CONTROL DE GASTOS",W/2,y+5,{align:"center"});
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text(`Generado el ${fecha} a las ${hora}`,W/2,y+12,{align:"center"});
    y+=18;

    y=tituloSeccion(doc,15,y,"RESUMEN EJECUTIVO",p,W);
    const kW=(W-40)/4, kH=30;
    [
      ["Total Gastos",gastos.length,"registros"],
      ["Total NIO",fmtN(total),"acumulado"],
      ["Promedio",fmtN(promedio),"por registro"],
      ["Este Mes",fmtN(stats?.gastosMes||0),"mes actual"],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+5;
    [
      ["Categorías",Object.keys(cats).length,"diferentes"],
      ["Proveedores",Object.keys(provs).length,"activos"],
      ["Mayor Cat.",(topCats[0]?.[0]||"—").slice(0,12),fmtN(topCats[0]?.[1]||0)],
      ["Mayor Prov.",(topProvs[0]?.[0]||"—").slice(0,12),fmtN(topProvs[0]?.[1]||0)],
    ].forEach((k,i)=>kpi(doc,15+i*(kW+5/3),y,kW,kH,k[0],k[1],k[2],p));
    y+=kH+10;

    y=tituloSeccion(doc,15,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-35)/2, ch=cw*(170/300);

    const pieCat=graficoPie(topCats.map(([label,valor])=>({label,valor})),p);
    if(pieCat){doc.addImage(pieCat,"JPEG",15,y,cw,ch);chartLabel(doc,"Gasto por Categoría",15+cw/2,y+ch+4);}
    const barMes=graficoBarras(mesData,p);
    if(barMes){doc.addImage(barMes,"JPEG",15+cw+5,y,cw,ch);chartLabel(doc,"Gasto Mensual (NIO)",15+cw+5+cw/2,y+ch+4);}
    y+=ch+9;

    const pieProv=graficoPie(topProvs.map(([label,valor])=>({label,valor})),p);
    if(pieProv){doc.addImage(pieProv,"JPEG",15,y,cw,ch);chartLabel(doc,"Gasto por Proveedor",15+cw/2,y+ch+4);}
    const lineaMes=graficoLinea(mesData,p);
    if(lineaMes){doc.addImage(lineaMes,"JPEG",15+cw+5,y,cw,ch*(150/170));chartLabel(doc,"Tendencia de Gastos",15+cw+5+cw/2,y+ch*(150/170)+4);}
    y+=ch+12;

    if(y>H-90){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"DETALLE DE GASTOS",p,W);
    autoTable(doc,{
      startY:y,
      head:[["#","Fecha","Categoría","Descripción","Proveedor","NIO"]],
      body:gastos.map((g,i)=>[i+1,g.fecha?new Date(g.fecha).toLocaleDateString("es"):"—",g.categoria||"—",(g.descripcion||g.concepto||"—").slice(0,32),(g.proveedor||"—").slice(0,20),fmtN(g.monto||0)]),
      foot:[["","","","","TOTAL",fmtN(total)]],
      margin:{left:15,right:15},
      styles:{fontSize:7.5,cellPadding:2.8,lineColor:[220,220,220],lineWidth:0.2},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:7.5},
      footStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold"},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{0:{cellWidth:8,halign:"center"},5:{halign:"right",fontStyle:"bold"}},
      showHead:"everyPage",
      didDrawPage:()=>pie(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",numReporte,fincaNombre,p,W,H),
    });
    y=doc.lastAutoTable.finalY+10;

    // Rankings
    if(topCats.length&&y<H-70){
      y=tituloSeccion(doc,15,y,"RANKING DE CATEGORÍAS",p,W);
      topCats.forEach(([cat,monto],i)=>{
        const pct=monto/(total||1);
        doc.setFillColor(240,240,240); doc.roundedRect(15,y,W-30,12,1,1,"F");
        doc.setFillColor(...p.dark); doc.roundedRect(15,y,Math.max((W-30)*pct,10),12,1,1,"F");
        doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","bold");
        doc.text(`${i+1}. ${cat.slice(0,30)}`,20,y+8);
        doc.setTextColor(...p.dark);
        doc.text(`${fmtN(monto)}  (${(pct*100).toFixed(1)}%)`,W-18,y+8,{align:"right"});
        y+=15;
      });
      y+=5;
    }

    if(y>H-55){doc.addPage();y=encabezado(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=tituloSeccion(doc,15,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    firmas(doc,y,["Administrador","Contador / Finanzas","Propietario / Dueño"],p,W);
    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIÓN PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════
  async function generarPDF(tipo) {
    setGenerando(tipo); setError("");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W=doc.internal.pageSize.getWidth();
      const H=doc.internal.pageSize.getHeight();

      const ahora=new Date();
      const fecha=ahora.toLocaleDateString("es",{dateStyle:"long"});
      const hora=ahora.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});
      const ts=`${ahora.getFullYear()}${String(ahora.getMonth()+1).padStart(2,"0")}${String(ahora.getDate()).padStart(2,"0")}-${String(ahora.getHours()).padStart(2,"0")}${String(ahora.getMinutes()).padStart(2,"0")}`;
      const numReporte=`${tipo.toUpperCase().slice(0,3)}-${ts}`;

      const fincaNombre=finca?.nombre||"Mi Finca";
      const adminNombre=finca?.usuarios?.[0]?.nombre||"Administrador";
      const p=PALETAS[tipo];
      const logo=await cargarImg(window.location.origin+"/logo-base.jpg",0.52);

      const ctx={logo,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre,stats};
      let totalPags;

      if(tipo==="animales")      totalPags=await reporteAnimales(doc,{...ctx,animales});
      else if(tipo==="ventas")   totalPags=await reporteVentas(doc,{...ctx,ventas});
      else                        totalPags=await reporteGastos(doc,{...ctx,gastos});

      // Actualizar pie con total real de páginas
      for(let pg=1;pg<=totalPags;pg++){
        doc.setPage(pg);
        pie(doc,pg,totalPags,numReporte,fincaNombre,p,W,H);
      }

      doc.save(`${numReporte}.pdf`);
    } catch(e) {
      setError("Error generando PDF: "+e.message);
      console.error(e);
    } finally { setGenerando(null); }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERFAZ DE USUARIO
  // ═══════════════════════════════════════════════════════════════════════════
  const anim  = animales.filter(a=>a.estado==="ACTIVO");
  const totNIO= ventas.reduce((s,v)=>s+(v.precioNIO||0),0);
  const totGas= gastos.reduce((s,g)=>s+(g.monto||0),0);

  const REPORTES=[
    {
      tipo:"animales", titulo:"Inventario Animal", icono:"🐄", col:"#14532D", colMid:"#15803D",
      desc:"Inventario completo, distribución por raza, sexo, estado reproductivo, gráficos analíticos y estadísticas del hato.",
      badges:[`${anim.length} activos`,`${anim.filter(a=>a.sexo==="HEMBRA").length} hembras`,`${anim.filter(a=>a.sexo==="MACHO").length} machos`],
      secciones:["Resumen Ejecutivo (8 KPIs)","4 Gráficos analíticos","Inventario completo con tabla","Indicadores clave","Firmas oficiales"],
    },
    {
      tipo:"ventas", titulo:"Ventas", icono:"💰", col:"#1E40AF", colMid:"#2563EB",
      desc:"Análisis financiero completo, métodos de pago, tendencia mensual, ranking de compradores y comparativos.",
      badges:[`${ventas.length} transacciones`,fmtN(totNIO),fmtU(ventas.reduce((s,v)=>s+(v.precioUSD||0),0))],
      secciones:["Resumen Ejecutivo (8 KPIs)","4 Gráficos financieros","Detalle completo con totales","Ranking de compradores","Firmas oficiales"],
    },
    {
      tipo:"gastos", titulo:"Control de Gastos", icono:"📊", col:"#6B21A8", colMid:"#7E22CE",
      desc:"Gasto total, distribución por categoría y proveedor, tendencia mensual, rankings y análisis porcentual.",
      badges:[`${gastos.length} registros`,fmtN(totGas),`${Object.keys(gastos.reduce((a,g)=>{const c=g.categoria||"X";a[c]=1;return a},{})).length} categorías`],
      secciones:["Resumen Ejecutivo (8 KPIs)","4 Gráficos de gastos","Detalle completo con totales","Ranking categorías","Firmas oficiales"],
    },
  ];

  return (
    <AppLayout>
      <div style={{maxWidth:1080,margin:"0 auto",padding:"28px 20px"}}>

        {/* Header de página */}
        <div style={{marginBottom:28}}>
          <p style={{color:"#6b7280",fontSize:11,textTransform:"uppercase",letterSpacing:3,marginBottom:4}}>Exportar Información</p>
          <h1 style={{fontSize:26,fontWeight:900,color:"#111827",margin:0,letterSpacing:-0.5}}>Reportes PDF Empresariales</h1>
          <p style={{color:"#6b7280",fontSize:13,marginTop:6}}>Sistema de reportes nivel SAP / Oracle — identidad visual premium y consistente</p>
        </div>

        {error&&(
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",marginBottom:20,color:"#991b1b",fontSize:12}}>
            ⚠️ {error}
          </div>
        )}

        {/* Cards de reportes */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginBottom:36}}>
          {REPORTES.map(r=>(
            <div key={r.tipo} style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              {/* Header card */}
              <div style={{background:`linear-gradient(135deg,${r.col},${r.colMid})`,padding:"18px 20px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:28}}>{r.icono}</span>
                    <div>
                      <h3 style={{color:"#fff",fontWeight:800,fontSize:15,margin:0}}>{r.titulo}</h3>
                      <p style={{color:"rgba(255,255,255,0.75)",fontSize:11,margin:"3px 0 0"}}>{r.desc}</p>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                  {r.badges.map((b,i)=>(
                    <span key={i} style={{background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"2px 9px",fontSize:10,color:"#fff",fontWeight:600}}>{b}</span>
                  ))}
                </div>
              </div>

              {/* Body card */}
              <div style={{padding:"14px 20px 18px"}}>
                <p style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Secciones del reporte</p>
                <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
                  {r.secciones.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:r.col,flexShrink:0,display:"block"}}/>
                      <span style={{fontSize:11,color:"#374151"}}>{s}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={()=>generarPDF(r.tipo)}
                  disabled={!!generando}
                  style={{
                    width:"100%",padding:"11px 0",borderRadius:8,border:"none",
                    cursor:generando?"wait":"pointer",
                    background:generando===r.tipo?"#f3f4f6":r.col,
                    color:generando===r.tipo?"#9ca3af":"#fff",
                    fontWeight:800,fontSize:13,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    opacity:generando&&generando!==r.tipo?0.4:1,
                    transition:"all 0.2s",
                  }}
                >
                  {generando===r.tipo?(
                    <span>⏳ Generando reporte...</span>
                  ):(
                    <span>↓ Descargar PDF Profesional</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen financiero */}
        {stats&&(
          <div>
            <h2 style={{fontSize:15,fontWeight:800,color:"#111827",marginBottom:14}}>Resumen Financiero</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
              {[
                {label:"Total animales",val:animales.length,icon:"🐄",col:"#14532D"},
                {label:"Activos",val:anim.length,icon:"✅",col:"#15803D"},
                {label:"Ventas del mes",val:fmtN(stats.ventas?.totalMesNIO||0),icon:"💰",col:"#1E40AF"},
                {label:"Histórico ventas",val:fmtN(stats.ventas?.totalHistoricoNIO||0),icon:"📈",col:"#1d4ed8"},
                {label:"Gastos del mes",val:fmtN(stats.gastosMes||0),icon:"📊",col:"#6B21A8"},
                {label:"Tipo de cambio",val:`C$ ${finca?.tipoCambio||36.5}`,icon:"💱",col:"#7E22CE"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:10,border:"1px solid #e5e7eb",padding:"14px 16px",borderTop:`3px solid ${s.col}`}}>
                  <div style={{fontSize:20,marginBottom:5}}>{s.icon}</div>
                  <div style={{fontSize:16,fontWeight:800,color:"#111827",lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:"#6b7280",marginTop:3}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
