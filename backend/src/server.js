require("dotenv").config();
const express = require("express");
const cors = require("cors");

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
      await prisma.venta.updateMany({ where: { animalId: a.id }, data: { animalId: null } });
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
  corregirTiposDeMedia();
  limpiarAnimalesEliminados();
});
