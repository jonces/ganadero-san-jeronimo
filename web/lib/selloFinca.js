// Sello circular de la finca para los PDF: cabeza de toro al centro,
// nombre de la finca curvado arriba y ubicacion curvada abajo.
// Devuelve un PNG (dataURL) listo para doc.addImage().

function escaparXML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function svgSelloFinca({ nombre, ubicacion, color = [34, 139, 60] }) {
  const nom = (nombre || "MI FINCA").toUpperCase();
  const ubi = (ubicacion || "").toUpperCase();
  const fondo = `rgb(${color[0]},${color[1]},${color[2]})`;

  // Tamano de letra segun largo del texto para que quepa en el arco
  const fsTop = Math.max(20, Math.min(40, (480 / nom.length - 3) / 0.62));
  const fsBot = ubi ? Math.max(15, Math.min(26, (500 / ubi.length - 2) / 0.62)) : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <path id="arcoTop" d="M 52 256 A 204 204 0 0 1 460 256"/>
    <path id="arcoBot" d="M 24 256 A 232 232 0 0 0 488 256"/>
  </defs>
  <circle cx="256" cy="256" r="252" fill="${fondo}"/>
  <circle cx="256" cy="256" r="243" fill="none" stroke="#ffffff" stroke-width="7"/>
  <circle cx="256" cy="256" r="176" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.85"/>
  <circle cx="38" cy="256" r="6" fill="#ffffff"/>
  <circle cx="474" cy="256" r="6" fill="#ffffff"/>
  <text fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${fsTop}" letter-spacing="3">
    <textPath href="#arcoTop" xlink:href="#arcoTop" startOffset="50%" text-anchor="middle">${escaparXML(nom)}</textPath>
  </text>
  ${ubi ? `<text fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="${fsBot}" letter-spacing="2">
    <textPath href="#arcoBot" xlink:href="#arcoBot" startOffset="50%" text-anchor="middle">${escaparXML(ubi)}</textPath>
  </text>` : ""}
  <g transform="translate(256 256) scale(0.66) translate(-256 -214)">
    <g fill="#ffffff">
      <path d="M 186 172 C 138 164 106 130 102 84 C 140 120 176 138 212 142 C 200 150 190 160 186 172 Z"/>
      <path d="M 326 172 C 374 164 406 130 410 84 C 372 120 336 138 300 142 C 312 150 322 160 326 172 Z"/>
      <ellipse cx="168" cy="206" rx="30" ry="17" transform="rotate(-24 168 206)"/>
      <ellipse cx="344" cy="206" rx="30" ry="17" transform="rotate(24 344 206)"/>
      <path d="M 256 140 C 300 140 332 166 336 210 C 339 242 324 274 306 300 C 290 322 274 336 256 344 C 238 336 222 322 206 300 C 188 274 173 242 176 210 C 180 166 212 140 256 140 Z"/>
    </g>
    <circle cx="224" cy="222" r="10" fill="${fondo}"/>
    <circle cx="288" cy="222" r="10" fill="${fondo}"/>
    <ellipse cx="238" cy="302" rx="7" ry="11" fill="${fondo}" transform="rotate(-14 238 302)"/>
    <ellipse cx="274" cy="302" rx="7" ry="11" fill="${fondo}" transform="rotate(14 274 302)"/>
  </g>
</svg>`;
}

export async function crearSelloFinca({ nombre, ubicacion, color }) {
  const svg = svgSelloFinca({ nombre, ubicacion, color });
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
