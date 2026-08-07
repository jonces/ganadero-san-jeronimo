/**
 * Servicio de publicaciones del Marketplace.
 * Búsqueda, filtros avanzados y scoring de relevancia.
 */
import { getListings, upsertListing, deleteListing } from "./marketplace-storage.js";

let _seq = Date.now();
function newId() { return `lst-${++_seq}`; }

/** Crea una nueva publicación. */
export function createListing(data) {
  const listing = {
    id:        newId(),
    status:    "activa",
    destacada: false,
    vistas:    0,
    favoritos: 0,
    calificacion: 0,
    num_resenas:  0,
    ...data,
    creadoTs:  Date.now(),
  };
  upsertListing(listing);
  return listing;
}

/** Actualiza una publicación existente. */
export function updateListing(id, patch) {
  const list = getListings();
  const curr = list.find(l => l.id === id);
  if (!curr) return null;
  return upsertListing({ ...curr, ...patch });
}

/** Soft-delete (status = eliminada). */
export function removeListing(id) { return deleteListing(id); }

/**
 * Busca y filtra publicaciones.
 * @param {object} filters — { q, categoria, tipo, ubicacion, precioMin, precioMax, raza, empresa, soloDestacadas, orden }
 */
export function searchListings(filters = {}) {
  let list = getListings().filter(l => l.status === "activa");

  const q = filters.q?.toLowerCase().trim();
  if (q) {
    list = list.filter(l =>
      l.titulo?.toLowerCase().includes(q)         ||
      l.descripcion?.toLowerCase().includes(q)    ||
      l.empresa?.toLowerCase().includes(q)        ||
      l.raza?.toLowerCase().includes(q)           ||
      l.ubicacion?.toLowerCase().includes(q)
    );
  }

  if (filters.categoria) list = list.filter(l => l.categoria === filters.categoria);
  if (filters.tipo)      list = list.filter(l => l.tipo      === filters.tipo);
  if (filters.raza)      list = list.filter(l => l.raza?.toLowerCase().includes(filters.raza.toLowerCase()));
  if (filters.empresa)   list = list.filter(l => l.empresa_id === filters.empresa || l.empresa?.toLowerCase().includes(filters.empresa.toLowerCase()));

  if (filters.ubicacion) {
    const ub = filters.ubicacion.toLowerCase();
    list = list.filter(l => l.ubicacion?.toLowerCase().includes(ub));
  }
  if (filters.precioMin != null) list = list.filter(l => (l.precio ?? 0) >= filters.precioMin);
  if (filters.precioMax != null) list = list.filter(l => (l.precio ?? 0) <= filters.precioMax);
  if (filters.soloDestacadas)    list = list.filter(l => l.destacada);
  if (filters.calificacionMin)   list = list.filter(l => (l.calificacion ?? 0) >= filters.calificacionMin);

  // Peso mínimo y máximo (para ganado)
  if (filters.pesoMin != null) list = list.filter(l => l.peso_kg == null || l.peso_kg >= filters.pesoMin);
  if (filters.pesoMax != null) list = list.filter(l => l.peso_kg == null || l.peso_kg <= filters.pesoMax);

  // Ordenamiento
  switch (filters.orden) {
    case "precio_asc":   list.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0));           break;
    case "precio_desc":  list.sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));           break;
    case "calificacion": list.sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0)); break;
    case "reciente":     list.sort((a, b) => (b.creadoTs ?? 0) - (a.creadoTs ?? 0));        break;
    case "vistas":       list.sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0));            break;
    default:
      // Destacadas primero, luego por relevancia (calificacion * log(vistas+1))
      list.sort((a, b) => {
        if (a.destacada && !b.destacada) return -1;
        if (!a.destacada && b.destacada) return 1;
        const sa = (a.calificacion ?? 0) * Math.log((a.vistas ?? 0) + 1);
        const sb = (b.calificacion ?? 0) * Math.log((b.vistas ?? 0) + 1);
        return sb - sa;
      });
  }

  return list;
}

/** Retorna publicaciones relacionadas (misma categoría, distinta empresa). */
export function getRelatedListings(listing, limit = 4) {
  return getListings()
    .filter(l => l.id !== listing.id && l.categoria === listing.categoria && l.status === "activa")
    .slice(0, limit);
}

/** Retorna las publicaciones de una empresa. */
export function getListingsByEmpresa(empresa_id) {
  return getListings().filter(l => l.empresa_id === empresa_id && l.status !== "eliminada");
}

/** Stats del catálogo para analytics. */
export function getCatalogStats() {
  const list    = getListings().filter(l => l.status === "activa");
  const byCat   = {};
  const byRaza  = {};
  list.forEach(l => {
    byCat[l.categoria] = (byCat[l.categoria] ?? 0) + 1;
    if (l.raza) byRaza[l.raza] = (byRaza[l.raza] ?? 0) + 1;
  });
  const topCats  = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topRazas = Object.entries(byRaza).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgPrecio = list.reduce((s, l) => s + (l.precio ?? 0), 0) / Math.max(1, list.length);
  const topVistas = [...list].sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0)).slice(0, 5);

  return { total: list.length, byCat, byRaza, topCats, topRazas, avgPrecio, topVistas };
}
