const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();

router.post("/registro-finca", async (req, res, next) => {
  try {
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
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
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
  } catch (err) { next(err); }
});

// Crear SUPER_ADMIN inicial (solo si no existe ninguno)
router.post("/setup-superadmin", async (req, res, next) => {
  try {
    const existe = await prisma.usuario.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (existe) return res.status(409).json({ error: "Super admin ya existe" });

    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: "Faltan campos" });

    // Crear finca especial para super admin
    const finca = await prisma.finca.create({ data: { nombre: "Sistema GSJ", ubicacion: "Nicaragua" } });
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash, role: "SUPER_ADMIN", fincaId: finca.id },
    });

    const token = jwt.sign(
      { sub: usuario.id, role: usuario.role, fincaId: finca.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(201).json({ token, usuario: { id: usuario.id, nombre, email, role: usuario.role } });
  } catch (err) { next(err); }
});

module.exports = router;
