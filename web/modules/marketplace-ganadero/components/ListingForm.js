"use client";
import React, { useState } from "react";
import { MKT_CATEGORY_CONFIG, CATEGORIAS_LISTA, RAZAS_BOVINAS, SUBCATEGORIAS_GANADO, SUBCATEGORIAS_SERVICIOS } from "../constants/categories.js";
import { LISTING_TYPE_CONFIG, UNIDADES } from "../constants/listing-types.js";

const EMPTY = {
  titulo: "", descripcion: "", tipo: "producto", categoria: "minerales",
  subcategoria: "", precio: "", precio_unidad: false, unidad_ref: "",
  ubicacion: "", empresa: "", raza: "", edad_meses: "", peso_kg: "",
  marca: "", unidad: "kg", cantidad_disponible: "", especialidad: "",
  zona_cobertura: "", experiencia_anos: "",
};

export default function ListingForm({ onSubmit, onCancel, initial = {} }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.precio)          payload.precio          = Number(payload.precio);
    if (payload.edad_meses)      payload.edad_meses      = Number(payload.edad_meses);
    if (payload.peso_kg)         payload.peso_kg         = Number(payload.peso_kg);
    if (payload.cantidad_disponible) payload.cantidad_disponible = Number(payload.cantidad_disponible);
    if (payload.experiencia_anos) payload.experiencia_anos = Number(payload.experiencia_anos);
    onSubmit?.(payload);
  };

  const catCfg = MKT_CATEGORY_CONFIG[form.categoria] ?? {};

  const subcats = form.categoria === "ganado"
    ? SUBCATEGORIAS_GANADO
    : form.categoria === "servicios"
    ? SUBCATEGORIAS_SERVICIOS
    : [];

  return (
    <form onSubmit={handleSubmit} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 20, background: "#f9fafb" }}>
      <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 16, color: "#111827" }}>
        {initial.id ? "✏️ Editar publicación" : "➕ Nueva publicación"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={lbl("span 2")}>
          Título *
          <input required value={form.titulo} onChange={e => set("titulo", e.target.value)}
            placeholder="Ej: Toro Brahman Puro, 3 años, 680 kg" style={inp} />
        </label>

        <label style={lbl()}>
          Tipo de publicación *
          <select value={form.tipo} onChange={e => set("tipo", e.target.value)} style={inp}>
            {Object.entries(LISTING_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icono} {v.label}</option>
            ))}
          </select>
        </label>

        <label style={lbl()}>
          Categoría *
          <select value={form.categoria} onChange={e => set("categoria", e.target.value)} style={inp}>
            {CATEGORIAS_LISTA.map(c => <option key={c.id} value={c.id}>{c.icono} {c.label}</option>)}
          </select>
        </label>

        {subcats.length > 0 && (
          <label style={lbl()}>
            Subcategoría
            <select value={form.subcategoria} onChange={e => set("subcategoria", e.target.value)} style={inp}>
              <option value="">Seleccionar…</option>
              {subcats.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}

        <label style={lbl()}>
          Precio (COP) *
          <input required type="number" value={form.precio} onChange={e => set("precio", e.target.value)}
            placeholder="Ej: 28000000" style={inp} />
        </label>

        <label style={lbl()} title="Marcar si el precio es por unidad de venta">
          <span>Precio por unidad</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <input type="checkbox" checked={form.precio_unidad} onChange={e => set("precio_unidad", e.target.checked)} />
            {form.precio_unidad && (
              <input value={form.unidad_ref} onChange={e => set("unidad_ref", e.target.value)}
                placeholder="Ej: por animal, por bulto" style={{ ...inp, flex: 1 }} />
            )}
          </div>
        </label>

        {/* Campos de Ganado */}
        {form.tipo === "animal" && (
          <>
            <label style={lbl()}>
              Raza
              <select value={form.raza} onChange={e => set("raza", e.target.value)} style={inp}>
                <option value="">Seleccionar…</option>
                {RAZAS_BOVINAS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label style={lbl()}>
              Edad (meses)
              <input type="number" value={form.edad_meses} onChange={e => set("edad_meses", e.target.value)}
                placeholder="36" style={inp} />
            </label>
            <label style={lbl()}>
              Peso (kg)
              <input type="number" value={form.peso_kg} onChange={e => set("peso_kg", e.target.value)}
                placeholder="680" style={inp} />
            </label>
          </>
        )}

        {/* Campos de Producto */}
        {form.tipo === "producto" && (
          <>
            <label style={lbl()}>
              Marca
              <input value={form.marca} onChange={e => set("marca", e.target.value)}
                placeholder="Nombre de la marca" style={inp} />
            </label>
            <label style={lbl()}>
              Unidad de venta
              <select value={form.unidad} onChange={e => set("unidad", e.target.value)} style={inp}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
            <label style={lbl()}>
              Cantidad disponible
              <input type="number" value={form.cantidad_disponible} onChange={e => set("cantidad_disponible", e.target.value)}
                placeholder="500" style={inp} />
            </label>
          </>
        )}

        {/* Campos de Servicio */}
        {form.tipo === "servicio" && (
          <>
            <label style={lbl()}>
              Especialidad
              <input value={form.especialidad} onChange={e => set("especialidad", e.target.value)}
                placeholder="Ej: Inseminación artificial" style={inp} />
            </label>
            <label style={lbl()}>
              Zona de cobertura
              <input value={form.zona_cobertura} onChange={e => set("zona_cobertura", e.target.value)}
                placeholder="Ej: Córdoba, Sucre" style={inp} />
            </label>
            <label style={lbl()}>
              Años de experiencia
              <input type="number" value={form.experiencia_anos} onChange={e => set("experiencia_anos", e.target.value)}
                placeholder="15" style={inp} />
            </label>
          </>
        )}

        <label style={lbl()}>
          Ubicación
          <input value={form.ubicacion} onChange={e => set("ubicacion", e.target.value)}
            placeholder="Ej: Montería, Córdoba" style={inp} />
        </label>

        <label style={lbl("span 2")}>
          Descripción *
          <textarea required rows={4} value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
            placeholder="Describe detalladamente el producto, animal o servicio…"
            style={{ ...inp, resize: "vertical" }} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button type="submit" style={{
          border: "none", background: catCfg.color ?? "#6366f1", color: "#fff",
          borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>
          {catCfg.icono} {initial.id ? "Guardar cambios" : "Publicar ahora"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{
            border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151",
            borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 14,
          }}>Cancelar</button>
        )}
      </div>
    </form>
  );
}

const lbl  = (gridColumn) => ({ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: "#374151", fontWeight: 600, ...(gridColumn ? { gridColumn } : {}) });
const inp  = { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111827", background: "#fff" };
