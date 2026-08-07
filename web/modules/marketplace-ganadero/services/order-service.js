/**
 * Servicio de órdenes, cotizaciones y envíos del Marketplace.
 */
import { getOrders, upsertOrder, getQuotes, upsertQuote } from "./marketplace-storage.js";
import { ORDER_STATUS, QUOTE_STATUS } from "../constants/order-status.js";

let _seq = Date.now();
const newId = (prefix) => `${prefix}-${++_seq}`;

/* ─── Órdenes ─────────────────────────────────────────────────────────────── */

export function createOrder({ listingId, listingTitulo, vendedor, comprador, cantidad, precio, metodoPago = "transferencia", notas = "" }) {
  const order = {
    id:            newId("ord"),
    listingId,
    listingTitulo,
    vendedor,      // { id, nombre }
    comprador,     // { id, nombre }
    cantidad,
    precio,
    total:         precio * cantidad,
    metodoPago,
    notas,
    status:        ORDER_STATUS.PENDIENTE,
    historial:     [{ status: ORDER_STATUS.PENDIENTE, ts: Date.now(), nota: "Orden creada" }],
    envio:         null,
  };
  upsertOrder(order);
  return order;
}

export function advanceOrderStatus(orderId, nuevaStatus, nota = "") {
  const orders = getOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return null;
  const updated = {
    ...order,
    status:   nuevaStatus,
    historial: [...(order.historial ?? []), { status: nuevaStatus, ts: Date.now(), nota }],
  };
  upsertOrder(updated);
  return updated;
}

export function getOrdersByUser(userId) {
  return getOrders().filter(o => o.comprador?.id === userId || o.vendedor?.id === userId);
}

export function getOrdersByListing(listingId) {
  return getOrders().filter(o => o.listingId === listingId);
}

/* ─── Cotizaciones ────────────────────────────────────────────────────────── */

export function createQuote({ listingId, listingTitulo, vendedor, comprador, precioSolicitado, cantidadSolicitada, mensaje }) {
  const quote = {
    id:                newId("qte"),
    listingId,
    listingTitulo,
    vendedor,
    comprador,
    precioOriginal:    null,      // se llena al responder
    precioSolicitado,
    cantidadSolicitada,
    descuento_pct:     0,
    mensaje,
    respuesta:         null,
    status:            QUOTE_STATUS.ENVIADA,
    historial:         [{ status: QUOTE_STATUS.ENVIADA, ts: Date.now() }],
  };
  upsertQuote(quote);
  return quote;
}

export function respondQuote(quoteId, { precioFinal, nota, aceptar }) {
  const quotes = getQuotes();
  const q      = quotes.find(q => q.id === quoteId);
  if (!q) return null;
  const newStatus = aceptar ? QUOTE_STATUS.ACEPTADA : QUOTE_STATUS.EN_NEGOCIACION;
  const updated = {
    ...q,
    precioFinal,
    respuesta: nota,
    status:    newStatus,
    historial: [...(q.historial ?? []), { status: newStatus, ts: Date.now(), nota }],
  };
  upsertQuote(updated);
  return updated;
}

export function getQuotesByUser(userId) {
  return getQuotes().filter(q => q.comprador?.id === userId || q.vendedor?.id === userId);
}

/* ─── Envíos (stub) ──────────────────────────────────────────────────────── */

export function createShipment({ orderId, transportista, guia, ruta, estimadoEntrega }) {
  const orders = getOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return null;
  const envio  = {
    id:               newId("env"),
    orderId,
    transportista,
    guia,
    ruta,
    estimadoEntrega,
    status:           "preparando",
    eventos:          [{ status: "preparando", ts: Date.now(), descripcion: "Envío creado" }],
  };
  upsertOrder({ ...order, envio });
  return envio;
}
