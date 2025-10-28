# DunApp PWA Icons

## Overview

This directory contains all icon assets for the DunApp Progressive Web Application.

## Icon Specifications

### Main App Icons

Required sizes for PWA manifest:

- `icon-72x72.png` - iOS home screen (legacy)
- `icon-96x96.png` - Android home screen (small)
- `icon-128x128.png` - Android home screen (medium)
- `icon-144x144.png` - Windows Start menu
- `icon-152x152.png` - iOS home screen
- `icon-192x192.png` - Android home screen (recommended)
- `icon-384x384.png` - Android splash screen
- `icon-512x512.png` - Android splash screen (large)

All icons should be:
- **Format:** PNG with transparency support
- **Color space:** sRGB
- **Purpose:** `maskable any` (supports both normal and maskable display)

### Shortcut Icons

Module-specific shortcut icons (96x96):

- `shortcut-meteorology.svg/png` - Meteorology module icon
- `shortcut-water.svg/png` - Water level module icon
- `shortcut-drought.svg/png` - Drought module icon

### Favicon

- `favicon.ico` - Browser tab icon (32x32 or 16x16)
- Located in `/public/` directory

## Design Guidelines

### Color Scheme

- **Primary:** #00A8CC (DunApp cyan)
- **Secondary:** #0088AA (Darker cyan)
- **Background:** Gradient from primary to secondary
- **Text/Icons:** White (#FFFFFF)

### Module Colors

- **Meteorology:** Blue (#3B82F6)
- **Water Level:** Cyan (#0891B2)
- **Drought:** Amber (#F59E0B)

### Design Elements

1. **Background:** Linear gradient of theme colors
2. **Wave Pattern:** Subtle white waves representing water (opacity: 0.2)
3. **Text:** "DA" in bold Arial, white color, centered
4. **Accent:** Droplet icon in top-right corner (main icon only)

### Maskable Icon Requirements

For "maskable" icons (Android adaptive icons):
- Minimum safe zone: 40% from edges (icons will be cropped into circle/squircle)
- Important content (DA text) should be centered within safe zone
- Background should extend to all edges

## Current Status

### ✅ Generated (SVG placeholders)

All SVG files have been generated using `scripts/generate-icons.js`.

### 🔄 Needed (PNG conversion)

SVG files need to be converted to PNG. Options:

**Option 1: Browser-based (Easiest)**
```bash
# Open the generator in browser
open public/icons/icon-generator.html
# Click "Download All Icons" button
```

**Option 2: ImageMagick (Command line)**
```bash
cd public/icons
for file in icon-*.svg; do
  convert "$file" "${file%.svg}.png"
done
```

**Option 3: Online converter**
1. Visit https://cloudconvert.com/svg-to-png
2. Upload SVG files
3. Download PNG versions
4. Place in `public/icons/` directory

## Validation Checklist

Before deployment, verify:

- [ ] All PNG files exist in correct sizes
- [ ] Icons display correctly on Android (Chrome)
- [ ] Icons display correctly on iOS (Safari)
- [ ] Maskable icons work in Android adaptive icon system
- [ ] Shortcut icons load properly
- [ ] Favicon appears in browser tab
- [ ] No transparency issues
- [ ] Icons look good on light and dark backgrounds

## Testing

### Test on Chrome (Desktop)
1. Open DevTools → Application → Manifest
2. Verify all icons load
3. Check for warnings

### Test on Chrome (Android)
1. Visit app in Chrome
2. Menu → Install app
3. Check home screen icon appearance
4. Long-press icon to see shortcuts

### Test on Safari (iOS)
1. Visit app in Safari
2. Share → Add to Home Screen
3. Check home screen icon appearance

## Production Recommendations

For production deployment, consider:

1. **Professional Design:** Hire a designer or use a service like https://realfavicongenerator.net/
2. **Optimization:** Compress PNGs using tools like TinyPNG or ImageOptim
3. **Accessibility:** Ensure sufficient contrast between icon elements
4. **Branding:** Match icons with overall app branding and design system
5. **Testing:** Test on multiple devices and screen densities

## File Size Guidelines

Recommended maximum file sizes:
- 72x72: < 5 KB
- 96x96: < 8 KB
- 128x128: < 12 KB
- 144x144: < 15 KB
- 152x152: < 16 KB
- 192x192: < 20 KB
- 384x384: < 40 KB
- 512x512: < 50 KB

## References

- [Web.dev: Add a web app manifest](https://web.dev/add-manifest/)
- [MDN: Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons](https://maskable.app/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)

---

**Last Updated:** 2025-10-28
**Maintained by:** DunApp Development Team
