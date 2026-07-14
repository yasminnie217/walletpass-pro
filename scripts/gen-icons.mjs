import sharp from 'sharp';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#00704A"/>
  <text x="50%" y="50%" dy="0.08em" text-anchor="middle" dominant-baseline="middle"
    font-family="Georgia, 'Times New Roman', serif" font-weight="700"
    font-size="300" fill="#FFFFFF">F</text>
</svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon-${size}.png`);
  console.log(`public/icon-${size}.png OK`);
}
