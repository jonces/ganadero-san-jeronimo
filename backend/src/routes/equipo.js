const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Solo el administrador puede gestionar el equipo" });
  }
  next();
}

router.use(requireAuth);

// Ver trabajadores de la finca
router.get("/", async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { fincaId: req.user.fincaId, role: { not: "SUPER_ADMIN" } },
      select: { id: true, nombre: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(usuarios);
  } catch (err) { next(err); }
});

// Crear trabajador (solo ADMIN)
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { nombre, email, password, role } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son requeridos" });
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
      select: { id: true, nombre: true, email: true, role: true, createdAt: true },
    });
    res.status(201).json(usuario);
  } catch (err) { next(err); }
});

// Eliminar trabajador (solo ADMIN)
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    if (usuario.role === "ADMIN") return res.status(400).json({ error: "No puedes eliminar al administrador" });

    await prisma.usuario.delete({ where: { id: usuario.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
