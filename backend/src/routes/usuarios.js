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

module.exports = router;
