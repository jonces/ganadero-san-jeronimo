const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function uploadMedia(file) {
  const ext = path.extname(file.originalname);
  const filename = `${randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer);
  return `http://localhost:4000/uploads/${filename}`;
}

module.exports = { uploadMedia };
