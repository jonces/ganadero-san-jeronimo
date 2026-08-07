function dl(content, filename, mime) {
  if (typeof window === "undefined") return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);
}

function fmtCOP(v) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

export function exportCSV(kpis) {
  const rows = [["KPI", "Valor", "Tipo"]];
  Object.entries(kpis ?? {}).forEach(([k, v]) => {
    rows.push([k, typeof v === "number" ? v.toFixed(2) : String(v), typeof v]);
  });
  dl(rows.map(r => r.join(",")).join("\n"), `BI_GanaderoSG_${stamp()}.csv`, "text/csv");
  return { ok: true, nota: "CSV descargado. Compatible con Excel y Google Sheets." };
}

export function exportHTMLReport(kpis, scores, empresas) {
  const scoreRows = Object.entries(scores ?? {})
    .map(([k, s]) => `<tr><td>${k}</td><td>${s.score?.toFixed(0)}/100</td><td>${nivel(s.score)}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe Ejecutivo GanaderoSG — ${stamp()}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:28px;color:#111827}
  h1{color:#1e40af;margin-bottom:4px}
  .sub{color:#6b7280;font-size:13px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px}
  .val{font-size:24px;font-weight:900;color:#1e40af}
  .lbl{font-size:12px;color:#6b7280;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{border:1px solid #e5e7eb;padding:9px 12px;text-align:left;font-size:13px}
  th{background:#f9fafb;font-weight:700}
  @media print{body{padding:0}.noprint{display:none}}
</style>
</head>
<body>
<h1>📊 Informe Ejecutivo GanaderoSG</h1>
<p class="sub">Generado: ${new Date().toLocaleString("es-CO")} · Executive Intelligence Center</p>

<div class="grid">
  <div class="card"><div class="val">${fmtCOP(kpis?.ingresos ?? 0)}</div><div class="lbl">Ingresos</div></div>
  <div class="card"><div class="val">${fmtCOP(kpis?.utilidad ?? 0)}</div><div class="lbl">Utilidad</div></div>
  <div class="card"><div class="val">${Math.round(kpis?.total_animales ?? 0)}</div><div class="lbl">Animales (cabezas)</div></div>
  <div class="card"><div class="val">${(kpis?.rentabilidad ?? 0).toFixed(1)}%</div><div class="lbl">Rentabilidad</div></div>
  <div class="card"><div class="val">${(kpis?.tasa_prenez ?? 0).toFixed(1)}%</div><div class="lbl">Tasa de Preñez</div></div>
  <div class="card"><div class="val">${scores?.general?.score?.toFixed(0) ?? 0}/100</div><div class="lbl">Score General</div></div>
</div>

<h2>Scores Empresariales</h2>
<table>
<tr><th>Área</th><th>Score</th><th>Nivel</th></tr>
${scoreRows}
</table>
</body></html>`;

  dl(html, `Informe_Ejecutivo_${stamp()}.html`, "text/html");
  return { ok: true, nota: "Informe HTML descargado. Ábrelo en cualquier navegador." };
}

export function triggerPrint() {
  if (typeof window !== "undefined") window.print();
  return { ok: true, nota: "Usa 'Guardar como PDF' en el diálogo de impresión del navegador." };
}

export function exportStub(formato) {
  return {
    ok: false,
    nota: `Exportación ${formato.toUpperCase()} requiere integración de librería externa (jsPDF / docx / pptx). Disponible en versión Pro.`,
  };
}

function stamp() { return new Date().toISOString().slice(0, 10); }
function nivel(s) { return s >= 80 ? "Excelente" : s >= 60 ? "Bueno" : s >= 40 ? "Regular" : "Crítico"; }
