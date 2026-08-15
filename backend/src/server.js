require("dotenv").config();
const express = require("express");
const cors = require("cors");
// v2 financial system — forces Railway redeploy with db push

const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuarios");
const fincaRoutes = require("./routes/fincas");
const animalRoutes = require("./routes/animales");
const eventoRoutes = require("./routes/eventos");
const documentoRoutes = require("./routes/documentos");
const ventaRoutes = require("./routes/ventas");
const incidenteRoutes = require("./routes/incidentes");
const gastoRoutes = require("./routes/gastos");
const superadminRoutes = require("./routes/superadmin");
const equipoRoutes = require("./routes/equipo");
const anuncioRoutes = require("./routes/anuncios");
const actividadRoutes = require("./routes/actividad");
const tareasRoutes = require("./routes/tareas");
const publicacionesRoutes = require("./routes/publicaciones");
const reservasRoutes = require("./routes/reservas");
const dashboardRoutes = require("./routes/dashboard");
const comprasRoutes = require("./routes/compras");
const proveedoresRoutes = require("./routes/proveedores");
const finanzasRoutes = require("./routes/finanzas");
const insumosRoutes = require("./routes/insumos");
const reproduccionRoutes = require("./routes/reproduccion");
const cuentasPagarRoutes = require("./routes/cuentas-pagar");
const cuentasFinancierasRoutes = require("./routes/cuentas-financieras");
const movimientosFinancierosRoutes = require("./routes/movimientos-financieros");
const activosFijosRoutes = require("./routes/activos-fijos");
const prestamosRoutes = require("./routes/prestamos");
const periodosFinancierosRoutes = require("./routes/periodos-financieros");
const estadosFinancierosRoutes = require("./routes/estados-financieros");
const informesFinancierosRoutes = require("./routes/informes-financieros");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", require("express").static(require("path").join(__dirname, "../uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/fincas", fincaRoutes);
app.use("/api/animales", animalRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/documentos", documentoRoutes);
app.use("/api/incidentes", incidenteRoutes);
app.use("/api/gastos", gastoRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/equipo", equipoRoutes);
app.use("/api/ventas", ventaRoutes);
app.use("/api/anuncios", anuncioRoutes);
app.use("/api/actividad", actividadRoutes);
app.use("/api/tareas", tareasRoutes);
app.use("/api/publicaciones", publicacionesRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/finanzas", finanzasRoutes);
app.use("/api/insumos", insumosRoutes);
app.use("/api/reproduccion", reproduccionRoutes);
app.use("/api/cuentas-pagar", cuentasPagarRoutes);
app.use("/api/cuentas-financieras", cuentasFinancierasRoutes);
app.use("/api/movimientos-financieros", movimientosFinancierosRoutes);
app.use("/api/activos-fijos", activosFijosRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/periodos-financieros", periodosFinancierosRoutes);
app.use("/api/estados-financieros", estadosFinancierosRoutes);
app.use("/api/informes-financieros", informesFinancierosRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

// Correccion de integridad: media cuyo tipo no coincide con su URL de
// Cloudinary (versiones viejas de la app enviaban todo como octet-stream
// y los videos quedaban marcados como FOTO). Idempotente.
async function corregirTiposDeMedia() {
  try {
    const prisma = require("./prisma");
    const aVideo = await prisma.media.updateMany({
      where: { url: { contains: "/video/upload/" }, tipo: "FOTO" },
      data: { tipo: "VIDEO" },
    });
    const aFoto = await prisma.media.updateMany({
      where: { url: { contains: "/image/upload/" }, tipo: "VIDEO" },
      data: { tipo: "FOTO" },
    });
    if (aVideo.count || aFoto.count) {
      console.log(`Media corregida: ${aVideo.count} a VIDEO, ${aFoto.count} a FOTO`);
    }
  } catch (err) {
    console.error("Error corrigiendo tipos de media:", err.message);
  }
}

const port = process.env.PORT || 4000;
async function limpiarAnimalesEliminados() {
  try {
    const prisma = require("./prisma");
    const eliminados = await prisma.animal.findMany({ where: { estado: "ELIMINADO" }, select: { id: true } });
    for (const a of eliminados) {
      await prisma.media.deleteMany({ where: { animalId: a.id } });
      await prisma.evento.deleteMany({ where: { animalId: a.id } });
      await prisma.incidente.updateMany({ where: { animalId: a.id }, data: { animalId: null } });
      await prisma.venta.deleteMany({ where: { animalId: a.id } });
      await prisma.animal.updateMany({ where: { madreId: a.id }, data: { madreId: null } });
      await prisma.animal.delete({ where: { id: a.id } });
    }
    if (eliminados.length) console.log(`Limpieza: ${eliminados.length} animales ELIMINADO borrados de DB`);
  } catch (err) {
    console.error("Error limpiando animales ELIMINADO:", err.message);
  }
}

app.listen(port, () => {
  console.log(`Backend escuchando en puerto ${port}`);
  // Migraciones DESPUÉS de que el servidor ya responde al healthcheck
  const { execSync } = require("child_process");
  try {
    console.log("Aplicando schema Prisma (db push)...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("Schema aplicado correctamente.");
  } catch (e) {
    console.error("Error en migraciones:", e.message);
  }
  corregirTiposDeMedia();
  limpiarAnimalesEliminados();
  migrarCategoriasViejas();
  upgradeCrias();
  // Re-chequear upgrades cada 24 horas
  setInterval(upgradeCrias, 24 * 60 * 60 * 1000);
});

async function migrarCategoriasViejas() {
  try {
    const prisma = require("./prisma");
    const novillo = await prisma.animal.updateMany({ where: { categoria: { in: ["Novillo","NOVILLO"] } }, data: { categoria: "TERNERO" } });
    const novilla = await prisma.animal.updateMany({ where: { categoria: { in: ["Novilla","NOVILLA"] } }, data: { categoria: "TERNERA" } });
    if (novillo.count || novilla.count) console.log(`Migración categorías: ${novillo.count} Novillo→TERNERO, ${novilla.count} Novilla→TERNERA`);
  } catch (e) { console.error("Error en migrarCategoriasViejas:", e.message); }
}

async function upgradeCrias() {
  try {
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);
    const crias = await prisma.animal.findMany({
      where: { categoria: "CRIA", fechaNacimiento: { lte: hace6Meses }, estado: "ACTIVO" },
      select: { id: true, sexo: true, identificador: true },
    });
    for (const c of crias) {
      const nuevaCategoria = c.sexo === "MACHO" ? "TERNERO" : "TERNERA";
      await prisma.animal.update({ where: { id: c.id }, data: { categoria: nuevaCategoria } });
      console.log(`Auto-upgrade: ${c.identificador} CRIA → ${nuevaCategoria}`);
    }
    if (crias.length > 0) console.log(`Upgrades de crías: ${crias.length} animales actualizados`);
  } catch (e) { console.error("Error en upgradeCrias:", e.message); }
}
