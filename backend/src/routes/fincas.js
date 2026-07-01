const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/mi-finca", async (req, res) => {
  const finca = await prisma.finca.findUnique({
    where: { id: req.user.fincaId },
    include: {
      _count: { select: { animales: true, usuarios: true } },
      usuarios: { where: { role: "ADMIN" }, select: { nombre: true, email: true }, take: 1 },
    },
  });
  res.json(finca);
});

module.exports = router;
