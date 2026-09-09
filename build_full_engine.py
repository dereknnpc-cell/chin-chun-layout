import json

def generate_engine():
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        layout_data = json.load(f)

    json_str = json.dumps(layout_data, ensure_ascii=False, indent=2)

    app_template = f"""/**
 * CHIN CHUN FACTORY LAYOUT - INTERACTIVE MULTI-FLOOR CAD ENGINE
 * Modular Equipment Planner, 2F Warehouse Mezzanine (EL. +4.40M) & Interactive Columns System
 */

(function () {
  // --- Global Constants & Scale ---
  const BAY_SIZE_M = 5.0; // 5.0 meters per column bay (X-axis)
  const COLS_X = 21;      // X1 to X21 (100.0m total width)
  const COLS_Y = 11;      // Y1 to Y11 (50.0m base depth)
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

  // --- Initial Factory Baseline Data ---
  const INITIAL_LAYOUT = {json_str};

  // --- State Variables ---
  let layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
  let currentFloor = "1F"; // "1F" | "2F" | "OVERLAY"
  let selectedEquipmentId = null;
  let selectedZoneId = null;
  let isDragging = false;
  let dragOffset = {{ x: 0, y: 0 }};
  let currentSnapM = 0.5; // default 0.5m snap

  // Zoom & Pan state
  let viewBox = {{ x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT }};
  let isPanning = false;
  let panStart = {{ x: 0, y: 0 }};

  // Layer visibility state
  const layerState = {{
    grid: true,
    walls: true,
    dims: true,
    aisles: true,
    clearance: true,
    mezzanine: true,
    handrails: true,
    stairs: true
  }};

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
  const propArea = document.getElementById("propArea");
  const propMm = document.getElementById("propMm");
  const propX = document.getElementById("propX");
  const propY = document.getElementById("propY");
  const rotationAngleDisplay = document.getElementById("rotationAngleDisplay");
  const distToCol = document.getElementById("distToCol");
  const distToAisle = document.getElementById("distToAisle");

  // Helper to find equipment or column by ID
  function findItemById(id) {{
    if (!id) return null;
    let item = (layoutData.equipment || []).find(e => e.id === id);
    if (item) return item;
    if (layoutData.equipment_2f) {{
      item = layoutData.equipment_2f.find(e => e.id === id);
      if (item) return item;
    }}
    if (layoutData.columns) {{
      item = layoutData.columns.find(e => e.id === id);
      if (item) return item;
    }}
    return null;
  }}

  // --- Initialize Application ---
  function init() {{
    svgEl.setAttribute("viewBox", `${{viewBox.x}} ${{viewBox.y}} ${{viewBox.width}} ${{viewBox.height}}`);
    
    populateLibrary();
    renderSvg();
    bindEvents();
    fitToScreen();
  }}

  // --- Coordinate Transformations ---
  function clientToSvgCoords(clientX, clientY) {{
    const rect = svgEl.getBoundingClientRect();
    const svgX = viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width;
    const svgY = viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height;
    return {{ x: svgX, y: svgY }};
  }}

  function svgToMeters(svgX, svgY) {{
    const xm = (svgX - OFFSET_X) / SCALE;
    const ym = (svgY - OFFSET_Y) / SCALE;
    return {{ x: xm, y: ym }};
  }}

  function metersToSvg(xm, ym) {{
    const sx = OFFSET_X + xm * SCALE;
    const sy = OFFSET_Y + ym * SCALE;
    return {{ x: sx, y: sy }};
  }}

  function snapValue(val, step) {{
    if (step <= 0) return val;
    return Math.round(val / step) * step;
  }}

  // Helper: calculate 4-vertex polygon for double-line wall
  function getWallPolygon(w) {{
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return null;
    const nx = -dy / len;
    const ny = dx / len;
    const ht = (w.thickness || 0.3) / 2;
    const ox = nx * ht;
    const oy = ny * ht;
    const p1 = metersToSvg(w.x1 + ox, w.y1 + oy);
    const p2 = metersToSvg(w.x2 + ox, w.y2 + oy);
    const p3 = metersToSvg(w.x2 - ox, w.y2 - oy);
    const p4 = metersToSvg(w.x1 - ox, w.y1 - oy);
    return {{
      points: `${{p1.x}},${{p1.y}} ${{p2.x}},${{p2.y}} ${{p3.x}},${{p3.y}} ${{p4.x}},${{p4.y}}`,
      c1: metersToSvg(w.x1, w.y1),
      c2: metersToSvg(w.x2, w.y2)
    }};
  }}

  // --- Render Full Layout SVG ---
  function renderSvg() {{
    let html = `
      <defs>
        <!-- Fine Grid Pattern -->
        <pattern id="gridPatternFine" width="${{SCALE}}" height="${{SCALE}}" patternUnits="userSpaceOnUse">
          <path d="M ${{SCALE}} 0 L 0 0 0 ${{SCALE}}" fill="none" stroke="currentColor" stroke-width="0.5" stroke-opacity="0.1"/>
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
        <!-- Dimension Arrows -->
        <marker id="dimArrowStart" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 10 2 L 0 5 L 10 8 Z" fill="currentColor"/>
        </marker>
        <marker id="dimArrowEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 10 5 L 0 8 Z" fill="currentColor"/>
        </marker>
      </defs>

      <!-- Background Sheet -->
      <rect width="${{SVG_WIDTH}}" height="${{SVG_HEIGHT}}" fill="var(--bg-canvas)"/>
      <rect x="${{OFFSET_X - 10}}" y="${{OFFSET_Y - 10}}" width="${{TOTAL_W_M * SCALE + 20}}" height="${{TOTAL_H_M * SCALE + 20}}" fill="var(--bg-panel)" stroke="var(--border-cad)" stroke-width="1.5" rx="6"/>
      <rect x="${{OFFSET_X}}" y="${{OFFSET_Y}}" width="${{TOTAL_W_M * SCALE}}" height="${{TOTAL_H_M * SCALE}}" fill="url(#gridPatternFine)"/>
    `;

    const is2F = currentFloor === "2F";
    const isOverlay = currentFloor === "OVERLAY";
    const is1F = currentFloor === "1F";

    // 1. Aisles Layer (1F)
    if (layerState.aisles && (is1F || isOverlay)) {{
      html += `<g id="layerAisles" opacity="${{isOverlay ? '0.4' : '1.0'}}">`;
      (layoutData.aisles || []).forEach(a => {{
        const ax = OFFSET_X + a.x * SCALE;
        const ay = OFFSET_Y + a.y * SCALE;
        const aw = a.width * SCALE;
        const ah = a.height * SCALE;
        html += `
          <rect x="${{ax}}" y="${{ay}}" width="${{aw}}" height="${{ah}}" fill="url(#aisleHatch)" stroke="#D69E2E" stroke-width="1.5" stroke-dasharray="6,4"/>
          <text x="${{ax + aw / 2}}" y="${{ay + ah / 2}}" font-size="11" font-weight="700" fill="#B7791F" text-anchor="middle" dominant-baseline="central">${{a.name}}</text>
        `;
      }});
      html += `</g>`;
    }}

    // 2. Double-line Architectural Walls Layer (雙筆劃實體建築牆體)
    if (layerState.walls) {{
      html += `<g id="layerWalls" opacity="${{is2F ? '0.35' : (isOverlay ? '0.55' : '1.0')}}">`;
      (layoutData.walls || []).forEach(w => {{
        const poly = getWallPolygon(w);
        if (!poly) return;
        html += `
          <polygon points="${{poly.points}}" class="wall-double-poly" stroke-linejoin="round"/>
          <line x1="${{poly.c1.x}}" y1="${{poly.c1.y}}" x2="${{poly.c2.x}}" y2="${{poly.c2.y}}" class="wall-centerline"/>
        `;
      }});
      html += `</g>`;
    }}

    // 3. Grid Axis Lines & Columns Layer
    if (layerState.grid) {{
      html += `<g id="layerGrid">`;
      
      if (is2F) {{
        // --- 2F Specific Grid (Cols 1~8 at 5.0m, Rows A~G at 4.75m) ---
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

        // Vertical Column Lines (1 ~ 8)
        for (let i = 0; i < mezzX.coords.length; i++) {{
          const xm = mezzX.coords[i];
          const px = OFFSET_X + xm * SCALE;
          const py1 = OFFSET_Y - 40;
          const py2 = OFFSET_Y + mezzY.total_depth * SCALE + 30;

          html += `
            <line x1="${{px}}" y1="${{py1}}" x2="${{px}}" y2="${{py2}}" stroke="#4F46E5" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.75"/>
            <circle cx="${{px}}" cy="${{py1 - 18}}" r="13" fill="var(--bg-panel)" stroke="#4F46E5" stroke-width="2"/>
            <text x="${{px}}" y="${{py1 - 18}}" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">${{mezzX.names[i]}}</text>
          `;
        }}

        // Horizontal Column Lines (A ~ G, 4.75m bay)
        for (let j = 0; j < mezzY.coords.length; j++) {{
          const ym = mezzY.coords[j];
          const py = OFFSET_Y + ym * SCALE;
          const px1 = OFFSET_X - 40;
          const px2 = OFFSET_X + mezzX.total_width * SCALE + 30;

          html += `
            <line x1="${{px1}}" y1="${{py}}" x2="${{px2}}" y2="${{py}}" stroke="#4F46E5" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.75"/>
            <circle cx="${{px1 - 18}}" cy="${{py}}" r="13" fill="var(--bg-panel)" stroke="#4F46E5" stroke-width="2"/>
            <text x="${{px1 - 18}}" y="${{py}}" font-size="11" font-weight="800" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">${{mezzY.names[j]}}</text>
          `;
        }}

        // 2F Columns
        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < mezzX.coords.length; i++) {{
          for (let j = 0; j < mezzY.coords.length; j++) {{
            const cx = OFFSET_X + mezzX.coords[i] * SCALE - colPx / 2;
            const cy = OFFSET_Y + mezzY.coords[j] * SCALE - colPx / 2;
            html += `<rect x="${{cx}}" y="${{cy}}" width="${{colPx}}" height="${{colPx}}" fill="#334155" stroke="#1E293B" stroke-width="1.5" rx="2"/>`;
          }}
        }}

      }} else {{
        // --- 1F / OVERLAY Grid Axes (X1~X21, Y1~Y11) ---
        for (let i = 0; i < COLS_X; i++) {{
          const xm = i * BAY_SIZE_M;
          const px = OFFSET_X + xm * SCALE;
          const py1 = OFFSET_Y - 40;
          const py2 = OFFSET_Y + TOTAL_H_M * SCALE + 20;

          html += `
            <line x1="${{px}}" y1="${{py1}}" x2="${{px}}" y2="${{py2}}" stroke="var(--cad-grid-axis)" stroke-width="1" stroke-dasharray="8,4,2,4" stroke-opacity="0.6"/>
            <circle cx="${{px}}" cy="${{py1 - 18}}" r="12" fill="var(--bg-panel)" stroke="var(--cad-col-bubble)" stroke-width="1.5"/>
            <text x="${{px}}" y="${{py1 - 18}}" font-size="11" font-weight="800" fill="var(--cad-col-bubble)" text-anchor="middle" dominant-baseline="central">X${{i + 1}}</text>
          `;
        }}

        for (let j = 0; j < COLS_Y; j++) {{
          const ym = j * BAY_SIZE_M;
          const py = OFFSET_Y + ym * SCALE;
          const px1 = OFFSET_X - 40;
          const px2 = OFFSET_X + TOTAL_W_M * SCALE + 20;

          html += `
            <line x1="${{px1}}" y1="${{py}}" x2="${{px2}}" y2="${{py}}" stroke="var(--cad-grid-axis)" stroke-width="1" stroke-dasharray="8,4,2,4" stroke-opacity="0.6"/>
            <circle cx="${{px1 - 18}}" cy="${{py}}" r="12" fill="var(--bg-panel)" stroke="var(--cad-col-bubble)" stroke-width="1.5"/>
            <text x="${{px1 - 18}}" y="${{py}}" font-size="11" font-weight="800" fill="var(--cad-col-bubble)" text-anchor="middle" dominant-baseline="central">Y${{j + 1}}</text>
          `;
        }}

        // --- Interactive Movable & Deletable 1F Columns (可移動與刪除之結構柱) ---
        (layoutData.columns || []).forEach(col => {{
          const cw = (col.width || COL_SIZE_M) * SCALE;
          const ch = (col.height || COL_SIZE_M) * SCALE;
          const cx = OFFSET_X + col.x * SCALE - cw / 2;
          const cy = OFFSET_Y + col.y * SCALE - ch / 2;
          const isSelected = col.id === selectedEquipmentId;

          html += `
            <g id="${{col.id}}" class="svg-column-group svg-equipment-group ${{isSelected ? 'selected' : ''}}"
               data-id="${{col.id}}" data-floor="1F" style="cursor: move;">
              <rect class="column-box main-box" x="${{cx}}" y="${{cy}}" width="${{cw}}" height="${{ch}}"
                    fill="${{isSelected ? 'var(--cad-selection)' : (col.color || '#334155')}}"
                    stroke="${{isSelected ? '#1D4ED8' : 'var(--cad-wall)'}}"
                    stroke-width="${{isSelected ? '2.5' : '1.2'}}" rx="2"/>
              <line x1="${{cx}}" y1="${{cy}}" x2="${{cx + cw}}" y2="${{cy + ch}}" stroke="${{isSelected ? '#FFFFFF' : '#94A3B8'}}" stroke-width="0.8" stroke-opacity="0.6"/>
              <line x1="${{cx + cw}}" y1="${{cy}}" x2="${{cx}}" y2="${{cy + ch}}" stroke="${{isSelected ? '#FFFFFF' : '#94A3B8'}}" stroke-width="0.8" stroke-opacity="0.6"/>
              <text x="${{cx + cw / 2}}" y="${{cy - 4}}" class="col-tag" text-anchor="middle">${{col.code}}</text>
          `;

          if (isSelected) {{
            html += `
              <g class="selection-dims">
                <line x1="${{cx}}" y1="${{cy - 10}}" x2="${{cx + cw}}" y2="${{cy - 10}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
                <text x="${{cx + cw / 2}}" y="${{cy - 14}}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${{col.width.toFixed(2)}} m</text>
                <line x1="${{cx + cw + 10}}" y1="${{cy}}" x2="${{cx + cw + 10}}" y2="${{cy + ch}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
                <text x="${{cx + cw + 14}}" y="${{cy + ch / 2}}" font-size="9" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${{col.height.toFixed(2)}} m</text>
              </g>
            `;
          }}

          html += `</g>`;
        }});
      }}
      html += `</g>`;
    }}

    // 4. Dimensions Chains Layer
    if (layerState.dims) {{
      html += `<g id="layerDimensions">`;
      
      if (is2F) {{
        // 2F Dimensions
        const dimY1 = OFFSET_Y - 80;
        const dimY2 = OFFSET_Y - 130;
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

        for (let i = 0; i < mezzX.coords.length - 1; i++) {{
          const x1 = OFFSET_X + mezzX.coords[i] * SCALE;
          const x2 = OFFSET_X + mezzX.coords[i + 1] * SCALE;
          html += `
            <line x1="${{x1}}" y1="${{OFFSET_Y - 30}}" x2="${{x1}}" y2="${{dimY1 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{x2}}" y1="${{OFFSET_Y - 30}}" x2="${{x2}}" y2="${{dimY1 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{x1 + 4}}" y1="${{dimY1}}" x2="${{x2 - 4}}" y2="${{dimY1}}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${{(x1 + x2) / 2}}" y="${{dimY1 - 6}}" font-size="10" font-weight="700" fill="#4F46E5" text-anchor="middle">5.00 m</text>
          `;
        }}

        const totalX1 = OFFSET_X;
        const totalX2 = OFFSET_X + mezzX.total_width * SCALE;
        html += `
          <line x1="${{totalX1}}" y1="${{OFFSET_Y - 30}}" x2="${{totalX1}}" y2="${{dimY2 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{totalX2}}" y1="${{OFFSET_Y - 30}}" x2="${{totalX2}}" y2="${{dimY2 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{totalX1 + 4}}" y1="${{dimY2}}" x2="${{totalX2 - 4}}" y2="${{dimY2}}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${{(totalX1 + totalX2) / 2}}" y="${{dimY2 - 8}}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="middle">二樓倉庫總面寬 35.00 M (1~8 軸 · 7 跨 × 5.00 M)</text>
        `;

        const dimX1 = OFFSET_X - 80;
        const dimX2 = OFFSET_X - 130;
        for (let j = 0; j < mezzY.coords.length - 1; j++) {{
          const y1 = OFFSET_Y + mezzY.coords[j] * SCALE;
          const y2 = OFFSET_Y + mezzY.coords[j + 1] * SCALE;
          html += `
            <line x1="${{OFFSET_X - 30}}" y1="${{y1}}" x2="${{dimX1 - 5}}" y2="${{y1}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{OFFSET_X - 30}}" y1="${{y2}}" x2="${{dimX1 - 5}}" y2="${{y2}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{dimX1}}" y1="${{y1 + 4}}" x2="${{dimX1}}" y2="${{y2 - 4}}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${{dimX1 - 8}}" y="${{(y1 + y2) / 2}}" font-size="10" font-weight="700" fill="#4F46E5" text-anchor="end" dominant-baseline="central">4.75 m</text>
          `;
        }}

        const totalY1 = OFFSET_Y;
        const totalY2 = OFFSET_Y + mezzY.total_depth * SCALE;
        html += `
          <line x1="${{OFFSET_X - 30}}" y1="${{totalY1}}" x2="${{dimX2 - 5}}" y2="${{totalY1}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{OFFSET_X - 30}}" y1="${{totalY2}}" x2="${{dimX2 - 5}}" y2="${{totalY2}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{dimX2}}" y1="${{totalY1 + 4}}" x2="${{dimX2}}" y2="${{totalY2 - 4}}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${{dimX2 - 10}}" y="${{(totalY1 + totalY2) / 2}}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${{dimX2 - 10}} ${{(totalY1 + totalY2) / 2}})">倉庫總縱深 28.50 M (A~G 軸 · 6 跨 × 4.75 M)</text>
        `;

      }} else {{
        // 1F Dimensions (100.0M W, 50.0M H)
        const dimY1 = OFFSET_Y - 80;
        const dimY2 = OFFSET_Y - 125;

        for (let i = 0; i < COLS_X - 1; i++) {{
          const x1 = OFFSET_X + i * BAY_SIZE_M * SCALE;
          const x2 = OFFSET_X + (i + 1) * BAY_SIZE_M * SCALE;
          html += `
            <line x1="${{x1}}" y1="${{OFFSET_Y - 30}}" x2="${{x1}}" y2="${{dimY1 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{x2}}" y1="${{OFFSET_Y - 30}}" x2="${{x2}}" y2="${{dimY1 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{x1 + 4}}" y1="${{dimY1}}" x2="${{x2 - 4}}" y2="${{dimY1}}" stroke="var(--cad-dim-line)" stroke-width="1.2" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${{(x1 + x2) / 2}}" y="${{dimY1 - 6}}" font-size="10" font-weight="700" fill="var(--cad-dim-text)" text-anchor="middle">5.00 m</text>
          `;
        }}

        const totalX1 = OFFSET_X;
        const totalX2 = OFFSET_X + TOTAL_W_M * SCALE;
        html += `
          <line x1="${{totalX1}}" y1="${{OFFSET_Y - 30}}" x2="${{totalX1}}" y2="${{dimY2 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{totalX2}}" y1="${{OFFSET_Y - 30}}" x2="${{totalX2}}" y2="${{dimY2 - 5}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{totalX1 + 4}}" y1="${{dimY2}}" x2="${{totalX2 - 4}}" y2="${{dimY2}}" stroke="var(--cad-dim-line)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${{(totalX1 + totalX2) / 2}}" y="${{dimY2 - 8}}" font-size="13" font-weight="800" fill="var(--cad-dim-text)" text-anchor="middle">廠房總寬度 100.00 M (20 跨 × 5.00 M)</text>
        `;

        const dimX1 = OFFSET_X - 80;
        const dimX2 = OFFSET_X - 125;
        for (let j = 0; j < COLS_Y - 1; j++) {{
          const y1 = OFFSET_Y + j * BAY_SIZE_M * SCALE;
          const y2 = OFFSET_Y + (j + 1) * BAY_SIZE_M * SCALE;
          html += `
            <line x1="${{OFFSET_X - 30}}" y1="${{y1}}" x2="${{dimX1 - 5}}" y2="${{y1}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{OFFSET_X - 30}}" y1="${{y2}}" x2="${{dimX1 - 5}}" y2="${{y2}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
            <line x1="${{dimX1}}" y1="${{y1 + 4}}" x2="${{dimX1}}" y2="${{y2 - 4}}" stroke="var(--cad-dim-line)" stroke-width="1.2" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
            <text x="${{dimX1 - 8}}" y="${{(y1 + y2) / 2}}" font-size="10" font-weight="700" fill="var(--cad-dim-text)" text-anchor="end" dominant-baseline="central">5.00 m</text>
          `;
        }}

        const totalY1 = OFFSET_Y;
        const totalY2 = OFFSET_Y + (COLS_Y - 1) * BAY_SIZE_M * SCALE;
        html += `
          <line x1="${{OFFSET_X - 30}}" y1="${{totalY1}}" x2="${{dimX2 - 5}}" y2="${{totalY1}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{OFFSET_X - 30}}" y1="${{totalY2}}" x2="${{dimX2 - 5}}" y2="${{totalY2}}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${{dimX2}}" y1="${{totalY1 + 4}}" x2="${{dimX2}}" y2="${{totalY2 - 4}}" stroke="var(--cad-dim-line)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${{dimX2 - 10}}" y="${{(totalY1 + totalY2) / 2}}" font-size="13" font-weight="800" fill="var(--cad-dim-text)" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${{dimX2 - 10}} ${{(totalY1 + totalY2) / 2}})">廠房總深度 50.00 M (10 跨 × 5.00 M)</text>
        `;
      }}
      html += `</g>`;
    }}

    // 5. 2F MEZZANINE STRUCTURE LAYER
    if (layerState.mezzanine && (is2F || isOverlay)) {{
      const m2f = layoutData.mezzanine_2f;
      html += `<g id="layer2FMezzanine" opacity="${{isOverlay ? '0.78' : '1.0'}}">`;

      m2f.zones.forEach(z => {{
        const zx = OFFSET_X + z.x * SCALE;
        const zy = OFFSET_Y + z.y * SCALE;
        const zw = z.width * SCALE;
        const zh = z.height * SCALE;
        const pat = z.pattern === "hatch_diagonal" ? "url(#existingMezzHatch)" : "url(#mezzanineGrating)";
        const isSelected = selectedZoneId === z.id;

        html += `
          <g class="mezzanine-zone-group" data-zone-id="${{z.id}}" style="cursor: pointer;">
            <rect class="mezzanine-deck" x="${{zx}}" y="${{zy}}" width="${{zw}}" height="${{zh}}"
                  fill="${{pat}}" stroke="${{isSelected ? '#2563EB' : '#2B6CB0'}}" stroke-width="${{isSelected ? '3.5' : '2'}}" rx="2"/>
            
            <rect x="${{zx + zw / 2 - 80}}" y="${{zy + zh / 2 - 24}}" width="160" height="48" rx="6" fill="rgba(255,255,255,0.92)" stroke="#2B6CB0" stroke-width="1.2"/>
            <text x="${{zx + zw / 2}}" y="${{zy + zh / 2 - 10}}" font-size="11" font-weight="800" fill="#1E3A8A" text-anchor="middle">${{z.thai_name}} ${{z.name.split(' ')[0]}}</text>
            <text x="${{zx + zw / 2}}" y="${{zy + zh / 2 + 5}}" font-size="10" font-weight="800" fill="#DC2626" text-anchor="middle">[2] EL. +4.40M</text>
            <text x="${{zx + zw / 2}}" y="${{zy + zh / 2 + 18}}" font-size="9" font-weight="600" fill="#475569" text-anchor="middle">面積 ${{z.area_sqm}} m² (${{z.width}}m × ${{z.height}}m)</text>
          </g>
        `;
      }});

      if (layerState.handrails) {{
        html += `<g id="layerHandrails">`;
        m2f.handrails.forEach((hr) => {{
          const p1 = metersToSvg(hr.x1, hr.y1);
          const p2 = metersToSvg(hr.x2, hr.y2);
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

          html += `
            <line x1="${{p1.x}}" y1="${{p1.y}}" x2="${{p2.x}}" y2="${{p2.y}}" class="handrail-line-glow"/>
            <line x1="${{p1.x}}" y1="${{p1.y}}" x2="${{p2.x}}" y2="${{p2.y}}" class="handrail-line"/>
            <g transform="translate(${{mx}}, ${{my}}) rotate(${{angle < -90 || angle > 90 ? angle + 180 : angle}})">
              <rect x="-36" y="-18" width="72" height="15" rx="3" fill="#FEF3C7" stroke="#D97706" stroke-width="1"/>
              <text x="0" y="-8" font-size="8.5" font-weight="800" fill="#92400E" text-anchor="middle" dominant-baseline="central">HAND RAIL</text>
            </g>
          `;
        }});
        html += `</g>`;
      }}

      if (layerState.stairs) {{
        const vc = m2f.vertical_circulation;
        html += `<g id="layerVerticalCirculation">`;

        // Lift
        const lx = OFFSET_X + vc.lift.x * SCALE;
        const ly = OFFSET_Y + vc.lift.y * SCALE;
        const lw = vc.lift.width * SCALE;
        const lh = vc.lift.height * SCALE;
        html += `
          <g class="lift-block">
            <rect x="${{lx}}" y="${{ly}}" width="${{lw}}" height="${{lh}}" fill="#334155" stroke="#E2E8F0" stroke-width="2" rx="3"/>
            <line x1="${{lx}}" y1="${{ly}}" x2="${{lx + lw}}" y2="${{ly + lh}}" stroke="#94A3B8" stroke-width="1.2"/>
            <line x1="${{lx + lw}}" y1="${{ly}}" x2="${{lx}}" y2="${{ly + lh}}" stroke="#94A3B8" stroke-width="1.2"/>
            <rect x="${{lx + 4}}" y="${{ly + lh / 2 - 10}}" width="${{lw - 8}}" height="20" fill="rgba(15,23,42,0.85)" rx="3"/>
            <text x="${{lx + lw / 2}}" y="${{ly + lh / 2}}" font-size="10" font-weight="800" fill="#38BDF8" text-anchor="middle" dominant-baseline="central">LIFT 貨梯</text>
          </g>
        `;

        // Stair ST-01
        const sx = OFFSET_X + vc.stair.x * SCALE;
        const sy = OFFSET_Y + vc.stair.y * SCALE;
        const sw = vc.stair.width * SCALE;
        const sh = vc.stair.height * SCALE;
        const steps = 14;
        const stepH = sh / steps;
        
        html += `<g class="stair-block">`;
        html += `<rect x="${{sx}}" y="${{sy}}" width="${{sw}}" height="${{sh}}" fill="#F8FAFC" stroke="#475569" stroke-width="2" rx="2"/>`;
        for (let s = 1; s < steps; s++) {{
          html += `<line x1="${{sx}}" y1="${{sy + s * stepH}}" x2="${{sx + sw}}" y2="${{sy + s * stepH}}" stroke="#94A3B8" stroke-width="1"/>`;
        }}
        html += `
          <line x1="${{sx + sw / 2}}" y1="${{sy + sh - 8}}" x2="${{sx + sw / 2}}" y2="${{sy + 8}}" stroke="#2563EB" stroke-width="2" marker-end="url(#dimArrowStart)"/>
          <rect x="${{sx - 12}}" y="${{sy - 24}}" width="${{sw + 24}}" height="20" rx="3" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1"/>
          <text x="${{sx + sw / 2}}" y="${{sy - 13}}" font-size="8.5" font-weight="800" fill="#1D4ED8" text-anchor="middle" dominant-baseline="central">STAIR ST-01 (S-05)</text>
        `;
        html += `</g>`;

        // Ramp
        const rx = OFFSET_X + vc.ramp.x * SCALE;
        const ry = OFFSET_Y + vc.ramp.y * SCALE;
        const rw = vc.ramp.width * SCALE;
        const rh = vc.ramp.height * SCALE;
        html += `
          <g class="ramp-block">
            <rect x="${{rx}}" y="${{ry}}" width="${{rw}}" height="${{rh}}" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5" rx="2"/>
            <line x1="${{rx + rw / 2}}" y1="${{ry + 8}}" x2="${{rx + rw / 2}}" y2="${{ry + rh - 8}}" stroke="#D97706" stroke-width="1.5" marker-end="url(#dimArrowStart)"/>
            <text x="${{rx + rw / 2}}" y="${{ry + rh / 2}}" font-size="9" font-weight="700" fill="#B45309" text-anchor="middle" dominant-baseline="central">RAMP 緩坡</text>
          </g>
        `;

        html += `</g>`;
      }}

      // Void opening
      const vo = m2f.void_opening;
      const vx = OFFSET_X + vo.x * SCALE;
      const vy = OFFSET_Y + vo.y * SCALE;
      const vw = vo.width * SCALE;
      const vh = vo.height * SCALE;
      html += `
        <g id="layerVoidOpening">
          <rect x="${{vx}}" y="${{vy}}" width="${{vw}}" height="${{vh}}" fill="var(--bg-canvas)" stroke="#DC2626" stroke-width="2" stroke-dasharray="6,4"/>
          <line x1="${{vx}}" y1="${{vy}}" x2="${{vx + vw}}" y2="${{vy + vh}}" stroke="#DC2626" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.6"/>
          <line x1="${{vx + vw}}" y1="${{vy}}" x2="${{vx}}" y2="${{vy + vh}}" stroke="#DC2626" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.6"/>
          <rect x="${{vx + vw / 2 - 70}}" y="${{vy + vh / 2 - 12}}" width="140" height="24" rx="4" fill="#FEF2F2" stroke="#DC2626" stroke-width="1"/>
          <text x="${{vx + vw / 2}}" y="${{vy + vh / 2}}" font-size="10" font-weight="800" fill="#DC2626" text-anchor="middle" dominant-baseline="central">沖壓機挑空區 (VOID)</text>
        </g>
      `;

      html += `</g>`;
    }}

    // 6. EQUIPMENT LAYER (1F Machines & 2F Racks)
    html += `<g id="layerEquipment">`;

    if (is1F || isOverlay) {{
      const eq1List = layoutData.equipment || [];
      eq1List.forEach(eq => {{
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
          <g id="${{eq.id}}" class="svg-equipment-group ${{isSelected ? 'selected' : ''}}" 
             transform="rotate(${{rot}} ${{centerX}} ${{centerY}})"
             data-id="${{eq.id}}" data-floor="1F" opacity="${{opacity}}">
        `;

        if (layerState.clearance && !isOverlay) {{
          html += `<rect x="${{pos.x - clrPx}}" y="${{pos.y - clrPx}}" width="${{ew + clrPx * 2}}" height="${{eh + clrPx * 2}}" fill="${{color}}" fill-opacity="0.08" stroke="${{color}}" stroke-width="0.8" stroke-dasharray="3,3" rx="4"/>`;
        }}

        html += `
          <rect class="main-box" x="${{pos.x}}" y="${{pos.y}}" width="${{ew}}" height="${{eh}}" 
                fill="${{color}}" fill-opacity="${{isSelected ? '0.5' : '0.22'}}" 
                stroke="${{color}}" stroke-width="${{isSelected ? '3' : '1.8'}}" rx="3"/>
          <line x1="${{pos.x}}" y1="${{pos.y + 4}}" x2="${{pos.x + ew}}" y2="${{pos.y + 4}}" stroke="${{color}}" stroke-width="2"/>
        `;

        if (eh > 28) {{
          html += `
            <text x="${{centerX}}" y="${{centerY - 7}}" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${{eq.code}}</text>
            <text x="${{centerX}}" y="${{centerY + 7}}" font-size="9" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${{eq.name}}</text>
            <text x="${{centerX}}" y="${{centerY + 18}}" font-size="8" font-family="'JetBrains Mono', monospace" fill="var(--cad-dim-text)" text-anchor="middle">${{eq.width.toFixed(1)}}m × ${{eq.height.toFixed(1)}}m</text>
          `;
        }} else {{
          html += `<text x="${{centerX}}" y="${{centerY}}" font-size="9.5" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${{eq.code}} (${{eq.width.toFixed(1)}}x${{eq.height.toFixed(1)}}m)</text>`;
        }}

        if (isSelected) {{
          html += `
            <g class="selection-dims">
              <line x1="${{pos.x}}" y1="${{pos.y - 12}}" x2="${{pos.x + ew}}" y2="${{pos.y - 12}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${{centerX}}" y="${{pos.y - 16}}" font-size="10" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${{eq.width.toFixed(2)}} m</text>
              <line x1="${{pos.x + ew + 12}}" y1="${{pos.y}}" x2="${{pos.x + ew + 12}}" y2="${{pos.y + eh}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${{pos.x + ew + 18}}" y="${{centerY}}" font-size="10" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${{eq.height.toFixed(2)}} m</text>
            </g>
          `;
        }}

        html += `</g>`;
      }});
    }}

    // 2F Equipment
    if (is2F || isOverlay) {{
      const eq2List = layoutData.equipment_2f || [];
      eq2List.forEach(eq => {{
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
          <g id="${{eq.id}}" class="svg-equipment-group ${{isSelected ? 'selected' : ''}}" 
             transform="rotate(${{rot}} ${{centerX}} ${{centerY}})"
             data-id="${{eq.id}}" data-floor="2F">
        `;

        if (layerState.clearance) {{
          html += `<rect x="${{pos.x - clrPx}}" y="${{pos.y - clrPx}}" width="${{ew + clrPx * 2}}" height="${{eh + clrPx * 2}}" fill="${{color}}" fill-opacity="0.1" stroke="${{color}}" stroke-width="0.8" stroke-dasharray="3,3" rx="3"/>`;
        }}

        html += `
          <rect class="main-box" x="${{pos.x}}" y="${{pos.y}}" width="${{ew}}" height="${{eh}}" 
                fill="${{color}}" fill-opacity="${{isSelected ? '0.6' : '0.3'}}" 
                stroke="${{color}}" stroke-width="${{isSelected ? '3' : '1.8'}}" rx="3"/>
          <line x1="${{pos.x}}" y1="${{pos.y + 4}}" x2="${{pos.x + ew}}" y2="${{pos.y + 4}}" stroke="${{color}}" stroke-width="2"/>
          <text x="${{centerX}}" y="${{centerY - 6}}" font-size="10" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${{eq.code}}</text>
          <text x="${{centerX}}" y="${{centerY + 8}}" font-size="8.5" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${{eq.name}}</text>
        `;

        if (isSelected) {{
          html += `
            <g class="selection-dims">
              <line x1="${{pos.x}}" y1="${{pos.y - 10}}" x2="${{pos.x + ew}}" y2="${{pos.y - 10}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${{centerX}}" y="${{pos.y - 14}}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${{eq.width.toFixed(2)}} m</text>
              <line x1="${{pos.x + ew + 10}}" y1="${{pos.y}}" x2="${{pos.x + ew + 10}}" y2="${{pos.y + eh}}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${{pos.x + ew + 14}}" y="${{centerY}}" font-size="9" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${{eq.height.toFixed(2)}} m</text>
            </g>
          `;
        }}

        html += `</g>`;
      }});
    }}

    html += `</g>`;

    // 7. Title Block
    const tbW = 460;
    const tbH = 175;
    const tbX = OFFSET_X + TOTAL_W_M * SCALE - tbW;
    const tbY = OFFSET_Y + TOTAL_H_M * SCALE - tbH;

    html += `
      <g id="layerTitleBlock" transform="translate(${{tbX}}, ${{tbY}})">
        <rect width="${{tbW}}" height="${{tbH}}" fill="var(--bg-panel)" stroke="var(--cad-wall)" stroke-width="2" rx="4"/>
        <rect width="${{tbW}}" height="45" fill="#1E3A8A" rx="4"/>
        <rect y="40" width="${{tbW}}" height="5" fill="#1E3A8A"/>
        <text x="20" y="28" font-size="15" font-weight="800" fill="#FFFFFF">晉春橡膠科技 · 廠房平面配置工程圖</text>
        <line x1="0" y1="45" x2="${{tbW}}" y2="45" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="88" x2="${{tbW}}" y2="88" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="130" x2="${{tbW}}" y2="130" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="150" y1="45" x2="150" y2="${{tbH}}" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="310" y1="45" x2="310" y2="${{tbH}}" stroke="var(--border-cad)" stroke-width="1.2"/>

        <text x="15" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖名 / TITLE</text>
        <text x="15" y="78" font-size="11" fill="var(--text-main)" font-weight="800">1F生產設備與2F新建倉庫</text>
        <text x="165" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖號 / DWG NO.</text>
        <text x="165" y="78" font-size="11" fill="var(--text-main)" font-weight="800">CC-ENG-2026-003</text>
        <text x="325" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">版次 / REV</text>
        <text x="325" y="78" font-size="11" fill="var(--text-main)" font-weight="800">REV V1.6 (100M×50M)</text>

        <text x="15" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">繪製 / DESIGNER</text>
        <text x="15" y="120" font-size="11" fill="var(--text-main)" font-weight="800">Derek Yeh</text>
        <text x="165" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">標高 / ELEVATION</text>
        <text x="165" y="120" font-size="11" fill="#DC2626" font-weight="800">1F +0.6M / 2F +4.4M</text>
        <text x="325" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">日期 / DATE</text>
        <text x="325" y="120" font-size="11" fill="var(--text-main)" font-weight="800">2026/09/07</text>

        <text x="15" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">廠區規格 / SPEC</text>
        <text x="15" y="162" font-size="11" fill="#16A34A" font-weight="800">100M×50M · 立柱可動/刪</text>
        <text x="165" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">比例 / SCALE</text>
        <text x="165" y="162" font-size="11" fill="var(--text-main)" font-weight="800">1:150 (Metric)</text>
        <text x="325" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">狀態 / STATUS</text>
        <text x="325" y="162" font-size="11" fill="#16A34A" font-weight="800">APPROVED 正式版</text>
      </g>
    `;

    svgEl.innerHTML = html;
    attachSvgClickListeners();
  }}

  // --- Attach Event Listeners to SVG Interactive Elements ---
  function attachSvgClickListeners() {{
    svgEl.querySelectorAll(".svg-equipment-group").forEach(el => {{
      el.addEventListener("click", (e) => {{
        e.stopPropagation();
        const id = el.getAttribute("data-id");
        selectEquipment(id);
      }});
    }});

    svgEl.querySelectorAll(".mezzanine-zone-group").forEach(el => {{
      el.addEventListener("click", (e) => {{
        e.stopPropagation();
        const zid = el.getAttribute("data-zone-id");
        selectMezzanineZone(zid);
      }});
    }});

    svgEl.addEventListener("click", (e) => {{
      if (e.target.tagName === "rect" && e.target.getAttribute("fill") === "var(--bg-canvas)") {{
        deselectAll();
      }}
    }});
  }}

  function deselectAll() {{
    selectedEquipmentId = null;
    selectedZoneId = null;
    inspectorEmptyState.style.display = "block";
    inspectorContent.style.display = "none";
    selectionBadge.textContent = "未選取";
    selectionBadge.classList.remove("active");
    renderSvg();
  }}

  // --- Populate Equipment Library ---
  function populateLibrary() {{
    const container = document.getElementById("libraryContainer");
    if (!container) return;

    const categories = {{
      "建築結構構件": [
        {{ code: "COL-500", name: "標準混凝土柱 (500×500)", w: 0.5, h: 0.5, cat: "Column", col: "#334155" }},
        {{ code: "COL-600", name: "重載鋼構柱 (600×600)", w: 0.6, h: 0.6, cat: "Column", col: "#1E293B" }}
      ],
      "貼合與原料加工 (ADH)": [
        {{ code: "M1-1", name: "ADH 1 (貼合機主機 M1-1)", w: 9.5, h: 2.2, cat: "ADH", col: "#2B6CB0" }},
        {{ code: "M2-1", name: "ADH 2 (貼合機主機 M2-1)", w: 9.5, h: 2.2, cat: "ADH", col: "#2B6CB0" }},
        {{ code: "N1-1", name: "DC (集塵設備/DC)", w: 3.2, h: 3.8, cat: "ADH", col: "#4A90E2" }},
        {{ code: "F1-1", name: "Foam (發泡原料存放區)", w: 14.5, h: 4.8, cat: "Material", col: "#319795" }},
        {{ code: "A1-1", name: "EVA 1 (EVA 原料暫存 1)", w: 18.0, h: 4.8, cat: "Material", col: "#319795" }}
      ],
      "裁切與精密切斷 (Cutting)": [
        {{ code: "T Cut 1", name: "T Cut 1 (裁切機 1)", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" }},
        {{ code: "T Cut 2", name: "T Cut 2 (裁切機 2)", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" }},
        {{ code: "C1-1", name: "PF 1 精密切斷機", w: 18.5, h: 3.8, cat: "Cutting", col: "#D69E2E" }},
        {{ code: "C1-2", name: "PF 2 精密切斷機", w: 7.5, h: 3.5, cat: "Cutting", col: "#D69E2E" }},
        {{ code: "J1-1", name: "V Cut 2 (V型裁斷機)", w: 4.5, h: 4.6, cat: "Cutting", col: "#F5A623" }},
        {{ code: "J1-3", name: "V Cut 3 (V型裁斷機)", w: 4.5, h: 4.5, cat: "Cutting", col: "#F5A623" }},
        {{ code: "L4-1", name: "Die Cut 模切機", w: 4.2, h: 4.0, cat: "Cutting", col: "#ECC94B" }}
      ],
      "品檢包裝與自動化": [
        {{ code: "B1-1", name: "QC 1 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" }},
        {{ code: "B1-2", name: "QC 2 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" }},
        {{ code: "B1-3", name: "QC 3 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" }},
        {{ code: "B1-4", name: "QC 4 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" }},
        {{ code: "G2-1", name: "AF 1 自動化設備", w: 2.4, h: 5.5, cat: "Automation", col: "#4A90E2" }}
      ],
      "公用與倉儲物流": [
        {{ code: "Lift 1", name: "貨梯 (北側貨梯)", w: 4.8, h: 4.5, cat: "Utility", col: "#718096" }},
        {{ code: "Office", name: "廠務辦公室", w: 11.5, h: 10.5, cat: "Office", col: "#CBD5E0" }},
        {{ code: "PL", name: "標準暫存棧板排", w: 10.0, h: 3.0, cat: "Storage", col: "#2F855A" }}
      ]
    }};

    let html = "";
    for (const [groupTitle, items] of Object.entries(categories)) {{
      html += `
        <div class="lib-group">
          <div class="lib-group-title">${{groupTitle}}</div>
          <div class="lib-item-grid">
      `;
      items.forEach(item => {{
        html += `
          <div class="lib-item" data-code="${{item.code}}" data-name="${{item.name}}" data-w="${{item.w}}" data-h="${{item.h}}" data-cat="${{item.cat}}" data-col="${{item.col}}">
            <div class="lib-item-info">
              <span class="lib-item-name">${{item.name}}</span>
              <span class="lib-item-dim">${{item.w}}m × ${{item.h}}m</span>
            </div>
            <span class="lib-badge" style="border-color: ${{item.col}}; color: ${{item.col}}">${{item.code}}</span>
          </div>
        `;
      }});
      html += `</div></div>`;
    }}
    container.innerHTML = html;

    container.querySelectorAll(".lib-item").forEach(itemEl => {{
      itemEl.addEventListener("click", () => {{
        const code = itemEl.getAttribute("data-code");
        const name = itemEl.getAttribute("data-name");
        const w = parseFloat(itemEl.getAttribute("data-w"));
        const h = parseFloat(itemEl.getAttribute("data-h"));
        const cat = itemEl.getAttribute("data-cat");
        const col = itemEl.getAttribute("data-col");

        const centerSvg = {{
          x: viewBox.x + viewBox.width / 2,
          y: viewBox.y + viewBox.height / 2
        }};
        const centerM = svgToMeters(centerSvg.x, centerSvg.y);
        const snappedX = snapValue(centerM.x - w / 2, currentSnapM);
        const snappedY = snapValue(centerM.y - h / 2, currentSnapM);

        const targetFloor = currentFloor === "2F" ? "2F" : "1F";
        const newObj = {{
          id: `${{cat === 'Column' ? 'col' : 'eq'}}_${{Date.now()}}`,
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
        }};

        if (cat === "Column") {{
          if (!layoutData.columns) layoutData.columns = [];
          layoutData.columns.push(newObj);
        }} else if (targetFloor === "2F") {{
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newObj);
        }} else {{
          if (!layoutData.equipment) layoutData.equipment = [];
          layoutData.equipment.push(newObj);
        }}

        selectEquipment(newObj.id);
        renderSvg();
      }});
    }});

    document.getElementById("libSearch").addEventListener("input", (e) => {{
      const q = e.target.value.toLowerCase().trim();
      container.querySelectorAll(".lib-item").forEach(el => {{
        const txt = el.textContent.toLowerCase();
        el.style.display = txt.includes(q) ? "flex" : "none";
      }});
    }});
  }}

  // --- Equipment Selection & Inspector ---
  function selectEquipment(id) {{
    selectedEquipmentId = id;
    selectedZoneId = null;

    let eq = findItemById(id);

    if (!eq) {{
      inspectorEmptyState.style.display = "block";
      inspectorContent.style.display = "none";
      selectionBadge.textContent = "未選取";
      selectionBadge.classList.remove("active");
      renderSvg();
      return;
    }}

    inspectorEmptyState.style.display = "none";
    inspectorContent.style.display = "flex";
    selectionBadge.textContent = `${{eq.floor || '1F'}} · ${{eq.code}}`;
    selectionBadge.classList.add("active");

    propName.value = eq.name;
    propCode.value = eq.code;
    propZone.value = eq.category === "Column" ? "1F · 結構立柱 (可移動/刪除)" : `${{eq.floor || '1F'}} · ${{eq.zone || eq.category}}`;
    propWidth.value = eq.width.toFixed(2);
    propHeight.value = eq.height.toFixed(2);
    propX.value = eq.x.toFixed(2);
    propY.value = eq.y.toFixed(2);
    rotationAngleDisplay.textContent = `${{eq.rotation || 0}}°`;

    const area = (eq.width * eq.height).toFixed(2);
    propArea.textContent = area;
    propMm.textContent = `${{Math.round(eq.width * 1000)}} × ${{Math.round(eq.height * 1000)}} mm`;

    updateClearanceReadouts(eq);
    renderSvg();
  }}

  function selectMezzanineZone(zoneId) {{
    selectedZoneId = zoneId;
    selectedEquipmentId = null;

    const z = layoutData.mezzanine_2f.zones.find(item => item.id === zoneId);
    if (!z) return;

    inspectorEmptyState.style.display = "none";
    inspectorContent.style.display = "flex";
    selectionBadge.textContent = `2F 夾層 · ${{z.name.split(' ')[0]}}`;
    selectionBadge.classList.add("active");

    propName.value = `${{z.thai_name}} (${{z.name}})`;
    propCode.value = "MEZZ-2F";
    propZone.value = "二樓倉庫夾層 (EL. +4.40M)";
    propWidth.value = z.width.toFixed(2);
    propHeight.value = z.height.toFixed(2);
    propX.value = z.x.toFixed(2);
    propY.value = z.y.toFixed(2);
    rotationAngleDisplay.textContent = "0°";
    propArea.textContent = z.area_sqm.toFixed(2);
    propMm.textContent = `${{Math.round(z.width * 1000)}} × ${{Math.round(z.height * 1000)}} mm`;

    distToCol.textContent = "立柱結構對齊";
    distToAisle.textContent = "護欄周邊安全動線";

    renderSvg();
  }}

  function updateClearanceReadouts(eq) {{
    if (!eq) return;
    const is2Feq = eq.floor === "2F";

    let minDistCol = 999.0;
    if (is2Feq) {{
      const mezzX = layoutData.mezzanine_2f.grid_x.coords;
      const mezzY = layoutData.mezzanine_2f.grid_y.coords;
      for (const cx of mezzX) {{
        for (const cy of mezzY) {{
          const dx = Math.max(eq.x - cx, 0, cx - (eq.x + eq.width));
          const dy = Math.max(eq.y - cy, 0, cy - (eq.y + eq.height));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDistCol) minDistCol = d;
        }}
      }}
    }} else {{
      for (const c of (layoutData.columns || [])) {{
        if (c.id === eq.id) continue;
        const dx = Math.max(eq.x - c.x, 0, c.x - (eq.x + eq.width));
        const dy = Math.max(eq.y - c.y, 0, c.y - (eq.y + eq.height));
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDistCol) minDistCol = d;
      }}
    }}
    distToCol.textContent = minDistCol < 990 ? `${{minDistCol.toFixed(2)}} 公尺` : "-- m";

    if (is2Feq) {{
      distToAisle.textContent = "夾層倉儲動線 (依護欄邊界)";
    }} else {{
      const aisleTop = 42.0;
      const aisleBottom = 45.5;
      let distAisle = 0;
      if (eq.y + eq.height < aisleTop) {{
        distAisle = aisleTop - (eq.y + eq.height);
      }} else if (eq.y > aisleBottom) {{
        distAisle = eq.y - aisleBottom;
      }} else {{
        distAisle = 0.0;
      }}
      distToAisle.textContent = distAisle === 0 ? "已切入主幹道 (注意動線)" : `${{distAisle.toFixed(2)}} 公尺`;
    }}
  }}

  // --- View Navigation & Zoom ---
  function updateViewBox() {{
    svgEl.setAttribute("viewBox", `${{viewBox.x}} ${{viewBox.y}} ${{viewBox.width}} ${{viewBox.height}}`);
  }}

  function fitToScreen() {{
    const vpW = viewportEl.clientWidth;
    const vpH = viewportEl.clientHeight;
    if (!vpW || !vpH) return;

    const aspectVp = vpW / vpH;
    let targetW = SVG_WIDTH;
    let targetH = SVG_HEIGHT;

    if (currentFloor === "2F") {{
      const mezzX = layoutData.mezzanine_2f.grid_x.total_width * SCALE;
      const mezzY = layoutData.mezzanine_2f.grid_y.total_depth * SCALE;
      targetW = mezzX + OFFSET_X + 220;
      targetH = mezzY + OFFSET_Y + 180;
      viewBox.x = 0;
      viewBox.y = 0;
      viewBox.width = targetW;
      viewBox.height = targetH;
    }} else {{
      const aspectContent = targetW / targetH;
      if (aspectVp > aspectContent) {{
        viewBox.height = targetH;
        viewBox.width = targetH * aspectVp;
        viewBox.x = (targetW - viewBox.width) / 2;
        viewBox.y = 0;
      }} else {{
        viewBox.width = targetW;
        viewBox.height = targetW / aspectVp;
        viewBox.x = 0;
        viewBox.y = (targetH - viewBox.height) / 2;
      }}
    }}
    updateViewBox();
  }}

  // --- Floor Switching Controller ---
  function switchFloor(targetFloor) {{
    currentFloor = targetFloor;

    [btnFloor1F, btnFloor2F, btnFloorOverlay].forEach(btn => {{
      if (!btn) return;
      btn.classList.toggle("active", btn.getAttribute("data-floor") === targetFloor);
    }});

    if (targetFloor === "1F") {{
      floorIndicatorEl.textContent = "1F 主廠房 (EL.+0.60M)";
      floorIndicatorEl.style.color = "#2563EB";
      gridBayInfoEl.textContent = "5.00 m 柱距 · 立柱可自由移動/刪除";
      mezzanineStatsEl.innerHTML = "廠房總跨度: <strong>100.0 M × 50.0 M</strong>";
    }} else if (targetFloor === "2F") {{
      floorIndicatorEl.textContent = "2F 倉庫夾層 (EL.+4.40M)";
      floorIndicatorEl.style.color = "#4F46E5";
      gridBayInfoEl.textContent = "1~8 軸 5.00m · A~G 軸 4.75m 柱距";
      mezzanineStatsEl.innerHTML = "2F夾層面積: <strong style='color:#16A34A'>380.0 m²</strong> (Zone A/B/既有)";
    }} else {{
      floorIndicatorEl.textContent = "1F+2F 雙層透視疊加";
      floorIndicatorEl.style.color = "#D97706";
      gridBayInfoEl.textContent = "雙層結構對齊基準";
      mezzanineStatsEl.innerHTML = "夾層投影面積: <strong>380.0 m²</strong>";
    }}

    deselectAll();
    fitToScreen();
    renderSvg();
  }}

  // --- Event Bindings ---
  function bindEvents() {{
    if (btnFloor1F) btnFloor1F.addEventListener("click", () => switchFloor("1F"));
    if (btnFloor2F) btnFloor2F.addEventListener("click", () => switchFloor("2F"));
    if (btnFloorOverlay) btnFloorOverlay.addEventListener("click", () => switchFloor("OVERLAY"));

    snapSelect.addEventListener("change", (e) => {{
      currentSnapM = parseFloat(e.target.value);
    }});

    document.querySelectorAll(".layer-toggles input[type='checkbox']").forEach(chk => {{
      chk.addEventListener("change", (e) => {{
        const layer = e.target.closest("label").getAttribute("data-layer");
        layerState[layer] = e.target.checked;
        e.target.closest("label").classList.toggle("active", e.target.checked);
        renderSvg();
      }});
    }});

    const themeBtn = document.getElementById("themeToggleBtn");
    const themeLabel = document.getElementById("themeLabel");
    themeBtn.addEventListener("click", () => {{
      const isDark = document.body.classList.toggle("theme-cad-dark");
      document.body.classList.toggle("theme-cad-light", !isDark);
      themeLabel.textContent = isDark ? "淺色工程圖" : "深色藍圖";
      renderSvg();
    }});

    // Canvas Pan & Drag
    viewportEl.addEventListener("mousemove", (e) => {{
      const svgPt = clientToSvgCoords(e.clientX, e.clientY);
      const mPt = svgToMeters(svgPt.x, svgPt.y);

      cursorXEl.textContent = Math.max(0, mPt.x).toFixed(2);
      cursorYEl.textContent = Math.max(0, mPt.y).toFixed(2);

      if (currentFloor === "2F") {{
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;
        const colIdx = Math.max(0, Math.min(mezzX.names.length - 1, Math.round(mPt.x / mezzX.bay_size)));
        const rowIdx = Math.max(0, Math.min(mezzY.names.length - 1, Math.round(mPt.y / mezzY.bay_size)));
        nearestColEl.textContent = `柱軸 ${{mezzX.names[colIdx]}} - ${{mezzY.names[rowIdx]}}`;
      }} else {{
        const colXIdx = Math.max(0, Math.min(COLS_X - 1, Math.round(mPt.x / BAY_SIZE_M)));
        const colYIdx = Math.max(0, Math.min(COLS_Y - 1, Math.round(mPt.y / BAY_SIZE_M)));
        nearestColEl.textContent = `X${{colXIdx + 1}} - Y${{colYIdx + 1}}`;
      }}

      if (isDragging && selectedEquipmentId) {{
        let item = findItemById(selectedEquipmentId);
        if (!item) return;

        const rawX = mPt.x - dragOffset.x;
        const rawY = mPt.y - dragOffset.y;

        item.x = Math.max(0, snapValue(rawX, currentSnapM));
        item.y = Math.max(0, snapValue(rawY, currentSnapM));

        propX.value = item.x.toFixed(2);
        propY.value = item.y.toFixed(2);

        updateClearanceReadouts(item);
        renderSvg();
      }}

      if (isPanning) {{
        const dx = (e.clientX - panStart.x) * (viewBox.width / viewportEl.clientWidth);
        const dy = (e.clientY - panStart.y) * (viewBox.height / viewportEl.clientHeight);
        viewBox.x -= dx;
        viewBox.y -= dy;
        panStart = {{ x: e.clientX, y: e.clientY }};
        updateViewBox();
      }}
    }});

    viewportEl.addEventListener("mousedown", (e) => {{
      const eqGroup = e.target.closest(".svg-equipment-group");
      if (eqGroup && e.button === 0) {{
        const id = eqGroup.getAttribute("data-id");
        selectEquipment(id);
        
        let item = findItemById(id);
        if (item) {{
          isDragging = true;
          const svgPt = clientToSvgCoords(e.clientX, e.clientY);
          const mPt = svgToMeters(svgPt.x, svgPt.y);
          dragOffset = {{ x: mPt.x - item.x, y: mPt.y - item.y }};
          eqGroup.classList.add("dragging");
        }}
        return;
      }}

      if (e.button === 1 || (!eqGroup && (e.button === 0 || e.ctrlKey))) {{
        isPanning = true;
        panStart = {{ x: e.clientX, y: e.clientY }};
        viewportEl.style.cursor = "grabbing";
      }}
    }});

    window.addEventListener("mouseup", () => {{
      isDragging = false;
      isPanning = false;
      viewportEl.style.cursor = "default";
      document.querySelectorAll(".svg-equipment-group.dragging").forEach(el => el.classList.remove("dragging"));
    }});

    viewportEl.addEventListener("wheel", (e) => {{
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
    }}, {{ passive: false }});

    document.getElementById("zoomInBtn").addEventListener("click", () => {{
      const cx = viewBox.x + viewBox.width / 2;
      const cy = viewBox.y + viewBox.height / 2;
      viewBox.width *= 0.8;
      viewBox.height *= 0.8;
      viewBox.x = cx - viewBox.width / 2;
      viewBox.y = cy - viewBox.height / 2;
      updateViewBox();
    }});

    document.getElementById("zoomOutBtn").addEventListener("click", () => {{
      const cx = viewBox.x + viewBox.width / 2;
      const cy = viewBox.y + viewBox.height / 2;
      viewBox.width *= 1.25;
      viewBox.height *= 1.25;
      viewBox.x = cx - viewBox.width / 2;
      viewBox.y = cy - viewBox.height / 2;
      updateViewBox();
    }});

    document.getElementById("zoomResetBtn").addEventListener("click", fitToScreen);
    document.getElementById("fitScreenBtn").addEventListener("click", fitToScreen);

    [propName, propCode, propWidth, propHeight, propX, propY].forEach(input => {{
      input.addEventListener("input", () => {{
        if (!selectedEquipmentId) return;
        let item = findItemById(selectedEquipmentId);
        if (!item) return;

        item.name = propName.value;
        item.code = propCode.value;
        item.width = Math.max(0.2, parseFloat(propWidth.value) || 0.2);
        item.height = Math.max(0.2, parseFloat(propHeight.value) || 0.2);
        item.x = parseFloat(propX.value) || 0;
        item.y = parseFloat(propY.value) || 0;

        propArea.textContent = (item.width * item.height).toFixed(2);
        propMm.textContent = `${{Math.round(item.width * 1000)}} × ${{Math.round(item.height * 1000)}} mm`;

        updateClearanceReadouts(item);
        renderSvg();
      }});
    }});

    document.getElementById("rotateLeftBtn").addEventListener("click", () => rotateSelected(-90));
    document.getElementById("rotateRightBtn").addEventListener("click", () => rotateSelected(90));

    window.addEventListener("keydown", (e) => {{
      if (e.target.tagName === "INPUT") return;
      if (e.key === "r" || e.key === "R") {{
        rotateSelected(90);
      }} else if (e.key === "Delete" || e.key === "Backspace") {{
        deleteSelected();
      }} else if (e.key === "1") {{
        switchFloor("1F");
      }} else if (e.key === "2") {{
        switchFloor("2F");
      }} else if (e.key === "3") {{
        switchFloor("OVERLAY");
      }}
    }});

    document.getElementById("duplicateBtn").addEventListener("click", () => {{
      if (!selectedEquipmentId) return;
      let item = findItemById(selectedEquipmentId);
      if (!item) return;

      const isCol = item.category === "Column";
      const is2Feq = item.floor === "2F";
      const cloned = JSON.parse(JSON.stringify(item));
      cloned.id = `${{isCol ? 'col' : 'eq'}}_${{Date.now()}}`;
      cloned.code = `${{item.code}}-COPY`;
      cloned.x += 1.0;
      cloned.y += 1.0;

      if (isCol) {{
        layoutData.columns.push(cloned);
      }} else if (is2Feq) {{
        layoutData.equipment_2f.push(cloned);
      }} else {{
        layoutData.equipment.push(cloned);
      }}

      selectEquipment(cloned.id);
      renderSvg();
    }});

    document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

    document.getElementById("exportDxfBtn").addEventListener("click", generateAndDownloadDxf);
    document.getElementById("exportSvgBtn").addEventListener("click", () => {{
      const blob = new Blob([svgEl.outerHTML], {{ type: "image/svg+xml" }});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chin_chun_factory_layout_${{currentFloor}}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }});
  }}

  function rotateSelected(delta) {{
    if (!selectedEquipmentId) return;
    let item = findItemById(selectedEquipmentId);
    if (!item) return;

    item.rotation = ((item.rotation || 0) + delta + 360) % 360;
    rotationAngleDisplay.textContent = `${{item.rotation}}°`;
    renderSvg();
  }}

  function deleteSelected() {{
    if (!selectedEquipmentId) return;
    let idx = (layoutData.equipment || []).findIndex(item => item.id === selectedEquipmentId);
    if (idx !== -1) {{
      layoutData.equipment.splice(idx, 1);
    }} else if (layoutData.equipment_2f) {{
      idx = layoutData.equipment_2f.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.equipment_2f.splice(idx, 1);
    }} else if (layoutData.columns) {{
      idx = layoutData.columns.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.columns.splice(idx, 1);
    }}
    deselectAll();
  }}

  // --- Dynamic DXF Generation in Browser (with 2F Mezzanine Layers) ---
  function generateAndDownloadDxf() {{
    const bayMm = BAY_SIZE_M * 1000;
    const dxf = [];

    dxf.push("0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "9", "$INSUNITS", "70", "4", "0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "13");
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
    allEq.forEach(eq => {{
      const blkName = `BLK_${{eq.id.toUpperCase()}}`;
      const wMm = eq.width * 1000;
      const hMm = eq.height * 1000;
      const layer = eq.floor === "2F" ? "12_2F_RACKS" : "05_EQUIPMENT_1F";
      dxf.push(
        "0", "BLOCK", "2", blkName, "70", "0", "10", "0.0", "20", "0.0", "30", "0.0", "3", blkName,
        "0", "POLYLINE", "8", layer, "66", "1", "70", "1",
        "0", "VERTEX", "8", layer, "10", "0.0", "20", "0.0", "30", "0.0",
        "0", "VERTEX", "8", layer, "10", `${{wMm}}`, "20", "0.0", "30", "0.0",
        "0", "VERTEX", "8", layer, "10", `${{wMm}}`, "20", `${{hMm}}`, "30", "0.0",
        "0", "VERTEX", "8", layer, "10", "0.0", "20", `${{hMm}}`, "30", "0.0",
        "0", "SEQEND",
        "0", "TEXT", "8", "07_TEXT", "10", `${{wMm / 2}}`, "20", `${{hMm / 2}}`, "30", "0.0", "40", "250.0", "1", eq.code,
        "72", "1", "11", `${{wMm / 2}}`, "21", `${{hMm / 2}}`, "31", "0.0",
        "0", "ENDBLK"
      );
    }});

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

    for (let i = 0; i < COLS_X; i++) {{
      const xm = i * bayMm;
      dxf.push(
        "0", "LINE", "8", "01_GRID_AXIS", "10", `${{xm}}`, "20", "-3000.0", "30", "0.0", "11", `${{xm}}`, "21", "68000.0", "31", "0.0",
        "0", "CIRCLE", "8", "01_GRID_AXIS", "10", `${{xm}}`, "20", "-4000.0", "30", "0.0", "40", "800.0",
        "0", "TEXT", "8", "07_TEXT", "10", `${{xm}}`, "20", "-4000.0", "30", "0.0", "40", "500.0", "1", `X${{i+1}}`,
        "72", "1", "11", `${{xm}}`, "21", "-4000.0", "31", "0.0"
      );
    }}
    for (let j = 0; j < COLS_Y; j++) {{
      const ym = j * bayMm;
      const xMax = (COLS_X - 1) * bayMm + 3000;
      dxf.push(
        "0", "LINE", "8", "01_GRID_AXIS", "10", "-3000.0", "20", `${{ym}}`, "30", "0.0", "11", `${{xMax}}`, "21", `${{ym}}`, "31", "0.0",
        "0", "CIRCLE", "8", "01_GRID_AXIS", "10", "-4000.0", "20", `${{ym}}`, "30", "0.0", "40", "800.0",
        "0", "TEXT", "8", "07_TEXT", "10", "-4000.0", "20", `${{ym}}`, "30", "0.0", "40", "500.0", "1", `Y${{j+1}}`,
        "72", "1", "11", "-4000.0", "21", `${{ym}}`, "31", "0.0"
      );
    }}

    // Export interactive columns (only active columns)
    (layoutData.columns || []).forEach(col => {{
      dxf.push("0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", `${{col.x * 1000}}`, "20", `${{col.y * 1000}}`, "30", "0.0");
    }});

    // Export double-line walls
    (layoutData.walls || []).forEach(w => {{
      const poly = getWallPolygon(w);
      dxf.push(
        "0", "LINE", "8", "03_WALLS", "10", `${{w.x1 * 1000}}`, "20", `${{w.y1 * 1000}}`, "30", "0.0",
        "11", `${{w.x2 * 1000}}`, "21", `${{w.y2 * 1000}}`, "31", "0.0"
      );
    }});

    const m2f = layoutData.mezzanine_2f;
    m2f.zones.forEach(z => {{
      const x1 = z.x * 1000;
      const y1 = z.y * 1000;
      const x2 = (z.x + z.width) * 1000;
      const y2 = (z.y + z.height) * 1000;
      dxf.push(
        "0", "POLYLINE", "8", "09_2F_MEZZANINE", "66", "1", "70", "1",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${{x1}}`, "20", `${{y1}}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${{x2}}`, "20", `${{y1}}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${{x2}}`, "20", `${{y2}}`, "30", "0.0",
        "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", `${{x1}}`, "20", `${{y2}}`, "30", "0.0",
        "0", "SEQEND",
        "0", "TEXT", "8", "07_TEXT", "10", `${{(x1 + x2) / 2}}`, "20", `${{(y1 + y2) / 2}}`, "30", "0.0", "40", "400.0", "1", `${{z.name}} (+4.40M)`,
        "72", "1", "11", `${{(x1 + x2) / 2}}`, "21", `${{(y1 + y2) / 2}}`, "31", "0.0"
      );
    }});

    m2f.handrails.forEach(hr => {{
      dxf.push(
        "0", "LINE", "8", "10_2F_HANDRAIL", "10", `${{hr.x1 * 1000}}`, "20", `${{hr.y1 * 1000}}`, "30", "0.0",
        "11", `${{hr.x2 * 1000}}`, "21", `${{hr.y2 * 1000}}`, "31", "0.0"
      );
    }});

    allEq.forEach(eq => {{
      const blkName = `BLK_${{eq.id.toUpperCase()}}`;
      const rot = eq.rotation || 0;
      const layer = eq.floor === "2F" ? "12_2F_RACKS" : "05_EQUIPMENT_1F";
      dxf.push(
        "0", "INSERT", "8", layer, "2", blkName,
        "10", `${{eq.x * 1000}}`, "20", `${{eq.y * 1000}}`, "30", "0.0",
        "50", `${{rot}}`
      );
    }});

    dxf.push("0", "ENDSEC", "0", "EOF");

    const blob = new Blob([dxf.join("\\n")], {{ type: "application/dxf" }});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chin_chun_factory_layout_2F.dxf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }}

  window.addEventListener("DOMContentLoaded", init);
}})();
"""

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_template)
    print("Generated app.js with interactive columns successfully!")

if __name__ == '__main__':
    generate_engine()
