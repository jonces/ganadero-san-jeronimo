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

const CARGOS_VALIDOS = [
  "GERENTE_GENERAL",
  "ADMINISTRADOR",
  "RESPONSABLE_NOMINA",
  "TRABAJADOR_CAMPO",
  "VAQUERO",
  "OTRO",
];

// Ver trabajadores de la finca
router.get("/", async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { fincaId: req.user.fincaId, role: { not: "SUPER_ADMIN" } },
      select: { id: true, nombre: true, email: true, role: true, cargo: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(usuarios);
  } catch (err) { next(err); }
});

// Crear trabajador (solo ADMIN)
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { nombre, email, password, role, cargo } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son requeridos" });
    }
    if (!cargo || !CARGOS_VALIDOS.includes(cargo)) {
      return res.status(400).json({ error: "Debes seleccionar el cargo del usuario" });
    }

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return res.status(409).json({ error: "Email ya registrado" });

    // Máximo 2 administradores por finca
    if (role === "ADMIN") {
      const totalAdmins = await prisma.usuario.count({
        where: { fincaId: req.user.fincaId, role: "ADMIN" },
      });
      if (totalAdmins >= 2) {
        return res.status(400).json({ error: "Esta finca ya tiene el máximo de 2 administradores permitidos" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        role: role === "ADMIN" ? "ADMIN" : "TRABAJADOR",
        cargo,
        fincaId: req.user.fincaId,
      },
      select: { id: true, nombre: true, email: true, role: true, cargo: true, createdAt: true },
    });
    res.status(201).json(usuario);
  } catch (err) { next(err); }
});

// Cambiar cargo y/o role de un usuario — ADMIN o usuario con cargo GERENTE_GENERAL
router.patch("/:id", async (req, res, next) => {
  try {
    const yo = await prisma.usuario.findUnique({
      where: { id: req.user.sub },
      select: { role: true, cargo: true },
    });
    const puedeEditar = yo?.role === "ADMIN" || yo?.role === "SUPER_ADMIN" || yo?.cargo === "GERENTE_GENERAL";
    if (!puedeEditar) return res.status(403).json({ error: "Solo administradores o gerentes pueden cambiar roles" });

    const { cargo, role } = req.body;
    if (cargo && !CARGOS_VALIDOS.includes(cargo)) {
      return res.status(400).json({ error: "Cargo no válido" });
    }

    const objetivo = await prisma.usuario.findFirst({
      where: { id: req.params.id, fincaId: req.user.fincaId },
    });
    if (!objetivo) return res.status(404).json({ error: "Usuario no encontrado" });
    if (objetivo.role === "SUPER_ADMIN") return res.status(400).json({ error: "No puedes editar a un Super Admin" });

    const data = {};
    if (cargo) data.cargo = cargo;
    if (role === "ADMIN" || role === "TRABAJADOR") data.role = role;

    const actualizado = await prisma.usuario.update({
      where: { id: objetivo.id },
      data,
      select: { id: true, nombre: true, email: true, role: true, cargo: true },
    });
    res.json(actualizado);
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
