/**
 * Persistencia localStorage del Marketplace Ganadero.
 */
import { generateDemoListings } from "../constants/listing-types.js";

const KEYS = {
  LISTINGS:   "mkt_listings_v1",
  ORDERS:     "mkt_orders_v1",
  QUOTES:     "mkt_quotes_v1",
  CHATS:      "mkt_chats_v1",
  REVIEWS:    "mkt_reviews_v1",
  FAVORITES:  "mkt_favorites_v1",
  PROFILES:   "mkt_profiles_v1",
  ANALYTICS:  "mkt_analytics_v1",
};

function isBrowser() { return typeof window !== "undefined"; }
function get(key) {
  if (!isBrowser()) return null;
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function set(key, val) {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ─── Listings ─────────────────────────────────────────────────────────────── */
export function getListings() {
  const stored = get(KEYS.LISTINGS);
  if (!stored) {
    // Seed demo data on first load
    const demos = generateDemoListings();
    set(KEYS.LISTINGS, demos);
    return demos;
  }
  return stored;
}
export function saveListings(list) { set(KEYS.LISTINGS, list); }
export function upsertListing(listing) {
  const list = getListings();
  const idx  = list.findIndex(l => l.id === listing.id);
  const ts   = Date.now();
  if (idx >= 0) list[idx] = { ...list[idx], ...listing, updatedTs: ts };
  else          list.unshift({ ...listing, creadoTs: ts, updatedTs: ts, vistas: 0, favoritos: 0, calificacion: 0, num_resenas: 0 });
  saveListings(list);
  return list;
}
export function deleteListing(id) {
  const list = getListings().map(l => l.id === id ? { ...l, status: "eliminada" } : l);
  saveListings(list);
  return list;
}

/* ─── Orders ─────────────────────────────────────────────────────────────── */
export function getOrders()           { return get(KEYS.ORDERS) ?? []; }
export function saveOrders(list)      { set(KEYS.ORDERS, list); }
export function upsertOrder(order)    {
  const list = getOrders();
  const idx  = list.findIndex(o => o.id === order.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...order, updatedTs: Date.now() };
  else          list.unshift({ ...order, creadoTs: Date.now(), updatedTs: Date.now() });
  saveOrders(list);
  return list;
}

/* ─── Quotes ─────────────────────────────────────────────────────────────── */
export function getQuotes()           { return get(KEYS.QUOTES) ?? []; }
export function upsertQuote(quote)    {
  const list = getQuotes();
  const idx  = list.findIndex(q => q.id === quote.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...quote, updatedTs: Date.now() };
  else          list.unshift({ ...quote, creadoTs: Date.now(), updatedTs: Date.now() });
  set(KEYS.QUOTES, list);
  return list;
}

/* ─── Chat ───────────────────────────────────────────────────────────────── */
export function getChats()            { return get(KEYS.CHATS) ?? {}; }
export function addChatMessage(chatId, msg) {
  const chats = getChats();
  if (!chats[chatId]) chats[chatId] = [];
  chats[chatId].push({ ...msg, id: `msg-${Date.now()}`, ts: Date.now() });
  set(KEYS.CHATS, chats);
  return chats[chatId];
}
export function getChatMessages(chatId) {
  return (getChats()[chatId]) ?? [];
}

/* ─── Reviews ────────────────────────────────────────────────────────────── */
export function getReviews(listingId) {
  const all = get(KEYS.REVIEWS) ?? {};
  return all[listingId] ?? [];
}
export function addReview(listingId, review) {
  const all = get(KEYS.REVIEWS) ?? {};
  if (!all[listingId]) all[listingId] = [];
  all[listingId].unshift({ ...review, id: `rev-${Date.now()}`, ts: Date.now() });
  set(KEYS.REVIEWS, all);
  // Update listing avg rating
  const list   = getListings();
  const idx    = list.findIndex(l => l.id === listingId);
  if (idx >= 0) {
    const revs = all[listingId];
    const avg  = revs.reduce((s, r) => s + (r.estrellas ?? 0), 0) / revs.length;
    list[idx]  = { ...list[idx], calificacion: parseFloat(avg.toFixed(1)), num_resenas: revs.length };
    saveListings(list);
  }
  return all[listingId];
}

/* ─── Favorites ──────────────────────────────────────────────────────────── */
export function getFavorites()        { return get(KEYS.FAVORITES) ?? []; }
export function toggleFavorite(listingId) {
  const favs = getFavorites();
  const idx  = favs.indexOf(listingId);
  if (idx >= 0) favs.splice(idx, 1);
  else          favs.push(listingId);
  set(KEYS.FAVORITES, favs);
  return favs;
}

/* ─── Profiles ───────────────────────────────────────────────────────────── */
export function getProfiles()         { return get(KEYS.PROFILES) ?? {}; }
export function upsertProfile(id, profile) {
  const all = getProfiles();
  all[id]   = { ...all[id], ...profile, updatedTs: Date.now() };
  set(KEYS.PROFILES, all);
  return all;
}

/* ─── Analytics tracker ──────────────────────────────────────────────────── */
export function trackView(listingId) {
  const list = getListings();
  const idx  = list.findIndex(l => l.id === listingId);
  if (idx >= 0) {
    list[idx].vistas = (list[idx].vistas ?? 0) + 1;
    saveListings(list);
  }
}
