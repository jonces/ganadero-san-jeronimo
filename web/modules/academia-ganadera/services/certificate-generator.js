/**
 * Generador de certificados de la Academia Ganadera.
 * Produce HTML imprimible y datos para el certificado digital.
 */

import { saveCertificado } from "./academia-storage.js";

/**
 * Genera y persiste un certificado para un curso completado.
 */
export function generateCertificado({ curso, usuario }) {
  const codigo  = generateCodigo(curso.id, usuario?.id ?? "anon");
  const fecha   = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const nombre  = usuario?.nombre ?? usuario?.name ?? "Participante";
  const empresa = usuario?.finca ?? usuario?.empresa ?? null;

  const cert = {
    id:        crypto.randomUUID(),
    cursoId:   curso.id,
    cursoTitulo: curso.titulo,
    nombre,
    empresa,
    fecha,
    duracion:  formatDuration(curso.duracionMins),
    nivel:     curso.nivel,
    codigo,
    emitidoPor: "GanaderoSG — Academia Ganadera Inteligente",
    ts:        Date.now(),
  };

  saveCertificado(cert);
  return cert;
}

/**
 * Construye el HTML imprimible del certificado.
 */
export function buildCertificadoHTML(cert) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Certificado — ${cert.cursoTitulo}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 297mm; height: 210mm;
    background: #FFF;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  .cert {
    width: 270mm; height: 190mm;
    border: 12px solid #15803D;
    border-radius: 8px;
    padding: 28px 40px;
    position: relative;
    background: linear-gradient(135deg, #FAFFFE 0%, #F0FDF4 100%);
    display: flex; flex-direction: column; align-items: center;
  }
  .corner {
    position: absolute; width: 60px; height: 60px;
    background: #15803D; opacity: 0.08; border-radius: 50%;
  }
  .corner.tl { top: -20px; left: -20px; }
  .corner.tr { top: -20px; right: -20px; }
  .corner.bl { bottom: -20px; left: -20px; }
  .corner.br { bottom: -20px; right: -20px; }
  .logo { font-size: 36px; margin-bottom: 6px; }
  .emisor { font-size: 11px; color: #15803D; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
  .title { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #166534; margin-bottom: 10px; }
  .subtitle { font-size: 12px; color: #6B7280; margin-bottom: 20px; }
  .line { width: 80px; height: 2px; background: #15803D; margin-bottom: 20px; }
  .certifica { font-size: 13px; color: #374151; margin-bottom: 8px; }
  .nombre { font-family: 'Playfair Display', Georgia, serif; font-size: 34px; color: #111; margin-bottom: 8px; }
  .empresa { font-size: 13px; color: #6B7280; margin-bottom: 20px; }
  .por { font-size: 13px; color: #374151; margin-bottom: 6px; }
  .curso { font-size: 20px; font-weight: 700; color: #15803D; margin-bottom: 6px; text-align: center; }
  .detalles { font-size: 12px; color: #6B7280; margin-bottom: 24px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-top: auto; }
  .firma-box { text-align: center; }
  .firma-linea { width: 120px; height: 1px; background: #9CA3AF; margin: 0 auto 4px; }
  .firma-label { font-size: 10px; color: #9CA3AF; }
  .codigo-box { text-align: right; }
  .codigo-label { font-size: 9px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
  .codigo { font-size: 11px; color: #374151; font-family: monospace; font-weight: 600; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="cert">
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="logo">🐄</div>
  <div class="emisor">GanaderoSG — Academia Ganadera Inteligente</div>
  <div class="title">Certificado de Finalización</div>
  <div class="line"></div>
  <div class="certifica">Se certifica que</div>
  <div class="nombre">${cert.nombre}</div>
  ${cert.empresa ? `<div class="empresa">${cert.empresa}</div>` : ""}
  <div class="por">ha completado satisfactoriamente el curso</div>
  <div class="curso">${cert.cursoTitulo}</div>
  <div class="detalles">Nivel: ${cert.nivel} · Duración: ${cert.duracion} · Fecha: ${cert.fecha}</div>
  <div class="footer">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Academia Ganadera IA</div>
    </div>
    <div style="text-align:center; font-size:32px;">🏆</div>
    <div class="codigo-box">
      <div class="codigo-label">Código de verificación</div>
      <div class="codigo">${cert.codigo}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function printCertificado(cert) {
  const html = buildCertificadoHTML(cert);
  const win  = window.open("", "_blank", "width=1200,height=850");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function generateCodigo(cursoId, userId) {
  const base   = `${cursoId}-${userId}-${Date.now()}`;
  let hash     = 0x811c9dc5;
  for (let i = 0; i < base.length; i++) {
    hash ^= base.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return `GS-${hash.toString(36).toUpperCase().slice(0, 8)}`;
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m > 0 ? m + "m" : ""}`.trim();
  return `${m} minutos`;
}
