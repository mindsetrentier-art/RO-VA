import sharp from 'sharp';
import fs from 'fs';

const svg192 = `
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C5CFF" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="shape" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="48" fill="url(#bg)" />
  <g transform="translate(48, 48)">
    <circle cx="32" cy="32" r="32" fill="url(#shape)" />
    <rect x="64" y="0" width="32" height="96" rx="16" fill="url(#shape)" />
  </g>
</svg>
`;

const svg512 = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C5CFF" />
      <stop offset="100%" stop-color="#2563EB" />
    </linearGradient>
    <linearGradient id="shape" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#E2E8F0" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <g transform="translate(128, 128) scale(2.66)">
    <circle cx="32" cy="32" r="32" fill="url(#shape)" />
    <rect x="64" y="0" width="32" height="96" rx="16" fill="url(#shape)" />
  </g>
</svg>
`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

sharp(Buffer.from(svg192))
  .png()
  .toFile('public/icon-192-simple.png')
  .then(() => console.log('Created public/icon-192-simple.png'))
  .catch(err => console.error(err));

sharp(Buffer.from(svg512))
  .png()
  .toFile('public/icon-512-simple.png')
  .then(() => console.log('Created public/icon-512-simple.png'))
  .catch(err => console.error(err));
