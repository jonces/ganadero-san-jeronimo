const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

// Verificar PIN del usuario logueado
router.post("/verificar", requireAuth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: "PIN debe ser 6 dígitos" });
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.sub }, select: { finanzasPin: true, cargo: true, role: true } });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    // Si no tiene PIN asignado aún
    if (!usuario.finanzasPin) {
      return res.status(403).json({ error: "No tienes código de acceso a Finanzas. Solicítaselo al Gerente General." });
    }
    if (pin !== usuario.finanzasPin) return res.status(401).json({ error: "Código incorrecto" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// El Gerente General asigna/cambia el PIN de cualquier usuario
router.patch("/usuario/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.cargo !== "GERENTE_GENERAL" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Solo el Gerente General puede asignar códigos de acceso a Finanzas" });
    }
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: "El código debe ser exactamente 6 dígitos numéricos" });
    // Verificar que el usuario pertenece a la misma finca
    const target = await prisma.usuario.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
    await prisma.usuario.update({ where: { id: req.params.id }, data: { finanzasPin: pin } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Quitar acceso a Finanzas de un usuario
router.delete("/usuario/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.cargo !== "GERENTE_GENERAL" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Solo el Gerente General puede revocar acceso a Finanzas" });
    }
    const target = await prisma.usuario.findFirst({ where: { id: req.params.id, fincaId: req.user.fincaId } });
    if (!target) return res.status(404).json({ error: "Usuario no encontrado" });
    await prisma.usuario.update({ where: { id: req.params.id }, data: { finanzasPin: null } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ver PINs de todos los usuarios (solo Gerente General)
router.get("/usuarios", requireAuth, async (req, res) => {
  try {
    if (req.user.cargo !== "GERENTE_GENERAL" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    const usuarios = await prisma.usuario.findMany({
      where: { fincaId: req.user.fincaId },
      select: { id: true, nombre: true, cargo: true, role: true, finanzasPin: true },
    });
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
