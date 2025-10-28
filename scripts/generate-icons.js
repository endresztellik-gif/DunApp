#!/usr/bin/env node

/**
 * PWA Icon Generator for DunApp
 *
 * Generates placeholder PWA icons in various sizes.
 * This script creates simple placeholder icons with:
 * - DunApp theme color gradient background (#00A8CC)
 * - "DA" text in center
 * - Wave pattern representing water
 *
 * Usage: node scripts/generate-icons.js
 *
 * Note: For production, replace these with professionally designed icons.
 * Consider using: https://realfavicongenerator.net/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../public/icons');
const SHORTCUTS_SIZES = [96]; // For shortcut icons

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Generating DunApp PWA Icons...\n');

// Generate SVG template
function generateSVG(size, variant = 'main') {
  const colors = {
    main: { primary: '#00A8CC', secondary: '#0088AA', text: 'DA' },
    meteorology: { primary: '#3B82F6', secondary: '#2563EB', text: '☁️' },
    water: { primary: '#0891B2', secondary: '#0E7490', text: '💧' },
    drought: { primary: '#F59E0B', secondary: '#D97706', text: '🌾' }
  };

  const color = colors[variant] || colors.main;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg-gradient)" rx="${size * 0.15}"/>

  <!-- Wave pattern -->
  <g opacity="0.2" stroke="white" stroke-width="${size * 0.02}" fill="none">
    <path d="M 0,${size * 0.3} Q ${size * 0.25},${size * 0.2} ${size * 0.5},${size * 0.3} T ${size},${size * 0.3}" />
    <path d="M 0,${size * 0.45} Q ${size * 0.25},${size * 0.35} ${size * 0.5},${size * 0.45} T ${size},${size * 0.45}" />
    <path d="M 0,${size * 0.6} Q ${size * 0.25},${size * 0.5} ${size * 0.5},${size * 0.6} T ${size},${size * 0.6}" />
  </g>

  <!-- Text -->
  <text
    x="${size / 2}"
    y="${size / 2}"
    font-family="Arial, sans-serif"
    font-size="${size * 0.35}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle">
    ${color.text}
  </text>

  <!-- Droplet accent -->
  ${variant === 'main' ? `
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.08}" fill="white" opacity="0.8"/>
  <ellipse cx="${size * 0.75}" cy="${size * 0.28}" rx="${size * 0.06}" ry="${size * 0.08}" fill="white" opacity="0.8"/>
  ` : ''}
</svg>`;
}

// Generate main app icons
ICON_SIZES.forEach(size => {
  const svg = generateSVG(size, 'main');
  const filename = `icon-${size}x${size}.png`;
  const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);

  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Generated ${filename} (SVG)`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'meteorology', variant: 'meteorology' },
  { name: 'water', variant: 'water' },
  { name: 'drought', variant: 'drought' }
];

shortcuts.forEach(({ name, variant }) => {
  SHORTCUTS_SIZES.forEach(size => {
    const svg = generateSVG(size, variant);
    const filename = `shortcut-${name}.png`;
    const svgPath = path.join(OUTPUT_DIR, `shortcut-${name}.svg`);

    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Generated ${filename} (SVG)`);
  });
});

// Generate favicon.ico placeholder info
const faviconInfo = `
<!-- Favicon -->
To generate favicon.ico, use one of these methods:

1. Online converter: https://realfavicongenerator.net/
   - Upload icon-192x192.svg
   - Download the generated favicon package

2. Command line (requires ImageMagick):
   convert icon-192x192.svg -resize 32x32 ../favicon.ico

3. Manual: Use any icon-72x72.svg and save as .ico format

Place the favicon.ico in the public/ directory.
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'FAVICON_INSTRUCTIONS.txt'), faviconInfo);

console.log('\n📝 Icon generation complete!');
console.log('\n⚠️  IMPORTANT: SVG files generated as placeholders.');
console.log('   Convert to PNG using:');
console.log('   - Online tools: https://cloudconvert.com/svg-to-png');
console.log('   - ImageMagick: convert icon-*.svg icon-*.png');
console.log('   - Browser: Open icon-generator.html in public/icons/\n');
console.log('💡 For production: Use professionally designed icons from a designer or https://realfavicongenerator.net/\n');
