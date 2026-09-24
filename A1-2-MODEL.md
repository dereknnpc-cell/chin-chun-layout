# A1-2 photo-reference model — first structural draft

The ten photographs supplied on 2026-09-24 are identified by the user as A1-2.
The procedural model reconstructs the visible cream frame, central drum and
polygonal support, red guards/control cabinet, silver hood, web, roll stands,
rollers and green fan support. Original photographs and people are not included
in the published assets.

This is **not a photogrammetric scan or engineering-verified reconstruction**.
Owner-confirmed: the two-person end is feed, the one-person end is collection,
and collection is on the left in the plan (local x=0 at the current 0° rotation).
The silver oven top is the highest point at 2.4 m. These are now reflected in
geometry and bilingual close-up labels. Other component heights, longitudinal
segment proportions and web routing remain estimates. Wear, labels and detailed
photo textures are not yet reproduced. Height is relative to equipment floor,
not the building elevation datum.

The model matches equipment code `A1-2`, using its current CAD x/y, rotation and
planar dimensions. The initial footprint is 20.23 × 2 m. No layout, storage,
authentication or cloud records are modified by this feature.

Preview: open 2.5D Twin, select A1-2, choose 設備特寫 (Thai: ดูอุปกรณ์ระยะใกล้).
Rotate retains the close-up; 全覽 returns to the full floor. The 2D editor remains
available unchanged. Geometry lives in twin-models.js and is loaded before
digital-twin.js. Run `node --test tests/twin-models.test.cjs` for geometry checks.
