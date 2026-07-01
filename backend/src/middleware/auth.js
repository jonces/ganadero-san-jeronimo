const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    // SUPER_ADMIN no tiene finca, saltar verificación
    if (req.user.role === "SUPER_ADMIN") return next();

    // Verificar que la finca esté activa
    if (req.user.fincaId) {
      const finca = await prisma.finca.findUnique({ where: { id: req.user.fincaId }, select: { activa: true } });
      if (finca && !finca.activa) {
        return res.status(403).json({ error: "FINCA_SUSPENDIDA" });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
