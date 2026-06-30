// Script para generar íconos - ejecutar con node
const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fondo verde
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1a5c2a');
  gradient.addColorStop(1, '#2d9e3f');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // Emoji vaca
  ctx.font = `${size * 0.55}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐄', size / 2, size / 2);

  fs.writeFileSync(filename, canvas.toBuffer('image/png'));
  console.log(`Generated ${filename}`);
}

generateIcon(192, 'icon-192.png');
generateIcon(512, 'icon-512.png');
