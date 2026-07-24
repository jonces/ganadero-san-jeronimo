const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dodix0vf2",
  api_key: process.env.CLOUDINARY_API_KEY || "828825281144852",
  api_secret: process.env.CLOUDINARY_API_SECRET || "3JroEgXlQpeHzrFiQreIRBf12cY",
});

async function uploadMedia(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ganadero-sg", resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

// Igual que uploadMedia pero devuelve tambien el tipo (FOTO/VIDEO) segun
// la deteccion de Cloudinary — el mimetype del cliente no es confiable
// (la app movil puede enviar application/octet-stream).
const TIPOS_DOCUMENTO = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

async function uploadMediaConTipo(file) {
  const esDocumento = TIPOS_DOCUMENTO.includes(file.mimetype) ||
    (file.originalname || "").match(/\.(pdf|doc|docx|xls|xlsx)$/i);
  const resourceType = esDocumento ? "raw" : "auto";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ganadero-sg", resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else {
          let tipo;
          if (esDocumento) tipo = "documento";
          else if (result.resource_type === "video") tipo = "video";
          else tipo = "imagen";
          resolve({ url: result.secure_url, tipo });
        }
      }
    );
    stream.end(file.buffer);
  });
}

module.exports = { uploadMedia, uploadMediaConTipo };
