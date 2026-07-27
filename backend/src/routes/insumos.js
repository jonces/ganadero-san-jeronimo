const express = require("express");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
router.use(requireAuth);
router.get("/", async (req, res) => res.json({ items: [], total: 0 }));
module.exports = router;
