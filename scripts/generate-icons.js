const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Draw a simple network icon
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size / 20;
  
  // Draw circles
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 3;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw lines
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, '../public', `icon-${size}x${size}.png`), buffer);
}

// Generate icons for all sizes
sizes.forEach(size => generateIcon(size)); 