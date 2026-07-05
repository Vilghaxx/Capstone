# Tooth Path Overlays for Interactive Dental Chart

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace imprecise rect-based tooth overlays with exact path-based overlays using the SVG's st222 tooth paths, while keeping rects as a fallback.

**Architecture:** Add IDs to all 32 st222 tooth paths in the SVG for cross-referencing. Add path data (`d` attribute) to each `TOOTH_REGIONS` entry. The component renders `<path>` overlays when path data exists, falling back to `<rect>` overlays.

**Tech Stack:** React, SVG, CSS modules

---

### Task 1: Add `id` attributes to 32 st222 paths in the SVG

**File:** `202402_Oral_Cavity.svg`

For each of the 32 `<path class="st222">` elements, add `id="tooth-N"` based on the mapping below. Edit format: `<path class="st222"` → `<path id="tooth-N" class="st222"`.

| Tooth | ID | Line | SVG Group |
|-------|----|------|-----------|
| UR 1 (3rd molar) | `tooth-1` | 1930 | Upper Right (line 1919) |
| UR 2 (2nd molar) | `tooth-2` | 1925 | Upper Right |
| UR 3 (1st molar) | `tooth-3` | 1921 | Upper Right |
| UR 4 (2nd premolar) | `tooth-4` | 1944 | Upper Right |
| UR 5 (1st premolar) | `tooth-5` | 1950 | Upper Right |
| UR 6 (canine) | `tooth-6` | 1937 | Upper Right |
| UR 7 (lateral incisor) | `tooth-7` | 1941 | Upper Right |
| UR 8 (central incisor) | `tooth-8` | 1934 | Upper Right |
| UL 9 (central incisor) | `tooth-9` | 1555 | Upper Left (line 1540) |
| UL 10 (lateral incisor) | `tooth-10` | 1562 | Upper Left |
| UL 11 (canine) | `tooth-11` | 1558 | Upper Left |
| UL 12 (1st premolar) | `tooth-12` | 1572 | Upper Left |
| UL 13 (2nd premolar) | `tooth-13` | 1566 | Upper Left |
| UL 14 (1st molar) | `tooth-14` | 1542 | Upper Left |
| UL 15 (2nd molar) | `tooth-15` | 1546 | Upper Left |
| UL 16 (3rd molar) | `tooth-16` | 1551 | Upper Left |
| LL 17 (3rd molar) | `tooth-17` | 1360 | Lower Left (line 1350) |
| LL 18 (2nd molar) | `tooth-18` | 1352 | Lower Left |
| LL 19 (1st molar) | `tooth-19` | 1356 | Lower Left |
| LL 20 (2nd premolar) | `tooth-20` | 1374 | Lower Left |
| LL 21 (1st premolar) | `tooth-21` | 1379 | Lower Left |
| LL 22 (canine) | `tooth-22` | 1363 | Lower Left |
| LL 23 (lateral incisor) | `tooth-23` | 1367 | Lower Left |
| LL 24 (central incisor) | `tooth-24` | 1371 | Lower Left |
| LR 25 (central incisor) | `tooth-25` | 1751 | Lower Right (line 1729) |
| LR 26 (lateral incisor) | `tooth-26` | 1747 | Lower Right |
| LR 27 (canine) | `tooth-27` | 1743 | Lower Right |
| LR 28 (1st premolar) | `tooth-28` | 1759 | Lower Right |
| LR 29 (2nd premolar) | `tooth-29` | 1754 | Lower Right |
| LR 30 (1st molar) | `tooth-30` | 1735 | Lower Right |
| LR 31 (2nd molar) | `tooth-31` | 1731 | Lower Right |
| LR 32 (3rd molar) | `tooth-32` | 1739 | Lower Right |

---

### Task 2: Add path data to each TOOTH_REGIONS entry

**File:** `src/utils/toothMapping.js`

Add a `path` property to each of the 32 `TOOTH_REGIONS` entries containing the full `d` attribute string from the corresponding `<path class="st222">` in the SVG.

Example:
```js
1: {
  toothNumber: 1,
  quadrant: 'UR',
  type: 'third_molar',
  bounds: { x1: 375, y1: 75, x2: 390, y2: 165 },
  centerX: 382, centerY: 120,
  fdi: '18',
  name: 'Upper Right Third Molar (Wisdom)',
  path: `M305.97,152.74c5.19-5.05,7.28,0.82,12.75-2.01...`
},
```

Each path value is the complete `d` attribute spanning 2-4 lines from the SVG. Keep the backtick template literal to handle multi-line path data naturally.

---

### Task 3: Update InteractiveDentalChart.jsx to render path overlays

**File:** `src/components/InteractiveDentalChart.jsx`

Remove the debug outline `<rect>` (lines 196-205).

Replace the clickable `<rect>` (lines 207-223) with conditional rendering that uses `<path>` when path data exists, falling back to `<rect>`:

```jsx
{toothData.path ? (
  <path
    d={toothData.path}
    className={getToothClass(toothData.toothNumber)}
    onClick={() => handleToothClick(toothData.toothNumber)}
    onMouseEnter={() => handleToothHover(toothData)}
    onMouseLeave={handleToothLeave}
    onFocus={() => handleToothHover(toothData)}
    onBlur={handleToothLeave}
    data-tooth={toothData.toothNumber}
    role="button"
    tabIndex="0"
    aria-label={`Tooth ${toothData.toothNumber}: ${toothData.name}`}
    aria-pressed={toothData.toothNumber === selectedTooth}
  />
) : (
  <rect
    x={toothData.bounds.x1}
    y={toothData.bounds.y1}
    width={toothData.bounds.x2 - toothData.bounds.x1}
    height={toothData.bounds.y2 - toothData.bounds.y1}
    className={getToothClass(toothData.toothNumber)}
    onClick={() => handleToothClick(toothData.toothNumber)}
    onMouseEnter={() => handleToothHover(toothData)}
    onMouseLeave={handleToothLeave}
    onFocus={() => handleToothHover(toothData)}
    onBlur={handleToothLeave}
    data-tooth={toothData.toothNumber}
    role="button"
    tabIndex="0"
    aria-label={`Tooth ${toothData.toothNumber}: ${toothData.name}`}
    aria-pressed={toothData.toothNumber === selectedTooth}
  />
)}
```

No other functions change.

---

### Task 4: Verify with development server

Run `npm run dev` and verify:
- All 32 teeth show hover highlight on mouse enter
- Clicking a tooth triggers the click handler
- Tooth shapes align perfectly with the SVG image background
- Status colors display correctly on path shapes
- Selected tooth shows the selection border/glow
- Tooltip positions correctly on hover
- Keyboard navigation works
