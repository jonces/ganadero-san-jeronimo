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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend escuchando en puerto ${port}`));
