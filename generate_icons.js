import sharp from 'sharp';
import fs from 'fs';

const svg192 = `
<svg width="192" height="192" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1e2f"/>
    </linearGradient>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C5CFF"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="40" fill="url(#bg)"/>
  <rect width="192" height="192" fill="url(#bg)"/>
  
  <g transform="translate(36, 36) scale(0.6)">
    <path d="M 40 160 L 40 40 L 100 40 C 130 40 150 60 150 90 C 150 110 135 125 115 130 L 160 160" fill="none" stroke="url(#grad1)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="100" cy="90" r="16" fill="url(#grad2)"/>
    <path d="M 80 160 L 115 130" stroke="url(#grad2)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

const svg512 = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1e2f"/>
    </linearGradient>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C5CFF"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>
  <rect width="512" height="512" fill="url(#bg)"/>
  
  <g transform="translate(96, 96) scale(1.6)">
    <path d="M 40 160 L 40 40 L 100 40 C 130 40 150 60 150 90 C 150 110 135 125 115 130 L 160 160" fill="none" stroke="url(#grad1)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="100" cy="90" r="16" fill="url(#grad2)"/>
    <path d="M 80 160 L 115 130" stroke="url(#grad2)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

sharp(Buffer.from(svg192))
  .png()
  .toFile('public/icon-192-abstract.png')
  .then(() => console.log('Created public/icon-192-abstract.png'))
  .catch(err => console.error(err));

sharp(Buffer.from(svg512))
  .png()
  .toFile('public/icon-512-abstract.png')
  .then(() => console.log('Created public/icon-512-abstract.png'))
  .catch(err => console.error(err));
