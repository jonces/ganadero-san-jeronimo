const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const logs = await prisma.actividadLog.findMany({
      where: { fincaId: req.user.fincaId },
      include: { usuario: { select: { nombre: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(logs);
  } catch (err) { next(err); }
});

module.exports = router;
