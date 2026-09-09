import json

# Load layout data
with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
    layout_data = json.load(f)

json_blob = json.dumps(layout_data, ensure_ascii=False, indent=2)

js_content = """/**
 * CHIN CHUN FACTORY LAYOUT - INTERACTIVE MULTI-FLOOR CAD ENGINE
 * Modular Equipment Planner, 2F Warehouse Mezzanine (EL. +4.40M) & Dimensioning System
 */

(function () {
  // --- Global Constants & Scale ---
  const BAY_SIZE_M = 5.0; // 5.0 meters per column bay (X-axis)
  const COLS_X = 21;      // X1 to X21 (100.0m total width)
  const COLS_Y = 9;       // Y1 to Y9 (40.0m base depth)
  const COL_SIZE_M = 0.5; // 500mm concrete column
  
  // 2F Warehouse Grid
  const MEZZ_COLS_X = 8;  // 1 to 8 (35.0m total, 5.0m bays)
  const MEZZ_COLS_Y = 7;  // A to G (28.5m total, 4.75m bays)
  const MEZZ_BAY_Y = 4.75;// 4.75 meters per bay in Y-axis

  const SCALE = 24.0;     // 24 SVG pixels per meter
  const OFFSET_X = 260;   // Left margin for Y-axis bubbles & dims
  const OFFSET_Y = 220;   // Top margin for X-axis bubbles & dims
  const TOTAL_W_M = (COLS_X - 1) * BAY_SIZE_M; // 100.0m
  const TOTAL_H_M = 70.0; // 70.0m total height including south CNC area

  const SVG_WIDTH = Math.round(TOTAL_W_M * SCALE + OFFSET_X + 280);
  const SVG_HEIGHT = Math.round(TOTAL_H_M * SCALE + OFFSET_Y + 160);

  // --- Initial Factory Baseline Data (Derek Yeh V1.3 & 2F Mezzanine) ---
  const INITIAL_LAYOUT = """ + json_blob + """;

  // --- State Variables ---
  let layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
  let currentFloor = "1F"; // "1F" | "2F" | "OVERLAY"
  let selectedEquipmentId = null;
  let selectedZoneId = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let currentSnapM = 0.5; // default 0.5m snap

  // Zoom & Pan state
  let viewBox = { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  // Layer visibility state
  const layerState = {
    grid: true,
    dims: true,
    aisles: true,
    clearance: true,
    mezzanine: true,
    handrails: true,
    stairs: true
  };

  // DOM Elements
  const svgEl = document.getElementById("factorySvg");
  const viewportEl = document.getElementById("canvasViewport");
  const cursorXEl = document.getElementById("cursorX");
  const cursorYEl = document.getElementById("cursorY");
  const nearestColEl = document.getElementById("nearestCol");
  const gridBayInfoEl = document.getElementById("gridBayInfo");
  const floorIndicatorEl = document.getElementById("floorIndicator");
  const mezzanineStatsEl = document.getElementById("mezzanineStats");
  const snapSelect = document.getElementById("snapSelect");

  // Floor buttons
  const btnFloor1F = document.getElementById("btnFloor1F");
  const btnFloor2F = document.getElementById("btnFloor2F");
  const btnFloorOverlay = document.getElementById("btnFloorOverlay");

  // Inspector Elements
  const inspectorPanel = document.getElementById("inspectorPanel");
  const inspectorEmptyState = document.getElementById("inspectorEmptyState");
  const inspectorContent = document.getElementById("inspectorContent");
  const selectionBadge = document.getElementById("selectionBadge");
  const propName = document.getElementById("propName");
  const propCode = document.getElementById("propCode");
  const propZone = document.getElementById("propZone");
  const propWidth = document.getElementById("propWidth");
  const propHeight = document.getElementById("propHeight");
  const propX = document.getElementById("propX");
  const propY = document.getElementById("propY");
  const propArea = document.getElementById("propArea");
  const propMm = document.getElementById("propMm");
  const rotationAngleDisplay = document.getElementById("rotationAngleDisplay");
  const distToCol = document.getElementById("distToCol");
  const distToAisle = document.getElementById("distToAisle");

  // --- Initialize Application ---
  function init() {
    svgEl.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    
    populateLibrary();
    renderSvg();
    bindEvents();
    fitToScreen();
  }

  // --- Coordinate Transformations ---
  function clientToSvgCoords(clientX, clientY) {
    const rect = svgEl.getBoundingClientRect();
    const svgX = viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width;
    const svgY = viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height;
    return { x: svgX, y: svgY };
  }

  function svgToMeters(svgX, svgY) {
    const xm = (svgX - OFFSET_X) / SCALE;
    const ym = (svgY - OFFSET_Y) / SCALE;
    return { x: xm, y: ym };
  }

  function metersToSvg(xm, ym) {
    const sx = OFFSET_X + xm * SCALE;
    const sy = OFFSET_Y + ym * SCALE;
    return { x: sx, y: sy };
  }

  function snapValue(val, step) {
    if (step <= 0) return val;
    return Math.round(val / step) * step;
  }

  // --- Render Full Layout SVG ---
  function renderSvg() {
    let html = `
      <defs>
        <!-- Fine Grid Pattern -->
        <pattern id="gridPatternFine" width="${SCALE}" height="${SCALE}" patternUnits="userSpaceOnUse">
          <path d="M ${SCALE} 0 L 0 0 0 ${SCALE}" fill="none" stroke="currentColor" stroke-width="0.5" stroke-opacity="0.1"/>
        </pattern>
        <!-- Aisle Zebra Hatch -->
        <pattern id="aisleHatch" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="20" fill="#ECC94B" fill-opacity="0.3"/>
          <rect x="10" width="10" height="20" fill="#4A5568" fill-opacity="0.15"/>
        </pattern>
        <!-- 2F Mezzanine Grating Pattern (Steel Deck) -->
        <pattern id="mezzanineGrating" width="12" height="6" patternUnits="userSpaceOnUse">
          <rect width="12" height="6" fill="#EBF8FF" fill-opacity="0.85"/>
          <line x1="0" y1="0" x2="12" y2="0" stroke="#3182CE" stroke-width="0.8" stroke-opacity="0.4"/>
          <line x1="0" y1="3" x2="12" y2="3" stroke="#90CDF4" stroke-width="0.5" stroke-opacity="0.3"/>
        </pattern>
        <!-- Existing Mezzanine Diagonal Hatch (///) -->
        <pattern id="existingMezzHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="#EDF2F7" fill-opacity="0.9"/>
          <line x1="0" y1="0" x2="0" y2="14" stroke="#4A5568" stroke-width="1.2" stroke-opacity="0.55"/>
          <line x1="7" y1="0" x2="7" y2="14" stroke="#718096" stroke-width="0.8" stroke-opacity="0.35"/>
        </pattern>
        <!-- Ramp Pattern -->
        <pattern id="rampPavingHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <rect width="10" height="10" fill="#FEFCBF" fill-opacity="0.6"/>
          <line x1="0" y1="0" x2="10" y2="0" stroke="#D69E2E" stroke-width="1" stroke-opacity="0.6"/>
        </pattern>
        <!-- Dimension Arrows -->
        <marker id="dimArrowStart" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 10 2 L 0 5 L 10 8 Z" fill="var(--cad-dim-line)"/>
        </marker>
        <marker id="dimArrowEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 10 5 L 0 8 Z" fill="var(--cad-dim-line)"/>
        </marker>
        <marker id="dimArrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 10 5 L 0 8 Z" fill="#D97706"/>
        </marker>
      </defs>

      <!-- Background Sheet -->
      <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="var(--bg-canvas)"/>
      <rect x="${OFFSET_X - 10}" y="${OFFSET_Y - 10}" width="${TOTAL_W_M * SCALE + 20}" height="${TOTAL_H_M * SCALE + 20}" fill="var(--bg-panel)" stroke="var(--border-cad)" stroke-width="1.5" rx="6"/>
      <rect x="${OFFSET_X}" y="${OFFSET_Y}" width="${TOTAL_W_M * SCALE}" height="${TOTAL_H_M * SCALE}" fill="url(#gridPatternFine)"/>
    `;

    const is2F = currentFloor === "2F";
    const isOverlay = currentFloor === "OVERLAY";
    const is1F = currentFloor === "1F";

    // 1. Aisles Layer (1F)
    if (layerState.aisles && (is1F || isOverlay)) {
      html += `<g id="layerAisles" opacity="${isOverlay ? '0.4' : '1.0'}">`;
      layoutData.aisles.forEach(a => {
        const ax = OFFSET_X + a.x * SCALE;
        const ay = OFFSET_Y + a.y * SCALE;
        const aw = a.width * SCALE;
        const ah = a.height * SCALE;
        html += `
          <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#aisleHatch)" stroke="#D69E2E" stroke-width="1.5" stroke-dasharray="6,4"/>
          <text x="${ax + aw / 2}" y="${ay + ah / 2}" font-size="11" font-weight="700" fill="#B7791F" text-anchor="middle" dominant-baseline="central">${a.name}</text>
        `;
      });
      html += `</g>`;
    }

    // 2. Walls Layer (Building Perimeter & Partitions)
    html += `<g id="layerWalls" opacity="${is2F ? '0.35' : (isOverlay ? '0.55' : '1.0')}">`;
    layoutData.walls.forEach(w => {
      const p1 = metersToSvg(w.x1, w.y1);
      const p2 = metersToSvg(w.x2, w.y2);
      const strokeW = w.type === "exterior" ? 4.5 : 2.5;
      const strokeCol = w.type === "exterior" ? "var(--cad-wall)" : "var(--cad-column)";
      html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${strokeCol}" stroke-width="${strokeW}" stroke-linecap="round"/>`;
    });
    html += `</g>`;

    // 3. Columns & Grid Axis Layer
    if (layerState.grid) {
      html += `<g id="layerGrid">`;
      
      if (is2F) {
        // --- 2F Specific Grid (Cols 1~8 at 5.0m, Rows A~G at 4.75m) ---
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

        // Vertical Column Lines (1 ~ 8)
        for (let i = 0; i < mezzX.coords.length; i++) {
          const xm = mezzX.coords[i];
          const px = OFFSET_X + xm * SCALE;
          const py1 = OFFSET_Y - 40;
          const py2 = OFFSET_Y + mezzY.total_depth * SCALE + 30;

          html += `
            <line x1="${px}" y1="${py1}" x2="${px}" y2="${py2}" stroke="#4F46E5" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.75"/>
            <circle cx="${px}" cy="${py1 - 18}" r="13" fill="var(--bg-panel)" stroke="#4F46E5" stroke-width="2"/>
            <text x="${px}" y="${py1 - 18}" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">${mezzX.names[i]}</text>
          `;
        }

        // Horizontal Column Lines (A ~ G, 4.75m bay)
        for (let j = 0; j < mezzY.coords.length; j++) {
          const ym = mezzY.coords[j];
          const py = OFFSET_Y + ym * SCALE;
          const px1 = OFFSET_X - 40;
          const px2 = OFFSET_X + mezzX.total_width * SCALE + 30;

          html += `
            <line x1="${px1}" y1="${py}" x2="${px2}" y2="${py}" stroke="#4F46E5" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.75"/>
            <circle cx="${px1 - 18}" cy="${py}" r="13" fill="var(--bg-panel)" stroke="#4F46E5" stroke-width="2"/>
            <text x="${px1 - 18}" y="${py}" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">${mezzY.names[j]}</text>
          `;
        }

        // Structural Columns (1~8, A~G)
        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < mezzX.coords.length; i++) {
          for (let j = 0; j < mezzY.coords.length; j++) {
            const cx = OFFSET_X + mezzX.coords[i] * SCALE - colPx / 2;
            const cy = OFFSET_Y + mezzY.coords[j] * SCALE - colPx / 2;
            html += `<rect x="${cx}" y="${cy}" width="${colPx}" height="${colPx}" fill="#334155" stroke="#1E293B" stroke-width="1.5" rx="2"/>`;
          }
        }

        // Faint reference of the rest of factory columns
        for (let i = mezzX.coords.length; i < COLS_X; i++) {
          const xm = i * BAY_SIZE_M;
          const px = OFFSET_X + xm * SCALE;
          html += `
            <line x1="${px}" y1="${OFFSET_Y}" x2="${px}" y2="${OFFSET_Y + 40 * SCALE}" stroke="var(--border-cad)" stroke-width="0.5" stroke-dasharray="4,4" stroke-opacity="0.3"/>
            <circle cx="${px}" cy="${OFFSET_Y - 14}" r="9" fill="none" stroke="var(--text-muted)" stroke-width="1" stroke-opacity="0.5"/>
            <text x="${px}" y="${OFFSET_Y - 14}" font-size="9" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central" opacity="0.6">X${i + 1}</text>
          `;
        }

      } else {
        // --- 1F / OVERLAY Standard Factory Grid (X1~X21, Y1~Y9) ---
        for (let i = 0; i < COLS_X; i++) {
          const xm = i * BAY_SIZE_M;
          const px = OFFSET_X + xm * SCALE;
          const py1 = OFFSET_Y - 40;
          const py2 = OFFSET_Y + TOTAL_H_M * SCALE + 20;

          html += `
            <line x1="${px}" y1="${py1}" x2="${px}" y2="${py2}" stroke="var(--cad-grid-axis)" stroke-width="1" stroke-dasharray="8,4,2,4" stroke-opacity="0.6"/>
            <circle cx="${px}" cy="${py1 - 18}" r="12" fill="var(--bg-panel)" stroke="var(--cad-col-bubble)" stroke-width="1.5"/>
            <text x="${px}" y="${py1 - 18}" font-size="11" font-weight="800" fill="var(--cad-col-bubble)" text-anchor="middle" dominant-baseline="central">X${i + 1}</text>
          `;
        }

        for (let j = 0; j < COLS_Y; j++) {
          const ym = j * BAY_SIZE_M;
          const py = OFFSET_Y + ym * SCALE;
          const px1 = OFFSET_X - 40;
          const px2 = OFFSET_X + TOTAL_W_M * SCALE + 20;

          html += `
            <line x1="${px1}" y1="${py}" x2="${px2}" y2="${py}" stroke="var(--cad-grid-axis)" stroke-width="1" stroke-dasharray="8,4,2,4" stroke-opacity="0.6"/>
            <circle cx="${px1 - 18}" cy="${py}" r="12" fill="var(--bg-panel)" stroke="var(--cad-col-bubble)" stroke-width="1.5"/>
            <text x="${px1 - 18}" y="${py}" font-size="11" font-weight="800" fill="var(--cad-col-bubble)" text-anchor="middle" dominant-baseline="central">Y${j + 1}</text>
          `;
        }

        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < COLS_X; i++) {
          for (let j = 0; j < COLS_Y; j++) {
            const cx = OFFSET_X + i * BAY_SIZE_M * SCALE - colPx / 2;
            const cy = OFFSET_Y + j * BAY_SIZE_M * SCALE - colPx / 2;
            html += `<rect x="${cx}" y="${cy}" width="${colPx}" height="${colPx}" fill="var(--cad-column)" stroke="var(--cad-wall)" stroke-width="1.2"/>`;
          }
        }
      }
      html += `</g>`;
    }

    // 4. Dimensions Chains Layer
    if (layerState.dims) {
      html += `<g id="layerDimensions">`;
      
      if (is2F) {
        // --- 2F Dimensions (Top 5.0m bays 1~8; Left 4.75m bays A~G) ---
        const dimY1 = OFFSET_Y - 80;
        const dimY2 = OFFSET_Y - 130;
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

        // Top Bay Dimensions (5.00 m)
        for (let i = 0; i < mezzX.coords.length - 1; i++) {
          const x1 = OFFSET_X + mezzX.coords[i] * SCALE;
          const x2 = OFFSET_X + mezzX.coords[i + 1] * SCALE;
          html += `
            <line x1="${x1}" y1="${OFFSET_Y - 30}" x2="${x1}" y2="${dimY1 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${x2}" y1="${OFFSET_Y - 30}" x2="${x2}" y2="${dimY1 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${x1 + 4}" y1="${dimY1}" x2="${x2 - 4}" y2="${dimY1}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${(x1 + x2) / 2}" y="${dimY1 - 6}" font-size="10" font-weight="700" fill="#4F46E5" text-anchor="middle">5.00 m</text>
          `;
        }

        // Top Total Width (35.00 m)
        const totalX1 = OFFSET_X;
        const totalX2 = OFFSET_X + mezzX.total_width * SCALE;
        html += `
          <line x1="${totalX1}" y1="${OFFSET_Y - 30}" x2="${totalX1}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX2}" y1="${OFFSET_Y - 30}" x2="${totalX2}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX1 + 4}" y1="${dimY2}" x2="${totalX2 - 4}" y2="${dimY2}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${(totalX1 + totalX2) / 2}" y="${dimY2 - 8}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="middle">二樓倉庫總面寬 35.00 M (1~8 軸 · 7 跨 × 5.00 M)</text>
        `;

        // Left Bay Dimensions (4.75 m)
        const dimX1 = OFFSET_X - 80;
        const dimX2 = OFFSET_X - 130;
        for (let j = 0; j < mezzY.coords.length - 1; j++) {
          const y1 = OFFSET_Y + mezzY.coords[j] * SCALE;
          const y2 = OFFSET_Y + mezzY.coords[j + 1] * SCALE;
          html += `
            <line x1="${OFFSET_X - 30}" y1="${y1}" x2="${dimX1 - 5}" y2="${y1}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${OFFSET_X - 30}" y1="${y2}" x2="${dimX1 - 5}" y2="${y2}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${dimX1}" y1="${y1 + 4}" x2="${dimX1}" y2="${y2 - 4}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${dimX1 - 8}" y="${(y1 + y2) / 2}" font-size="10" font-weight="700" fill="#4F46E5" text-anchor="end" dominant-baseline="central">4.75 m</text>
          `;
        }

        // Left Total Depth (28.50 m)
        const totalY1 = OFFSET_Y;
        const totalY2 = OFFSET_Y + mezzY.total_depth * SCALE;
        html += `
          <line x1="${OFFSET_X - 30}" y1="${totalY1}" x2="${dimX2 - 5}" y2="${totalY1}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${OFFSET_X - 30}" y1="${totalY2}" x2="${dimX2 - 5}" y2="${totalY2}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${dimX2}" y1="${totalY1 + 4}" x2="${dimX2}" y2="${totalY2 - 4}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${dimX2 - 10}" y="${(totalY1 + totalY2) / 2}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">倉庫總縱深 28.50 M (A~G 軸 · 6 跨 × 4.75 M)</text>
        `;

      } else {
        // --- 1F Standard Dimensions (100.0m W, 40.0m H) ---
        const dimY1 = OFFSET_Y - 80;
        const dimY2 = OFFSET_Y - 125;

        for (let i = 0; i < COLS_X - 1; i++) {
          const x1 = OFFSET_X + i * BAY_SIZE_M * SCALE;
          const x2 = OFFSET_X + (i + 1) * BAY_SIZE_M * SCALE;
          html += `
            <line x1="${x1}" y1="${OFFSET_Y - 30}" x2="${x1}" y2="${dimY1 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${x2}" y1="${OFFSET_Y - 30}" x2="${x2}" y2="${dimY1 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${x1 + 4}" y1="${dimY1}" x2="${x2 - 4}" y2="${dimY1}" stroke="var(--cad-dim-line)" stroke-width="1.2" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${(x1 + x2) / 2}" y="${dimY1 - 6}" font-size="10" font-weight="700" fill="var(--cad-dim-text)" text-anchor="middle">5.00 m</text>
          `;
        }

        const totalX1 = OFFSET_X;
        const totalX2 = OFFSET_X + TOTAL_W_M * SCALE;
        html += `
          <line x1="${totalX1}" y1="${OFFSET_Y - 30}" x2="${totalX1}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX2}" y1="${OFFSET_Y - 30}" x2="${totalX2}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX1 + 4}" y1="${dimY2}" x2="${totalX2 - 4}" y2="${dimY2}" stroke="var(--cad-dim-line)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${(totalX1 + totalX2) / 2}" y="${dimY2 - 8}" font-size="13" font-weight="800" fill="var(--cad-dim-text)" text-anchor="middle">廠房總寬度 100.00 M (20 跨 × 5.00 M)</text>
        `;

        const dimX1 = OFFSET_X - 80;
        const dimX2 = OFFSET_X - 125;
        for (let j = 0; j < COLS_Y - 1; j++) {
          const y1 = OFFSET_Y + j * BAY_SIZE_M * SCALE;
          const y2 = OFFSET_Y + (j + 1) * BAY_SIZE_M * SCALE;
          html += `
            <line x1="${OFFSET_X - 30}" y1="${y1}" x2="${dimX1 - 5}" y2="${y1}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${OFFSET_X - 30}" y1="${y2}" x2="${dimX1 - 5}" y2="${y2}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${dimX1}" y1="${y1 + 4}" x2="${dimX1}" y2="${y2 - 4}" stroke="var(--cad-dim-line)" stroke-width="1.2" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${dimX1 - 8}" y="${(y1 + y2) / 2}" font-size="10" font-weight="700" fill="var(--cad-dim-text)" text-anchor="end" dominant-baseline="central">5.00 m</text>
          `;
        }

        const totalY1 = OFFSET_Y;
        const totalY2 = OFFSET_Y + (COLS_Y - 1) * BAY_SIZE_M * SCALE;
        html += `
          <line x1="${OFFSET_X - 30}" y1="${totalY1}" x2="${dimX2 - 5}" y2="${totalY1}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${OFFSET_X - 30}" y1="${totalY2}" x2="${dimX2 - 5}" y2="${totalY2}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${dimX2}" y1="${totalY1 + 4}" x2="${dimX2}" y2="${totalY2 - 4}" stroke="var(--cad-dim-line)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${dimX2 - 10}" y="${(totalY1 + totalY2) / 2}" font-size="13" font-weight="800" fill="var(--cad-dim-text)" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">主廠房基準深度 40.00 M (8 跨 × 5.00 M)</text>
        `;
      }
      html += `</g>`;
    }

    // 5. 2F MEZZANINE STRUCTURE LAYER
    if (layerState.mezzanine && (is2F || isOverlay)) {
      const m2f = layoutData.mezzanine_2f;
      html += `<g id="layer2FMezzanine" opacity="${isOverlay ? '0.78' : '1.0'}">`;

      // 5.1 Mezzanine Decks & Zones
      m2f.zones.forEach(z => {
        const zx = OFFSET_X + z.x * SCALE;
        const zy = OFFSET_Y + z.y * SCALE;
        const zw = z.width * SCALE;
        const zh = z.height * SCALE;
        const pat = z.pattern === "hatch_diagonal" ? "url(#existingMezzHatch)" : "url(#mezzanineGrating)";
        const isSelected = selectedZoneId === z.id;

        html += `
          <g class="mezzanine-zone-group" data-zone-id="${z.id}" style="cursor: pointer;">
            <rect class="mezzanine-deck" x="${zx}" y="${zy}" width="${zw}" height="${zh}"
                  fill="${pat}" stroke="${isSelected ? '#2563EB' : '#2B6CB0'}" stroke-width="${isSelected ? '3.5' : '2'}" rx="2"/>
            
            <!-- Zone Center Badge -->
            <rect x="${zx + zw / 2 - 80}" y="${zy + zh / 2 - 24}" width="160" height="48" rx="6" fill="rgba(255,255,255,0.92)" stroke="#2B6CB0" stroke-width="1.2"/>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 - 10}" font-size="11" font-weight="800" fill="#1E3A8A" text-anchor="middle">${z.thai_name} ${z.name.split(' ')[0]}</text>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 + 5}" font-size="10" font-weight="800" fill="#DC2626" text-anchor="middle">[2] EL. +4.40M</text>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 + 18}" font-size="9" font-weight="600" fill="#475569" text-anchor="middle">面積 ${z.area_sqm} m² (${z.width}m × ${z.height}m)</text>
          </g>
        `;
      });

      // 5.2 Handrails Layer (HAND RAIL)
      if (layerState.handrails) {
        html += `<g id="layerHandrails">`;
        m2f.handrails.forEach((hr) => {
          const p1 = metersToSvg(hr.x1, hr.y1);
          const p2 = metersToSvg(hr.x2, hr.y2);
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

          html += `
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="handrail-line-glow"/>
            <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="handrail-line"/>
            <g transform="translate(${mx}, ${my}) rotate(${angle < -90 || angle > 90 ? angle + 180 : angle})">
              <rect x="-36" y="-18" width="72" height="15" rx="3" fill="#FEF3C7" stroke="#D97706" stroke-width="1"/>
              <text x="0" y="-8" font-size="8.5" font-weight="800" fill="#92400E" text-anchor="middle" dominant-baseline="central">HAND RAIL</text>
            </g>
          `;
        });
        html += `</g>`;
      }

      // 5.3 Vertical Circulation (Stair ST-01, Lift, Ramp)
      if (layerState.stairs) {
        const vc = m2f.vertical_circulation;
        html += `<g id="layerVerticalCirculation">`;

        // 1. Lift (貨梯 EL.+0.60M ~ +4.40M)
        const lx = OFFSET_X + vc.lift.x * SCALE;
        const ly = OFFSET_Y + vc.lift.y * SCALE;
        const lw = vc.lift.width * SCALE;
        const lh = vc.lift.height * SCALE;
        html += `
          <g class="lift-block">
            <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="#334155" stroke="#E2E8F0" stroke-width="2" rx="3"/>
            <line x1="${lx}" y1="${ly}" x2="${lx + lw}" y2="${ly + lh}" stroke="#94A3B8" stroke-width="1.2"/>
            <line x1="${lx + lw}" y1="${ly}" x2="${lx}" y2="${ly + lh}" stroke="#94A3B8" stroke-width="1.2"/>
            <rect x="${lx + 4}" y="${ly + lh / 2 - 10}" width="${lw - 8}" height="20" fill="rgba(15,23,42,0.85)" rx="3"/>
            <text x="${lx + lw / 2}" y="${ly + lh / 2}" font-size="10" font-weight="800" fill="#38BDF8" text-anchor="middle" dominant-baseline="central">LIFT 貨梯</text>
          </g>
        `;

        // 2. Stair ST-01 (DWG. NO. : S-05)
        const sx = OFFSET_X + vc.stair.x * SCALE;
        const sy = OFFSET_Y + vc.stair.y * SCALE;
        const sw = vc.stair.width * SCALE;
        const sh = vc.stair.height * SCALE;
        const steps = 14;
        const stepH = sh / steps;
        
        html += `<g class="stair-block">`;
        html += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#F8FAFC" stroke="#475569" stroke-width="2" rx="2"/>`;
        for (let s = 1; s < steps; s++) {
          html += `<line x1="${sx}" y1="${sy + s * stepH}" x2="${sx + sw}" y2="${sy + s * stepH}" stroke="#94A3B8" stroke-width="1"/>`;
        }
        html += `
          <line x1="${sx + sw / 2}" y1="${sy + sh - 8}" x2="${sx + sw / 2}" y2="${sy + 8}" stroke="#2563EB" stroke-width="2" marker-end="url(#dimArrowStart)"/>
          <rect x="${sx - 12}" y="${sy - 24}" width="${sw + 24}" height="20" rx="3" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1"/>
          <text x="${sx + sw / 2}" y="${sy - 13}" font-size="8.5" font-weight="800" fill="#1D4ED8" text-anchor="middle" dominant-baseline="central">STAIR ST-01 (S-05)</text>
        `;
        html += `</g>`;

        // 3. Ramp & Entrance (1F)
        const rx = OFFSET_X + vc.ramp.x * SCALE;
        const ry = OFFSET_Y + vc.ramp.y * SCALE;
        const rw = vc.ramp.width * SCALE;
        const rh = vc.ramp.height * SCALE;
        html += `
          <g class="ramp-block">
            <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="url(#rampPavingHatch)" stroke="#D97706" stroke-width="1.8" rx="3"/>
            <line x1="${rx + rw / 2}" y1="${ry + rh - 4}" x2="${rx + rw / 2}" y2="${ry + 4}" stroke="#D97706" stroke-width="2" marker-end="url(#dimArrowAmber)"/>
            <text x="${rx + rw / 2}" y="${ry + rh / 2 - 5}" font-size="10" font-weight="800" fill="#B45309" text-anchor="middle">RAMP 斜坡道</text>
            <text x="${rx + rw / 2}" y="${ry + rh / 2 + 8}" font-size="9" font-weight="700" fill="#78350F" text-anchor="middle">ENTRANCE 出入口</text>
          </g>
        `;
        html += `</g>`;
      }

      // 5.4 Support Posts
      html += `<g id="layerSupportPosts">`;
      m2f.support_posts.forEach(sp => {
        const px = OFFSET_X + sp.x * SCALE;
        const py = OFFSET_Y + sp.y * SCALE;
        html += `
          <circle cx="${px}" cy="${py}" r="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
          <circle cx="${px}" cy="${py}" r="3" fill="#38BDF8"/>
          <line x1="${px - 10}" y1="${py}" x2="${px + 10}" y2="${py}" stroke="#38BDF8" stroke-width="1"/>
          <line x1="${px}" y1="${py - 10}" x2="${px}" y2="${py + 10}" stroke="#38BDF8" stroke-width="1"/>
        `;
      });
      html += `</g>`;

      html += `</g>`;
    }

    // 6. EQUIPMENT BLOCKS LAYER (Interactive & Movable)
    html += `<g id="layerEquipment">`;

    // A. 1F Equipment
    if (is1F || isOverlay) {
      const eq1List = layoutData.equipment || [];
      eq1List.forEach(eq => {
        const pos = metersToSvg(eq.x, eq.y);
        const ew = eq.width * SCALE;
        const eh = eq.height * SCALE;
        const color = eq.color || "#4A90E2";
        const isSelected = eq.id === selectedEquipmentId;
        const clrPx = 0.5 * SCALE;
        const rot = eq.rotation || 0;
        const centerX = pos.x + ew / 2;
        const centerY = pos.y + eh / 2;
        const opacity = isOverlay ? "0.38" : "1.0";

        html += `
          <g id="${eq.id}" class="svg-equipment-group ${isSelected ? 'selected' : ''}" 
             transform="rotate(${rot} ${centerX} ${centerY})"
             data-id="${eq.id}" data-floor="1F" opacity="${opacity}">
        `;

        if (layerState.clearance && !isOverlay) {
          html += `<rect x="${pos.x - clrPx}" y="${pos.y - clrPx}" width="${ew + clrPx * 2}" height="${eh + clrPx * 2}" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="0.8" stroke-dasharray="3,3" rx="4"/>`;
        }

        html += `
          <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" 
                fill="${color}" fill-opacity="${isSelected ? '0.5' : '0.22'}" 
                stroke="${color}" stroke-width="${isSelected ? '3' : '1.8'}" rx="3"/>
          <line x1="${pos.x}" y1="${pos.y + 4}" x2="${pos.x + ew}" y2="${pos.y + 4}" stroke="${color}" stroke-width="2"/>
        `;

        if (eh > 28) {
          html += `
            <text x="${centerX}" y="${centerY - 7}" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
            <text x="${centerX}" y="${centerY + 7}" font-size="9" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${eq.name}</text>
            <text x="${centerX}" y="${centerY + 18}" font-size="8" font-family="'JetBrains Mono', monospace" fill="var(--cad-dim-text)" text-anchor="middle">${eq.width.toFixed(1)}m × ${eq.height.toFixed(1)}m</text>
          `;
        } else {
          html += `<text x="${centerX}" y="${centerY}" font-size="9.5" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code} (${eq.width.toFixed(1)}x${eq.height.toFixed(1)}m)</text>`;
        }

        if (isSelected) {
          html += `
            <g class="selection-dims">
              <line x1="${pos.x}" y1="${pos.y - 12}" x2="${pos.x + ew}" y2="${pos.y - 12}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${centerX}" y="${pos.y - 16}" font-size="10" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${eq.width.toFixed(2)} m</text>
              <line x1="${pos.x + ew + 12}" y1="${pos.y}" x2="${pos.x + ew + 12}" y2="${pos.y + eh}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${pos.x + ew + 18}" y="${centerY}" font-size="10" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${eq.height.toFixed(2)} m</text>
            </g>
          `;
        }

        html += `</g>`;
      });
    }

    // B. 2F Equipment (Warehouse Racks & Staging)
    if (is2F || isOverlay) {
      const eq2List = layoutData.equipment_2f || [];
      eq2List.forEach(eq => {
        const pos = metersToSvg(eq.x, eq.y);
        const ew = eq.width * SCALE;
        const eh = eq.height * SCALE;
        const color = eq.color || "#3182CE";
        const isSelected = eq.id === selectedEquipmentId;
        const clrPx = 0.4 * SCALE;
        const rot = eq.rotation || 0;
        const centerX = pos.x + ew / 2;
        const centerY = pos.y + eh / 2;

        html += `
          <g id="${eq.id}" class="svg-equipment-group ${isSelected ? 'selected' : ''}" 
             transform="rotate(${rot} ${centerX} ${centerY})"
             data-id="${eq.id}" data-floor="2F">
        `;

        if (layerState.clearance) {
          html += `<rect x="${pos.x - clrPx}" y="${pos.y - clrPx}" width="${ew + clrPx * 2}" height="${eh + clrPx * 2}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="0.8" stroke-dasharray="3,3" rx="3"/>`;
        }

        html += `
          <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" 
                fill="${color}" fill-opacity="${isSelected ? '0.65' : '0.35'}" 
                stroke="${color}" stroke-width="${isSelected ? '3' : '2'}" rx="3"/>
          <line x1="${pos.x}" y1="${pos.y}" x2="${pos.x + ew}" y2="${pos.y + eh}" stroke="${color}" stroke-width="0.7" stroke-opacity="0.4"/>
          <line x1="${pos.x + ew}" y1="${pos.y}" x2="${pos.x}" y2="${pos.y + eh}" stroke="${color}" stroke-width="0.7" stroke-opacity="0.4"/>
        `;

        html += `
          <text x="${centerX}" y="${centerY - 6}" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 7}" font-size="8.5" font-weight="700" fill="#1E293B" text-anchor="middle" dominant-baseline="central">${eq.name}</text>
        `;

        if (isSelected) {
          html += `
            <g class="selection-dims">
              <line x1="${pos.x}" y1="${pos.y - 12}" x2="${pos.x + ew}" y2="${pos.y - 12}" stroke="#2563EB" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${centerX}" y="${pos.y - 16}" font-size="10" font-weight="700" fill="#2563EB" text-anchor="middle">${eq.width.toFixed(2)} m</text>
              <line x1="${pos.x + ew + 12}" y1="${pos.y}" x2="${pos.x + ew + 12}" y2="${pos.y + eh}" stroke="#2563EB" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${pos.x + ew + 18}" y="${centerY}" font-size="10" font-weight="700" fill="#2563EB" dominant-baseline="central">${eq.height.toFixed(2)} m</text>
            </g>
          `;
        }

        html += `</g>`;
      });
    }

    html += `</g>`;

    // 7. Formal Engineering Title Block
    const tbW = 440;
    const tbH = 175;
    const tbX = SVG_WIDTH - tbW - 40;
    const tbY = SVG_HEIGHT - tbH - 40;

    let drawingTitle = "1F 產線與設備模組化配置圖";
    let dwgNo = "CC-ENG-2026-001";
    let dwgRev = "REV V1.4 (正式工程版)";
    let dwgGridDesc = "5.00 M 柱距 (柱中心)";
    let dwgElev = "1F EL. +0.60M";

    if (is2F) {
      drawingTitle = "2F 倉庫夾層平面配置工程圖";
      dwgNo = "CC-ENG-2026-002-2F";
      dwgGridDesc = "X: 5.00M / Y: 4.75M (淨柱距)";
      dwgElev = "2F EL. +4.40M";
    } else if (isOverlay) {
      drawingTitle = "1F+2F 廠房與二樓倉庫垂直疊加透視圖";
      dwgNo = "CC-ENG-2026-OVERLAY";
      dwgGridDesc = "全廠 5.0M 模組 + 4.75M 夾層";
      dwgElev = "雙層透視疊合";
    }

    html += `
      <g id="engineeringTitleBlock" transform="translate(${tbX}, ${tbY})">
        <rect width="${tbW}" height="${tbH}" fill="var(--bg-panel)" stroke="var(--cad-wall)" stroke-width="2"/>
        <rect width="${tbW}" height="45" fill="${is2F ? '#4338CA' : '#1E40AF'}"/>
        <text x="20" y="28" font-size="15" font-weight="800" fill="#FFFFFF">晉春橡膠科技 · 廠房平面配置工程圖</text>
        <line x1="0" y1="45" x2="${tbW}" y2="45" stroke="var(--border-cad)" stroke-width="1"/>
        <line x1="0" y1="88" x2="${tbW}" y2="88" stroke="var(--border-cad)" stroke-width="1"/>
        <line x1="0" y1="130" x2="${tbW}" y2="130" stroke="var(--border-cad)" stroke-width="1"/>
        <line x1="150" y1="45" x2="150" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1"/>
        <line x1="300" y1="45" x2="300" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1"/>

        <text x="15" y="60" font-size="9" fill="var(--text-muted)" font-weight="600">圖名 / DRAWING TITLE</text>
        <text x="15" y="76" font-size="11" fill="var(--text-main)" font-weight="700">${drawingTitle}</text>
        <text x="165" y="60" font-size="9" fill="var(--text-muted)" font-weight="600">圖號 / DWG NO.</text>
        <text x="165" y="76" font-size="11" fill="var(--text-main)" font-weight="700">${dwgNo}</text>
        <text x="315" y="60" font-size="9" fill="var(--text-muted)" font-weight="600">版次 / REVISION</text>
        <text x="315" y="76" font-size="11" fill="var(--text-main)" font-weight="700">${dwgRev}</text>

        <text x="15" y="102" font-size="9" fill="var(--text-muted)" font-weight="600">基準標高 / ELEVATION</text>
        <text x="15" y="118" font-size="11" fill="#DC2626" font-weight="800">${dwgElev}</text>
        <text x="165" y="102" font-size="9" fill="var(--text-muted)" font-weight="600">柱網規範 / GRID BAY</text>
        <text x="165" y="118" font-size="11" fill="var(--text-main)" font-weight="700">${dwgGridDesc}</text>
        <text x="315" y="102" font-size="9" fill="var(--text-muted)" font-weight="600">審核日期 / DATE</text>
        <text x="315" y="118" font-size="11" fill="var(--text-main)" font-weight="700">2026/09/07</text>

        <text x="15" y="145" font-size="9" fill="var(--text-muted)" font-weight="600">夾層總面積 / 2F AREA</text>
        <text x="15" y="161" font-size="11" fill="#16A34A" font-weight="800">380.0 m² (淨高 3.80M)</text>
        <text x="165" y="145" font-size="9" fill="var(--text-muted)" font-weight="600">比例尺 / SCALE</text>
        <text x="165" y="161" font-size="11" fill="var(--text-main)" font-weight="700">1:150 @ A1 (Metric)</text>
        <text x="315" y="145" font-size="9" fill="var(--text-muted)" font-weight="600">施工狀態 / STATUS</text>
        <text x="315" y="161" font-size="11" fill="#16A34A" font-weight="800">APPROVED 正式施工版</text>
      </g>
    `;

    // 8. Legend
    const lgW = 420;
    const lgH = 140;
    const lgX = OFFSET_X;
    const lgY = SVG_HEIGHT - lgH - 40;
    html += `
      <g id="engineeringLegend" transform="translate(${lgX}, ${lgY})">
        <rect width="${lgW}" height="${lgH}" fill="var(--bg-panel)" stroke="var(--border-cad)" stroke-width="1.5" rx="4"/>
        <text x="15" y="22" font-size="12" font-weight="700" fill="var(--text-main)">工程圖例說明 (LEGEND & SYMBOLS)</text>
        
        <rect x="15" y="35" width="24" height="14" fill="url(#mezzanineGrating)" stroke="#2B6CB0" stroke-width="1.5"/>
        <text x="48" y="46" font-size="10" fill="var(--text-main)">2F 新建夾層 (Zone A/B, EL.+4.40M)</text>
        
        <rect x="220" y="35" width="24" height="14" fill="url(#existingMezzHatch)" stroke="#475569" stroke-width="1.5"/>
        <text x="252" y="46" font-size="10" fill="var(--text-main)">既有夾層 (พื้นที่ชั้นลอยเดิม 71.25m²)</text>
        
        <line x1="15" y1="70" x2="39" y2="70" stroke="#D97706" stroke-width="3.5" stroke-dasharray="6,3"/>
        <text x="48" y="73" font-size="10" fill="var(--text-main)">安全防護欄杆 (HAND RAIL)</text>
        
        <circle cx="232" cy="70" r="6" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5"/>
        <text x="252" y="73" font-size="10" fill="var(--text-main)">夾層支撐鋼柱 (Support Post)</text>

        <rect x="15" y="95" width="24" height="14" fill="#334155" stroke="#E2E8F0" stroke-width="1.5"/>
        <text x="48" y="106" font-size="10" fill="var(--text-main)">貨梯 LIFT (1F~2F 垂直物流)</text>
        
        <rect x="220" y="95" width="24" height="14" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
        <text x="252" y="106" font-size="10" fill="var(--text-main)">安全樓梯 STAIR ST-01 (S-05)</text>
      </g>
    `;

    svgEl.innerHTML = html;
    attachSvgClickListeners();
  }

  // --- Attach Event Listeners to SVG Interactive Elements ---
  function attachSvgClickListeners() {
    svgEl.querySelectorAll(".svg-equipment-group").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = el.getAttribute("data-id");
        selectEquipment(id);
      });
    });

    svgEl.querySelectorAll(".mezzanine-zone-group").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const zid = el.getAttribute("data-zone-id");
        selectMezzanineZone(zid);
      });
    });

    svgEl.addEventListener("click", (e) => {
      if (e.target.tagName === "rect" && e.target.getAttribute("fill") === "var(--bg-canvas)") {
        deselectAll();
      }
    });
  }

  function deselectAll() {
    selectedEquipmentId = null;
    selectedZoneId = null;
    inspectorEmptyState.style.display = "block";
    inspectorContent.style.display = "none";
    selectionBadge.textContent = "未選取";
    selectionBadge.classList.remove("active");
    renderSvg();
  }

  // --- Populate Equipment Library ---
  function populateLibrary() {
    const container = document.getElementById("libraryContainer");
    if (!container) return;

    const categories = {
      "二樓新建倉庫模組": [
        { code: "RK-B", name: "重型鋼製物料架", w: 5.5, h: 1.8, cat: "2F Storage", col: "#3182CE" },
        { code: "PL-A", name: "標準棧板儲位排", w: 6.0, h: 2.4, cat: "2F Pallets", col: "#2F855A" },
        { code: "EX-RK", name: "夾層輕型零件架", w: 5.0, h: 2.5, cat: "2F Existing", col: "#718096" },
        { code: "STG", name: "電梯理貨暫存區", w: 3.0, h: 3.0, cat: "2F Staging", col: "#DD6B20" }
      ],
      "貼合生產線 (ADH 1 / 2)": [
        { code: "M1-1", name: "ADH 1 貼合機主機", w: 9.5, h: 2.2, cat: "ADH", col: "#2B6CB0" },
        { code: "M2-1", name: "ADH 2 貼合機主機", w: 11.5, h: 2.5, cat: "ADH", col: "#2B6CB0" },
        { code: "N1-1", name: "DC 集塵設備", w: 3.2, h: 3.8, cat: "ADH", col: "#4A90E2" },
        { code: "J1-1", name: "V Cut 2 (V型裁斷機)", w: 4.5, h: 4.6, cat: "Cutting", col: "#F5A623" },
        { code: "T Cut 1", name: "T Cut 1 裁切機", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" },
        { code: "T Cut 2", name: "T Cut 2 裁切機", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" }
      ],
      "發泡與原料區 (Foam / EVA)": [
        { code: "F1-1", name: "Foam 發泡線主機", w: 14.5, h: 4.2, cat: "Foam", col: "#319795" },
        { code: "A1-1", name: "EVA 1 生產線", w: 18.0, h: 4.5, cat: "EVA", col: "#2C7A7B" },
        { code: "A1-2", name: "EVA 2 生產線", w: 18.0, h: 3.5, cat: "EVA", col: "#2C7A7B" },
        { code: "EVA 3", name: "EVA 3 生產線", w: 11.0, h: 7.5, cat: "EVA", col: "#2C7A7B" },
        { code: "H1-1", name: "Latex 乳膠加工機", w: 12.5, h: 4.0, cat: "Foam", col: "#319795" }
      ],
      "裁斷與沖床加工區": [
        { code: "C1-1", name: "PF 1 精密切斷機", w: 18.5, h: 3.8, cat: "Cutting", col: "#D69E2E" },
        { code: "C1-2", name: "PF 2 精密切斷機", w: 7.5, h: 3.5, cat: "Cutting", col: "#D69E2E" },
        { code: "E1-1", name: "Auto Cut 1 自動裁斷", w: 5.0, h: 2.2, cat: "Cutting", col: "#F5A623" },
        { code: "E1-2", name: "Auto Cut 2 自動裁斷", w: 5.0, h: 2.2, cat: "Cutting", col: "#F5A623" },
        { code: "J1-2", name: "V Cut 1 (V型裁斷機)", w: 4.5, h: 4.5, cat: "Cutting", col: "#F5A623" },
        { code: "J1-3", name: "V Cut 3 (V型裁斷機)", w: 4.5, h: 4.5, cat: "Cutting", col: "#F5A623" },
        { code: "L4-1", name: "Die Cut 模切機", w: 4.2, h: 4.0, cat: "Cutting", col: "#ECC94B" }
      ],
      "品檢包裝與自動化": [
        { code: "B1-1", name: "QC 1 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" },
        { code: "B1-2", name: "QC 2 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" },
        { code: "B1-3", name: "QC 3 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" },
        { code: "B1-4", name: "QC 4 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" },
        { code: "G2-1", name: "AF 1 自動化設備", w: 2.4, h: 5.5, cat: "Automation", col: "#4A90E2" },
        { code: "G2-2", name: "AF 2 自動化設備", w: 4.8, h: 3.8, cat: "Automation", col: "#4A90E2" }
      ],
      "公用與倉儲物流": [
        { code: "Lift 1", name: "貨梯 (北側貨梯)", w: 4.8, h: 4.5, cat: "Utility", col: "#718096" },
        { code: "Office", name: "廠務辦公室", w: 11.5, h: 10.5, cat: "Office", col: "#CBD5E0" },
        { code: "K1-1", name: "FDC 物料貨架", w: 2.4, h: 2.8, cat: "Storage", col: "#38A169" },
        { code: "PL", name: "標準暫存棧板排", w: 10.0, h: 3.0, cat: "Storage", col: "#2F855A" }
      ]
    };

    let html = "";
    for (const [groupTitle, items] of Object.entries(categories)) {
      html += `
        <div class="lib-group">
          <div class="lib-group-title">${groupTitle}</div>
          <div class="lib-item-grid">
      `;
      items.forEach(item => {
        html += `
          <div class="lib-item" data-code="${item.code}" data-name="${item.name}" data-w="${item.w}" data-h="${item.h}" data-cat="${item.cat}" data-col="${item.col}">
            <div class="lib-item-info">
              <span class="lib-item-name">${item.name}</span>
              <span class="lib-item-dim">${item.w}m × ${item.h}m</span>
            </div>
            <span class="lib-badge" style="border-color: ${item.col}; color: ${item.col}">${item.code}</span>
          </div>
        `;
      });
      html += `</div></div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll(".lib-item").forEach(itemEl => {
      itemEl.addEventListener("click", () => {
        const code = itemEl.getAttribute("data-code");
        const name = itemEl.getAttribute("data-name");
        const w = parseFloat(itemEl.getAttribute("data-w"));
        const h = parseFloat(itemEl.getAttribute("data-h"));
        const cat = itemEl.getAttribute("data-cat");
        const col = itemEl.getAttribute("data-col");

        const centerSvg = {
          x: viewBox.x + viewBox.width / 2,
          y: viewBox.y + viewBox.height / 2
        };
        const centerM = svgToMeters(centerSvg.x, centerSvg.y);
        const snappedX = snapValue(centerM.x - w / 2, currentSnapM);
        const snappedY = snapValue(centerM.y - h / 2, currentSnapM);

        const targetFloor = currentFloor === "2F" ? "2F" : "1F";
        const newEq = {
          id: `eq_${Date.now()}`,
          code: code,
          name: name,
          zone: cat,
          floor: targetFloor,
          x: snappedX,
          y: snappedY,
          width: w,
          height: h,
          rotation: 0,
          color: col,
          category: cat
        };

        if (targetFloor === "2F") {
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newEq);
        } else {
          layoutData.equipment.push(newEq);
        }

        selectEquipment(newEq.id);
        renderSvg();
      });
    });

    document.getElementById("libSearch").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      container.querySelectorAll(".lib-item").forEach(el => {
        const txt = el.textContent.toLowerCase();
        el.style.display = txt.includes(q) ? "flex" : "none";
      });
    });
  }

  // --- Equipment Selection & Inspector ---
  function selectEquipment(id) {
    selectedEquipmentId = id;
    selectedZoneId = null;

    let eq = (layoutData.equipment || []).find(e => e.id === id);
    if (!eq && layoutData.equipment_2f) {
      eq = layoutData.equipment_2f.find(e => e.id === id);
    }

    if (!eq) {
      inspectorEmptyState.style.display = "block";
      inspectorContent.style.display = "none";
      selectionBadge.textContent = "未選取";
      selectionBadge.classList.remove("active");
      renderSvg();
      return;
    }

    inspectorEmptyState.style.display = "none";
    inspectorContent.style.display = "flex";
    selectionBadge.textContent = `${eq.floor || '1F'} · ${eq.code}`;
    selectionBadge.classList.add("active");

    propName.value = eq.name;
    propCode.value = eq.code;
    propZone.value = `${eq.floor || '1F'} · ${eq.zone || eq.category}`;
    propWidth.value = eq.width.toFixed(2);
    propHeight.value = eq.height.toFixed(2);
    propX.value = eq.x.toFixed(2);
    propY.value = eq.y.toFixed(2);
    rotationAngleDisplay.textContent = `${eq.rotation || 0}°`;

    const area = (eq.width * eq.height).toFixed(2);
    propArea.textContent = area;
    propMm.textContent = `${Math.round(eq.width * 1000)} × ${Math.round(eq.height * 1000)} mm`;

    updateClearanceReadouts(eq);
    renderSvg();
  }

  function selectMezzanineZone(zoneId) {
    selectedZoneId = zoneId;
    selectedEquipmentId = null;

    const z = layoutData.mezzanine_2f.zones.find(item => item.id === zoneId);
    if (!z) return;

    inspectorEmptyState.style.display = "none";
    inspectorContent.style.display = "flex";
    selectionBadge.textContent = `2F 夾層 · ${z.name.split(' ')[0]}`;
    selectionBadge.classList.add("active");

    propName.value = `${z.thai_name} (${z.name})`;
    propCode.value = "MEZZ-2F";
    propZone.value = "二樓倉庫夾層 (EL. +4.40M)";
    propWidth.value = z.width.toFixed(2);
    propHeight.value = z.height.toFixed(2);
    propX.value = z.x.toFixed(2);
    propY.value = z.y.toFixed(2);
    rotationAngleDisplay.textContent = "0°";

    propArea.textContent = z.area_sqm.toFixed(2);
    propMm.textContent = `${Math.round(z.width * 1000)} × ${Math.round(z.height * 1000)} mm`;

    distToCol.textContent = "對齊 5.0m × 4.75m 柱網";
    distToAisle.textContent = "設有安全防墜護欄 (HAND RAIL)";

    renderSvg();
  }

  function updateClearanceReadouts(eq) {
    let minDistCol = 999;
    const is2Feq = eq.floor === "2F" || currentFloor === "2F";

    if (is2Feq) {
      const mezzX = layoutData.mezzanine_2f.grid_x.coords;
      const mezzY = layoutData.mezzanine_2f.grid_y.coords;
      for (const cx of mezzX) {
        for (const cy of mezzY) {
          const dx = Math.max(eq.x - cx, 0, cx - (eq.x + eq.width));
          const dy = Math.max(eq.y - cy, 0, cy - (eq.y + eq.height));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDistCol) minDistCol = d;
        }
      }
    } else {
      for (let i = 0; i < COLS_X; i++) {
        for (let j = 0; j < COLS_Y; j++) {
          const cx = i * BAY_SIZE_M;
          const cy = j * BAY_SIZE_M;
          const dx = Math.max(eq.x - cx, 0, cx - (eq.x + eq.width));
          const dy = Math.max(eq.y - cy, 0, cy - (eq.y + eq.height));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDistCol) minDistCol = d;
        }
      }
    }
    distToCol.textContent = `${minDistCol.toFixed(2)} 公尺`;

    if (is2Feq) {
      distToAisle.textContent = "夾層倉儲動線 (依護欄邊界)";
    } else {
      const aisleTop = 42.0;
      const aisleBottom = 45.5;
      let distAisle = 0;
      if (eq.y + eq.height < aisleTop) {
        distAisle = aisleTop - (eq.y + eq.height);
      } else if (eq.y > aisleBottom) {
        distAisle = eq.y - aisleBottom;
      } else {
        distAisle = 0.0;
      }
      distToAisle.textContent = distAisle === 0 ? "臨近走道 (0 m)" : `${distAisle.toFixed(2)} 公尺`;
    }
  }

  // --- Zoom & Pan Logic ---
  function updateViewBox() {
    svgEl.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
  }

  function fitToScreen() {
    const vpRect = viewportEl.getBoundingClientRect();
    const aspectVp = vpRect.width / vpRect.height;
    
    let targetW = TOTAL_W_M * SCALE + OFFSET_X + 160;
    let targetH = TOTAL_H_M * SCALE + OFFSET_Y + 120;

    if (currentFloor === "2F") {
      targetW = (35.0 + 12.0) * SCALE;
      targetH = (28.5 + 16.0) * SCALE;
      viewBox.x = OFFSET_X - 60;
      viewBox.y = OFFSET_Y - 80;
      viewBox.width = targetW;
      viewBox.height = targetH;
    } else {
      const aspectContent = targetW / targetH;
      if (aspectVp > aspectContent) {
        viewBox.height = targetH;
        viewBox.width = targetH * aspectVp;
        viewBox.x = (targetW - viewBox.width) / 2;
        viewBox.y = 0;
      } else {
        viewBox.width = targetW;
        viewBox.height = targetW / aspectVp;
        viewBox.x = 0;
        viewBox.y = (targetH - viewBox.height) / 2;
      }
    }
    updateViewBox();
  }

  // --- Floor Switching Controller ---
  function switchFloor(targetFloor) {
    currentFloor = targetFloor;

    [btnFloor1F, btnFloor2F, btnFloorOverlay].forEach(btn => {
      if (!btn) return;
      btn.classList.toggle("active", btn.getAttribute("data-floor") === targetFloor);
    });

    if (targetFloor === "1F") {
      floorIndicatorEl.textContent = "1F 主廠房 (EL.+0.60M)";
      floorIndicatorEl.style.color = "#2563EB";
      gridBayInfoEl.textContent = "5.00 m (柱中心) / 4.75 m (淨柱距)";
      mezzanineStatsEl.innerHTML = "廠房總跨度: <strong>100.0 M × 40.0 M</strong>";
    } else if (targetFloor === "2F") {
      floorIndicatorEl.textContent = "2F 倉庫夾層 (EL.+4.40M)";
      floorIndicatorEl.style.color = "#4F46E5";
      gridBayInfoEl.textContent = "1~8 軸 5.00m · A~G 軸 4.75m 柱距";
      mezzanineStatsEl.innerHTML = "2F夾層面積: <strong style='color:#16A34A'>380.0 m²</strong> (Zone A/B/既有)";
    } else {
      floorIndicatorEl.textContent = "1F+2F 雙層透視疊加";
      floorIndicatorEl.style.color = "#D97706";
      gridBayInfoEl.textContent = "雙層結構對齊基準";
      mezzanineStatsEl.innerHTML = "夾層投影面積: <strong>380.0 m²</strong>";
    }

    deselectAll();
    fitToScreen();
    renderSvg();
  }

  // --- Event Bindings ---
  function bindEvents() {
    if (btnFloor1F) btnFloor1F.addEventListener("click", () => switchFloor("1F"));
    if (btnFloor2F) btnFloor2F.addEventListener("click", () => switchFloor("2F"));
    if (btnFloorOverlay) btnFloorOverlay.addEventListener("click", () => switchFloor("OVERLAY"));

    snapSelect.addEventListener("change", (e) => {
      currentSnapM = parseFloat(e.target.value);
    });

    document.querySelectorAll(".layer-toggles input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const layer = e.target.closest("label").getAttribute("data-layer");
        layerState[layer] = e.target.checked;
        e.target.closest("label").classList.toggle("active", e.target.checked);
        renderSvg();
      });
    });

    const themeBtn = document.getElementById("themeToggleBtn");
    const themeLabel = document.getElementById("themeLabel");
    themeBtn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("theme-cad-dark");
      document.body.classList.toggle("theme-cad-light", !isDark);
      themeLabel.textContent = isDark ? "淺色工程圖" : "深色藍圖";
      renderSvg();
    });

    viewportEl.addEventListener("mousemove", (e) => {
      const svgPt = clientToSvgCoords(e.clientX, e.clientY);
      const mPt = svgToMeters(svgPt.x, svgPt.y);

      cursorXEl.textContent = Math.max(0, mPt.x).toFixed(2);
      cursorYEl.textContent = Math.max(0, mPt.y).toFixed(2);

      if (currentFloor === "2F") {
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;
        const colIdx = Math.max(0, Math.min(mezzX.names.length - 1, Math.round(mPt.x / mezzX.bay_size)));
        const rowIdx = Math.max(0, Math.min(mezzY.names.length - 1, Math.round(mPt.y / mezzY.bay_size)));
        nearestColEl.textContent = `柱軸 ${mezzX.names[colIdx]} - ${mezzY.names[rowIdx]}`;
      } else {
        const colXIdx = Math.max(0, Math.min(COLS_X - 1, Math.round(mPt.x / BAY_SIZE_M)));
        const colYIdx = Math.max(0, Math.min(COLS_Y - 1, Math.round(mPt.y / BAY_SIZE_M)));
        nearestColEl.textContent = `X${colXIdx + 1} - Y${colYIdx + 1}`;
      }

      if (isDragging && selectedEquipmentId) {
        let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        }
        if (!eq) return;

        const rawX = mPt.x - dragOffset.x;
        const rawY = mPt.y - dragOffset.y;

        eq.x = Math.max(0, snapValue(rawX, currentSnapM));
        eq.y = Math.max(0, snapValue(rawY, currentSnapM));

        propX.value = eq.x.toFixed(2);
        propY.value = eq.y.toFixed(2);

        updateClearanceReadouts(eq);
        renderSvg();
      }

      if (isPanning) {
        const dx = (e.clientX - panStart.x) * (viewBox.width / viewportEl.clientWidth);
        const dy = (e.clientY - panStart.y) * (viewBox.height / viewportEl.clientHeight);
        viewBox.x -= dx;
        viewBox.y -= dy;
        panStart = { x: e.clientX, y: e.clientY };
        updateViewBox();
      }
    });

    viewportEl.addEventListener("mousedown", (e) => {
      const eqGroup = e.target.closest(".svg-equipment-group");
      if (eqGroup && e.button === 0) {
        const id = eqGroup.getAttribute("data-id");
        selectEquipment(id);
        
        let eq = (layoutData.equipment || []).find(item => item.id === id);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === id);
        }
        if (eq) {
          isDragging = true;
          const svgPt = clientToSvgCoords(e.clientX, e.clientY);
          const mPt = svgToMeters(svgPt.x, svgPt.y);
          dragOffset = { x: mPt.x - eq.x, y: mPt.y - eq.y };
          eqGroup.classList.add("dragging");
        }
        return;
      }

      if (e.button === 1 || (!eqGroup && (e.button === 0 || e.ctrlKey))) {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        viewportEl.style.cursor = "grabbing";
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      isPanning = false;
      viewportEl.style.cursor = "default";
      document.querySelectorAll(".svg-equipment-group.dragging").forEach(el => el.classList.remove("dragging"));
    });

    viewportEl.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      const mouseSvg = clientToSvgCoords(e.clientX, e.clientY);

      const newW = viewBox.width * zoomFactor;
      const newH = viewBox.height * zoomFactor;

      viewBox.x = mouseSvg.x - (mouseSvg.x - viewBox.x) * (newW / viewBox.width);
      viewBox.y = mouseSvg.y - (mouseSvg.y - viewBox.y) * (newH / viewBox.height);
      viewBox.width = newW;
      viewBox.height = newH;

      updateViewBox();
    }, { passive: false });

    document.getElementById("zoomInBtn").addEventListener("click", () => {
      const cx = viewBox.x + viewBox.width / 2;
      const cy = viewBox.y + viewBox.height / 2;
      viewBox.width *= 0.8;
      viewBox.height *= 0.8;
      viewBox.x = cx - viewBox.width / 2;
      viewBox.y = cy - viewBox.height / 2;
      updateViewBox();
    });

    document.getElementById("zoomOutBtn").addEventListener("click", () => {
      const cx = viewBox.x + viewBox.width / 2;
      const cy = viewBox.y + viewBox.height / 2;
      viewBox.width *= 1.25;
      viewBox.height *= 1.25;
      viewBox.x = cx - viewBox.width / 2;
      viewBox.y = cy - viewBox.height / 2;
      updateViewBox();
    });

    document.getElementById("zoomResetBtn").addEventListener("click", fitToScreen);
    document.getElementById("fitScreenBtn").addEventListener("click", fitToScreen);

    [propName, propCode, propWidth, propHeight, propX, propY].forEach(input => {
      input.addEventListener("input", () => {
        if (!selectedEquipmentId) return;
        let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        }
        if (!eq) return;

        eq.name = propName.value;
        eq.code = propCode.value;
        eq.width = Math.max(0.2, parseFloat(propWidth.value) || 0.2);
        eq.height = Math.max(0.2, parseFloat(propHeight.value) || 0.2);
        eq.x = parseFloat(propX.value) || 0;
        eq.y = parseFloat(propY.value) || 0;

        propArea.textContent = (eq.width * eq.height).toFixed(2);
        propMm.textContent = `${Math.round(eq.width * 1000)} × ${Math.round(eq.height * 1000)} mm`;

        updateClearanceReadouts(eq);
        renderSvg();
      });
    });

    document.getElementById("rotateLeftBtn").addEventListener("click", () => rotateSelected(-90));
    document.getElementById("rotateRightBtn").addEventListener("click", () => rotateSelected(90));

    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "r" || e.key === "R") {
        rotateSelected(90);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "1") {
        switchFloor("1F");
      } else if (e.key === "2") {
        switchFloor("2F");
      } else if (e.key === "3") {
        switchFloor("OVERLAY");
      }
    });

    document.getElementById("duplicateBtn").addEventListener("click", () => {
      if (!selectedEquipmentId) return;
      let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
      let targetList = layoutData.equipment;
      if (!eq && layoutData.equipment_2f) {
        eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        targetList = layoutData.equipment_2f;
      }
      if (!eq) return;

      const newEq = JSON.parse(JSON.stringify(eq));
      newEq.id = `eq_${Date.now()}`;
      newEq.code = `${eq.code}_COPY`;
      newEq.x += 1.0;
      newEq.y += 1.0;
      targetList.push(newEq);
      selectEquipment(newEq.id);
    });

    document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

    document.getElementById("saveJsonBtn").addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(layoutData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `chin_chun_layout_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    document.getElementById("exportSvgBtn").addEventListener("click", () => {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chin_chun_factory_layout_${currentFloor}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    document.getElementById("exportDxfBtn").addEventListener("click", () => {
      generateAndDownloadDxf();
    });

    document.getElementById("printBtn").addEventListener("click", () => {
      window.print();
    });
  }

  function rotateSelected(delta) {
    if (!selectedEquipmentId) return;
    let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
    if (!eq && layoutData.equipment_2f) {
      eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
    }
    if (!eq) return;

    eq.rotation = ((eq.rotation || 0) + delta + 360) % 360;
    rotationAngleDisplay.textContent = `${eq.rotation}°`;
    renderSvg();
  }

  function deleteSelected() {
    if (!selectedEquipmentId) return;
    let idx = (layoutData.equipment || []).findIndex(item => item.id === selectedEquipmentId);
    if (idx !== -1) {
      layoutData.equipment.splice(idx, 1);
    } else if (layoutData.equipment_2f) {
      idx = layoutData.equipment_2f.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.equipment_2f.splice(idx, 1);
    }
    deselectAll();
  }

  // --- Dynamic DXF Generation in Browser (with 2F Mezzanine Layers) ---
  function generateAndDownloadDxf() {
    const bayMm = BAY_SIZE_M * 1000;
    const dxf = [];

    dxf.push("0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "9", "$INSUNITS", "70", "4", "0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "12");
    dxf.push("0", "LAYER", "2", "01_GRID_AXIS", "70", "0", "62", "1", "6", "CENTER");
    dxf.push("0", "LAYER", "2", "02_COLUMNS", "70", "0", "62", "7", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "03_WALLS", "70", "0", "62", "7", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "04_AISLES", "70", "0", "62", "2", "6", "DASHED");
    dxf.push("0", "LAYER", "2", "05_EQUIPMENT_1F", "70", "0", "62", "4", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "06_DIMENSIONS", "70", "0", "62", "3", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "07_TEXT", "70", "0", "62", "7", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "08_TITLE_BLOCK", "70", "0", "62", "6", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "09_2F_MEZZANINE", "70", "0", "62", "5", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "10_2F_HANDRAIL", "70", "0", "62", "2", "6", "DASHED");
    dxf.push("0", "LAYER", "2", "11_2F_STAIRS_LIFT", "70", "0", "62", "3", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "12_2F_RACKS", "70", "0", "62", "6", "6", "CONTINUOUS");
    dxf.push("0", "ENDTAB", "0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "BLOCKS");
    const allEq = [...(layoutData.equipment || []), ...(layoutData.equipment_2f || [])];
    allEq.forEach(eq => {
      const blkName = `BLK_${eq.id.toUpperCase()}`;
      const wMm = eq.width * 1000;
      const hMm = eq.height * 1000;
      const layer = eq.floor === "2F" ? "12_2F_RACKS" : "05_EQUIPMENT_1F";
      dxf.push(
        "0", "BLOCK", "2", blkName, "70", "0", "10", "0.0", "20", "0.0", "30", "0.0", "3", blkName,
        "0", "POLYLINE", "8", layer, "66", "1", "70", "1",
        "0", "VERTEX", "8", layer, "10", "0.0", "20", "0.0", "30", "0.0",
        "0", "VERTEX", "8", layer, "10", `${wMm}`, "20", "0.0", "30", "0.0",
        "0", "VERTEX", "8", layer, "10", `${wMm}`, "20", `${hMm}`, "30", "0.0",
        "0", "VERTEX", "8", layer, "10", "0.0", "20", `${hMm}`, "30", "0.0",
        "0", "SEQEND",
        "0", "TEXT", "8", "07_TEXT", "10", `${wMm / 2}`, "20", `${hMm / 2}`, "30", "0.0", "40", "250.0", "1", eq.code,
        "72", "1", "11", `${wMm / 2}`, "21", `${hMm / 2}`, "31", "0.0",
        "0", "ENDBLK"
      );
    });

    dxf.push(
      "0", "BLOCK", "2", "BLK_COLUMN", "70", "0", "10", "0.0", "20", "0.0", "30", "0.0", "3", "BLK_COLUMN",
      "0", "POLYLINE", "8", "02_COLUMNS", "66", "1", "70", "1",
      "0", "VERTEX", "8", "02_COLUMNS", "10", "-250.0", "20", "-250.0", "30", "0.0",
      "0", "VERTEX", "8", "02_COLUMNS", "10", "250.0", "20", "-250.0", "30", "0.0",
      "0", "VERTEX", "8", "02_COLUMNS", "10", "250.0", "20", "250.0", "30", "0.0",
      "0", "VERTEX", "8", "02_COLUMNS", "10", "-250.0", "20", "250.0", "30", "0.0",
      "0", "SEQEND", "0", "ENDBLK"
    );
    dxf.push("0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "ENTITIES");

    for (let i = 0; i < COLS_X; i++) {
      const xm = i * bayMm;
      dxf.push(
        "0", "LINE", "8", "01_GRID_AXIS", "10", `${xm}`, "20", "-3000.0", "30", "0.0", "11", `${xm}`, "21", "68000.0", "31", "0.0",
        "0", "CIRCLE", "8", "01_GRID_AXIS", "10", `${xm}`, "20", "-4000.0", "30", "0.0", "40", "800.0",
        "0", "TEXT", "8", "07_TEXT", "10", `${xm}`, "20", "-4000.0", "30", "0.0", "40", "500.0", "1", `X${i+1}`,
        "72", "1", "11", `${xm}`, "21", "-4000.0", "31", "0.0"
      );
    }
    for (let j = 0; j < COLS_Y; j++) {
      const ym = j * bayMm;
      const xMax = (COLS_X - 1) * bayMm + 3000;
      dxf.push(
        "0", "LINE", "8", "01_GRID_AXIS", "10", "-3000.0", "20", `${ym}`, "30", "0.0", "11", `${xMax}`, "21", `${ym}`, "31", "0.0",
        "0", "CIRCLE", "8", "01_GRID_AXIS", "10", "-4000.0", "20", `${ym}`, "30", "0.0", "40", "800.0",
        "0", "TEXT", "8", "07_TEXT", "10", "-4000.0", "20", `${ym}`, "30", "0.0", "40", "500.0", "1", `Y${j+1}`,
        "72", "1", "11", "-4000.0", "21", `${ym}`, "31", "0.0"
      );
    }

    for (let i = 0; i < COLS_X; i++) {
      for (let j = 0; j < COLS_Y; j++) {
        dxf.push("0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", `${i * bayMm}`, "20", `${j * bayMm}`, "30", "0.0");
      }
    }

    layoutData.walls.forEach(w => {
      dxf.push(
        "0", "LINE", "8", "03_WALLS", "10", `${w.x1 * 1000}`, "20", `${w.y1 * 1000}`, "30", "0.0",
        "11", `${w.x2 * 1000}`, "21", `${w.y2 * 1000}`, "31", "0.0"
      );
    });

    const m2f = layoutData.mezzanine_2f;
    m2f.zones.forEach(z => {
      const x1 = z.x * 1000;
      const y1 = z.y * 1000;
      const x2 = (z.x + z.width) * 1000;
      const y2 = (z.y + z.height) * 1000;
      dxf.push(
        "0", "POLYLINE", "8", "09_2F_MEZZANINE", "66", "1", "70", "1",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${x1}`, "20", `${y1}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${x2}`, "20", `${y1}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${x2}`, "20", `${y2}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${x1}`, "20", `${y2}`, "30", "0.0",
        "0", "SEQEND",
        "0", "TEXT", "8", "07_TEXT", "10", `${(x1 + x2) / 2}`, "20", `${(y1 + y2) / 2}`, "30", "0.0", "40", "400.0", "1", `${z.name} (+4.40M)`,
        "72", "1", "11", `${(x1 + x2) / 2}`, "21", `${(y1 + y2) / 2}`, "31", "0.0"
      );
    });

    m2f.handrails.forEach(hr => {
      dxf.push(
        "0", "LINE", "8", "10_2F_HANDRAIL", "10", `${hr.x1 * 1000}`, "20", `${hr.y1 * 1000}`, "30", "0.0",
        "11", `${hr.x2 * 1000}`, "21", `${hr.y2 * 1000}`, "31", "0.0"
      );
    });

    allEq.forEach(eq => {
      const blkName = `BLK_${eq.id.toUpperCase()}`;
      const rot = eq.rotation || 0;
      const layer = eq.floor === "2F" ? "12_2F_RACKS" : "05_EQUIPMENT_1F";
      dxf.push(
        "0", "INSERT", "8", layer, "2", blkName,
        "10", `${eq.x * 1000}`, "20", `${eq.y * 1000}`, "30", "0.0",
        "50", `${rot}`
      );
    });

    dxf.push("0", "ENDSEC", "0", "EOF");

    const blob = new Blob([dxf.join("\\n")], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chin_chun_factory_layout_2F.dxf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
"""

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print('app.js generated successfully!')
