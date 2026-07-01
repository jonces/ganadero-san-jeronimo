const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

// Registro de finca + admin
router.post("/registro", async (req, res, next) => {
  try {
    const { nombre, email, password, nombreFinca, ubicacion } = req.body;
    if (!nombre || !email || !password || !nombreFinca)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: "Este email ya está registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const finca = await prisma.finca.create({ data: { nombre: nombreFinca, ubicacion } });
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

// Login
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

// Setup superadmin
router.post("/setup-superadmin", async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await prisma.usuario.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (existe) return res.status(400).json({ error: "Ya existe un superadmin" });

    const finca = await prisma.finca.create({ data: { nombre: "Sistema GSJ" } });
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

// Olvidé mi contraseña — enviar código
router.post("/olvide-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.json({ ok: true }); // no revelar si existe

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetCodigo: codigo, resetExpira: expira },
    });

    // Enviar email con Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Ganadero SG <noreply@ganaderosg.app>",
        to: email,
        subject: "Código para recuperar tu contraseña",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
            <h2 style="color:#2d9e3f">🐄 Ganadero San Jerónimo</h2>
            <p>Tu código para recuperar la contraseña es:</p>
            <div style="background:#f0f4f0;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
              <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a5c2a">${codigo}</span>
            </div>
            <p style="color:#666;font-size:14px">Este código expira en 15 minutos.<br>Si no solicitaste esto, ignora este mensaje.</p>
          </div>
        `,
      });
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Verificar código y cambiar contraseña
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, codigo, nuevaPassword } = req.body;
    if (!email || !codigo || !nuevaPassword)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.resetCodigo !== codigo)
      return res.status(400).json({ error: "Código inválido" });

    if (!usuario.resetExpira || new Date() > new Date(usuario.resetExpira))
      return res.status(400).json({ error: "El código expiró, solicita uno nuevo" });

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash, resetCodigo: null, resetExpira: null },
    });

    res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (err) { next(err); }
});

module.exports = router;
