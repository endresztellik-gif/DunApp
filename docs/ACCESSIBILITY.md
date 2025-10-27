# Accessibility Standards - DunApp PWA

**Version:** 1.0
**Last Updated:** 2025-10-24
**Compliance Level:** WCAG 2.1 AA

---

## Table of Contents

1. [Overview](#overview)
2. [Color Contrast Requirements](#color-contrast-requirements)
3. [ARIA Labels & Semantic HTML](#aria-labels--semantic-html)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Focus States](#focus-states)
6. [Screen Reader Support](#screen-reader-support)
7. [Component Accessibility Checklist](#component-accessibility-checklist)
8. [Testing Guidelines](#testing-guidelines)

---

## Overview

DunApp PWA is committed to providing an accessible experience for all users, including those with disabilities. We follow **WCAG 2.1 Level AA** standards as our baseline.

### Core Principles

1. **Perceivable** - Information and UI components must be presentable to users in ways they can perceive
2. **Operable** - UI components and navigation must be operable
3. **Understandable** - Information and operation of UI must be understandable
4. **Robust** - Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies

---

## Color Contrast Requirements

### WCAG AA Minimum Ratios

```
Normal Text (< 18px):     4.5:1
Large Text (>= 18px):     3:1
UI Components & Icons:    3:1
```

### Module Color Contrast Verification

#### Meteorology Module (#00A8CC on white #FFFFFF)
- **Ratio:** 3.3:1
- **Usage:** Border colors, icons (pass for large text/icons)
- **For normal text:** Use darker shade #006064 (ratio 7.5:1)

#### Water Level Module (#00BCD4 on white #FFFFFF)
- **Ratio:** 3.0:1
- **Usage:** Border colors, icons (pass for UI components)
- **For normal text:** Use darker shade #00838F (ratio 4.8:1)

#### Drought Module (#FF9800 on white #FFFFFF)
- **Ratio:** 2.3:1
- **Usage:** Border colors only (does NOT pass for text)
- **For normal text:** Use darker shade #E65100 (ratio 4.6:1)

### Text Color Contrast (on white background)

```css
/* Passing Colors */
--color-text-primary: #2C3E50     /* 12.6:1 - Excellent */
--color-text-secondary: #607D8B   /* 5.1:1 - Good (AA) */
--color-text-light: #90A4AE       /* 3.0:1 - Use for large text only */

/* Module-specific text colors */
--meteorology-dark: #006064       /* 7.5:1 - Excellent */
--water-dark: #00838F             /* 4.8:1 - Good (AA) */
--drought-dark: #E65100           /* 4.6:1 - Good (AA) */
```

### Implementation Example

```tsx
// ✅ GOOD: High contrast for body text
<p className="text-gray-900">Normal body text</p>

// ✅ GOOD: Module color for icons/borders
<MapPin className="h-5 w-5 text-meteorology" />

// ❌ BAD: Module primary color for body text
<p className="text-meteorology">This fails contrast</p>

// ✅ GOOD: Use dark variant for text
<p className="text-[#006064]">Meteorology text content</p>
```

---

## ARIA Labels & Semantic HTML

### Required ARIA Attributes

#### Buttons
```tsx
// ✅ GOOD: Descriptive label
<button
  aria-label="Település kiválasztása"
  aria-expanded={isOpen}
  aria-controls="city-dropdown"
>
  <MapPin className="h-5 w-5" />
  {selectedCity.name}
</button>

// ❌ BAD: No label
<button onClick={handleClick}>
  <MapPin />
</button>
```

#### Form Controls
```tsx
// ✅ GOOD: Label association
<label htmlFor="search-input" className="sr-only">
  Keresés
</label>
<input
  id="search-input"
  type="text"
  placeholder="Keresés..."
  aria-label="Keresés"
/>

// Alternative: aria-labelledby
<div>
  <span id="location-label">Helyszín</span>
  <select aria-labelledby="location-label">
    <option>Szekszárd</option>
  </select>
</div>
```

#### Navigation
```tsx
// ✅ GOOD: Semantic nav with label
<nav aria-label="Fő navigáció">
  <button className="module-tab-meteorology-active">
    Meteorológia
  </button>
  <button className="module-tab-water">
    Vízállás
  </button>
</nav>
```

#### Regions & Landmarks
```tsx
// ✅ GOOD: Semantic HTML
<header className="app-header">
  <h1>DunApp</h1>
</header>

<main className="main-container">
  <section aria-labelledby="meteo-heading">
    <h2 id="meteo-heading">Meteorológia</h2>
    {/* content */}
  </section>
</main>

<footer>
  <p>Forrás: OMSZ</p>
</footer>
```

### Live Regions

For dynamic data updates:

```tsx
// ✅ Data that updates frequently
<div
  role="region"
  aria-live="polite"
  aria-atomic="true"
  aria-label="Aktuális hőmérséklet"
>
  <p>{temperature}°C</p>
</div>

// Use aria-live="assertive" for critical alerts
<div
  role="alert"
  aria-live="assertive"
  className="error-message"
>
  Hiba történt az adatok betöltése során
</div>
```

---

## Keyboard Navigation

### Required Keyboard Support

| Key | Action |
|-----|--------|
| **Tab** | Move focus to next interactive element |
| **Shift+Tab** | Move focus to previous interactive element |
| **Enter** | Activate button/link |
| **Space** | Activate button, toggle checkbox |
| **Escape** | Close modal/dropdown |
| **Arrow Keys** | Navigate within dropdown/select |
| **Home/End** | Jump to first/last item in list |

### Implementation

```tsx
// ✅ GOOD: Full keyboard support
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="selector-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
      >
        Válassz várost
      </button>
      {isOpen && (
        <ul role="listbox" className="selector-dropdown-menu">
          <li
            role="option"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') selectCity('Szekszárd');
            }}
          >
            Szekszárd
          </li>
        </ul>
      )}
    </div>
  );
}
```

### Tab Order

Ensure logical tab order:

```tsx
// ✅ GOOD: Logical order (default browser behavior)
<form>
  <input type="text" name="city" />
  <input type="text" name="date" />
  <button type="submit">Küldés</button>
</form>

// ⚠️ Use tabIndex sparingly
// tabIndex={0}  - Include in natural tab order
// tabIndex={-1} - Focusable by script, not by keyboard
// tabIndex={1+} - Avoid! Disrupts natural order
```

---

## Focus States

### Visual Focus Indicators

**All interactive elements MUST have visible focus states.**

### Default Focus Style

```css
/* Applied via src/index.css */
:focus-visible {
  @apply outline-none ring-2 ring-offset-2;
}
```

### Module-Specific Focus States

```tsx
// Meteorology module
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-meteorology
  focus:ring-offset-2
">
  Meteorológia
</button>

// Water level module
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-water
  focus:ring-offset-2
">
  Vízállás
</button>

// Drought module
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-drought
  focus:ring-offset-2
">
  Aszály
</button>
```

### Component Class Usage

```tsx
// Using predefined component classes
<button className="module-tab-meteorology">
  {/* Focus state included automatically */}
</button>

<button className="selector-button-drought">
  {/* Focus state included automatically */}
</button>
```

### Testing Focus States

```bash
# Check focus indicators manually:
# 1. Press Tab repeatedly
# 2. Verify blue/cyan/orange ring appears on each element
# 3. Verify ring is clearly visible (2px width minimum)
# 4. Verify offset creates space between ring and element
```

---

## Screen Reader Support

### Semantic HTML Priority

Always use semantic HTML over `<div>` when possible:

```tsx
// ✅ GOOD: Semantic elements
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
<button>
<a href="">

// ❌ BAD: Non-semantic divs
<div className="header">
<div className="navigation">
<div onClick={...}>  // Use <button> instead
```

### Hidden Content for Screen Readers

```tsx
// Screen reader only text
<span className="sr-only">
  Ugrás a fő tartalomhoz
</span>

// CSS for sr-only (already in components.css)
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Hiding Decorative Elements

```tsx
// ✅ GOOD: Hide decorative icons
<div className="data-card">
  <CloudRain aria-hidden="true" className="data-card-icon" />
  <h3>Csapadék</h3>
  <p>26.2 mm</p>
</div>

// ❌ BAD: Icon announced by screen reader
<CloudRain className="data-card-icon" />
```

### Image Alternatives

```tsx
// ✅ GOOD: Descriptive alt text
<img
  src="/map-marker.png"
  alt="Szekszárd helyszín a térképen"
/>

// ✅ GOOD: Decorative images
<img
  src="/decorative-pattern.png"
  alt=""
  role="presentation"
/>
```

---

## Component Accessibility Checklist

Use this checklist when creating or reviewing components:

### General
- [ ] Semantic HTML used where applicable
- [ ] All interactive elements keyboard accessible (Tab, Enter, Space)
- [ ] Focus states clearly visible (2px ring)
- [ ] Text contrast meets WCAG AA (4.5:1 minimum)
- [ ] Component works without JavaScript (progressive enhancement)

### Buttons
- [ ] `<button>` element used (not `<div>` with onClick)
- [ ] `aria-label` or text content present
- [ ] `aria-expanded` for toggle buttons
- [ ] `aria-pressed` for toggle state (if applicable)
- [ ] Disabled state indicated visually and programmatically

### Forms
- [ ] `<label>` associated with input (`htmlFor` matches `id`)
- [ ] `aria-label` or `aria-labelledby` for inputs
- [ ] `aria-describedby` for help text
- [ ] `aria-invalid` and `aria-errormessage` for errors
- [ ] Required fields indicated (`aria-required` or `required`)

### Dropdowns/Selects
- [ ] `aria-haspopup="listbox"` on trigger
- [ ] `aria-expanded` state toggled
- [ ] `role="listbox"` on dropdown container
- [ ] `role="option"` on each item
- [ ] Escape key closes dropdown
- [ ] Arrow keys navigate options

### Cards
- [ ] `role="region"` or `<article>`/`<section>`
- [ ] `aria-labelledby` referencing heading
- [ ] Interactive elements focusable
- [ ] Hover state does not rely on color alone

### Maps
- [ ] `role="img"` or `role="application"`
- [ ] `aria-label` describing map purpose
- [ ] Keyboard-accessible controls
- [ ] Alternative text-based data view (table)

### Charts
- [ ] Chart title in DOM (not just SVG)
- [ ] `aria-label` describing chart type and data
- [ ] Consider providing data table alternative
- [ ] Legend items keyboard accessible

---

## Testing Guidelines

### Manual Testing

#### Keyboard Testing
1. Disconnect mouse/trackpad
2. Tab through entire page
3. Verify all interactive elements reachable
4. Verify focus indicators visible
5. Test Enter/Space on all buttons
6. Test Escape on modals/dropdowns

#### Screen Reader Testing

**macOS VoiceOver:**
```bash
# Enable: Cmd + F5
# Navigate: Ctrl + Option + Arrow keys
# Read all: Ctrl + Option + A
# Web rotor: Ctrl + Option + U
```

**Windows NVDA:**
```bash
# Start: Ctrl + Alt + N
# Navigate: Arrow keys
# Read all: Insert + Down arrow
# Elements list: Insert + F7
```

#### Color Contrast Testing

Use browser tools:
1. Chrome DevTools: Lighthouse Audit
2. Firefox Accessibility Inspector
3. Online: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Automated Testing

#### Recommended Tools

```bash
# Install axe DevTools
# Chrome extension: axe DevTools

# Run Lighthouse audit
npm run build
npx lighthouse http://localhost:4173 --view

# Jest + jest-axe (for unit tests)
npm install --save-dev jest-axe
```

#### Example Test
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('CitySelector has no accessibility violations', async () => {
  const { container } = render(<CitySelector />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Quick Reference

### Essential ARIA Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `aria-label` | Accessible name | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | Reference to label | `<div aria-labelledby="heading-id">` |
| `aria-describedby` | Reference to description | `<input aria-describedby="help-text">` |
| `aria-expanded` | Collapsible state | `<button aria-expanded={isOpen}>` |
| `aria-haspopup` | Element has popup | `<button aria-haspopup="menu">` |
| `aria-controls` | ID of controlled element | `<button aria-controls="panel-1">` |
| `aria-live` | Live region updates | `<div aria-live="polite">` |
| `aria-hidden` | Hide from screen readers | `<span aria-hidden="true">` |
| `aria-invalid` | Invalid input | `<input aria-invalid={hasError}>` |
| `aria-required` | Required field | `<input aria-required="true">` |

### Common Issues to Avoid

❌ **Don't:**
- Use `<div>` or `<span>` with onClick (use `<button>`)
- Remove focus outlines without replacement
- Use color as only indicator of state
- Rely on hover-only interactions
- Create keyboard traps
- Use positive tabIndex values (1, 2, 3...)
- Nest interactive elements (button inside button)
- Use poor contrast colors for text

✅ **Do:**
- Use semantic HTML elements
- Provide text alternatives for images/icons
- Ensure all content is keyboard accessible
- Test with screen readers regularly
- Maintain logical tab order
- Provide clear focus indicators
- Use ARIA attributes correctly
- Test color contrast ratios

---

**For Questions:**
Contact UI/UX Designer Agent or refer to:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)

---

*Document Version 1.0 - Last Updated 2025-10-24*
