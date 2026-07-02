const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Un ADMIN invita/crea trabajadores dentro de su misma finca
router.post("/", requireRole("ADMIN"), async (req, res) => {
  const { nombre, email, password, role } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return res.status(409).json({ error: "Email ya registrado" });

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      role: role === "ADMIN" ? "ADMIN" : "TRABAJADOR",
      fincaId: req.user.fincaId,
    },
  });

  res.status(201).json({ id: usuario.id, nombre, email, role: usuario.role });
});

router.get("/", requireRole("ADMIN"), async (req, res) => {
  const usuarios = await prisma.usuario.findMany({
    where: { fincaId: req.user.fincaId },
    select: { id: true, nombre: true, email: true, role: true, createdAt: true },
  });
  res.json(usuarios);
});

// Ver perfil propio
router.get("/perfil", async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.sub },
      select: { id: true, nombre: true, email: true, role: true, createdAt: true },
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (err) { next(err); }
});

// Actualizar nombre
router.patch("/perfil", async (req, res, next) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" });
    const usuario = await prisma.usuario.update({
      where: { id: req.user.sub },
      data: { nombre: nombre.trim() },
      select: { id: true, nombre: true, email: true, role: true },
    });
    res.json(usuario);
  } catch (err) { next(err); }
});

// Cambiar contraseña
router.patch("/perfil/password", async (req, res, next) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    if (!passwordActual || !nuevaPassword) return res.status(400).json({ error: "Faltan campos" });
    if (nuevaPassword.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.sub } });
    const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!ok) return res.status(400).json({ error: "Contraseña actual incorrecta" });

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await prisma.usuario.update({ where: { id: req.user.sub }, data: { passwordHash } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
