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
async function uploadMediaConTipo(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ganadero-sg", resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          url: result.secure_url,
          tipo: result.resource_type === "video" ? "VIDEO" : "FOTO",
        });
      }
    );
    stream.end(file.buffer);
  });
}

module.exports = { uploadMedia, uploadMediaConTipo };
