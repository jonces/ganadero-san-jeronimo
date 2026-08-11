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

    // Verificar tokenVersion y actualizar lastSeen
    if (req.user.sub) {
      prisma.usuario.findUnique({
        where: { id: req.user.sub },
        select: { tokenVersion: true },
      }).then(u => {
        if (u && u.tokenVersion !== (req.user.tokenVersion ?? 0)) {
          // Token desactualizado — el cargo cambió
          return; // El error se maneja en la verificación de abajo
        }
        prisma.usuario.update({
          where: { id: req.user.sub },
          data: { lastSeen: new Date() },
        }).catch(() => {});
      }).catch(() => {});

      // Verificación síncrona de tokenVersion
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.sub },
        select: { tokenVersion: true },
      });
      if (usuario && usuario.tokenVersion !== (req.user.tokenVersion ?? 0)) {
        return res.status(401).json({ error: "ROL_ACTUALIZADO" });
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

// Bloquea cargos de campo (TRABAJADOR_CAMPO, VAQUERO) de rutas financieras/admin
async function requireNoEsCampo(req, res, next) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.sub },
      select: { cargo: true },
    });
    const cargosCampo = ["TRABAJADOR_CAMPO", "VAQUERO"];
    if (cargosCampo.includes(usuario?.cargo)) {
      return res.status(403).json({ error: "No tienes permiso para acceder a esta sección" });
    }
    next();
  } catch (err) { next(err); }
}

module.exports = { requireAuth, requireRole, requireNoEsCampo };
