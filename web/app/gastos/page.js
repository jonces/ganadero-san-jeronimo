"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CATEGORIAS = [
  { value: "ALIMENTACION", label: "🌾 Alimentación", color: "#2d9e3f" },
  { value: "MEDICAMENTO", label: "💊 Medicamentos", color: "#3182ce" },
  { value: "MANTENIMIENTO", label: "🔧 Mantenimiento", color: "#718096" },
  { value: "SALARIO", label: "👷 Salarios", color: "#805ad5" },
  { value: "COMBUSTIBLE", label: "⛽ Combustible", color: "#ed8936" },
  { value: "OTRO", label: "📋 Otro", color: "#a0aec0" },
];

const PERIODOS = [
  { value: "", label: "📅 Todos" },
  { value: "DIARIO", label: "☀️ Hoy" },
  { value: "SEMANAL", label: "📆 Esta semana" },
  { value: "QUINCENAL", label: "🗓️ Últimos 15 días" },
  { value: "MENSUAL", label: "📊 Este mes" },
];

const PERIODICIDADES = [
  { value: "UNICO", label: "1️⃣ Único / puntual" },
  { value: "DIARIO", label: "☀️ Diario" },
  { value: "SEMANAL", label: "📆 Semanal" },
  { value: "QUINCENAL", label: "🗓️ Cada 15 días" },
  { value: "MENSUAL", label: "📊 Mensual" },
];

export default function GastosPage() {
  const router = useRouter();
  const [data, setData] = useState({ gastos: [], total: 0 });
  const [periodo, setPeriodo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    descripcion: "", categoria: "ALIMENTACION", monto: "",
    moneda: "NIO", periodicidad: "UNICO",
    fecha: new Date().toISOString().slice(0, 10), notas: "",
  });

  async function load() {
    try {
      const q = periodo ? `?periodo=${periodo}` : "";
      const res = await api(`/gastos${q}`);
      setData(res);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, [periodo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await api("/gastos", { method: "POST", body: form });
      setForm({ descripcion: "", categoria: "ALIMENTACION", monto: "", moneda: "NIO", periodicidad: "UNICO", fecha: new Date().toISOString().slice(0, 10), notas: "" });
      setShowForm(false);
      load();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await api(`/gastos/${id}`, { method: "DELETE" });
    load();
  }

  const porCategoria = CATEGORIAS.map((c) => ({
    ...c,
    total: data.gastos.filter((g) => g.categoria === c.value).reduce((s, g) => s + g.monto, 0),
    count: data.gastos.filter((g) => g.categoria === c.value).length,
  })).filter((c) => c.count > 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: "#805ad5" }}>
        <button onClick={() => router.push("/dashboard")} className="text-white text-xl font-bold">←</button>
        <span className="font-bold text-lg">💸 Control de Gastos</span>
        <div />
      </header>

      {/* Total */}
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        <div className="rounded-2xl text-white text-center py-6 shadow-lg mb-4"
          style={{ background: "linear-gradient(135deg,#553c9a,#805ad5)" }}>
          <p className="text-xs font-bold opacity-75 uppercase tracking-widest">Total de gastos</p>
          <p className="text-4xl font-black mt-1">C$ {data.total.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
          <p className="text-purple-200 text-sm mt-1">≈ USD $ {(data.total / 36.5).toLocaleString("es", { maximumFractionDigits: 0 })}</p>
        </div>

        {/* Filtro de periodo */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {PERIODOS.map((p) => (
            <button key={p.value} onClick={() => setPeriodo(p.value)}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold border-2 transition-all"
              style={{
                background: periodo === p.value ? "#805ad5" : "#fff",
                color: periodo === p.value ? "#fff" : "#805ad5",
                borderColor: "#805ad5",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Resumen por categoría */}
        {porCategoria.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {porCategoria.map((c) => (
              <div key={c.value} className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
                <span className="text-2xl">{c.label.split(" ")[0]}</span>
                <div>
                  <p className="font-black text-gray-800 text-sm">C$ {c.total.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                  <p className="text-xs text-gray-400">{c.label.split(" ").slice(1).join(" ")} · {c.count} registro{c.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {error && <p className="text-red-600 mb-4 bg-red-50 rounded-xl p-3 text-sm">{error}</p>}

        <button onClick={() => setShowForm((s) => !s)}
          className="w-full text-white rounded-2xl py-4 font-black text-lg mb-5 shadow-lg"
          style={{ background: showForm ? "#718096" : "#805ad5" }}>
          {showForm ? "✕ Cancelar" : "+ Registrar Gasto"}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl mb-5 overflow-hidden">
            <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#553c9a,#805ad5)" }}>
              <h2 className="text-white font-black text-lg">Nuevo Gasto</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CATEGORIAS.map((c) => (
                    <button type="button" key={c.value} onClick={() => setForm({ ...form, categoria: c.value })}
                      className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all text-left"
                      style={{ background: form.categoria === c.value ? c.color : "#fff", color: form.categoria === c.value ? "#fff" : c.color, borderColor: c.color }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción *</label>
                <input className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                  placeholder="Ej: Compra de concentrado, sal mineral..." value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Monto (C$) *</label>
                  <input type="number" step="0.01" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                    placeholder="0.00" value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                  <input type="date" className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none bg-gray-50"
                    value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Periodicidad</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PERIODICIDADES.map((p) => (
                    <button type="button" key={p.value} onClick={() => setForm({ ...form, periodicidad: p.value })}
                      className="rounded-xl py-2 px-3 text-sm font-bold border-2 transition-all"
                      style={{ background: form.periodicidad === p.value ? "#805ad5" : "#fff", color: form.periodicidad === p.value ? "#fff" : "#805ad5", borderColor: "#805ad5" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Notas</label>
                <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 mt-1 focus:border-purple-400 focus:outline-none resize-none bg-gray-50"
                  placeholder="Detalles adicionales..." rows={2} value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>

              <button disabled={enviando} type="submit"
                className="w-full text-white rounded-2xl py-4 font-black disabled:opacity-50"
                style={{ background: "#805ad5" }}>
                {enviando ? "Guardando..." : "Guardar Gasto"}
              </button>
            </div>
          </form>
        )}

        {/* Lista de gastos */}
        <div className="space-y-3">
          {data.gastos.map((g) => {
            const cat = CATEGORIAS.find((c) => c.value === g.categoria) || CATEGORIAS[5];
            const per = PERIODICIDADES.find((p) => p.value === g.periodicidad);
            return (
              <div key={g.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-2 flex items-center justify-between" style={{ background: cat.color }}>
                  <span className="text-white font-bold text-sm">{cat.label}</span>
                  <span className="text-white text-xs opacity-80">{per?.label}</span>
                </div>
                <div className="p-4 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{g.descripcion}</p>
                    {g.notas && <p className="text-xs text-gray-400 mt-1">📝 {g.notas}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(g.fecha).toLocaleDateString("es", { dateStyle: "medium" })} · {g.usuario?.nombre}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-black text-xl" style={{ color: "#805ad5" }}>C$ {g.monto.toLocaleString("es", { maximumFractionDigits: 0 })}</p>
                    <button onClick={() => eliminar(g.id)}
                      className="text-white text-xs px-3 py-1 rounded-xl font-bold"
                      style={{ background: "#e53e3e" }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.gastos.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-4">💸</div>
            <p className="text-gray-500 text-lg font-bold">Sin gastos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Registra los gastos diarios de tu finca</p>
          </div>
        )}
      </div>
    </div>
  );
}
