import sharp from 'sharp';

const GREEN = '#00704A';
const GREEN_DARK = '#0B4A34';
const GOLD = '#CBA258';
const WHITE = '#FFFFFF';

function starPath(cx, cy, outer, inner, points = 5) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}

// Composition carte + badge, construite autour d'un centre local puis centrée
// dans le canevas via un translate global pour équilibrer le poids du badge.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>

  <g transform="translate(-20,12)">
    <g transform="rotate(-10 512 512)">
      <rect x="322" y="392" width="380" height="240" rx="36" fill="${WHITE}"/>
      <rect x="358" y="436" width="190" height="20" rx="10" fill="${GREEN}" opacity="0.9"/>
      <rect x="358" y="472" width="128" height="16" rx="8" fill="${GREEN}" opacity="0.4"/>
      <circle cx="636" cy="560" r="30" fill="${GREEN}" opacity="0.15"/>
    </g>
    <circle cx="678" cy="408" r="84" fill="${GOLD}"/>
    <path d="${starPath(678, 408, 52, 22)}" fill="${WHITE}"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/brand/logo-final.png');
console.log('public/brand/logo-final.png OK');
