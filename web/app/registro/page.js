"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveToken } from "@/lib/api";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreFinca: "", ubicacion: "", nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/auth/registro-finca", { method: "POST", body: form });
      saveToken(data.token);
      router.push("/animales");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-xl p-8 w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold text-green-700">Registrar finca</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input className="w-full border rounded-lg p-2" placeholder="Nombre de la finca" value={form.nombreFinca} onChange={update("nombreFinca")} required />
        <input className="w-full border rounded-lg p-2" placeholder="Ubicación" value={form.ubicacion} onChange={update("ubicacion")} />
        <input className="w-full border rounded-lg p-2" placeholder="Tu nombre" value={form.nombre} onChange={update("nombre")} required />
        <input className="w-full border rounded-lg p-2" type="email" placeholder="Email" value={form.email} onChange={update("email")} required />
        <input className="w-full border rounded-lg p-2" type="password" placeholder="Contraseña" value={form.password} onChange={update("password")} required />

        <button disabled={loading} className="w-full bg-green-700 text-white rounded-lg p-2 font-medium disabled:opacity-50">
          {loading ? "Creando..." : "Crear finca"}
        </button>
      </form>
    </main>
  );
}
