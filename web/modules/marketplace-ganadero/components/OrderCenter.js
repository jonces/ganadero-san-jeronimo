"use client";
import React, { useState } from "react";
import { ORDER_STATUS_CONFIG, PAYMENT_METHOD_CONFIG } from "../constants/order-status.js";
import { advanceOrderStatus }                         from "../services/order-service.js";

const fmtCOP = v => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v ?? 0);

export default function OrderCenter({ orders, quotes, onRefresh }) {
  const [tab,      setTab]      = useState("ordenes");
  const [statusF,  setStatusF]  = useState(null);

  const visible = orders.filter(o => !statusF || o.status === statusF);

  const handleAdvance = (orderId, currentStatus) => {
    const flow = ["pendiente", "aceptada", "en_preparacion", "en_transito", "entregada"];
    const idx  = flow.indexOf(currentStatus);
    if (idx < 0 || idx >= flow.length - 1) return;
    advanceOrderStatus(orderId, flow[idx + 1]);
    onRefresh?.();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #f3f4f6", marginBottom: 14 }}>
        {[{ id: "ordenes", label: `Órdenes (${orders.length})` }, { id: "cotizaciones", label: `Cotizaciones (${quotes.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 14px", border: "none",
            borderBottom: tab === t.id ? "2.5px solid #6366f1" : "2.5px solid transparent",
            background: "none", cursor: "pointer",
            color: tab === t.id ? "#4338ca" : "#6b7280",
            fontWeight: tab === t.id ? 700 : 400, fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "ordenes" && (
        <div>
          {/* Filtros estado */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            <Chip label="Todas" active={!statusF} onClick={() => setStatusF(null)} />
            {Object.entries(ORDER_STATUS_CONFIG).map(([k, cfg]) => (
              <Chip key={k} label={`${cfg.icono} ${cfg.label}`} active={statusF === k} onClick={() => setStatusF(statusF === k ? null : k)} />
            ))}
          </div>

          {visible.length === 0 && (
            <Empty icon="📦" text="Sin órdenes" sub="Las órdenes aparecerán aquí al comprar o vender." />
          )}

          {visible.map(order => {
            const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pendiente;
            return (
              <div key={order.id} style={{
                border: `1.5px solid ${cfg.color}30`, borderLeft: `4px solid ${cfg.color}`,
                borderRadius: 10, background: cfg.bg, padding: "14px 16px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>{order.listingTitulo}</p>
                    <p style={{ margin: "3px 0", fontSize: 12, color: "#6b7280" }}>
                      Vendedor: {order.vendedor?.nombre} · Comprador: {order.comprador?.nombre}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: cfg.color }}>
                      {cfg.icono} {cfg.label}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>{fmtCOP(order.total)}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                      {new Date(order.creadoTs).toLocaleDateString("es-CO")}
                    </p>
                    {order.status !== "entregada" && order.status !== "cancelada" && (
                      <button onClick={() => handleAdvance(order.id, order.status)} style={{
                        border: "none", background: "#6366f1", color: "#fff",
                        borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginTop: 6, fontWeight: 700,
                      }}>
                        Avanzar estado →
                      </button>
                    )}
                  </div>
                </div>
                {/* Historial */}
                {order.historial?.length > 0 && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${cfg.color}20`, paddingTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {order.historial.map((h, i) => (
                      <span key={i} style={{ fontSize: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px", color: "#6b7280" }}>
                        {ORDER_STATUS_CONFIG[h.status]?.icono} {ORDER_STATUS_CONFIG[h.status]?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "cotizaciones" && (
        <div>
          {quotes.length === 0 && <Empty icon="💬" text="Sin cotizaciones" sub="Las cotizaciones enviadas/recibidas aparecerán aquí." />}
          {quotes.map(q => (
            <div key={q.id} style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 10, background: "#fff" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14 }}>{q.listingTitulo}</p>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>
                Precio solicitado: <b style={{ color: "#111827" }}>{fmtCOP(q.precioSolicitado)}</b>
                {q.precioFinal && <> → Final: <b style={{ color: "#16a34a" }}>{fmtCOP(q.precioFinal)}</b></>}
              </p>
              {q.mensaje && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#374151" }}>"{q.mensaje}"</p>}
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Estado: {q.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border: active ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
      borderRadius: 20, padding: "5px 12px", cursor: "pointer",
      background: active ? "#eef2ff" : "#fff",
      color:      active ? "#4338ca" : "#374151",
      fontSize: 12, fontWeight: active ? 700 : 400,
    }}>{label}</button>
  );
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
      <p style={{ fontSize: 32, margin: "0 0 8px" }}>{icon}</p>
      <p style={{ margin: 0, fontWeight: 600, color: "#374151" }}>{text}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>{sub}</p>
    </div>
  );
}
