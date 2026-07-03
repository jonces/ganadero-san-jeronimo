// Logo de la finca para los PDF, estilo emblema ganadero:
// toro brahman negro sobre disco blanco con anillo rojo,
// nombre de la finca curvado arriba y ubicacion en el liston rojo de abajo.
// Devuelve un PNG (dataURL) listo para doc.addImage().

const ROJO = "#d93a2b";
const ROJO_OSCURO = "#b32014";
const ROJO_SOMBRA = "#8f1a10";
const NEGRO = "#111111";

function escaparXML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function svgSelloFinca({ nombre, ubicacion }) {
  const nom = (nombre || "MI FINCA").toUpperCase();
  const ubi = (ubicacion || "FINCA GANADERA").toUpperCase();

  // Tamano de letra segun largo del texto para que quepa en el arco y el liston
  const fsNombre = Math.max(18, Math.min(38, (470 / nom.length - 2) / 0.62));
  const fsUbi = Math.max(13, Math.min(26, (270 / ubi.length - 1) / 0.6));

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <path id="arcoNombre" d="M 88 240 A 168 168 0 0 1 424 240"/>
  </defs>
  <!-- disco blanco con anillo rojo -->
  <circle cx="256" cy="240" r="136" fill="#ffffff"/>
  <circle cx="256" cy="240" r="136" fill="none" stroke="${ROJO}" stroke-width="20"/>
  <!-- nombre de la finca curvado arriba -->
  <text fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${fsNombre}" letter-spacing="2">
    <textPath href="#arcoNombre" xlink:href="#arcoNombre" startOffset="50%" text-anchor="middle">${escaparXML(nom)}</textPath>
  </text>
  <!-- toro brahman -->
  <g>
    <path fill="${NEGRO}" d="M 214 160 C 192 140 184 112 194 84 C 210 102 226 122 246 140 C 234 144 222 151 214 160 Z"/>
    <path fill="${NEGRO}" d="M 298 160 C 320 140 328 112 318 84 C 302 102 286 122 266 140 C 278 144 290 151 298 160 Z"/>
    <ellipse cx="172" cy="222" rx="20" ry="52" fill="${NEGRO}" transform="rotate(42 172 222)"/>
    <ellipse cx="340" cy="222" rx="20" ry="52" fill="${NEGRO}" transform="rotate(-42 340 222)"/>
    <ellipse cx="174" cy="224" rx="8" ry="34" fill="#ffffff" transform="rotate(42 174 224)"/>
    <ellipse cx="338" cy="224" rx="8" ry="34" fill="#ffffff" transform="rotate(-42 338 224)"/>
    <path fill="${NEGRO}" d="M 256 148 C 290 148 312 168 316 198 C 320 230 306 268 292 292 C 280 312 268 322 256 326 C 244 322 232 312 220 292 C 206 268 192 230 196 198 C 200 168 222 148 256 148 Z"/>
    <path fill="${NEGRO}" d="M 146 348 C 164 306 196 288 220 284 C 232 302 244 314 256 318 C 268 314 280 302 292 284 C 316 288 348 306 366 348 C 332 366 298 374 256 374 C 214 374 180 366 146 348 Z"/>
    <circle cx="234" cy="206" r="7" fill="#ffffff"/>
    <circle cx="278" cy="206" r="7" fill="#ffffff"/>
    <ellipse cx="256" cy="298" rx="27" ry="17" fill="#ffffff"/>
    <ellipse cx="245" cy="298" rx="5" ry="7" fill="${NEGRO}"/>
    <ellipse cx="267" cy="298" rx="5" ry="7" fill="${NEGRO}"/>
  </g>
  <!-- liston rojo con la ubicacion -->
  <g>
    <path fill="${ROJO_OSCURO}" d="M 38 378 L 118 366 L 118 434 L 38 446 L 64 412 Z"/>
    <path fill="${ROJO_OSCURO}" d="M 474 378 L 394 366 L 394 434 L 474 446 L 448 412 Z"/>
    <path fill="${ROJO_SOMBRA}" d="M 118 366 L 142 380 L 118 400 Z"/>
    <path fill="${ROJO_SOMBRA}" d="M 394 366 L 370 380 L 394 400 Z"/>
    <path fill="${ROJO}" d="M 110 362 C 162 384 350 384 402 362 L 402 428 C 350 450 162 450 110 428 Z"/>
    <text x="256" y="414" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${fsUbi}" text-anchor="middle" letter-spacing="1">${escaparXML(ubi)}</text>
  </g>
</svg>`;
}

export async function crearSelloFinca({ nombre, ubicacion }) {
  const svg = svgSelloFinca({ nombre, ubicacion });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("No se pudo generar el sello de la finca"));
      im.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    canvas.getContext("2d").drawImage(img, 0, 0, 640, 640);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
