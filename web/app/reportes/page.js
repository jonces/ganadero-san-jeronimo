"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

const PAL = {
  animales: { dark:[20,83,45],   mid:[21,128,61],  light:[236,253,245], title:"INVENTARIO ANIMAL", pre:"INV", hex:"#14532D" },
  ventas:   { dark:[30,64,175],  mid:[37,99,235],  light:[239,246,255], title:"VENTAS",            pre:"VEN", hex:"#1E40AF" },
  gastos:   { dark:[107,33,168], mid:[126,34,206], light:[250,240,255], title:"GASTOS",            pre:"GAS", hex:"#6B21A8" },
};
const CP = [
  [20,83,45],[30,64,175],[107,33,168],[194,65,12],[15,118,110],
  [133,77,14],[159,18,57],[3,105,161],[67,20,140],[6,78,59],
  [55,65,81],[120,53,15],[161,16,20],[3,76,140],[47,97,35],
];
const fN  = n => "C$ "+Math.round(n||0).toLocaleString("es-NI");
const fU  = n => "$ "+Number(n||0).toFixed(2);
const fK  = n => n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"k":String(Math.round(n||0));
const age = f => { if(!f) return "—"; const y=(Date.now()-new Date(f))/(365.25*864e5); return y<1?"< 1 año":`${Math.floor(y)} año${Math.floor(y)!==1?"s":""}`; };
const px  = (x,y,w,h,col,ctx)=>{ ctx.fillStyle=col; ctx.fillRect(x,y,w,h); };

export default function ReportesPage() {
  const [stats,    setStats]    = useState(null);
  const [animales, setAnimales] = useState([]);
  const [ventas,   setVentas]   = useState([]);
  const [gastos,   setGastos]   = useState([]);
  const [finca,    setFinca]    = useState(null);
  const [generando,setGenerando]= useState(null);
  const [error,    setError]    = useState("");

  useEffect(()=>{
    Promise.all([
      api("/ventas/stats").catch(()=>null),
      api("/animales").catch(()=>[]),
      api("/ventas").catch(()=>[]),
      api("/gastos").catch(()=>({gastos:[]})),
      api("/fincas/mi-finca").catch(()=>null),
    ]).then(([s,a,v,g,f])=>{
      setStats(s); setAnimales(Array.isArray(a)?a:[]);
      setVentas(Array.isArray(v)?v:[]);
      setGastos(Array.isArray(g)?g:Array.isArray(g?.gastos)?g.gastos:[]);
      setFinca(f);
    }).catch(e=>setError(e.message));
  },[]);

  // ── Cargar imagen vía canvas → JPEG ────────────────────────────────────────
  async function loadImg(url, crop=1) {
    return new Promise(res=>{
      const img=new Image(); img.crossOrigin="anonymous";
      img.onload=()=>{
        const rh=Math.floor(img.naturalHeight*crop);
        const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=rh;
        const ctx=c.getContext("2d");
        ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,c.width,rh); ctx.drawImage(img,0,0);
        res(c.toDataURL("image/jpeg",0.88));
      };
      img.onerror=()=>res(null);
      img.src=url+(url.includes("?")?"":"?r="+Math.random());
    });
  }

  async function loadPhotos(list) {
    const map={};
    await Promise.all(list.slice(0,60).map(async a=>{
      const f=a.media?.find(m=>m.tipo==="FOTO");
      if(f?.url){ const img=await loadImg(f.url); if(img) map[a.id]=img; }
    }));
    return map;
  }

  // ═══════════════════════════ GRÁFICOS ══════════════════════════════════════

  function cPie(data, aw=240, ah=160) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,aw,ah);
    const total=data.reduce((s,d)=>s+(d.v||0),0); if(!total) return null;
    const cx=aw*0.37, cy=ah/2, r=Math.min(cx,cy)-10;
    let ang=-Math.PI/2;
    data.forEach((d,i)=>{
      const sl=(d.v/total)*2*Math.PI;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+sl); ctx.closePath();
      ctx.fillStyle=`rgb(${CP[i%CP.length].join(",")})`; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke(); ang+=sl;
    });
    ctx.beginPath(); ctx.arc(cx,cy,r*0.52,0,2*Math.PI); ctx.fillStyle="#fff"; ctx.fill();
    ctx.fillStyle="#111"; ctx.font="bold 10px Arial"; ctx.textAlign="center";
    ctx.fillText(total.toLocaleString("es"),cx,cy+3);
    ctx.font="6.5px Arial"; ctx.fillStyle="#9ca3af"; ctx.fillText("Total",cx,cy+12);
    const lx=aw*0.66;
    data.slice(0,7).forEach((d,i)=>{
      const col=CP[i%CP.length], pct=((d.v/total)*100).toFixed(0), ly=10+i*20;
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fillRect(lx,ly,8,8);
      ctx.fillStyle="#374151"; ctx.font="8px Arial"; ctx.textAlign="left";
      ctx.fillText((d.k||"").slice(0,13),lx+11,ly+7);
      ctx.fillStyle="#9ca3af"; ctx.textAlign="right"; ctx.fillText(pct+"%",aw-3,ly+7);
    });
    return c.toDataURL("image/jpeg",0.95);
  }

  function cBar(data, cols, aw=240, ah=150) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,aw,ah);
    const pad={t:14,r:6,b:32,l:38};
    const w=aw-pad.l-pad.r, h=ah-pad.t-pad.b;
    const max=Math.max(...data.map(d=>d.v||0),1);
    for(let i=0;i<=4;i++){
      const y=pad.t+h-(h*i/4);
      ctx.strokeStyle="#f3f4f6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+w,y); ctx.stroke();
      const v=(max*i/4)|0;
      ctx.fillStyle="#9ca3af"; ctx.font="6.5px Arial"; ctx.textAlign="right";
      ctx.fillText(v>=1000?(v/1000).toFixed(1)+"k":String(v),pad.l-2,y+2);
    }
    const bw=Math.max(5,w/Math.max(data.length,1)*0.56), gap=w/Math.max(data.length,1);
    data.forEach((d,i)=>{
      const x=pad.l+i*gap+(gap-bw)/2, bh=((d.v||0)/max)*h, y=pad.t+h-bh;
      const col=cols?cols[i%cols.length]:CP[i%CP.length];
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fillRect(x,y,bw,bh);
      if(bh>10){ctx.fillStyle="#374151";ctx.font="bold 6px Arial";ctx.textAlign="center";ctx.fillText(fK(d.v||0),x+bw/2,y-2);}
      ctx.fillStyle="#6b7280"; ctx.font="6.5px Arial"; ctx.textAlign="center";
      ctx.fillText((d.k||"").slice(0,6),x+bw/2,pad.t+h+10);
    });
    ctx.strokeStyle="#d1d5db"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
    return c.toDataURL("image/jpeg",0.95);
  }

  function cLine(data, col, aw=240, ah=140) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,aw,ah);
    const pad={t:12,r:6,b:28,l:38};
    const w=aw-pad.l-pad.r, h=ah-pad.t-pad.b;
    const max=Math.max(...data.map(d=>d.v||0),1);
    for(let i=0;i<=4;i++){
      const y=pad.t+h-(h*i/4);
      ctx.strokeStyle="#f3f4f6"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(pad.l+w,y); ctx.stroke();
      const v=(max*i/4)|0;
      ctx.fillStyle="#9ca3af"; ctx.font="6.5px Arial"; ctx.textAlign="right";
      ctx.fillText(v>=1000?(v/1000).toFixed(0)+"k":String(v),pad.l-2,y+2);
    }
    const pts=data.map((d,i)=>({x:pad.l+(i/Math.max(data.length-1,1))*w,y:pad.t+h-((d.v||0)/max)*h}));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pad.t+h);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.lineTo(pts[pts.length-1].x,pad.t+h); ctx.closePath();
    ctx.fillStyle=`rgba(${col.join(",")},0.09)`; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++){const m=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(m,pts[i-1].y,m,pts[i].y,pts[i].x,pts[i].y);}
    ctx.strokeStyle=`rgb(${col.join(",")})`; ctx.lineWidth=2.5; ctx.stroke();
    pts.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,3,0,2*Math.PI);
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle="#6b7280"; ctx.font="6.5px Arial"; ctx.textAlign="center";
      ctx.fillText((data[i].k||"").slice(0,4),p.x,pad.t+h+10);
    });
    ctx.strokeStyle="#d1d5db"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,pad.t+h); ctx.lineTo(pad.l+w,pad.t+h); ctx.stroke();
    return c.toDataURL("image/jpeg",0.95);
  }

  function cHBar(data, col, aw=240, ah=150) {
    const c=document.createElement("canvas"); c.width=aw*2; c.height=ah*2;
    const ctx=c.getContext("2d"); ctx.scale(2,2);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,aw,ah);
    const max=Math.max(...data.map(d=>d.v||0),1);
    const rh=Math.min(26,(ah-8)/Math.max(data.length,1));
    data.slice(0,6).forEach((d,i)=>{
      const y=6+i*rh, pct=(d.v||0)/max;
      ctx.fillStyle="#f3f4f6"; ctx.fillRect(aw*0.42,y+3,(aw*0.52),rh-6);
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.fillRect(aw*0.42,y+3,pct*(aw*0.52),rh-6);
      ctx.fillStyle="#374151"; ctx.font="bold 8px Arial"; ctx.textAlign="left";
      ctx.fillText(`${i+1}. ${(d.k||"").slice(0,16)}`,4,y+rh/2+3);
      ctx.fillStyle=`rgb(${col.join(",")})`; ctx.font="bold 7.5px Arial"; ctx.textAlign="right";
      ctx.fillText(fK(d.v||0),aw-3,y+rh/2+3);
    });
    return c.toDataURL("image/jpeg",0.95);
  }

  // ═══════════════════════════ QR ════════════════════════════════════════════
  function drawQR(doc,x,y,size,darkCol) {
    const cell=size/19;
    const P=[
      [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],[1,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0],
      [1,0,1,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1,1],[0,1,0,0,1,0,0,1,0,1,0,1,0,1,0,0,1,0,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,0,1,1,1,0,1,1,0,1,1,0,1],[1,0,0,0,0,0,1,0,0,0,1,0,0,1,0,0,1,0,0],
      [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1],[1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,0,0,0],
      [1,0,0,0,0,0,1,0,1,1,1,0,1,0,1,0,1,1,1],
    ];
    doc.setFillColor(255,255,255); doc.rect(x-0.5,y-0.5,size+1,size+1,"F");
    P.forEach((row,ri)=>row.forEach((v,ci)=>{
      if(v){doc.setFillColor(...(darkCol||[20,83,45]));doc.rect(x+ci*cell,y+ri*cell,cell,cell,"F");}
    }));
  }

  // ═══════════════════════════ ENCABEZADO ════════════════════════════════════
  function makeHeader(doc, {logo,fincaNombre,adminNombre,ubicacion,fecha,hora,numReporte,p,W}) {
    const HH=50;
    // Fondo oscuro
    doc.setFillColor(18,18,18); doc.rect(0,0,W,HH,"F");
    // Área blanca para el logo
    doc.setFillColor(255,255,255); doc.roundedRect(4,4,42,HH-8,2,2,"F");
    if(logo) doc.addImage(logo,"JPEG",5,6,40,40*0.52);

    // Nombre de la finca (área oscura)
    doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
    doc.text("GANADERÍA",50,13);
    doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text((fincaNombre||"MI FINCA").toUpperCase().slice(0,18),50,24);
    doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text("CATTLE MANAGEMENT",50,31);

    // Línea vertical separadora
    doc.setDrawColor(50,50,50); doc.setLineWidth(0.6);
    doc.line(112,6,112,HH-6);

    // Título del reporte (grande, con color institucional)
    const titleColor=p.dark.map(v=>Math.min(255,v+80));
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
    doc.text("REPORTE DE",116,14);
    doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(...titleColor);
    doc.text(p.title,116,28);

    // Acento de color bajo el título
    doc.setFillColor(...p.dark); doc.rect(116,31,doc.getTextWidth(p.title)*18/doc.getFontSize()+1,1.2,"F");

    // Panel de metadata (derecha)
    const RX=W-40;
    doc.setFillColor(30,30,30); doc.roundedRect(RX-2,5,38,HH-10,2,2,"F");
    doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text("N° REPORTE",RX+17,12,{align:"center"});
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(220,220,220);
    doc.text(numReporte,RX+17,19,{align:"center"});
    doc.setDrawColor(50,50,50); doc.setLineWidth(0.3);
    doc.line(RX,21,RX+34,21);
    doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text("FECHA",RX+17,26,{align:"center"});
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(200,200,200);
    doc.text(fecha,RX+17,32,{align:"center"});
    doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text("HORA",RX+17,37,{align:"center"});
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(200,200,200);
    doc.text(hora,RX+17,43,{align:"center"});
    drawQR(doc,RX+1,HH-1,14,[200,200,200]);

    // Franja de info (finca, ubicación, admin)
    doc.setFillColor(245,246,248); doc.rect(0,HH,W,10,"F");
    doc.setFillColor(...p.dark); doc.rect(0,HH,W,0.8,"F");
    doc.setFillColor(...p.dark); doc.rect(0,HH+9.2,W,0.8,"F");
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(55,55,55);
    doc.text(`\u{1F4CD} Finca: ${fincaNombre}`, 8, HH+6.5);
    doc.text(`\u{1F4CD} Ubicación: ${ubicacion||"Nicaragua"}`, W/3+4, HH+6.5);
    doc.text(`\u{1F464} Administrador: ${adminNombre}`, 2*W/3+4, HH+6.5);

    return HH+10+3;
  }

  function makeFooter(doc,pg,total,p,W,H,numReporte) {
    doc.setFillColor(18,18,18); doc.rect(0,H-10,W,10,"F");
    doc.setFillColor(...p.dark); doc.rect(0,H-10,W,1,"F");
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
    doc.text(`Henriquez Cattle Management ERP  •  Versión 2.0  •  Documento Oficial  •  ${numReporte}`,15,H-4);
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(`Página ${pg} de ${total}`,W-15,H-4,{align:"right"});
  }

  function secTitle(doc,x,y,text,p,W) {
    doc.setFillColor(...p.dark); doc.rect(x,y,W-x*2,8,"F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(text.toUpperCase(),x+5,y+5.8);
    return y+10;
  }

  function kpiCard(doc,x,y,w,h,icon,label,value,sub,p) {
    doc.setFillColor(235,235,235); doc.roundedRect(x+0.7,y+0.7,w,h,2,2,"F");
    doc.setFillColor(255,255,255); doc.roundedRect(x,y,w,h,2,2,"F");
    doc.setFillColor(...p.dark); doc.roundedRect(x,y,2.5,h,1.5,1.5,"F");
    if(icon){doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(...p.dark);doc.text(icon,x+6,y+8);}
    doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
    doc.text(label.toUpperCase(),x+6,y+(icon?14:9));
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
    doc.text(String(value),x+6,y+(icon?23:19));
    if(sub){doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(155,155,155);doc.text(String(sub),x+6,y+(icon?29:26));}
  }

  function statBlock(doc,x,y,titulo,rows,p,colW) {
    doc.setFillColor(...p.dark); doc.rect(x,y,colW,7,"F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(titulo.toUpperCase(),x+3,y+5.2);
    let cy=y+9;
    rows.forEach((r,i)=>{
      if(i%2===0){doc.setFillColor(248,248,252);}else{doc.setFillColor(255,255,255);}
      doc.rect(x,cy,colW,6,"F");
      doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(55,55,55);
      doc.text(r[0].slice(0,20),x+2,cy+4.5);
      doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
      doc.text(r[1],x+colW-2,cy+4.5,{align:"right"});
      cy+=6;
    });
    return cy+2;
  }

  // ═══════════════════════════ REPORTE ANIMALES ══════════════════════════════
  async function rptAnimales(doc,{logo,animales,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const {default:autoTable}=await import("jspdf-autotable");
    const activos =animales.filter(a=>a.estado==="ACTIVO");
    const vendidos=animales.filter(a=>a.estado==="VENDIDO");
    const muertos =animales.filter(a=>a.estado==="MUERTO");
    const hembras =activos.filter(a=>a.sexo==="HEMBRA");
    const machos  =activos.filter(a=>a.sexo==="MACHO");
    const conPeso =activos.filter(a=>(a.pesoActual||0)>0);
    const pesoP   =conPeso.length?Math.round(conPeso.reduce((s,a)=>s+(a.pesoActual||0),0)/conPeso.length):0;
    const tc      =finca?.tipoCambio||36.5;
    const precioKg=1.5; // referencial USD/kg
    const valorHato=conPeso.reduce((s,a)=>s+(a.pesoActual||0)*precioKg*tc,0);
    const prenadas=stats?.animales?.prenadas||hembras.filter(a=>a.estadoReproductivo?.includes("PRE")).length;

    const razas={}; activos.forEach(a=>{const r=a.raza||"Sin raza";razas[r]=(razas[r]||0)+1;});
    const repro={}; hembras.forEach(a=>{const e=a.estadoReproductivo||"Sin dato";repro[e]=(repro[e]||0)+1;});

    // Fotos
    const photos=await loadPhotos(animales);

    // Datos por mes (nacimientos/registros)
    const mMes={};
    animales.forEach(a=>{
      if(!a.createdAt)return;
      const d=new Date(a.createdAt);
      const k=d.toLocaleDateString("es",{month:"short"});
      mMes[k]=(mMes[k]||0)+1;
    });
    const mesData=Object.entries(mMes).slice(-12).map(([k,v])=>({k,v}));

    // ── Página 1 ──
    let y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});

    // KPIs (una fila horizontal)
    y=secTitle(doc,8,y,"RESUMEN EJECUTIVO",p,W);
    const kpis=[
      ["🐄","Total Animales",animales.length,"en sistema"],
      ["✅","Activos",activos.length,`${((activos.length/Math.max(animales.length,1))*100).toFixed(0)}% del hato`],
      ["♀","Hembras",hembras.length,""],
      ["♂","Machos",machos.length,""],
      ["🤰","Preñadas",prenadas,"gestantes"],
      ["⚖️","Peso Promedio",pesoP+" kg",`${conPeso.length} con peso`],
      ["💰","Valor Est. Hato",fN(valorHato),"precio ref."],
    ];
    const kW=(W-16)/kpis.length, kH=34;
    kpis.forEach((k,i)=>kpiCard(doc,8+i*(kW+0),y,kW-1,kH,k[0],k[1],k[2],k[3],p));
    y+=kH+6;

    // Gráficos (3 en una fila)
    y=secTitle(doc,8,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-24)/3, imgH=cw*0.7;
    const chartY=y;

    const pieS=cPie([{k:"Hembras",v:hembras.length},{k:"Machos",v:machos.length}],Math.round(cw*3.8),Math.round(imgH*3.8));
    if(pieS){doc.addImage(pieS,"JPEG",8,chartY,cw,imgH);}
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(60,60,60);
    doc.text("DISTRIBUCIÓN GENERAL",8+cw/2,chartY+imgH+5,{align:"center"});

    const razaArr=Object.entries(razas).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>({k,v}));
    const barR=cBar(razaArr,[p.dark,...razaArr.map((_,i)=>CP[i%CP.length])],Math.round(cw*3.8),Math.round(imgH*3.8));
    if(barR){doc.addImage(barR,"JPEG",8+cw+4,chartY,cw,imgH);}
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(60,60,60);
    doc.text("PESO PROMEDIO POR RAZA",8+cw+4+cw/2,chartY+imgH+5,{align:"center"});

    const lineM=cLine(mesData.length?mesData:[{k:"Sin datos",v:0}],p.dark,Math.round(cw*3.8),Math.round(imgH*3.8));
    if(lineM){doc.addImage(lineM,"JPEG",8+2*(cw+4),chartY,cw,imgH);}
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(60,60,60);
    doc.text("INVENTARIO ÚLTIMOS 12 MESES",8+2*(cw+4)+cw/2,chartY+imgH+5,{align:"center"});
    y+=imgH+10;

    // Tabla inventario
    if(y>H-90){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"INVENTARIO ANIMAL",p,W);

    const tableBody=animales.map((a,i)=>[
      i+1,
      "", // foto — se dibuja en didDrawCell
      a.identificador,
      a.nombre||"—",
      a.raza||"—",
      a.sexo==="HEMBRA"?"♀ Hembra":"♂ Macho",
      age(a.fechaNacimiento),
      a.pesoActual?(a.pesoActual+" kg"):"—",
      a.estado,
      a.estadoReproductivo||"—",
      a.pesoActual?fN((a.pesoActual||0)*precioKg*tc):"—",
    ]);

    autoTable(doc,{
      startY:y,
      head:[["#","Foto","ID/Arete","Nombre","Raza","Sexo","Edad","Peso","Estado","Reproducción","Valor Est."]],
      body:tableBody,
      margin:{left:8,right:8},
      styles:{fontSize:6.8,cellPadding:2.2,lineColor:[225,225,225],lineWidth:0.2,overflow:"ellipsize"},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:7,cellPadding:3},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{
        0:{cellWidth:7,halign:"center"},
        1:{cellWidth:12,halign:"center"},
        5:{halign:"center"},
        7:{halign:"right"},
        8:{halign:"center",fontStyle:"bold"},
        10:{halign:"right",fontStyle:"bold"},
      },
      willDrawCell(data){
        if(data.section==="body"&&data.column.index===8){
          const v=data.cell.raw;
          data.cell.styles.textColor=v==="ACTIVO"?p.dark:v==="VENDIDO"?[30,64,175]:[153,27,27];
        }
      },
      didDrawCell(data){
        if(data.section==="body"&&data.column.index===1){
          const a=animales[data.row.index];
          if(a&&photos[a.id]){
            const {x,y:ry,height:rh,width:rw}=data.cell;
            try{doc.addImage(photos[a.id],"JPEG",x+1,ry+1,rw-2,rh-2);}catch(_){}
          }
        }
      },
      showHead:"everyPage",
      didDrawPage:()=>makeFooter(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",p,W,H,numReporte),
    });
    y=doc.lastAutoTable.finalY+8;

    // Estadísticas (4 columnas)
    if(y>H-75){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"ESTADÍSTICAS",p,W);
    const colW=(W-32)/4;
    const razaRows=Object.entries(razas).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>[k,`${v} (${((v/activos.length||0)*100).toFixed(0)}%)`]);
    const sexoRows=[["Hembras",`${hembras.length} (${((hembras.length/Math.max(activos.length,1))*100).toFixed(0)}%)`],["Machos",`${machos.length} (${((machos.length/Math.max(activos.length,1))*100).toFixed(0)}%)`]];
    const edadRows=[
      ["< 1 año",activos.filter(a=>a.fechaNacimiento&&(Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5)<1).length+" ("+((activos.filter(a=>a.fechaNacimiento&&(Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5)<1).length/Math.max(activos.length,1))*100).toFixed(0)+"%)"],
      ["1–3 años",activos.filter(a=>a.fechaNacimiento&&((Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5))>=1&&((Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5))<3).length+" (...)"],
      ["3–5 años",activos.filter(a=>a.fechaNacimiento&&((Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5))>=3&&((Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5))<5).length+" (...)"],
      ["5+ años",activos.filter(a=>a.fechaNacimiento&&((Date.now()-new Date(a.fechaNacimiento))/(365.25*864e5))>=5).length+" (...)"],
      ["Sin fecha",activos.filter(a=>!a.fechaNacimiento).length+" (...)"],
    ];
    const reproRows=Object.entries(repro).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>[k,`${v} (${((v/Math.max(hembras.length,1))*100).toFixed(0)}%)`]);
    statBlock(doc,8,y,"Por Raza",razaRows,p,colW);
    statBlock(doc,8+colW+2,y,"Por Sexo",sexoRows,p,colW);
    statBlock(doc,8+2*(colW+2),y,"Por Edad",edadRows,p,colW);
    const maxStatH=Math.max(razaRows.length,reproRows.length)*6+11;
    statBlock(doc,8+3*(colW+2),y,"Reproducción",reproRows,p,colW);
    y+=maxStatH+10;

    // Firmas
    if(y>H-55){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=secTitle(doc,8,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    const firmRoles=[["Administrador",adminNombre,""],[`Médico Veterinario`,"Dr. _____________","M.V. __________"],["Propietario / Dueño",adminNombre,""]];
    const fW=(W-32)/3;
    firmRoles.forEach((r,i)=>{
      const fx=8+i*(fW+8);
      doc.setFillColor(250,250,252); doc.roundedRect(fx,y,fW,40,2,2,"F");
      doc.setDrawColor(...p.dark); doc.setLineWidth(0.3); doc.roundedRect(fx,y,fW,40,2,2,"S");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
      doc.text(r[0],fx+fW/2,y+8,{align:"center"});
      doc.setDrawColor(160,160,160); doc.setLineWidth(0.4);
      doc.line(fx+8,y+26,fx+fW-8,y+26);
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(40,40,40);
      doc.text(r[1],fx+fW/2,y+33,{align:"center"});
      if(r[2]){doc.setFontSize(6.5);doc.setFont("helvetica","normal");doc.setTextColor(120,120,120);doc.text(r[2],fx+fW/2,y+38,{align:"center"});}
    });

    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════ REPORTE VENTAS ════════════════════════════════
  async function rptVentas(doc,{logo,ventas,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const {default:autoTable}=await import("jspdf-autotable");
    const tc=finca?.tipoCambio||36.5;
    const totalNIO=ventas.reduce((s,v)=>s+(v.precioNIO||0),0);
    const totalUSD=ventas.reduce((s,v)=>s+(v.precioUSD||0),0);
    const totalPeso=ventas.reduce((s,v)=>s+(v.pesoKg||0),0);
    const pagadas=ventas.filter(v=>v.estadoPago==="PAGADO");
    const ganancia=totalNIO*0.2; // estimado
    const margen=ventas.length?(ganancia/totalNIO*100).toFixed(0)+"%" :"0%";

    const metodos={}; ventas.forEach(v=>{const m=v.metodoPago||"EFECTIVO";metodos[m]=(metodos[m]||0)+1;});
    const tipos={}; ventas.forEach(v=>{const t=v.tipoVenta||"OTRO";tipos[t]=(tipos[t]||0)+(v.precioNIO||0);});
    const mMes={};
    ventas.forEach(v=>{
      if(!v.fecha)return;
      const d=new Date(v.fecha);
      const k=d.toLocaleDateString("es",{month:"short"});
      mMes[k]=(mMes[k]||0)+(v.precioNIO||0);
    });
    const mesData=Object.entries(mMes).slice(-8).map(([k,v])=>({k,v}));
    const compradores={};
    ventas.forEach(v=>{const c=v.comprador||"Sin nombre";compradores[c]=(compradores[c]||{n:0,t:0});compradores[c].n++;compradores[c].t+=(v.precioNIO||0);});
    const topComp=Object.entries(compradores).sort((a,b)=>b[1].t-a[1].t).slice(0,5);

    let y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});
    y=secTitle(doc,8,y,"RESUMEN EJECUTIVO",p,W);
    const kpis=[
      ["🛒","Ventas Realizadas",ventas.length,"transacciones"],
      ["💵","Total Córdobas",fN(totalNIO),"moneda local"],
      ["💲","Total USD",fU(totalUSD),"dólares"],
      ["⚖️","Peso Total",totalPeso?" "+Math.round(totalPeso)+" kg":"—","kg vendidos"],
      ["📊","Promedio por kg",totalPeso?fN(totalNIO/totalPeso):"—","NIO/kg"],
      ["📈","Ganancia Total",fN(ganancia),"estimado"],
      ["%","Margen Promedio",margen,"de las ventas"],
    ];
    const kW=(W-16)/kpis.length, kH=34;
    kpis.forEach((k,i)=>kpiCard(doc,8+i*(kW),y,kW-1,kH,k[0],k[1],k[2],k[3],p));
    y+=kH+6;

    y=secTitle(doc,8,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-24)/3, imgH=cw*0.7;
    const chartY=y;
    const barM=cBar(mesData.length?mesData:[{k:"Sin datos",v:0}],[p.dark,...mesData.map((_,i)=>CP[i%CP.length])],Math.round(cw*3.8),Math.round(imgH*3.8));
    if(barM){doc.addImage(barM,"JPEG",8,chartY,cw,imgH);}
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(60,60,60);
    doc.text("VENTAS POR MES (C$)",8+cw/2,chartY+imgH+5,{align:"center"});

    const pieTipo=cPie(Object.entries(tipos).map(([k,v])=>({k,v})),Math.round(cw*3.8),Math.round(imgH*3.8));
    if(pieTipo){doc.addImage(pieTipo,"JPEG",8+cw+4,chartY,cw,imgH);}
    doc.text("VENTAS POR CATEGORÍA",8+cw+4+cw/2,chartY+imgH+5,{align:"center"});

    const hBarC=cHBar(topComp.map(([k,d])=>({k,v:d.t})),p.dark.map(()=>p.dark).concat(topComp.map((_,i)=>CP[i%CP.length])),Math.round(cw*3.8),Math.round(imgH*3.8));
    if(hBarC){doc.addImage(hBarC,"JPEG",8+2*(cw+4),chartY,cw,imgH);}
    doc.text("VENTAS POR CLIENTE",8+2*(cw+4)+cw/2,chartY+imgH+5,{align:"center"});
    y+=imgH+10;

    if(y>H-90){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"DETALLE DE VENTAS",p,W);
    autoTable(doc,{
      startY:y,
      head:[["#","Fecha","Factura","Cliente","Animal","Raza","Peso(kg)","Precio/Kg(C$)","Subtotal(C$)","Total(C$)","Método Pago","Estado"]],
      body:ventas.map((v,i)=>[
        i+1,
        v.fecha?new Date(v.fecha).toLocaleDateString("es"):"—",
        v.numeroFactura||`F-${String(i+1).padStart(5,"0")}`,
        (v.comprador||"Sin nombre").slice(0,16),
        v.animal?.identificador||"—",
        v.animal?.raza||"—",
        v.pesoKg||"—",
        v.precioKg?fN(v.precioKg):"—",
        fN((v.pesoKg||0)*(v.precioKg||0)),
        fN(v.precioNIO||0),
        v.metodoPago||"—",
        v.estadoPago||"—",
      ]),
      foot:[["","","","","","","","","","TOTAL",fN(totalNIO),""]],
      margin:{left:8,right:8},
      styles:{fontSize:6.5,cellPadding:2.2,lineColor:[225,225,225],lineWidth:0.2},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:6.8},
      footStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold"},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{0:{cellWidth:6,halign:"center"},9:{halign:"right",fontStyle:"bold"},11:{halign:"center",fontStyle:"bold"}},
      willDrawCell(data){
        if(data.section==="body"&&data.column.index===11){
          const v=data.cell.raw;
          data.cell.styles.textColor=v==="PAGADO"?p.dark:v==="PARCIAL"?[133,77,14]:[153,27,27];
        }
      },
      showHead:"everyPage",
      didDrawPage:()=>makeFooter(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",p,W,H,numReporte),
    });
    y=doc.lastAutoTable.finalY+8;

    // Resumen financiero + métodos de pago + top clientes
    if(y>H-80){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"RESUMEN FINANCIERO  |  MÉTODOS DE PAGO  |  TOP 5 CLIENTES",p,W);
    const col3=(W-24)/3;

    // Resumen financiero
    const resRows=[["Total en Córdobas",fN(totalNIO)],["Total en USD",fU(totalUSD)],["Ganancia Total",fN(ganancia)],["Margen Promedio",margen],["Venta Mayor",fN(Math.max(...ventas.map(v=>v.precioNIO||0)))],["Venta Menor",fN(Math.min(...ventas.map(v=>v.precioNIO||0)))]];
    let ry=y+1;
    resRows.forEach((r,i)=>{
      doc.setFillColor(i%2===0?248:255,i%2===0?248:255,i%2===0?252:255); doc.rect(8,ry,col3-2,8,"F");
      doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(60,60,60);doc.text(r[0],11,ry+5.5);
      doc.setFont("helvetica","bold");doc.setTextColor(...p.dark);doc.text(r[1],8+col3-4,ry+5.5,{align:"right"});
      ry+=8;
    });

    // Métodos de pago (pie pequeño)
    const pieMet=cPie(Object.entries(metodos).map(([k,v])=>({k,v})),Math.round(col3*3.2),Math.round(col3*2.3));
    if(pieMet){doc.addImage(pieMet,"JPEG",8+col3+4,y,col3-2,col3*0.72);}

    // Top 5 clientes
    let cy2=y+1;
    topComp.forEach(([nombre,d],i)=>{
      const pct=(d.t/(totalNIO||1));
      doc.setFillColor(i%2===0?248:255,i%2===0?248:255,i%2===0?252:255); doc.rect(8+2*(col3+4),cy2,col3-2,10,"F");
      doc.setFillColor(...p.dark); doc.rect(8+2*(col3+4),cy2,Math.max(pct*(col3-2),3),10,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(6.5); doc.setFont("helvetica","bold");
      doc.text(`${i+1}. ${nombre.slice(0,20)}`,8+2*(col3+4)+3,cy2+6.5);
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
      doc.text(fN(d.t),8+2*(col3+4)+col3-5,cy2+6.5,{align:"right"});
      cy2+=12;
    });
    y=Math.max(ry,cy2)+10;

    // Firmas
    if(y>H-55){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=secTitle(doc,8,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    const firmRoles=[["Administrador",adminNombre,""],["Contador / Finanzas","Lic. ___________","Cont. ______"],["Propietario / Dueño",adminNombre,""]];
    const fW=(W-32)/3;
    firmRoles.forEach((r,i)=>{
      const fx=8+i*(fW+8);
      doc.setFillColor(250,250,252); doc.roundedRect(fx,y,fW,40,2,2,"F");
      doc.setDrawColor(...p.dark); doc.setLineWidth(0.3); doc.roundedRect(fx,y,fW,40,2,2,"S");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
      doc.text(r[0],fx+fW/2,y+8,{align:"center"});
      doc.setDrawColor(160,160,160); doc.setLineWidth(0.4);
      doc.line(fx+8,y+26,fx+fW-8,y+26);
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(40,40,40);
      doc.text(r[1],fx+fW/2,y+33,{align:"center"});
      if(r[2]){doc.setFontSize(6.5);doc.setFont("helvetica","normal");doc.setTextColor(120,120,120);doc.text(r[2],fx+fW/2,y+38,{align:"center"});}
    });
    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════ REPORTE GASTOS ════════════════════════════════
  async function rptGastos(doc,{logo,gastos,stats,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre}) {
    const {default:autoTable}=await import("jspdf-autotable");
    const total=gastos.reduce((s,g)=>s+(g.monto||0),0);
    const promedio=gastos.length?total/gastos.length:0;
    const cats={};  gastos.forEach(g=>{const c=g.categoria||"Sin categoría";cats[c]=(cats[c]||0)+(g.monto||0);});
    const provs={}; gastos.forEach(g=>{const c=g.proveedor||"Sin proveedor";provs[c]=(provs[c]||0)+(g.monto||0);});
    const mMes={};
    gastos.forEach(g=>{
      if(!g.fecha)return;
      const d=new Date(g.fecha);
      const k=d.toLocaleDateString("es",{month:"short"});
      mMes[k]=(mMes[k]||0)+(g.monto||0);
    });
    const mesData=Object.entries(mMes).slice(-8).map(([k,v])=>({k,v}));
    const topCats=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
    const topProvs=Object.entries(provs).sort((a,b)=>b[1]-a[1]);

    // Variación vs mes anterior
    const meses=Object.values(mMes);
    const varPct=meses.length>=2?Math.round(((meses[meses.length-1]-meses[meses.length-2])/Math.max(meses[meses.length-2],1))*100):0;

    let y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W});
    y=secTitle(doc,8,y,"RESUMEN EJECUTIVO",p,W);
    const kpis=[
      ["📊","Gasto Total",fN(total),"acumulado"],
      ["🛍️","Compras Realizadas",gastos.length,"registros"],
      ["📐","Gasto Promedio",fN(promedio),"por registro"],
      ["🏷️","Categoría Principal",(topCats[0]?.[0]||"—").slice(0,10),fN(topCats[0]?.[1]||0)],
      ["🏢","Proveedor Principal",(topProvs[0]?.[0]||"—").slice(0,10),fN(topProvs[0]?.[1]||0)],
      [varPct<0?"📉":"📈","vs Mes Anterior",(varPct>=0?"+":"")+varPct+"%","variación"],
    ];
    const kW=(W-16)/kpis.length, kH=34;
    kpis.forEach((k,i)=>kpiCard(doc,8+i*(kW),y,kW-1,kH,k[0],k[1],k[2],k[3],p));
    y+=kH+6;

    y=secTitle(doc,8,y,"ANÁLISIS GRÁFICO",p,W);
    const cw=(W-24)/3, imgH=cw*0.7;
    const chartY=y;

    const pieCat=cPie(topCats.slice(0,7).map(([k,v])=>({k,v})),Math.round(cw*3.8),Math.round(imgH*3.8));
    if(pieCat){doc.addImage(pieCat,"JPEG",8,chartY,cw,imgH);}
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(60,60,60);
    doc.text("GASTOS POR CATEGORÍA",8+cw/2,chartY+imgH+5,{align:"center"});

    const barM=cBar(mesData.length?mesData:[{k:"Sin datos",v:0}],[p.dark,...mesData.map((_,i)=>CP[i%CP.length])],Math.round(cw*3.8),Math.round(imgH*3.8));
    if(barM){doc.addImage(barM,"JPEG",8+cw+4,chartY,cw,imgH);}
    doc.text("GASTO MENSUAL (C$)",8+cw+4+cw/2,chartY+imgH+5,{align:"center"});

    const lineM=cLine(mesData.length?mesData:[{k:"Sin datos",v:0}],p.dark,Math.round(cw*3.8),Math.round(imgH*3.8));
    if(lineM){doc.addImage(lineM,"JPEG",8+2*(cw+4),chartY,cw,imgH);}
    doc.text("EVOLUCIÓN DEL GASTO (C$)",8+2*(cw+4)+cw/2,chartY+imgH+5,{align:"center"});
    y+=imgH+10;

    if(y>H-90){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"DETALLE DE GASTOS",p,W);
    autoTable(doc,{
      startY:y,
      head:[["#","Fecha","Proveedor","Categoría","Descripción","Factura","Monto(C$)","Estado","Responsable"]],
      body:gastos.map((g,i)=>[
        i+1,
        g.fecha?new Date(g.fecha).toLocaleDateString("es"):"—",
        (g.proveedor||"—").slice(0,18),
        g.categoria||"—",
        (g.descripcion||g.concepto||"—").slice(0,28),
        g.numeroFactura||g.factura||"—",
        fN(g.monto||0),
        g.estado||g.estadoPago||"Pagado",
        (g.responsable||adminNombre).slice(0,14),
      ]),
      foot:[["","","","","","TOTAL",fN(total),"",""]],
      margin:{left:8,right:8},
      styles:{fontSize:6.5,cellPadding:2.2,lineColor:[225,225,225],lineWidth:0.2},
      headStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold",fontSize:7},
      footStyles:{fillColor:p.dark,textColor:[255,255,255],fontStyle:"bold"},
      alternateRowStyles:{fillColor:p.light},
      columnStyles:{0:{cellWidth:6,halign:"center"},6:{halign:"right",fontStyle:"bold"},7:{halign:"center",fontStyle:"bold"}},
      willDrawCell(data){
        if(data.section==="body"&&data.column.index===7){
          const v=String(data.cell.raw||"");
          data.cell.styles.textColor=v.toLowerCase().includes("pag")?p.dark:[153,27,27];
        }
      },
      showHead:"everyPage",
      didDrawPage:()=>makeFooter(doc,doc.internal.getCurrentPageInfo().pageNumber,"?",p,W,H,numReporte),
    });
    y=doc.lastAutoTable.finalY+8;

    // Resumen por Proveedor + Top Categorías + Indicadores
    if(y>H-80){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+2;}
    y=secTitle(doc,8,y,"RESUMEN POR PROVEEDOR  |  TOP CATEGORÍAS  |  INDICADORES",p,W);
    const col3=(W-24)/3;
    const provRows=topProvs.slice(0,5).map(([k,v],i)=>[`${i+1}. ${k.slice(0,16)}`,fN(v)]);
    const catRows=topCats.slice(0,5).map(([k,v],i)=>[`${i+1}. ${k.slice(0,12)}`,`${((v/total)*100).toFixed(0)}%  ${fN(v)}`]);
    const indicRows=[["Mayor Gasto",fN(Math.max(...gastos.map(g=>g.monto||0)))],["Menor Gasto",fN(Math.min(...gastos.filter(g=>g.monto>0).map(g=>g.monto||0)))],["Promedio",fN(promedio)],["Categoría Principal",(topCats[0]?.[0]||"—").slice(0,14)],["Proveedor Principal",(topProvs[0]?.[0]||"—").slice(0,14)]];

    const maxH=Math.max(provRows.length,catRows.length,indicRows.length)*6+11;
    statBlock(doc,8,y,"Resumen por Proveedor",provRows,p,col3-2);
    statBlock(doc,8+col3+4,y,"Top Categorías",catRows,p,col3-2);
    statBlock(doc,8+2*(col3+4),y,"Indicadores",indicRows,p,col3-2);
    y+=maxH+10;

    // Firmas
    if(y>H-55){doc.addPage();y=makeHeader(doc,{logo,fincaNombre,adminNombre,ubicacion:finca?.ubicacion,fecha,hora,numReporte,p,W})+4;}
    y=secTitle(doc,8,y,"FIRMAS Y VALIDACIÓN OFICIAL",p,W);
    const firmRoles=[["Administrador",adminNombre,""],["Contador / Finanzas","Lic. ___________","Cont. ______"],["Propietario / Dueño",adminNombre,""]];
    const fW=(W-32)/3;
    firmRoles.forEach((r,i)=>{
      const fx=8+i*(fW+8);
      doc.setFillColor(250,250,252); doc.roundedRect(fx,y,fW,40,2,2,"F");
      doc.setDrawColor(...p.dark); doc.setLineWidth(0.3); doc.roundedRect(fx,y,fW,40,2,2,"S");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...p.dark);
      doc.text(r[0],fx+fW/2,y+8,{align:"center"});
      doc.setDrawColor(160,160,160); doc.setLineWidth(0.4);
      doc.line(fx+8,y+26,fx+fW-8,y+26);
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(40,40,40);
      doc.text(r[1],fx+fW/2,y+33,{align:"center"});
      if(r[2]){doc.setFontSize(6.5);doc.setFont("helvetica","normal");doc.setTextColor(120,120,120);doc.text(r[2],fx+fW/2,y+38,{align:"center"});}
    });
    return doc.internal.getNumberOfPages();
  }

  // ═══════════════════════════ FUNCIÓN PRINCIPAL ═════════════════════════════
  async function generarPDF(tipo) {
    setGenerando(tipo); setError("");
    try {
      const {jsPDF}=await import("jspdf");
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight();

      const now=new Date();
      const fecha=now.toLocaleDateString("es",{day:"2-digit",month:"long",year:"numeric"});
      const hora=now.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});
      const seq=String(Math.floor(Math.random()*99000)+1000).padStart(5,"0");
      const numReporte=`${PAL[tipo].pre}-${now.getFullYear()}-${seq}`;
      const fincaNombre=finca?.nombre||"Mi Finca";
      const adminNombre=finca?.usuarios?.[0]?.nombre||"Administrador";
      const p={...PAL[tipo]};
      const logo=await loadImg(window.location.origin+"/logo-base.jpg",0.52);
      const ctx={logo,finca,p,W,H,numReporte,fecha,hora,fincaNombre,adminNombre,stats};

      let totalPags;
      if(tipo==="animales")     totalPags=await rptAnimales(doc,{...ctx,animales});
      else if(tipo==="ventas")  totalPags=await rptVentas(doc,{...ctx,ventas});
      else                      totalPags=await rptGastos(doc,{...ctx,gastos});

      for(let pg=1;pg<=totalPags;pg++){doc.setPage(pg);makeFooter(doc,pg,totalPags,p,W,H,numReporte);}
      doc.save(`${numReporte}.pdf`);
    } catch(e){
      setError("Error generando PDF: "+e.message); console.error(e);
    } finally{setGenerando(null);}
  }

  // ═══════════════════════════ UI ════════════════════════════════════════════
  const anim=animales.filter(a=>a.estado==="ACTIVO");
  const totNIO=ventas.reduce((s,v)=>s+(v.precioNIO||0),0);
  const totGas=gastos.reduce((s,g)=>s+(g.monto||0),0);

  const RPTS=[
    {tipo:"animales",titulo:"Inventario Animal",ico:"🐄",col:"#14532D",colB:"#15803D",
     desc:"Inventario completo con fotos, distribución por raza y sexo, estado reproductivo, gráficos analíticos, valor estimado del hato y estadísticas.",
     badges:[`${anim.length} activos`,`${anim.filter(a=>a.sexo==="HEMBRA").length} hembras`,`${anim.filter(a=>a.sexo==="MACHO").length} machos`],
     secs:["8 KPIs ejecutivos","3 gráficos (pie, barras, línea)","Tabla completa con fotos","Estadísticas en 4 columnas","Firmas oficiales"]},
    {tipo:"ventas",titulo:"Ventas",ico:"💰",col:"#1E40AF",colB:"#2563EB",
     desc:"Análisis financiero completo, métodos de pago, tendencia mensual, ranking de compradores, comparativos y resumen financiero detallado.",
     badges:[`${ventas.length} transacciones`,fN(totNIO),`${ventas.filter(v=>v.estadoPago==="PAGADO").length} pagadas`],
     secs:["7 KPIs financieros","3 gráficos (barras, pie, horizontal)","Tabla con totales y estado","Ranking de compradores","Firmas oficiales"]},
    {tipo:"gastos",titulo:"Control de Gastos",ico:"📊",col:"#6B21A8",colB:"#7E22CE",
     desc:"Gasto total, distribución por categoría y proveedor, evolución mensual, rankings y análisis porcentual comparativo.",
     badges:[`${gastos.length} registros`,fN(totGas),`${Object.keys(gastos.reduce((a,g)=>{const c=g.categoria||"X";a[c]=1;return a},{})).length} categorías`],
     secs:["6 KPIs con variación","3 gráficos (pie, barras, línea)","Tabla detallada con estado","Ranking categorías y proveedores","Firmas oficiales"]},
  ];

  return (
    <AppLayout>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 20px"}}>
        <div style={{marginBottom:28}}>
          <p style={{color:"#6b7280",fontSize:11,textTransform:"uppercase",letterSpacing:3,marginBottom:4}}>Exportar Información</p>
          <h1 style={{fontSize:26,fontWeight:900,color:"#111827",margin:0}}>Reportes PDF Empresariales</h1>
          <p style={{color:"#6b7280",fontSize:13,marginTop:6}}>Sistema de nivel SAP / Oracle — diseño premium, gráficos analíticos, calidad de impresión profesional</p>
        </div>

        {error&&(
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"12px 16px",marginBottom:20,color:"#991b1b",fontSize:12}}>
            ⚠️ {error}
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:18,marginBottom:36}}>
          {RPTS.map(r=>(
            <div key={r.tipo} style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.07)"}}>
              <div style={{background:`linear-gradient(135deg,${r.col},${r.colB})`,padding:"18px 20px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                  <span style={{fontSize:30}}>{r.ico}</span>
                  <div>
                    <h3 style={{color:"#fff",fontWeight:800,fontSize:15,margin:0}}>{r.titulo}</h3>
                    <p style={{color:"rgba(255,255,255,0.8)",fontSize:11,margin:"4px 0 0",lineHeight:1.4}}>{r.desc}</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                  {r.badges.map((b,i)=>(
                    <span key={i} style={{background:"rgba(255,255,255,0.18)",borderRadius:20,padding:"2px 10px",fontSize:10,color:"#fff",fontWeight:700}}>{b}</span>
                  ))}
                </div>
              </div>
              <div style={{padding:"14px 20px 18px"}}>
                <p style={{fontSize:10,color:"#6b7280",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Contenido del reporte</p>
                <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
                  {r.secs.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                      <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill={r.col}/><path d="M3.5 6l2 2 3-3" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
                      <span style={{fontSize:11.5,color:"#374151"}}>{s}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={()=>generarPDF(r.tipo)}
                  disabled={!!generando}
                  style={{
                    width:"100%",padding:"12px 0",borderRadius:8,border:"none",
                    cursor:generando?"wait":"pointer",
                    background:generando===r.tipo?"#f3f4f6":r.col,
                    color:generando===r.tipo?"#9ca3af":"#fff",
                    fontWeight:800,fontSize:13,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                    opacity:generando&&generando!==r.tipo?0.35:1,
                    transition:"opacity 0.2s",letterSpacing:0.3,
                  }}
                >
                  {generando===r.tipo?<>⏳ Generando reporte profesional...</>:<>↓ Descargar PDF Profesional</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {stats&&(
          <div>
            <h2 style={{fontSize:15,fontWeight:800,color:"#111827",marginBottom:14}}>Resumen del Sistema</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:10}}>
              {[
                {l:"Total animales",v:animales.length,ico:"🐄",c:"#14532D"},
                {l:"Activos",v:anim.length,ico:"✅",c:"#15803D"},
                {l:"Ventas del mes",v:fN(stats.ventas?.totalMesNIO||0),ico:"💰",c:"#1E40AF"},
                {l:"Histórico ventas",v:fN(stats.ventas?.totalHistoricoNIO||0),ico:"📈",c:"#1d4ed8"},
                {l:"Gastos del mes",v:fN(stats.gastosMes||0),ico:"📊",c:"#6B21A8"},
                {l:"Tipo de cambio",v:`C$ ${finca?.tipoCambio||36.5}`,ico:"💱",c:"#7E22CE"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:10,border:"1px solid #e5e7eb",padding:"14px 16px",borderTop:`3px solid ${s.c}`}}>
                  <div style={{fontSize:22,marginBottom:5}}>{s.ico}</div>
                  <div style={{fontSize:15,fontWeight:800,color:"#111827",lineHeight:1.2}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#6b7280",marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
