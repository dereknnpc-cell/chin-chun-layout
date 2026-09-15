# Design QA — 2026 Layout for AI.eps / V2.6

## Evidence

- Visual source of truth: `/Users/Documents/工廠配置圖/2026 Layout for AI.eps`
- Normalized source render: `qa/reference-eps.png` (3081 × 2317 px)
- Same-input comparison: `qa/qa-comparison.html` at `http://127.0.0.1:4174/qa-comparison.html`
- Implementation: `http://127.0.0.1:4173/`
- QA viewport: 1600 × 1000 CSS px at DPR 1
- Tested state: light theme, local mode, 1F indoor/full-site views, all structural layers enabled; 2F switch also exercised.

The EPS is a drawing surface while the implementation includes editor controls around its SVG canvas. Full-view fidelity was therefore evaluated against the shared 5 m structural grid and source geometry rather than by a raw whole-window pixel overlay.

## Full-view comparison

- Source grid resolves to X1–X21 and Y1–Y9: 20 × 8 bays, 100.00 × 40.00 m.
- Implementation displays the same X/Y range and 100.00 × 40.00 m dimension strings.
- Source omissions in the structural grid were retained, producing 152 visible column locations.
- Twenty-five wall segments and 51 source equipment records were recalibrated from EPS vector coordinates.
- Title block and UI identify the EPS-calibrated geometry as REV V2.6.

## Focused-region comparison

- West/north production region: M1-1 = `(x 4.75, y 6.15, 30.25 × 4.00 m)`; M2-1 = `(x 4.85, y 15.20, 25.00 × 4.30 m)`.
- North material region: Foam = `15.00 × 3.80 m`; EVA 1 = `13.60 × 3.70 m`.
- South/east region: PF 1 = `20.23 × 4.20 m`; PF 2 = `6.75 × 4.20 m`; CNC enclosure and five CNC machines align to the EPS grid.
- Walls and columns were checked in both the west production bays and east/CNC boundary, where the previous import had the largest drift.

## Iteration history

1. Initial comparison found the earlier 50 m depth, Y1–Y11 grid, 213 generated columns, rough wall paths, and incorrect major machine dimensions/positions. Rebuilt the source geometry from the EPS vector coordinate system.
2. Follow-up comparison found stale 100 × 50 m summary text and an optional 2F void assumption. Updated the summary to 100 × 40 m and guarded the missing optional void so floor switching renders without errors.
3. Post-fix verification confirmed M1 inspector values, Y1–Y9 labels, 152 column labels, working 1F ↔ 2F switching, five 2F zones, three vertical-circulation blocks, and no browser console errors or warnings in a clean tab.

## Fidelity surfaces

- Typography: intentionally follows the existing CAD editor UI; equipment codes and dimensions remain legible at fit-to-screen scale.
- Spacing/layout: source-relative positions and sizes follow the common 5 m module.
- Color/tokens: existing semantic editor colors retained; fidelity target is geometry, not EPS print colors.
- Assets: the EPS render is used only as QA evidence; interactive SVG geometry remains the product surface.
- Copy: grid depth, revision, preset sizes, title block, and indoor-view labels updated consistently.
- Residual P3: decorative pallet/rack details are simplified interactive rectangles; their footprint geometry is preserved.

## Automated checks

- `npm run build`: passed
- `node --check app.js`: passed
- `node --check app_template.js`: passed
- Python compile checks for the geometry/embed scripts: passed
- `npm audit --omit=dev`: 0 vulnerabilities
- Browser smoke test: passed; clean console after 1F → 2F → 1F.

Final result: passed
