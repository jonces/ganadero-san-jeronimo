import { appendAuditEntry, getAuditLog } from "./bi-storage.js";

export function logBI(accion, detalles = {}, usuario = "Propietario") {
  appendAuditEntry({ accion, detalles, usuario });
}

export { getAuditLog };

export function exportAuditCSV() {
  const log  = getAuditLog();
  const rows = [["ID", "Fecha", "Usuario", "Acción", "Detalles"]];
  log.forEach(e => rows.push([
    e.id, e.ts, e.usuario, e.accion,
    JSON.stringify(e.detalles ?? {}),
  ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a   = document.createElement("a");
  a.href    = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `Auditoria_BI_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);
}
