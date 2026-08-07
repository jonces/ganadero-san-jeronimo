/** Formatea un timestamp a HH:MM en español. */
export function ts(timestamp) {
  return new Date(timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Agrupa conversaciones por fecha relativa (Hoy / Ayer / Esta semana / Anteriores).
 * @param {Array<{ updatedAt: number|string }>} conversations
 */
export function groupByDate(conversations) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  const week  = new Date(today); week.setDate(week.getDate() - 7);

  const hoy = [], ayer = [], estaSem = [], antes = [];

  for (const c of conversations) {
    const d = new Date(c.updatedAt); d.setHours(0, 0, 0, 0);
    if      (d >= today) hoy.push(c);
    else if (d >= yest)  ayer.push(c);
    else if (d >= week)  estaSem.push(c);
    else                 antes.push(c);
  }

  const groups = [];
  if (hoy.length)     groups.push({ label: "Hoy",         items: hoy });
  if (ayer.length)    groups.push({ label: "Ayer",         items: ayer });
  if (estaSem.length) groups.push({ label: "Esta semana",  items: estaSem });
  if (antes.length)   groups.push({ label: "Anteriores",   items: antes });
  return groups;
}
