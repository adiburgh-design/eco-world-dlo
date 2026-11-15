import * as THREE from 'three';

export function createTerrainTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Rich lush meadow grass gradient base
  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  grad.addColorStop(0, '#3f8f4e');
  grad.addColorStop(0.55, '#2f7a41');
  grad.addColorStop(0.88, '#4a7c45');
  grad.addColorStop(1, '#c2a878'); // sandy shoreline rim
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Organic grass blades & stone speckles
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const dist = Math.hypot(x - 256, y - 256);
    if (dist > 225) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(214, 190, 140, 0.35)' : 'rgba(176, 148, 98, 0.25)';
      ctx.fillRect(x, y, 3, 3);
    } else {
      ctx.fillStyle =
        Math.random() > 0.5 ? 'rgba(74, 222, 128, 0.16)' : 'rgba(20, 83, 45, 0.18)';
      ctx.fillRect(x, y, 2, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createPlazaTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createEarthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, 256);
  ocean.addColorStop(0, '#0369a1');
  ocean.addColorStop(0.5, '#0284c7');
  ocean.addColorStop(1, '#075985');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 512, 256);

  // Stylized continents
  ctx.fillStyle = '#22c55e';
  const blobs = [
    [95, 90, 48, 34],
    [130, 155, 28, 42],
    [255, 85, 58, 38],
    [275, 145, 36, 48],
    [380, 95, 62, 36],
    [415, 170, 32, 24],
  ];
  blobs.forEach(([cx, cy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  // Polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 238, 512, 18);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createMetalHazardTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#0f172a';
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i + 144, 128);
    ctx.lineTo(i + 128, 128);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(2, 6, 23, 0.52)');
  grad.addColorStop(0.6, 'rgba(2, 6, 23, 0.22)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFloatingLabelSprite(
  title: string,
  subtitle: string,
  accentHex: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 148;
  const ctx = canvas.getContext('2d')!;

  // Rounded dark badge card
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  roundRect(ctx, 14, 14, 484, 120, 24);
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = accentHex;
  roundRect(ctx, 14, 14, 484, 120, 24);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 66);

  ctx.fillStyle = accentHex;
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, 256, 106);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6.4, 1.85, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
