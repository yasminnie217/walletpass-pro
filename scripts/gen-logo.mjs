import sharp from 'sharp';

const GREEN = '#00704A';
const GREEN_DARK = '#0B4A34';
const GOLD = '#CBA258';
const CREAM = '#F9F6F0';
const WHITE = '#FFFFFF';

// Génère un chemin d'étoile à 5 branches
function starPath(cx, cy, outer, inner, points = 5) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d + 'Z';
}

// Variante A — étoile dorée sur médaillon vert
const variantA = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN_DARK}"/>
      <stop offset="1" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="512" cy="512" r="300" fill="none" stroke="${GOLD}" stroke-width="14" opacity="0.55"/>
  <path d="${starPath(512, 512, 220, 92)}" fill="${GOLD}"/>
</svg>`;

// Variante B — carte de fidélité avec tampons (dernier = étoile dorée)
const stamps = [];
for (let i = 0; i < 5; i++) {
  const cx = 300 + i * 106;
  const cy = 600;
  if (i === 4) {
    stamps.push(`<path d="${starPath(cx, cy, 46, 19)}" fill="${GOLD}"/>`);
  } else {
    stamps.push(`<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="${GOLD}" stroke-width="8" opacity="0.85"/>`);
  }
}
const variantB = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${CREAM}"/>
  <rect x="180" y="300" width="664" height="424" rx="56" fill="${GREEN}"/>
  <circle cx="270" cy="400" r="42" fill="${WHITE}" opacity="0.9"/>
  <path d="${starPath(270, 400, 26, 11)}" fill="${GOLD}"/>
  <rect x="360" y="378" width="300" height="20" rx="10" fill="${WHITE}" opacity="0.85"/>
  <rect x="360" y="418" width="200" height="16" rx="8" fill="${WHITE}" opacity="0.5"/>
  ${stamps.join('\n  ')}
</svg>`;

// Variante C — carte inclinée + badge étoile dorée
const variantC = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g2)"/>
  <g transform="rotate(-12 512 512)">
    <rect x="292" y="372" width="440" height="280" rx="40" fill="${WHITE}"/>
    <rect x="332" y="420" width="220" height="22" rx="11" fill="${GREEN}" opacity="0.85"/>
    <rect x="332" y="462" width="150" height="16" rx="8" fill="${GREEN}" opacity="0.4"/>
    <circle cx="640" cy="560" r="34" fill="${GREEN}" opacity="0.15"/>
  </g>
  <circle cx="690" cy="360" r="96" fill="${GOLD}"/>
  <path d="${starPath(690, 360, 60, 25)}" fill="${WHITE}"/>
</svg>`;

const variants = { 'logo-1': variantA, 'logo-2': variantB, 'logo-3': variantC };
for (const [name, svg] of Object.entries(variants)) {
  await sharp(Buffer.from(svg)).png().toFile(`public/brand/${name}.png`);
  console.log(`public/brand/${name}.png OK`);
}
