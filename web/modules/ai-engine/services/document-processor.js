/**
 * Servicio de extracción de texto de documentos para IA.
 *
 * Casos de uso en ganadería:
 *   - Actas sanitarias (PDF)
 *   - Resultados de laboratorio (PDF)
 *   - Inventarios y registros (Excel / CSV)
 *   - Contratos y pólizas (Word)
 *   - Recetas veterinarias escaneadas
 *
 * Implementación por tipo:
 *   - CSV  → parseo nativo (ya funcional)
 *   - TXT  → lectura directa (ya funcional)
 *   - PDF  → requiere PDF.js (pendiente)
 *   - DOCX → requiere mammoth.js (pendiente)
 *   - XLSX → requiere SheetJS (pendiente)
 */

/**
 * Extrae el texto de un archivo.
 * @param {File} file
 * @returns {Promise<{ text: string, pages?: number, sheets?: string[] }>}
 */
export async function extractText(file) {
  const mime = file.type || "";
  const name = file.name.toLowerCase();

  // ── Texto plano / CSV ─────────────────────────────────────────────────────
  if (mime.startsWith("text/") || name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    return { text };
  }

  // ── JSON ──────────────────────────────────────────────────────────────────
  if (mime === "application/json" || name.endsWith(".json")) {
    const raw  = await file.text();
    let text   = raw;
    try {
      const obj = JSON.parse(raw);
      text = JSON.stringify(obj, null, 2);
    } catch {}
    return { text };
  }

  // ── PDF — stub (requiere PDF.js) ──────────────────────────────────────────
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    // TODO: integrar PDF.js
    // import * as pdfjs from "pdfjs-dist";
    // pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
    // const doc   = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    // const pages = await Promise.all(Array.from({ length: doc.numPages }, (_, i) =>
    //   doc.getPage(i + 1).then(p => p.getTextContent()).then(c => c.items.map(i => i.str).join(" "))
    // ));
    // return { text: pages.join("\n\n"), pages: doc.numPages };
    return {
      text: `[PDF: ${file.name} — extracción de texto pendiente de integración con PDF.js]`,
      pages: undefined,
    };
  }

  // ── DOCX / Word — stub (requiere mammoth.js) ──────────────────────────────
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx") || name.endsWith(".doc")
  ) {
    // TODO: integrar mammoth.js
    // import mammoth from "mammoth";
    // const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    // return { text: value };
    return { text: `[Word: ${file.name} — extracción de texto pendiente de integración con mammoth.js]` };
  }

  // ── Excel / XLSX — stub (requiere SheetJS) ────────────────────────────────
  if (
    mime.includes("spreadsheet") || mime.includes("excel") ||
    name.endsWith(".xlsx") || name.endsWith(".xls")
  ) {
    // TODO: integrar SheetJS (xlsx)
    // import * as XLSX from "xlsx";
    // const wb     = XLSX.read(await file.arrayBuffer(), { type: "array" });
    // const sheets = wb.SheetNames.map(name => {
    //   const ws  = wb.Sheets[name];
    //   const csv = XLSX.utils.sheet_to_csv(ws);
    //   return `--- Hoja: ${name} ---\n${csv}`;
    // });
    // return { text: sheets.join("\n\n"), sheets: wb.SheetNames };
    return { text: `[Excel: ${file.name} — extracción de datos pendiente de integración con SheetJS]`, sheets: [] };
  }

  return { text: `[Documento: ${file.name} (${mime}) — tipo no soportado aún]` };
}

/**
 * Devuelve una descripción legible del tipo de documento.
 * @param {string} mime
 * @param {string} name
 * @returns {string}
 */
export function documentTypeLabel(mime, name = "") {
  const n = name.toLowerCase();
  if (mime === "application/pdf" || n.endsWith(".pdf"))  return "PDF";
  if (n.endsWith(".docx") || n.endsWith(".doc"))         return "Word";
  if (n.endsWith(".xlsx") || n.endsWith(".xls"))         return "Excel";
  if (mime.startsWith("text/csv") || n.endsWith(".csv")) return "CSV";
  if (mime.startsWith("text/"))                          return "Texto";
  return "Documento";
}
