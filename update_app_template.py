code = r'''/**
 * CHIN CHUN FACTORY LAYOUT - INTERACTIVE MULTI-FLOOR CAD & CIRCULATION ENGINE
 * Modular Equipment Planner, Architectural Components, Circulation Routes, and 2F Warehouse Mezzanine
 */

(function () {
  // --- Global Constants & Scale ---
  const BAY_SIZE_M = 5.0; // 5.0 meters per column bay (X-axis)
  const COLS_X = 21;      // X1 to X21 (100.0m total width)
  const COLS_Y = 11;      // Y1 to Y11 (50.0m base depth)
  const COL_SIZE_M = 0.5; // 500mm concrete column

  const SCALE = 24.0;     // 24 SVG pixels per meter
  const OFFSET_X = 260;   // Left margin for Y-axis bubbles & dims
  const OFFSET_Y = 220;   // Top margin for X-axis bubbles & dims
  const TOTAL_W_M = (COLS_X - 1) * BAY_SIZE_M; // 100.0m
  const TOTAL_H_M = 70.0; // 70.0m total height including south CNC area

  const SVG_WIDTH = Math.round(TOTAL_W_M * SCALE + OFFSET_X + 280);
  const SVG_HEIGHT = Math.round(TOTAL_H_M * SCALE + OFFSET_Y + 160);

  // --- Initial Factory Baseline Data ---
  const INITIAL_LAYOUT = __INITIAL_LAYOUT_JSON__;

  // --- State Variables ---
  let layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
  let currentFloor = "1F"; // "1F" | "2F" | "OVERLAY"
  let selectedId = null;
  let selectedItemType = null; // 'equipment' | 'column' | 'wall' | 'aisle' | 'zone' | 'flow'
  
  // Dragging & Editing state
  let isDragging = false;
  let dragMode = "translate"; // 'translate' | 'wall-p1' | 'wall-p2' | 'flow-point'
  let dragPointIndex = -1;
  let dragOffset = { x: 0, y: 0 };
  let dragStartM = { x: 0, y: 0 };
  let currentSnapM = 0.5; // default 0.5m snap

  // Flow Route Drawing Tool state
  let isDrawingRoute = false;
  let activeRoutePoints = [];
  let currentHoverM = { x: 0, y: 0 };

  // Zoom & Pan state
  let viewBox = { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  // Layer visibility state
  const layerState = {
    grid: true,
    walls: true,
    flows: true,
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

  // Route & Wall Buttons
  const btnDrawRoute = document.getElementById("btnDrawRoute");
  const btnAddWall = document.getElementById("btnAddWall");

  // Inspector Elements
  const inspectorPanel = document.getElementById("inspectorPanel");
  const inspectorEmptyState = document.getElementById("inspectorEmptyState");
  const inspectorContent = document.getElementById("inspectorContent");
  const selectionBadge = document.getElementById("selectionBadge");

  // General Inspector Fields
  const propName = document.getElementById("propName");
  const propCode = document.getElementById("propCode");
  const propZone = document.getElementById("propZone");
  const lblPropName = document.getElementById("lblPropName");
  const lblPropCode = document.getElementById("lblPropCode");

  // Standard Dimension & Coordinate Cards
  const cardStandardDims = document.getElementById("cardStandardDims");
  const cardStandardCoords = document.getElementById("cardStandardCoords");
  const propWidth = document.getElementById("propWidth");
  const propHeight = document.getElementById("propHeight");
  const propArea = document.getElementById("propArea");
  const propMm = document.getElementById("propMm");
  const propX = document.getElementById("propX");
  const propY = document.getElementById("propY");
  const propRotationGroup = document.getElementById("propRotationGroup");
  const rotationAngleDisplay = document.getElementById("rotationAngleDisplay");

  // Wall Specific Card
  const cardWallProps = document.getElementById("cardWallProps");
  const propWallX1 = document.getElementById("propWallX1");
  const propWallY1 = document.getElementById("propWallY1");
  const propWallX2 = document.getElementById("propWallX2");
  const propWallY2 = document.getElementById("propWallY2");
  const propWallThickness = document.getElementById("propWallThickness");
  const propWallLength = document.getElementById("propWallLength");

  // Flow Route Specific Card
  const cardFlowProps = document.getElementById("cardFlowProps");
  const propFlowType = document.getElementById("propFlowType");
  const propFlowWidth = document.getElementById("propFlowWidth");
  const propFlowArrow = document.getElementById("propFlowArrow");
  const propFlowWaypoints = document.getElementById("propFlowWaypoints");
  const propFlowTotalLen = document.getElementById("propFlowTotalLen");

  // Clearance Card
  const cardClearance = document.getElementById("cardClearance");
  const distToCol = document.getElementById("distToCol");
  const distToAisle = document.getElementById("distToAisle");

  // Universal Entity Finder: returns { item, type, collection }
  function findItemRecord(id) {
    if (!id) return null;
    // 1. equipment (1F)
    let item = (layoutData.equipment || []).find(e => e.id === id);
    if (item) return { item, type: item.category === 'Column' ? 'column' : 'equipment', collection: layoutData.equipment };
    // 2. equipment_2f
    if (layoutData.equipment_2f) {
      item = layoutData.equipment_2f.find(e => e.id === id);
      if (item) return { item, type: 'equipment', collection: layoutData.equipment_2f };
    }
    // 3. columns
    if (layoutData.columns) {
      item = layoutData.columns.find(e => e.id === id);
      if (item) return { item, type: 'column', collection: layoutData.columns };
    }
    // 4. walls
    if (layoutData.walls) {
      item = layoutData.walls.find(w => w.id === id);
      if (item) return { item, type: 'wall', collection: layoutData.walls };
    }
    // 5. aisles
    if (layoutData.aisles) {
      item = layoutData.aisles.find(a => a.id === id);
      if (item) return { item, type: 'aisle', collection: layoutData.aisles };
    }
    // 6. 2F mezzanine zones
    if (layoutData.mezzanine_2f && layoutData.mezzanine_2f.zones) {
      item = layoutData.mezzanine_2f.zones.find(z => z.id === id);
      if (item) return { item, type: 'zone', collection: layoutData.mezzanine_2f.zones };
    }
    // 7. flows
    if (layoutData.flows) {
      item = layoutData.flows.find(f => f.id === id);
      if (item) return { item, type: 'flow', collection: layoutData.flows };
    }
    return null;
  }

  function findItemById(id) {
    const rec = findItemRecord(id);
    return rec ? rec.item : null;
  }

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

  // Helper: calculate 4-vertex polygon for double-line wall
  function getWallPolygon(w) {
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
    return {
      points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`,
      c1: metersToSvg(w.x1, w.y1),
      c2: metersToSvg(w.x2, w.y2),
      lenM: len
    };
  }

  // Helper: calculate polyline path string from point array
  function getPolylinePathD(points) {
    if (!points || points.length === 0) return "";
    let d = `M ${metersToSvg(points[0].x, points[0].y).x} ${metersToSvg(points[0].x, points[0].y).y}`;
    for (let i = 1; i < points.length; i++) {
      const pt = metersToSvg(points[i].x, points[i].y);
      d += ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }

  function calculatePolylineLength(points) {
    if (!points || points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    }
    return total;
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
        <!-- Dimension Arrows -->
        <marker id="dimArrowStart" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 10 2 L 0 5 L 10 8 Z" fill="currentColor"/>
        </marker>
        <marker id="dimArrowEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 10 5 L 0 8 Z" fill="currentColor"/>
        </marker>

        <!-- Flow Directional Markers -->
        <marker id="flowArrowForklift" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 2 2 L 10 6 L 2 10 Z" fill="#F59E0B"/>
        </marker>
        <marker id="flowArrowPedestrian" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 2 2 L 10 6 L 2 10 Z" fill="#10B981"/>
        </marker>
        <marker id="flowArrowProcess" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 2 2 L 10 6 L 2 10 Z" fill="#3B82F6"/>
        </marker>
        <marker id="flowArrowEvacuation" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 2 2 L 10 6 L 2 10 Z" fill="#EF4444"/>
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

    // 1. Aisles Layer (1F) - 可點選、移動、微調尺寸與刪除之色塊走道
    if (layerState.aisles && (is1F || isOverlay)) {
      html += `<g id="layerAisles" opacity="${isOverlay ? '0.4' : '1.0'}">`;
      (layoutData.aisles || []).forEach(a => {
        const ax = OFFSET_X + a.x * SCALE;
        const ay = OFFSET_Y + a.y * SCALE;
        const aw = a.width * SCALE;
        const ah = a.height * SCALE;
        const isSelected = a.id === selectedId;

        html += `
          <g id="${a.id}" class="svg-aisle-group svg-interactive-item ${isSelected ? 'selected' : ''}" data-id="${a.id}">
            <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#aisleHatch)"
                  stroke="${isSelected ? 'var(--cad-selection)' : '#D69E2E'}"
                  stroke-width="${isSelected ? '3.5' : '1.5'}"
                  stroke-dasharray="${isSelected ? 'none' : '6,4'}" rx="3"/>
            <text x="${ax + aw / 2}" y="${ay + ah / 2}" font-size="11" font-weight="700" fill="${isSelected ? 'var(--cad-selection)' : '#B7791F'}" text-anchor="middle" dominant-baseline="central">${a.name}</text>
        `;

        if (isSelected) {
          html += `
            <g class="selection-dims">
              <line x1="${ax}" y1="${ay - 10}" x2="${ax + aw}" y2="${ay - 10}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${ax + aw / 2}" y="${ay - 14}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${a.width.toFixed(2)} m</text>
              <line x1="${ax + aw + 10}" y1="${ay}" x2="${ax + aw + 10}" y2="${ay + ah}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${ax + aw + 14}" y="${ay + ah / 2}" font-size="9" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${a.height.toFixed(2)} m</text>
            </g>
          `;
        }

        html += `</g>`;
      });
      html += `</g>`;
    }

    // 2. Double-line Architectural Walls Layer (可選取、移動、調整端點與厚度、刪除之實體雙線牆)
    if (layerState.walls) {
      html += `<g id="layerWalls" opacity="${is2F ? '0.35' : (isOverlay ? '0.55' : '1.0')}">`;
      (layoutData.walls || []).forEach(w => {
        const poly = getWallPolygon(w);
        if (!poly) return;
        const isSelected = w.id === selectedId;

        html += `
          <g id="${w.id}" class="svg-wall-group svg-interactive-item ${isSelected ? 'selected' : ''}" data-id="${w.id}">
            <polygon points="${poly.points}" class="wall-double-poly" stroke-linejoin="round"/>
            <line x1="${poly.c1.x}" y1="${poly.c1.y}" x2="${poly.c2.x}" y2="${poly.c2.y}" class="wall-centerline"/>
        `;

        if (isSelected) {
          html += `
            <!-- Wall Endpoint Handles (P1 & P2) -->
            <circle cx="${poly.c1.x}" cy="${poly.c1.y}" r="6" class="wall-endpoint-handle" data-handle="p1" data-wall-id="${w.id}"/>
            <circle cx="${poly.c2.x}" cy="${poly.c2.y}" r="6" class="wall-endpoint-handle" data-handle="p2" data-wall-id="${w.id}"/>
            <text x="${(poly.c1.x + poly.c2.x) / 2}" y="${(poly.c1.y + poly.c2.y) / 2 - 10}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">L=${poly.lenM.toFixed(2)}m (T=${(w.thickness || 0.3).toFixed(2)}m)</text>
          `;
        }

        html += `</g>`;
      });
      html += `</g>`;
    }

    // 3. Grid Axis Lines & Columns Layer
    if (layerState.grid) {
      html += `<g id="layerGrid">`;
      
      if (is2F) {
        // --- 2F Specific Grid (Cols 1~8 at 5.0m, Rows A~G at 4.75m) ---
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

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

        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < mezzX.coords.length; i++) {
          for (let j = 0; j < mezzY.coords.length; j++) {
            const cx = OFFSET_X + mezzX.coords[i] * SCALE - colPx / 2;
            const cy = OFFSET_Y + mezzY.coords[j] * SCALE - colPx / 2;
            html += `<rect x="${cx}" y="${cy}" width="${colPx}" height="${colPx}" fill="#334155" stroke="#1E293B" stroke-width="1.5" rx="2"/>`;
          }
        }

      } else {
        // --- 1F / OVERLAY Grid Axes (X1~X21, Y1~Y11) ---
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

        // --- Interactive Movable & Deletable 1F Columns ---
        (layoutData.columns || []).forEach(col => {
          const cw = (col.width || COL_SIZE_M) * SCALE;
          const ch = (col.height || COL_SIZE_M) * SCALE;
          const cx = OFFSET_X + col.x * SCALE - cw / 2;
          const cy = OFFSET_Y + col.y * SCALE - ch / 2;
          const isSelected = col.id === selectedId;

          html += `
            <g id="${col.id}" class="svg-column-group svg-equipment-group svg-interactive-item ${isSelected ? 'selected' : ''}"
               data-id="${col.id}" data-floor="1F" style="cursor: move;">
              <rect class="column-box main-box" x="${cx}" y="${cy}" width="${cw}" height="${ch}"
                    fill="${isSelected ? 'var(--cad-selection)' : (col.color || '#334155')}"
                    stroke="${isSelected ? '#1D4ED8' : 'var(--cad-wall)'}"
                    stroke-width="${isSelected ? '2.5' : '1.2'}" rx="2"/>
              <line x1="${cx}" y1="${cy}" x2="${cx + cw}" y2="${cy + ch}" stroke="${isSelected ? '#FFFFFF' : '#94A3B8'}" stroke-width="0.8" stroke-opacity="0.6"/>
              <line x1="${cx + cw}" y1="${cy}" x2="${cx}" y2="${cy + ch}" stroke="${isSelected ? '#FFFFFF' : '#94A3B8'}" stroke-width="0.8" stroke-opacity="0.6"/>
              <text x="${cx + cw / 2}" y="${cy - 4}" class="col-tag" text-anchor="middle">${col.code}</text>
          `;

          if (isSelected) {
            html += `
              <g class="selection-dims">
                <line x1="${cx}" y1="${cy - 10}" x2="${cx + cw}" y2="${cy - 10}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
                <text x="${cx + cw / 2}" y="${cy - 14}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${col.width.toFixed(2)} m</text>
                <line x1="${cx + cw + 10}" y1="${cy}" x2="${cx + cw + 10}" y2="${cy + ch}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
                <text x="${cx + cw + 14}" y="${cy + ch / 2}" font-size="9" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${col.height.toFixed(2)} m</text>
              </g>
            `;
          }

          html += `</g>`;
        });
      }
      html += `</g>`;
    }

    // 4. Dimensions Chains Layer
    if (layerState.dims) {
      html += `<g id="layerDimensions">`;
      if (is2F) {
        const dimY1 = OFFSET_Y - 80;
        const dimY2 = OFFSET_Y - 130;
        const mezzX = layoutData.mezzanine_2f.grid_x;
        const mezzY = layoutData.mezzanine_2f.grid_y;

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

        const totalX1 = OFFSET_X;
        const totalX2 = OFFSET_X + mezzX.total_width * SCALE;
        html += `
          <line x1="${totalX1}" y1="${OFFSET_Y - 30}" x2="${totalX1}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX2}" y1="${OFFSET_Y - 30}" x2="${totalX2}" y2="${dimY2 - 5}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${totalX1 + 4}" y1="${dimY2}" x2="${totalX2 - 4}" y2="${dimY2}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${(totalX1 + totalX2) / 2}" y="${dimY2 - 8}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="middle">二樓倉庫總面寬 35.00 M (1~8 軸 · 7 跨 × 5.00 M)</text>
        `;

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

        const totalY1 = OFFSET_Y;
        const totalY2 = OFFSET_Y + mezzY.total_depth * SCALE;
        html += `
          <line x1="${OFFSET_X - 30}" y1="${totalY1}" x2="${dimX2 - 5}" y2="${totalY1}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${OFFSET_X - 30}" y1="${totalY2}" x2="${dimX2 - 5}" y2="${totalY2}" stroke="var(--text-muted)" stroke-width="0.8" stroke-dasharray="2,2"/>
          <line x1="${dimX2}" y1="${totalY1 + 4}" x2="${dimX2}" y2="${totalY2 - 4}" stroke="#4F46E5" stroke-width="1.6" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${dimX2 - 10}" y="${(totalY1 + totalY2) / 2}" font-size="12" font-weight="800" fill="#4F46E5" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">倉庫總縱深 28.50 M (A~G 軸 · 6 跨 × 4.75 M)</text>
        `;

      } else {
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
          <text x="${dimX2 - 10}" y="${(totalY1 + totalY2) / 2}" font-size="13" font-weight="800" fill="var(--cad-dim-text)" text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">廠房總深度 50.00 M (10 跨 × 5.00 M)</text>
        `;
      }
      html += `</g>`;
    }

    // 5. 2F MEZZANINE STRUCTURE LAYER
    if (layerState.mezzanine && (is2F || isOverlay)) {
      const m2f = layoutData.mezzanine_2f;
      html += `<g id="layer2FMezzanine" opacity="${isOverlay ? '0.78' : '1.0'}">`;

      m2f.zones.forEach(z => {
        const zx = OFFSET_X + z.x * SCALE;
        const zy = OFFSET_Y + z.y * SCALE;
        const zw = z.width * SCALE;
        const zh = z.height * SCALE;
        const pat = z.pattern === "hatch_diagonal" ? "url(#existingMezzHatch)" : "url(#mezzanineGrating)";
        const isSelected = selectedId === z.id;

        html += `
          <g class="mezzanine-zone-group svg-interactive-item ${isSelected ? 'selected' : ''}" data-id="${z.id}" style="cursor: move;">
            <rect class="mezzanine-deck" x="${zx}" y="${zy}" width="${zw}" height="${zh}"
                  fill="${pat}" stroke="${isSelected ? 'var(--cad-selection)' : '#2B6CB0'}" stroke-width="${isSelected ? '3.5' : '2'}" rx="2"/>
            
            <rect x="${zx + zw / 2 - 80}" y="${zy + zh / 2 - 24}" width="160" height="48" rx="6" fill="rgba(255,255,255,0.92)" stroke="#2B6CB0" stroke-width="1.2"/>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 - 10}" font-size="11" font-weight="800" fill="#1E3A8A" text-anchor="middle">${z.thai_name} ${z.name.split(' ')[0]}</text>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 + 5}" font-size="10" font-weight="800" fill="#DC2626" text-anchor="middle">[2] EL. +4.40M</text>
            <text x="${zx + zw / 2}" y="${zy + zh / 2 + 18}" font-size="9" font-weight="600" fill="#475569" text-anchor="middle">面積 ${z.area_sqm} m² (${z.width}m × ${z.height}m)</text>
        `;

        if (isSelected) {
          html += `
            <g class="selection-dims">
              <line x1="${zx}" y1="${zy - 10}" x2="${zx + zw}" y2="${zy - 10}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${zx + zw / 2}" y="${zy - 14}" font-size="9" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${z.width.toFixed(2)} m</text>
              <line x1="${zx + zw + 10}" y1="${zy}" x2="${zx + zw + 10}" y2="${zy + zh}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
              <text x="${zx + zw + 14}" y="${zy + zh / 2}" font-size="9" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${z.height.toFixed(2)} m</text>
            </g>
          `;
        }

        html += `</g>`;
      });

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

      if (layerState.stairs) {
        const vc = m2f.vertical_circulation;
        html += `<g id="layerVerticalCirculation">`;

        // Lift
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

        // Stair ST-01
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

        // Ramp
        const rx = OFFSET_X + vc.ramp.x * SCALE;
        const ry = OFFSET_Y + vc.ramp.y * SCALE;
        const rw = vc.ramp.width * SCALE;
        const rh = vc.ramp.height * SCALE;
        html += `
          <g class="ramp-block">
            <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5" rx="2"/>
            <line x1="${rx + rw / 2}" y1="${ry + 8}" x2="${rx + rw / 2}" y2="${ry + rh - 8}" stroke="#D97706" stroke-width="1.5" marker-end="url(#dimArrowStart)"/>
            <text x="${rx + rw / 2}" y="${ry + rh / 2}" font-size="9" font-weight="700" fill="#B45309" text-anchor="middle" dominant-baseline="central">RAMP 緩坡</text>
          </g>
        `;

        html += `</g>`;
      }

      // Void opening
      const vo = m2f.void_opening;
      const vx = OFFSET_X + vo.x * SCALE;
      const vy = OFFSET_Y + vo.y * SCALE;
      const vw = vo.width * SCALE;
      const vh = vo.height * SCALE;
      html += `
        <g id="layerVoidOpening">
          <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="var(--bg-canvas)" stroke="#DC2626" stroke-width="2" stroke-dasharray="6,4"/>
          <line x1="${vx}" y1="${vy}" x2="${vx + vw}" y2="${vy + vh}" stroke="#DC2626" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.6"/>
          <line x1="${vx + vw}" y1="${vy}" x2="${vx}" y2="${vy + vh}" stroke="#DC2626" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.6"/>
          <rect x="${vx + vw / 2 - 70}" y="${vy + vh / 2 - 12}" width="140" height="24" rx="4" fill="#FEF2F2" stroke="#DC2626" stroke-width="1"/>
          <text x="${vx + vw / 2}" y="${vy + vh / 2}" font-size="10" font-weight="800" fill="#DC2626" text-anchor="middle" dominant-baseline="central">沖壓機挑空區 (VOID)</text>
        </g>
      `;

      html += `</g>`;
    }

    // 6. Interactive Circulation Flow Planning Layer (動線規劃層)
    if (layerState.flows) {
      html += `<g id="layerFlows">`;
      (layoutData.flows || []).forEach(f => {
        const isSelected = f.id === selectedId;
        const d = getPolylinePathD(f.points);
        if (!d) return;

        let markerEnd = "";
        let markerStart = "";
        const arrowMarkerId = f.type === "forklift" ? "flowArrowForklift" :
                              f.type === "pedestrian" ? "flowArrowPedestrian" :
                              f.type === "process" ? "flowArrowProcess" : "flowArrowEvacuation";

        if (f.arrow_direction === "forward" || f.arrow_direction === "both") {
          markerEnd = `url(#${arrowMarkerId})`;
        }
        if (f.arrow_direction === "backward" || f.arrow_direction === "both") {
          markerStart = `url(#${arrowMarkerId})`;
        }

        const strokeCol = f.color || "#F59E0B";
        const strokeW = Math.max(3, (f.width_m || 2.0) * SCALE * 0.35);

        html += `
          <g id="${f.id}" class="svg-flow-group svg-interactive-item ${isSelected ? 'selected' : ''}" data-id="${f.id}">
            <!-- Invisible Wide Hit Area for easy clicking/dragging -->
            <path d="${d}" class="flow-hit-area"/>
            <!-- Semi-transparent corridor ground band -->
            <path d="${d}" stroke="${strokeCol}" stroke-width="${strokeW}" stroke-opacity="0.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- Animated centerline route with directional arrows -->
            <path d="${d}" class="flow-line-main flow-line-animated"
                  stroke="${strokeCol}" stroke-width="${isSelected ? '3.5' : '2.2'}"
                  stroke-dasharray="${f.dash || '8,4'}" fill="none"
                  marker-start="${markerStart}" marker-end="${markerEnd}"
                  stroke-linecap="round" stroke-linejoin="round"/>
        `;

        // Midpoint label
        if (f.points && f.points.length >= 2) {
          const midIdx = Math.floor(f.points.length / 2);
          const pMid = metersToSvg(f.points[midIdx].x, f.points[midIdx].y);
          html += `
            <rect x="${pMid.x - 45}" y="${pMid.y - 10}" width="90" height="20" rx="3" fill="var(--bg-panel)" stroke="${strokeCol}" stroke-width="1" fill-opacity="0.95"/>
            <text x="${pMid.x}" y="${pMid.y}" font-size="8.5" font-weight="700" fill="${strokeCol}" text-anchor="middle" dominant-baseline="central">${f.name.split(' ')[0]}</text>
          `;
        }

        // Draggable waypoint handles when selected
        if (isSelected && f.points) {
          f.points.forEach((pt, idx) => {
            const svgPt = metersToSvg(pt.x, pt.y);
            html += `
              <circle cx="${svgPt.x}" cy="${svgPt.y}" r="6" class="flow-waypoint-handle"
                      data-flow-id="${f.id}" data-point-index="${idx}"/>
            `;
          });
        }

        html += `</g>`;
      });

      // Active drawing preview route
      if (isDrawingRoute && activeRoutePoints.length > 0) {
        const previewPts = [...activeRoutePoints, currentHoverM];
        const prevD = getPolylinePathD(previewPts);
        html += `
          <g id="flowDrawingPreview">
            <path d="${prevD}" stroke="#DC2626" stroke-width="3" stroke-dasharray="6,4" fill="none"/>
        `;
        previewPts.forEach(pt => {
          const spt = metersToSvg(pt.x, pt.y);
          html += `<circle cx="${spt.x}" cy="${spt.y}" r="5" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>`;
        });
        html += `</g>`;
      }

      html += `</g>`;
    }

    // 7. EQUIPMENT, FURNITURE, DOORS & WINDOWS LAYER
    html += `<g id="layerEquipment">`;

    // 1F Equipment & Components
    if (is1F || isOverlay) {
      const eq1List = layoutData.equipment || [];
      eq1List.forEach(eq => {
        html += renderSingleItemSvg(eq, "1F", isOverlay ? "0.38" : "1.0");
      });
    }

    // 2F Equipment & Components
    if (is2F || isOverlay) {
      const eq2List = layoutData.equipment_2f || [];
      eq2List.forEach(eq => {
        html += renderSingleItemSvg(eq, "2F", "1.0");
      });
    }

    html += `</g>`;

    // 8. Title Block
    const tbW = 460;
    const tbH = 175;
    const tbX = OFFSET_X + TOTAL_W_M * SCALE - tbW;
    const tbY = OFFSET_Y + TOTAL_H_M * SCALE - tbH;

    html += `
      <g id="layerTitleBlock" transform="translate(${tbX}, ${tbY})">
        <rect width="${tbW}" height="${tbH}" fill="var(--bg-panel)" stroke="var(--cad-wall)" stroke-width="2" rx="4"/>
        <rect width="${tbW}" height="45" fill="#1E3A8A" rx="4"/>
        <rect y="40" width="${tbW}" height="5" fill="#1E3A8A"/>
        <text x="20" y="28" font-size="15" font-weight="800" fill="#FFFFFF">金讚科技 · 廠房平面配置工程圖</text>
        <line x1="0" y1="45" x2="${tbW}" y2="45" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="88" x2="${tbW}" y2="88" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="130" x2="${tbW}" y2="130" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="150" y1="45" x2="150" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="310" y1="45" x2="310" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1.2"/>

        <text x="15" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖名 / TITLE</text>
        <text x="15" y="78" font-size="11" fill="var(--text-main)" font-weight="800">1F生產動線、建築元件與2F倉庫</text>
        <text x="165" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖號 / DWG NO.</text>
        <text x="165" y="78" font-size="11" fill="var(--text-main)" font-weight="800">CC-ENG-2026-004</text>
        <text x="325" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">版次 / REV</text>
        <text x="325" y="78" font-size="11" fill="var(--text-main)" font-weight="800">REV V2.0 (100M×50M)</text>

        <text x="15" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">繪製 / DESIGNER</text>
        <text x="15" y="120" font-size="11" fill="var(--text-main)" font-weight="800">Derek Yeh</text>
        <text x="165" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">標高 / ELEVATION</text>
        <text x="165" y="120" font-size="11" fill="#DC2626" font-weight="800">1F +0.6M / 2F +4.4M</text>
        <text x="325" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">日期 / DATE</text>
        <text x="325" y="120" font-size="11" fill="var(--text-main)" font-weight="800">2026/09/07</text>

        <text x="15" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">規格 / SPEC</text>
        <text x="15" y="162" font-size="11" fill="#16A34A" font-weight="800">100M×50M · 牆體/動線/元件</text>
        <text x="165" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">比例 / SCALE</text>
        <text x="165" y="162" font-size="11" fill="var(--text-main)" font-weight="800">1:150 (Metric)</text>
        <text x="325" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">狀態 / STATUS</text>
        <text x="325" y="162" font-size="11" fill="#16A34A" font-weight="800">APPROVED 正式版</text>
      </g>
    `;

    svgEl.innerHTML = html;
    attachSvgClickListeners();
  }

  // --- Specialized Architectural Component SVG Renderer ---
  function renderSingleItemSvg(eq, floor, opacity) {
    const pos = metersToSvg(eq.x, eq.y);
    const ew = eq.width * SCALE;
    const eh = eq.height * SCALE;
    const color = eq.color || "#4A90E2";
    const isSelected = eq.id === selectedId;
    const clrPx = 0.5 * SCALE;
    const rot = eq.rotation || 0;
    const centerX = pos.x + ew / 2;
    const centerY = pos.y + eh / 2;
    const cat = eq.category || "General";

    let itemHtml = `
      <g id="${eq.id}" class="svg-equipment-group svg-interactive-item ${isSelected ? 'selected' : ''}" 
         transform="rotate(${rot} ${centerX} ${centerY})"
         data-id="${eq.id}" data-floor="${floor}" opacity="${opacity}">
    `;

    // Clearance buffer
    if (layerState.clearance && opacity === "1.0" && cat !== "Door" && cat !== "Window") {
      itemHtml += `<rect x="${pos.x - clrPx}" y="${pos.y - clrPx}" width="${ew + clrPx * 2}" height="${eh + clrPx * 2}" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="0.8" stroke-dasharray="3,3" rx="4"/>`;
    }

    if (cat === "Door") {
      // Architectural Door (門片與 90° 開啟擺動弧線)
      itemHtml += `
        <rect x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="none" stroke="#2563EB" stroke-width="1.2"/>
        <path d="M ${pos.x} ${pos.y + eh} A ${ew} ${ew} 0 0 1 ${pos.x + ew} ${pos.y}" class="door-swing-arc"/>
        <line x1="${pos.x}" y1="${pos.y + eh}" x2="${pos.x}" y2="${pos.y}" class="door-leaf-line"/>
        <rect x="${pos.x - 3}" y="${pos.y - 3}" width="6" height="6" class="door-frame"/>
        <rect x="${pos.x + ew - 3}" y="${pos.y - 3}" width="6" height="6" class="door-frame"/>
        <text x="${centerX}" y="${centerY - 4}" font-size="8.5" font-weight="700" fill="#1D4ED8" text-anchor="middle">${eq.code}</text>
      `;
    } else if (cat === "Window") {
      // Architectural Window (雙實線與中線玻璃)
      itemHtml += `
        <rect x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.8"/>
        <line x1="${pos.x}" y1="${pos.y + eh / 2}" x2="${pos.x + ew}" y2="${pos.y + eh / 2}" class="window-glass"/>
        <text x="${centerX}" y="${centerY}" font-size="8" font-weight="700" fill="#0369A1" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
      `;
    } else if (cat === "Stairs") {
      // Vertical Circulation: Stairs (踏階與箭頭)
      const steps = Math.max(6, Math.round(eh / 6));
      const stepH = eh / steps;
      itemHtml += `
        <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#F8FAFC" stroke="#475569" stroke-width="1.8" rx="2"/>
      `;
      for (let s = 1; s < steps; s++) {
        itemHtml += `<line x1="${pos.x}" y1="${pos.y + s * stepH}" x2="${pos.x + ew}" y2="${pos.y + s * stepH}" class="stair-tread-line"/>`;
      }
      itemHtml += `
        <line x1="${centerX}" y1="${pos.y + eh - 6}" x2="${centerX}" y2="${pos.y + 6}" stroke="#2563EB" stroke-width="2" marker-end="url(#dimArrowStart)"/>
        <text x="${centerX}" y="${centerY - 6}" font-size="9" font-weight="800" fill="#1E3A8A" text-anchor="middle">${eq.code}</text>
      `;
    } else if (cat === "Elevator") {
      // Heavy Goods Lift or Passenger Elevator
      itemHtml += `
        <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#1E293B" stroke="#94A3B8" stroke-width="2" rx="3"/>
        <line x1="${pos.x}" y1="${pos.y}" x2="${pos.x + ew}" y2="${pos.y + eh}" stroke="#64748B" stroke-width="1.2"/>
        <line x1="${pos.x + ew}" y1="${pos.y}" x2="${pos.x}" y2="${pos.y + eh}" stroke="#64748B" stroke-width="1.2"/>
        <rect x="${pos.x + 4}" y="${centerY - 10}" width="${ew - 8}" height="20" fill="rgba(15,23,42,0.9)" rx="3"/>
        <text x="${centerX}" y="${centerY}" font-size="9.5" font-weight="800" fill="#38BDF8" text-anchor="middle" dominant-baseline="central">${eq.code} (${eq.name.split(' ')[0]})</text>
      `;
    } else if (cat === "Furniture") {
      // Office furniture, Desks, Conference Tables
      itemHtml += `
        <rect class="main-box furniture-contour" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" rx="4"/>
        <rect x="${pos.x + 4}" y="${pos.y + 4}" width="${ew - 8}" height="${eh - 8}" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1" rx="2"/>
        <text x="${centerX}" y="${centerY - 4}" font-size="9" font-weight="700" fill="#334155" text-anchor="middle">${eq.code}</text>
        <text x="${centerX}" y="${centerY + 8}" font-size="7.5" fill="#64748B" text-anchor="middle">${eq.name.split(' ')[0]}</text>
      `;
    } else if (cat === "Sanitary") {
      // Sanitary / WC fixtures
      itemHtml += `
        <rect class="main-box sanitary-fixture-body" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" rx="4"/>
        <ellipse cx="${centerX}" cy="${centerY}" rx="${ew * 0.35}" ry="${eh * 0.35}" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.2"/>
        <text x="${centerX}" y="${centerY}" font-size="8.5" font-weight="800" fill="#0369A1" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
      `;
    } else {
      // Standard Production Machine / Workstation
      itemHtml += `
        <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" 
              fill="${color}" fill-opacity="${isSelected ? '0.55' : '0.25'}" 
              stroke="${color}" stroke-width="${isSelected ? '3' : '1.8'}" rx="3"/>
        <line x1="${pos.x}" y1="${pos.y + 4}" x2="${pos.x + ew}" y2="${pos.y + 4}" stroke="${color}" stroke-width="2"/>
      `;

      if (eh > 28) {
        itemHtml += `
          <text x="${centerX}" y="${centerY - 7}" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 7}" font-size="9" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${eq.name}</text>
          <text x="${centerX}" y="${centerY + 18}" font-size="8" font-family="'JetBrains Mono', monospace" fill="var(--cad-dim-text)" text-anchor="middle">${eq.width.toFixed(1)}m × ${eq.height.toFixed(1)}m</text>
        `;
      } else {
        itemHtml += `<text x="${centerX}" y="${centerY}" font-size="9.5" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code} (${eq.width.toFixed(1)}x${eq.height.toFixed(1)}m)</text>`;
      }
    }

    // Selection dimensions
    if (isSelected) {
      itemHtml += `
        <g class="selection-dims">
          <line x1="${pos.x}" y1="${pos.y - 12}" x2="${pos.x + ew}" y2="${pos.y - 12}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${centerX}" y="${pos.y - 16}" font-size="10" font-weight="700" fill="var(--cad-selection)" text-anchor="middle">${eq.width.toFixed(2)} m</text>
          <line x1="${pos.x + ew + 12}" y1="${pos.y}" x2="${pos.x + ew + 12}" y2="${pos.y + eh}" stroke="var(--cad-selection)" stroke-width="1.5" marker-start="url(#dimArrowStart)" marker-end="url(#dimArrowEnd)"/>
          <text x="${pos.x + ew + 18}" y="${centerY}" font-size="10" font-weight="700" fill="var(--cad-selection)" dominant-baseline="central">${eq.height.toFixed(2)} m</text>
        </g>
      `;
    }

    itemHtml += `</g>`;
    return itemHtml;
  }

  // --- Attach Event Listeners to SVG Elements ---
  function attachSvgClickListeners() {
    svgEl.querySelectorAll(".svg-interactive-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (isDrawingRoute) return;
        e.stopPropagation();
        const id = el.getAttribute("data-id");
        selectItem(id);
      });
    });

    svgEl.addEventListener("click", (e) => {
      if (isDrawingRoute) {
        const svgPt = clientToSvgCoords(e.clientX, e.clientY);
        const mPt = svgToMeters(svgPt.x, svgPt.y);
        const snapX = snapValue(mPt.x, currentSnapM);
        const snapY = snapValue(mPt.y, currentSnapM);
        activeRoutePoints.push({ x: snapX, y: snapY });
        renderSvg();
        return;
      }

      if (e.target.tagName === "rect" && e.target.getAttribute("fill") === "var(--bg-canvas)") {
        deselectAll();
      }
    });

    svgEl.addEventListener("dblclick", (e) => {
      if (isDrawingRoute) {
        e.preventDefault();
        finishDrawingRoute();
      }
    });
  }

  // --- Deselect All ---
  function deselectAll() {
    selectedId = null;
    selectedItemType = null;
    inspectorEmptyState.style.display = "block";
    inspectorContent.style.display = "none";
    selectionBadge.textContent = "未選取";
    selectionBadge.classList.remove("active");
    renderSvg();
  }

  // --- Universal Item Selection & Inspector Update ---
  function selectItem(id) {
    selectedId = id;
    const rec = findItemRecord(id);

    if (!rec) {
      deselectAll();
      return;
    }

    selectedItemType = rec.type;
    const item = rec.item;

    inspectorEmptyState.style.display = "none";
    inspectorContent.style.display = "flex";

    // Configure card visibility based on item type
    if (rec.type === "wall") {
      selectionBadge.textContent = `🧱 雙線牆 · ${item.id}`;
      selectionBadge.classList.add("active");

      propName.value = item.description || "建築隔間實體牆";
      propCode.value = item.type === "exterior" ? "外牆 (Exterior)" : "隔間牆 (Interior)";
      propZone.value = "1F · 建築隔間雙線牆 (可調整/刪除)";

      cardStandardDims.style.display = "none";
      cardStandardCoords.style.display = "none";
      cardFlowProps.style.display = "none";
      cardWallProps.style.display = "block";
      cardClearance.style.display = "none";

      propWallX1.value = item.x1.toFixed(2);
      propWallY1.value = item.y1.toFixed(2);
      propWallX2.value = item.x2.toFixed(2);
      propWallY2.value = item.y2.toFixed(2);
      propWallThickness.value = (item.thickness || 0.3).toFixed(2);
      propWallLength.textContent = Math.hypot(item.x2 - item.x1, item.y2 - item.y1).toFixed(2);

    } else if (rec.type === "flow") {
      selectionBadge.textContent = `📍 動線 · ${item.name.split(' ')[0]}`;
      selectionBadge.classList.add("active");

      propName.value = item.name;
      propCode.value = item.type.toUpperCase();
      propZone.value = "廠區規劃動線 (可拖曳節點/刪除)";

      cardStandardDims.style.display = "none";
      cardStandardCoords.style.display = "none";
      cardWallProps.style.display = "none";
      cardFlowProps.style.display = "block";
      cardClearance.style.display = "none";

      propFlowType.value = item.type;
      propFlowWidth.value = (item.width_m || 2.0).toFixed(1);
      propFlowArrow.value = item.arrow_direction || "both";
      propFlowWaypoints.textContent = item.points ? item.points.length : 0;
      propFlowTotalLen.textContent = calculatePolylineLength(item.points).toFixed(2);

    } else if (rec.type === "aisle") {
      selectionBadge.textContent = `🟩 走道色塊 · ${item.name}`;
      selectionBadge.classList.add("active");

      propName.value = item.name;
      propCode.value = "AISLE";
      propZone.value = "1F · 主物流通道 (可移動/刪除)";

      cardWallProps.style.display = "none";
      cardFlowProps.style.display = "none";
      cardStandardDims.style.display = "block";
      cardStandardCoords.style.display = "block";
      propRotationGroup.style.display = "none";
      cardClearance.style.display = "none";

      propWidth.value = item.width.toFixed(2);
      propHeight.value = item.height.toFixed(2);
      propX.value = item.x.toFixed(2);
      propY.value = item.y.toFixed(2);
      propArea.textContent = (item.width * item.height).toFixed(2);
      propMm.textContent = `${Math.round(item.width * 1000)} × ${Math.round(item.height * 1000)} mm`;

    } else if (rec.type === "zone") {
      selectionBadge.textContent = `2F 夾層 · ${item.name.split(' ')[0]}`;
      selectionBadge.classList.add("active");

      propName.value = `${item.thai_name} (${item.name})`;
      propCode.value = "MEZZ-2F";
      propZone.value = "二樓倉庫夾層 (EL. +4.40M)";

      cardWallProps.style.display = "none";
      cardFlowProps.style.display = "none";
      cardStandardDims.style.display = "block";
      cardStandardCoords.style.display = "block";
      propRotationGroup.style.display = "none";
      cardClearance.style.display = "none";

      propWidth.value = item.width.toFixed(2);
      propHeight.value = item.height.toFixed(2);
      propX.value = item.x.toFixed(2);
      propY.value = item.y.toFixed(2);
      propArea.textContent = (item.width * item.height).toFixed(2);
      propMm.textContent = `${Math.round(item.width * 1000)} × ${Math.round(item.height * 1000)} mm`;

    } else {
      // Equipment, Column, Furniture, Doors, Windows
      const isCol = item.category === "Column";
      selectionBadge.textContent = `${item.floor || '1F'} · ${item.code}`;
      selectionBadge.classList.add("active");

      propName.value = item.name;
      propCode.value = item.code;
      propZone.value = isCol ? "1F · 結構立柱 (可移動/刪除)" : `${item.floor || '1F'} · ${item.zone || item.category}`;

      cardWallProps.style.display = "none";
      cardFlowProps.style.display = "none";
      cardStandardDims.style.display = "block";
      cardStandardCoords.style.display = "block";
      propRotationGroup.style.display = "block";
      cardClearance.style.display = "block";

      propWidth.value = item.width.toFixed(2);
      propHeight.value = item.height.toFixed(2);
      propX.value = item.x.toFixed(2);
      propY.value = item.y.toFixed(2);
      rotationAngleDisplay.textContent = `${item.rotation || 0}°`;
      propArea.textContent = (item.width * item.height).toFixed(2);
      propMm.textContent = `${Math.round(item.width * 1000)} × ${Math.round(item.height * 1000)} mm`;

      updateClearanceReadouts(item);
    }

    renderSvg();
  }

  function updateClearanceReadouts(eq) {
    if (!eq || typeof eq.x !== 'number') return;
    let minColDist = Infinity;
    (layoutData.columns || []).forEach(col => {
      if (col.id === eq.id) return;
      const d = Math.hypot(eq.x + eq.width / 2 - col.x, eq.y + eq.height / 2 - col.y);
      if (d < minColDist) minColDist = d;
    });

    let minAisleDist = Infinity;
    (layoutData.aisles || []).forEach(a => {
      const d = Math.max(0, Math.min(
        Math.abs(eq.x - (a.x + a.width)),
        Math.abs(a.x - (eq.x + eq.width))
      ));
      if (d < minAisleDist) minAisleDist = d;
    });

    distToCol.textContent = isFinite(minColDist) ? `${minColDist.toFixed(2)} m` : "-- m";
    distToAisle.textContent = isFinite(minAisleDist) ? `${minAisleDist.toFixed(2)} m` : "-- m";
  }

  // --- Universal Deletion ---
  function deleteSelected() {
    if (!selectedId) return;
    const rec = findItemRecord(selectedId);
    if (!rec || !rec.collection) return;

    const idx = rec.collection.findIndex(item => item.id === selectedId);
    if (idx !== -1) {
      rec.collection.splice(idx, 1);
    }
    deselectAll();
  }

  // --- Universal Duplication ---
  function duplicateSelected() {
    if (!selectedId) return;
    const rec = findItemRecord(selectedId);
    if (!rec) return;

    const item = rec.item;
    const cloned = JSON.parse(JSON.stringify(item));
    cloned.id = `${rec.type}_${Date.now()}`;

    if (rec.type === "wall") {
      cloned.x1 += 1.5;
      cloned.y1 += 1.5;
      cloned.x2 += 1.5;
      cloned.y2 += 1.5;
      layoutData.walls.push(cloned);
    } else if (rec.type === "flow") {
      cloned.name = `${item.name} (複製)`;
      if (cloned.points) {
        cloned.points = cloned.points.map(p => ({ x: p.x + 1.5, y: p.y + 1.5 }));
      }
      layoutData.flows.push(cloned);
    } else if (rec.type === "aisle") {
      cloned.name = `${item.name} (複製)`;
      cloned.x += 1.5;
      cloned.y += 1.5;
      layoutData.aisles.push(cloned);
    } else if (rec.type === "zone") {
      cloned.name = `${item.name} (副分區)`;
      cloned.x += 2.0;
      cloned.y += 2.0;
      layoutData.mezzanine_2f.zones.push(cloned);
    } else {
      // Equipment / Columns
      cloned.code = `${item.code}-COPY`;
      cloned.x += 1.0;
      cloned.y += 1.0;
      if (item.category === "Column") {
        layoutData.columns.push(cloned);
      } else if (item.floor === "2F") {
        layoutData.equipment_2f.push(cloned);
      } else {
        layoutData.equipment.push(cloned);
      }
    }

    selectItem(cloned.id);
    renderSvg();
  }

  function rotateSelected(delta) {
    if (!selectedId) return;
    const item = findItemById(selectedId);
    if (!item || typeof item.rotation === "undefined") return;

    item.rotation = ((item.rotation || 0) + delta + 360) % 360;
    rotationAngleDisplay.textContent = `${item.rotation}°`;
    renderSvg();
  }

  // --- Populate Equipment & Architectural Library ---
  function populateLibrary() {
    const container = document.getElementById("libraryContainer");
    if (!container) return;

    const categories = {
      "🚪 門窗開口 (Doors & Windows)": [
        { code: "DOOR-900", name: "單開門 (900×150mm)", w: 0.9, h: 0.15, cat: "Door", col: "#2563EB" },
        { code: "DOOR-1800", name: "雙開門 (1800×150mm)", w: 1.8, h: 0.15, cat: "Door", col: "#2563EB" },
        { code: "ROLL-4000", name: "工業電動捲門 (4.0×0.35M)", w: 4.0, h: 0.35, cat: "Door", col: "#D97706" },
        { code: "SLIDE-2000", name: "自動感應玻璃門 (2.0×0.2M)", w: 2.0, h: 0.2, cat: "Door", col: "#0284C7" },
        { code: "FIRE-1000", name: "逃生推桿防火門 (1.0×0.15M)", w: 1.0, h: 0.15, cat: "Door", col: "#DC2626" },
        { code: "WIN-1500", name: "標準採光氣密窗 (1.5×0.2M)", w: 1.5, h: 0.2, cat: "Window", col: "#0284C7" },
        { code: "WIN-3000", name: "帶形落地觀景窗 (3.0×0.2M)", w: 3.0, h: 0.2, cat: "Window", col: "#0284C7" }
      ],
      "🪜 垂直動線 (Stairs & Lifts)": [
        { code: "ST-STEEL", name: "鋼構單跑樓梯 (3.5×1.2M)", w: 3.5, h: 1.2, cat: "Stairs", col: "#1E3A8A" },
        { code: "ST-SCISSOR", name: "雙跑樓梯組 (3.5×2.4M)", w: 3.5, h: 2.4, cat: "Stairs", col: "#1E3A8A" },
        { code: "LIFT-HEAVY", name: "重型貨梯 3.2×3.0M (載重3T)", w: 3.2, h: 3.0, cat: "Elevator", col: "#334155" },
        { code: "LIFT-PASS", name: "客梯 2.0×2.0M (8人座)", w: 2.0, h: 2.0, cat: "Elevator", col: "#334155" },
        { code: "RAMP-5M", name: "車輛裝卸緩坡 (5.0×2.5M)", w: 5.0, h: 2.5, cat: "Stairs", col: "#D97706" }
      ],
      "🪑 辦公傢俱 (Office Furniture)": [
        { code: "DESK-STD", name: "職員辦公桌椅組 (1.6×0.8M)", w: 1.6, h: 0.8, cat: "Furniture", col: "#475569" },
        { code: "CONF-8P", name: "8人會議長桌組 (3.6×1.4M)", w: 3.6, h: 1.4, cat: "Furniture", col: "#1E293B" },
        { code: "EXEC-DESK", name: "主管大辦公桌 (2.0×1.0M)", w: 2.0, h: 1.0, cat: "Furniture", col: "#334155" },
        { code: "ROUND-4P", name: "4人圓形洽談桌 (1.6×1.6M)", w: 1.6, h: 1.6, cat: "Furniture", col: "#475569" },
        { code: "CAB-STEEL", name: "工業鋼製文件鐵櫃 (1.2×0.5M)", w: 1.2, h: 0.5, cat: "Furniture", col: "#64748B" },
        { code: "SOFA-SET", name: "接待沙發茶几組 (2.4×1.8M)", w: 2.4, h: 1.8, cat: "Furniture", col: "#475569" }
      ],
      "🚻 衛浴與廠務 (Sanitary & Utility)": [
        { code: "WC-STALLS", name: "洗手間隔間組 (3.0×2.0M)", w: 3.0, h: 2.0, cat: "Sanitary", col: "#0284C7" },
        { code: "SINK-IND", name: "工業洗手台水槽 (1.8×0.6M)", w: 1.8, h: 0.6, cat: "Sanitary", col: "#0284C7" },
        { code: "PANTRY", name: "茶水間流理台 (2.4×0.7M)", w: 2.4, h: 0.7, cat: "Sanitary", col: "#0D9488" },
        { code: "ELEC-PANEL", name: "高低壓主配電盤 (2.0×0.8M)", w: 2.0, h: 0.8, cat: "Utility", col: "#DC2626" },
        { code: "FIRE-HOSE", name: "廠房消防栓箱 (0.8×0.4M)", w: 0.8, h: 0.4, cat: "Utility", col: "#EF4444" }
      ],
      "🧱 結構構件 (Structural Columns & Walls)": [
        { code: "COL-500", name: "標準混凝土柱 (500×500)", w: 0.5, h: 0.5, cat: "Column", col: "#334155" },
        { code: "COL-600", name: "重載鋼構柱 (600×600)", w: 0.6, h: 0.6, cat: "Column", col: "#1E293B" }
      ],
      "⚙️ 貼合與原料加工 (ADH Line)": [
        { code: "M1-1", name: "ADH 1 (貼合機主機 M1-1)", w: 9.5, h: 2.2, cat: "ADH", col: "#2B6CB0" },
        { code: "M2-1", name: "ADH 2 (貼合機主機 M2-1)", w: 9.5, h: 2.2, cat: "ADH", col: "#2B6CB0" },
        { code: "N1-1", name: "DC (集塵設備/DC)", w: 3.2, h: 3.8, cat: "ADH", col: "#4A90E2" },
        { code: "F1-1", name: "Foam (發泡原料存放區)", w: 14.5, h: 4.8, cat: "Material", col: "#319795" },
        { code: "A1-1", name: "EVA 1 (EVA 原料暫存 1)", w: 18.0, h: 4.8, cat: "Material", col: "#319795" }
      ],
      "✂️ 裁切與成型精加工 (Cutting)": [
        { code: "T Cut 1", name: "T Cut 1 (裁切機 1)", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" },
        { code: "T Cut 2", name: "T Cut 2 (裁切機 2)", w: 4.5, h: 2.7, cat: "Cutting", col: "#F5A623" },
        { code: "C1-1", name: "PF 1 精密切斷機", w: 18.5, h: 3.8, cat: "Cutting", col: "#D69E2E" },
        { code: "C1-2", name: "PF 2 精密切斷機", w: 7.5, h: 3.5, cat: "Cutting", col: "#D69E2E" },
        { code: "J1-1", name: "V Cut 2 (V型裁斷機)", w: 4.5, h: 4.6, cat: "Cutting", col: "#F5A623" },
        { code: "J1-3", name: "V Cut 3 (V型裁斷機)", w: 4.5, h: 4.5, cat: "Cutting", col: "#F5A623" },
        { code: "L4-1", name: "Die Cut 模切機", w: 4.2, h: 4.0, cat: "Cutting", col: "#ECC94B" }
      ],
      "📦 檢驗、倉儲與自動化": [
        { code: "B1-1", name: "QC 1 品檢桌", w: 2.5, h: 5.2, cat: "QC", col: "#63B3ED" },
        { code: "G2-1", name: "AF 1 自動化設備", w: 2.4, h: 5.5, cat: "Automation", col: "#4A90E2" },
        { code: "RACK-HV", name: "三層重型倉儲貨架 (4.0×1.5M)", w: 4.0, h: 1.5, cat: "Storage", col: "#1E3A8A" },
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
        const newObj = {
          id: `${cat.toLowerCase()}_${Date.now()}`,
          code: code,
          name: name,
          zone: cat,
          floor: targetFloor,
          x: Math.max(0, snappedX),
          y: Math.max(0, snappedY),
          width: w,
          height: h,
          rotation: 0,
          color: col,
          category: cat
        };

        if (cat === "Column") {
          if (!layoutData.columns) layoutData.columns = [];
          layoutData.columns.push(newObj);
        } else if (targetFloor === "2F") {
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newObj);
        } else {
          if (!layoutData.equipment) layoutData.equipment = [];
          layoutData.equipment.push(newObj);
        }

        selectItem(newObj.id);
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

  // --- Circulation Flow Tool Handling ---
  function toggleDrawingRoute() {
    isDrawingRoute = !isDrawingRoute;
    activeRoutePoints = [];

    if (isDrawingRoute) {
      btnDrawRoute.classList.add("drawing-mode");
      btnDrawRoute.innerHTML = `<span class="btn-icon">🛑</span> 結束繪製動線`;
      viewportEl.style.cursor = "crosshair";
    } else {
      btnDrawRoute.classList.remove("drawing-mode");
      btnDrawRoute.innerHTML = `<span class="btn-icon">📍</span> 繪製動線`;
      viewportEl.style.cursor = "default";
      renderSvg();
    }
  }

  function finishDrawingRoute() {
    if (activeRoutePoints.length >= 2) {
      const newFlow = {
        id: `flow_${Date.now()}`,
        name: `新建物料動線 ${layoutData.flows.length + 1}`,
        type: "forklift",
        points: JSON.parse(JSON.stringify(activeRoutePoints)),
        width_m: 2.5,
        color: "#F59E0B",
        dash: "8,4",
        arrow_direction: "both"
      };
      if (!layoutData.flows) layoutData.flows = [];
      layoutData.flows.push(newFlow);
      toggleDrawingRoute();
      selectItem(newFlow.id);
    } else {
      toggleDrawingRoute();
    }
  }

  // --- Add New Wall Function ---
  function addNewWall() {
    const centerSvg = {
      x: viewBox.x + viewBox.width / 2,
      y: viewBox.y + viewBox.height / 2
    };
    const centerM = svgToMeters(centerSvg.x, centerSvg.y);
    const snapX = snapValue(centerM.x, currentSnapM);
    const snapY = snapValue(centerM.y, currentSnapM);

    const newWall = {
      id: `wall_${Date.now()}`,
      x1: snapX - 2.5,
      y1: snapY,
      x2: snapX + 2.5,
      y2: snapY,
      thickness: 0.3,
      type: "interior",
      description: "新建實體雙線隔間牆"
    };

    if (!layoutData.walls) layoutData.walls = [];
    layoutData.walls.push(newWall);
    selectItem(newWall.id);
    renderSvg();
  }

  // --- Zoom & Pan Helper Functions ---
  function updateViewBox() {
    svgEl.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
  }

  function fitToScreen() {
    const vpW = viewportEl.clientWidth;
    const vpH = viewportEl.clientHeight;
    if (vpW === 0 || vpH === 0) return;

    const aspectVp = vpW / vpH;

    if (currentFloor === "2F") {
      const targetW = 40.0 * SCALE + OFFSET_X;
      const targetH = 34.0 * SCALE + OFFSET_Y;
      const aspectTarget = targetW / targetH;

      if (aspectVp > aspectTarget) {
        viewBox.height = targetH * 1.15;
        viewBox.width = viewBox.height * aspectVp;
      } else {
        viewBox.width = targetW * 1.15;
        viewBox.height = viewBox.width / aspectVp;
      }
      viewBox.x = 20;
      viewBox.y = 20;

    } else {
      const targetW = TOTAL_W_M * SCALE + OFFSET_X + 240;
      const targetH = TOTAL_H_M * SCALE + OFFSET_Y + 140;
      const aspectTarget = targetW / targetH;

      if (aspectVp > aspectTarget) {
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
      gridBayInfoEl.textContent = "5.00 m 柱距 · 立柱與牆體自由編輯/移動/刪除";
      mezzanineStatsEl.innerHTML = "廠房總跨度: <strong>100.0 M × 50.0 M</strong>";
    } else if (targetFloor === "2F") {
      floorIndicatorEl.textContent = "2F 倉庫夾層 (EL.+4.40M)";
      floorIndicatorEl.style.color = "#4F46E5";
      gridBayInfoEl.textContent = "1~8 軸 5.00m · A~G 軸 4.75m 柱距";
      mezzanineStatsEl.innerHTML = "2F夾層面積: <strong style='color:#16A34A'>380.0 m²</strong> (Zone A/B/既有)";
    } else {
      floorIndicatorEl.textContent = "1F+2F 雙層透視疊加";
      floorIndicatorEl.style.color = "#D97706";
      gridBayInfoEl.textContent = "雙層結構與動線對齊基準";
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

    if (btnDrawRoute) btnDrawRoute.addEventListener("click", toggleDrawingRoute);
    if (btnAddWall) btnAddWall.addEventListener("click", addNewWall);

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

    // Zoom buttons
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

    document.getElementById("zoomResetBtn").addEventListener("click", () => {
      viewBox = { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
      updateViewBox();
    });

    document.getElementById("fitScreenBtn").addEventListener("click", fitToScreen);

    // Canvas Mouse Events: Dragging, Waypoints, Panning
    viewportEl.addEventListener("mousemove", (e) => {
      const svgPt = clientToSvgCoords(e.clientX, e.clientY);
      const mPt = svgToMeters(svgPt.x, svgPt.y);
      currentHoverM = { x: snapValue(mPt.x, currentSnapM), y: snapValue(mPt.y, currentSnapM) };

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

      if (isDrawingRoute && activeRoutePoints.length > 0) {
        renderSvg();
        return;
      }

      if (isDragging && selectedId) {
        const rec = findItemRecord(selectedId);
        if (!rec) return;

        if (dragMode === "translate") {
          const deltaX = mPt.x - dragStartM.x;
          const deltaY = mPt.y - dragStartM.y;

          if (rec.type === "wall") {
            const w = rec.item;
            const snX = snapValue(deltaX, currentSnapM);
            const snY = snapValue(deltaY, currentSnapM);
            if (snX !== 0 || snY !== 0) {
              w.x1 = Math.round((w.x1 + snX) * 100) / 100;
              w.y1 = Math.round((w.y1 + snY) * 100) / 100;
              w.x2 = Math.round((w.x2 + snX) * 100) / 100;
              w.y2 = Math.round((w.y2 + snY) * 100) / 100;
              dragStartM.x += snX;
              dragStartM.y += snY;
              propWallX1.value = w.x1.toFixed(2);
              propWallY1.value = w.y1.toFixed(2);
              propWallX2.value = w.x2.toFixed(2);
              propWallY2.value = w.y2.toFixed(2);
              renderSvg();
            }
          } else if (rec.type === "flow") {
            const f = rec.item;
            const snX = snapValue(deltaX, currentSnapM);
            const snY = snapValue(deltaY, currentSnapM);
            if ((snX !== 0 || snY !== 0) && f.points) {
              f.points.forEach(p => {
                p.x = Math.round((p.x + snX) * 100) / 100;
                p.y = Math.round((p.y + snY) * 100) / 100;
              });
              dragStartM.x += snX;
              dragStartM.y += snY;
              renderSvg();
            }
          } else {
            // Equipment, Columns, Aisles, Zones
            const item = rec.item;
            const rawX = mPt.x - dragOffset.x;
            const rawY = mPt.y - dragOffset.y;
            item.x = Math.max(0, snapValue(rawX, currentSnapM));
            item.y = Math.max(0, snapValue(rawY, currentSnapM));
            propX.value = item.x.toFixed(2);
            propY.value = item.y.toFixed(2);
            updateClearanceReadouts(item);
            renderSvg();
          }

        } else if (dragMode === "wall-p1") {
          const w = rec.item;
          w.x1 = Math.max(0, snapValue(mPt.x, currentSnapM));
          w.y1 = Math.max(0, snapValue(mPt.y, currentSnapM));
          propWallX1.value = w.x1.toFixed(2);
          propWallY1.value = w.y1.toFixed(2);
          propWallLength.textContent = Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2);
          renderSvg();

        } else if (dragMode === "wall-p2") {
          const w = rec.item;
          w.x2 = Math.max(0, snapValue(mPt.x, currentSnapM));
          w.y2 = Math.max(0, snapValue(mPt.y, currentSnapM));
          propWallX2.value = w.x2.toFixed(2);
          propWallY2.value = w.y2.toFixed(2);
          propWallLength.textContent = Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2);
          renderSvg();

        } else if (dragMode === "flow-point") {
          const f = rec.item;
          if (f.points && dragPointIndex >= 0 && dragPointIndex < f.points.length) {
            f.points[dragPointIndex].x = Math.max(0, snapValue(mPt.x, currentSnapM));
            f.points[dragPointIndex].y = Math.max(0, snapValue(mPt.y, currentSnapM));
            propFlowTotalLen.textContent = calculatePolylineLength(f.points).toFixed(2);
            renderSvg();
          }
        }
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
      if (isDrawingRoute) return;

      const svgPt = clientToSvgCoords(e.clientX, e.clientY);
      const mPt = svgToMeters(svgPt.x, svgPt.y);

      // Check if clicking wall handle
      const wallHandle = e.target.closest(".wall-endpoint-handle");
      if (wallHandle && e.button === 0) {
        const wid = wallHandle.getAttribute("data-wall-id");
        const handle = wallHandle.getAttribute("data-handle");
        selectItem(wid);
        isDragging = true;
        dragMode = handle === "p1" ? "wall-p1" : "wall-p2";
        return;
      }

      // Check if clicking flow waypoint
      const flowHandle = e.target.closest(".flow-waypoint-handle");
      if (flowHandle && e.button === 0) {
        const fid = flowHandle.getAttribute("data-flow-id");
        const pidx = parseInt(flowHandle.getAttribute("data-point-index"), 10);
        selectItem(fid);
        isDragging = true;
        dragMode = "flow-point";
        dragPointIndex = pidx;
        return;
      }

      // Check if clicking any interactive entity
      const itemGroup = e.target.closest(".svg-interactive-item");
      if (itemGroup && e.button === 0) {
        const id = itemGroup.getAttribute("data-id");
        selectItem(id);

        const rec = findItemRecord(id);
        if (rec) {
          isDragging = true;
          dragMode = "translate";
          dragStartM = { x: mPt.x, y: mPt.y };
          if (rec.item.x !== undefined) {
            dragOffset = { x: mPt.x - rec.item.x, y: mPt.y - rec.item.y };
          }
        }
        return;
      }

      // Middle click or drag empty area for canvas panning
      if (e.button === 1 || (!itemGroup && (e.button === 0 || e.ctrlKey))) {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        viewportEl.style.cursor = "grabbing";
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      isPanning = false;
      dragPointIndex = -1;
      dragMode = "translate";
      viewportEl.style.cursor = isDrawingRoute ? "crosshair" : "default";
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
    });

    // Inspector Live Input Bindings
    propName.addEventListener("input", (e) => {
      if (!selectedId) return;
      const item = findItemById(selectedId);
      if (item) {
        item.name = e.target.value;
        renderSvg();
      }
    });

    propCode.addEventListener("input", (e) => {
      if (!selectedId) return;
      const item = findItemById(selectedId);
      if (item) {
        item.code = e.target.value;
        renderSvg();
      }
    });

    [propWidth, propHeight, propX, propY].forEach(inp => {
      inp.addEventListener("change", () => {
        if (!selectedId) return;
        const item = findItemById(selectedId);
        if (!item) return;

        if (item.width !== undefined) item.width = Math.max(0.2, parseFloat(propWidth.value) || 1.0);
        if (item.height !== undefined) item.height = Math.max(0.2, parseFloat(propHeight.value) || 1.0);
        if (item.x !== undefined) item.x = Math.max(0, parseFloat(propX.value) || 0);
        if (item.y !== undefined) item.y = Math.max(0, parseFloat(propY.value) || 0);

        propArea.textContent = (item.width * item.height).toFixed(2);
        propMm.textContent = `${Math.round(item.width * 1000)} × ${Math.round(item.height * 1000)} mm`;

        updateClearanceReadouts(item);
        renderSvg();
      });
    });

    // Wall specific inputs
    [propWallX1, propWallY1, propWallX2, propWallY2, propWallThickness].forEach(inp => {
      inp.addEventListener("change", () => {
        if (!selectedId) return;
        const rec = findItemRecord(selectedId);
        if (!rec || rec.type !== "wall") return;
        const w = rec.item;

        w.x1 = parseFloat(propWallX1.value) || 0;
        w.y1 = parseFloat(propWallY1.value) || 0;
        w.x2 = parseFloat(propWallX2.value) || 0;
        w.y2 = parseFloat(propWallY2.value) || 0;
        w.thickness = Math.max(0.1, parseFloat(propWallThickness.value) || 0.3);

        propWallLength.textContent = Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2);
        renderSvg();
      });
    });

    // Flow specific inputs
    propFlowType.addEventListener("change", (e) => {
      if (!selectedId) return;
      const rec = findItemRecord(selectedId);
      if (!rec || rec.type !== "flow") return;
      const f = rec.item;
      f.type = e.target.value;
      f.color = f.type === "forklift" ? "#F59E0B" :
                f.type === "pedestrian" ? "#10B981" :
                f.type === "process" ? "#3B82F6" : "#EF4444";
      renderSvg();
    });

    propFlowWidth.addEventListener("change", (e) => {
      if (!selectedId) return;
      const rec = findItemRecord(selectedId);
      if (!rec || rec.type !== "flow") return;
      rec.item.width_m = Math.max(0.5, parseFloat(e.target.value) || 2.0);
      renderSvg();
    });

    propFlowArrow.addEventListener("change", (e) => {
      if (!selectedId) return;
      const rec = findItemRecord(selectedId);
      if (!rec || rec.type !== "flow") return;
      rec.item.arrow_direction = e.target.value;
      renderSvg();
    });

    document.getElementById("rotateLeftBtn").addEventListener("click", () => rotateSelected(-90));
    document.getElementById("rotateRightBtn").addEventListener("click", () => rotateSelected(90));
    document.getElementById("duplicateBtn").addEventListener("click", duplicateSelected);
    document.getElementById("deleteBtn").addEventListener("click", deleteSelected);

    // Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "r" || e.key === "R") {
        rotateSelected(90);
      } else if (e.key === "1") {
        switchFloor("1F");
      } else if (e.key === "2") {
        switchFloor("2F");
      } else if (e.key === "3") {
        switchFloor("OVERLAY");
      } else if (e.key === "Enter") {
        if (isDrawingRoute) finishDrawingRoute();
      } else if (e.key === "Escape") {
        if (isDrawingRoute) toggleDrawingRoute();
        else deselectAll();
      }
    });

    // Export & Persistence Actions
    document.getElementById("exportDxfBtn").addEventListener("click", generateAndDownloadDxf);
    document.getElementById("exportSvgBtn").addEventListener("click", () => {
      const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chin_chun_factory_layout_${currentFloor}.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    document.getElementById("printBtn").addEventListener("click", () => window.print());

    document.getElementById("saveJsonBtn").addEventListener("click", () => {
      const jsonStr = JSON.stringify(layoutData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `factory_layout_data_v2.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    document.getElementById("resetLayoutBtn").addEventListener("click", () => {
      if (confirm("確定要重設為工廠初始基準配置嗎？所有新增的自訂牆體與動線將被重設。")) {
        layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
        deselectAll();
        renderSvg();
      }
    });
  }

  // --- Dynamic Professional AutoCAD DXF Generator ---
  function generateAndDownloadDxf() {
    const bayMm = BAY_SIZE_M * 1000;
    const dxf = [];

    dxf.push("0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "9", "$INSUNITS", "70", "4", "0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "14");
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
    dxf.push("0", "LAYER", "2", "11_FLOW_ROUTES", "70", "0", "62", "1", "6", "DASHED");
    dxf.push("0", "LAYER", "2", "12_ARCH_DOORS_WINDOWS", "70", "0", "62", "4", "6", "CONTINUOUS");
    dxf.push("0", "LAYER", "2", "13_FURNITURE", "70", "0", "62", "8", "6", "CONTINUOUS");
    dxf.push("0", "ENDTAB", "0", "ENDSEC");

    dxf.push("0", "SECTION", "2", "ENTITIES");

    // Grid Axis Lines
    for (let i = 0; i < COLS_X; i++) {
      const xMm = i * bayMm;
      dxf.push("0", "LINE", "8", "01_GRID_AXIS", "10", xMm.toString(), "20", "0", "30", "0", "11", xMm.toString(), "21", (TOTAL_H_M * 1000).toString(), "31", "0");
      dxf.push("0", "TEXT", "8", "01_GRID_AXIS", "10", xMm.toString(), "20", "-1500", "30", "0", "40", "350", "1", `X${i + 1}`);
    }
    for (let j = 0; j < COLS_Y; j++) {
      const yMm = j * bayMm;
      dxf.push("0", "LINE", "8", "01_GRID_AXIS", "10", "0", "20", yMm.toString(), "30", "0", "11", (TOTAL_W_M * 1000).toString(), "21", yMm.toString(), "31", "0");
      dxf.push("0", "TEXT", "8", "01_GRID_AXIS", "10", "-1500", "20", yMm.toString(), "30", "0", "40", "350", "1", `Y${j + 1}`);
    }

    // Columns
    (layoutData.columns || []).forEach(col => {
      const cxMm = col.x * 1000;
      const cyMm = (TOTAL_H_M - col.y) * 1000;
      const halfW = (col.width * 1000) / 2;
      const halfH = (col.height * 1000) / 2;
      dxf.push("0", "POLYLINE", "8", "02_COLUMNS", "66", "1", "70", "1");
      dxf.push("0", "VERTEX", "8", "02_COLUMNS", "10", (cxMm - halfW).toString(), "20", (cyMm - halfH).toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", "02_COLUMNS", "10", (cxMm + halfW).toString(), "20", (cyMm - halfH).toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", "02_COLUMNS", "10", (cxMm + halfW).toString(), "20", (cyMm + halfH).toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", "02_COLUMNS", "10", (cxMm - halfW).toString(), "20", (cyMm + halfH).toString(), "30", "0");
      dxf.push("0", "SEQEND");
    });

    // Double-line Walls
    (layoutData.walls || []).forEach(w => {
      const x1Mm = w.x1 * 1000;
      const y1Mm = (TOTAL_H_M - w.y1) * 1000;
      const x2Mm = w.x2 * 1000;
      const y2Mm = (TOTAL_H_M - w.y2) * 1000;
      const dx = x2Mm - x1Mm;
      const dy = y2Mm - y1Mm;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const nx = -dy / len;
        const ny = dx / len;
        const htMm = ((w.thickness || 0.3) * 1000) / 2;
        const ox = nx * htMm;
        const oy = ny * htMm;
        dxf.push("0", "LINE", "8", "03_WALLS", "10", (x1Mm + ox).toString(), "20", (y1Mm + oy).toString(), "30", "0", "11", (x2Mm + ox).toString(), "21", (y2Mm + oy).toString(), "31", "0");
        dxf.push("0", "LINE", "8", "03_WALLS", "10", (x1Mm - ox).toString(), "20", (y1Mm - oy).toString(), "30", "0", "11", (x2Mm - ox).toString(), "21", (y2Mm - oy).toString(), "31", "0");
      }
    });

    // Flow Routes
    (layoutData.flows || []).forEach(f => {
      if (f.points && f.points.length >= 2) {
        for (let i = 0; i < f.points.length - 1; i++) {
          const px1 = f.points[i].x * 1000;
          const py1 = (TOTAL_H_M - f.points[i].y) * 1000;
          const px2 = f.points[i + 1].x * 1000;
          const py2 = (TOTAL_H_M - f.points[i + 1].y) * 1000;
          dxf.push("0", "LINE", "8", "11_FLOW_ROUTES", "10", px1.toString(), "20", py1.toString(), "30", "0", "11", px2.toString(), "21", py2.toString(), "31", "0");
        }
      }
    });

    // Equipment & Components
    const allEq = [...(layoutData.equipment || []), ...(layoutData.equipment_2f || [])];
    allEq.forEach(eq => {
      const xMm = eq.x * 1000;
      const yMm = (TOTAL_H_M - eq.y - eq.height) * 1000;
      const wMm = eq.width * 1000;
      const hMm = eq.height * 1000;
      const cat = eq.category || "Equipment";
      const layer = cat === "Door" || cat === "Window" ? "12_ARCH_DOORS_WINDOWS" :
                    cat === "Furniture" ? "13_FURNITURE" : "05_EQUIPMENT_1F";

      dxf.push("0", "POLYLINE", "8", layer, "66", "1", "70", "1");
      dxf.push("0", "VERTEX", "8", layer, "10", xMm.toString(), "20", yMm.toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", layer, "10", (xMm + wMm).toString(), "20", yMm.toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", layer, "10", (xMm + wMm).toString(), "20", (yMm + hMm).toString(), "30", "0");
      dxf.push("0", "VERTEX", "8", layer, "10", xMm.toString(), "20", (yMm + hMm).toString(), "30", "0");
      dxf.push("0", "SEQEND");

      dxf.push("0", "TEXT", "8", "07_TEXT", "10", (xMm + wMm / 2).toString(), "20", (yMm + hMm / 2).toString(), "30", "0", "40", "250", "1", eq.code);
    });

    dxf.push("0", "ENDSEC", "0", "EOF");

    const dxfBlob = new Blob([dxf.join("\n")], { type: "application/dxf" });
    const url = URL.createObjectURL(dxfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chin_chun_layout_${currentFloor}.dxf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Launch app when DOM is ready
  document.addEventListener("DOMContentLoaded", init);
})();
'''

with open('app_template.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app_template.js successfully!")
