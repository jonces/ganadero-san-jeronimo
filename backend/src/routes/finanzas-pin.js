const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

// Verificar PIN — cualquier usuario autenticado puede intentar
router.post("/verificar", requireAuth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: "PIN debe ser 6 dígitos" });
    const finca = await prisma.finca.findUnique({ where: { id: req.user.fincaId }, select: { finanzasPin: true } });
    if (!finca) return res.status(404).json({ error: "Finca no encontrada" });
    // Si no hay PIN configurado, solo el ADMIN puede entrar sin PIN
    if (!finca.finanzasPin) {
      if (req.user.role === "ADMIN") return res.json({ ok: true });
      return res.status(403).json({ error: "El administrador aún no ha configurado el PIN de Finanzas" });
    }
    if (pin !== finca.finanzasPin) return res.status(401).json({ error: "PIN incorrecto" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cambiar PIN — solo ADMIN
router.post("/cambiar", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Solo el Gerente General puede cambiar el PIN" });
    const { pin } = req.body;
    if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: "El nuevo PIN debe ser exactamente 6 dígitos numéricos" });
    await prisma.finca.update({ where: { id: req.user.fincaId }, data: { finanzasPin: pin } });
    res.json({ ok: true, message: "PIN actualizado correctamente" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Obtener estado del PIN (si está configurado o no) — solo ADMIN
router.get("/estado", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acceso denegado" });
    const finca = await prisma.finca.findUnique({ where: { id: req.user.fincaId }, select: { finanzasPin: true } });
    res.json({ configurado: !!finca?.finanzasPin });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
