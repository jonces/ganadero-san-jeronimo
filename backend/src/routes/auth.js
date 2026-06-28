const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();

// Registra la primera finca + usuario ADMIN. Usuarios siguientes los crea un ADMIN.
router.post("/registro-finca", async (req, res) => {
  const { nombreFinca, ubicacion, nombre, email, password } = req.body;
  if (!nombreFinca || !nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return res.status(409).json({ error: "Email ya registrado" });

  const finca = await prisma.finca.create({
    data: { nombre: nombreFinca, ubicacion },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash, role: "ADMIN", fincaId: finca.id },
  });

  const token = jwt.sign(
    { sub: usuario.id, role: usuario.role, fincaId: finca.id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.status(201).json({ token, finca, usuario: { id: usuario.id, nombre, email, role: usuario.role } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = jwt.sign(
    { sub: usuario.id, role: usuario.role, fincaId: usuario.fincaId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.role },
  });
});

module.exports = router;
