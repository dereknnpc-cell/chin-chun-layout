import json
import re

def update_codebase():
    # Read factory_layout_data.json
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        layout_json = json.load(f)

    print("Loaded factory_layout_data.json:")
    print(f" - cols_x: {layout_json['grid']['cols_x']}, cols_y: {layout_json['grid']['cols_y']}")
    print(f" - factory_width: {layout_json['grid'].get('factory_width')}, factory_depth: {layout_json['grid'].get('factory_depth')}")
    print(f" - column_exclusion_zones: {len(layout_json['grid'].get('column_exclusion_zones', []))}")
    print(f" - walls: {len(layout_json.get('walls', []))}")

    # 1. Update app.js
    with open('app.js', 'r', encoding='utf-8') as f:
        app_content = f.read()

    # Update COLS_Y constant
    app_content = app_content.replace(
        "const COLS_Y = 9;       // Y1 to Y9 (40.0m base depth)",
        "const COLS_Y = 11;      // Y1 to Y11 (50.0m base depth: 10 bays * 5.0m)"
    )

    # Update INITIAL_LAYOUT in app.js with the full updated layout_json
    # Find start and end of INITIAL_LAYOUT
    init_start = app_content.find("  const INITIAL_LAYOUT = {")
    init_end = app_content.find("  // --- State Variables ---", init_start)
    if init_start != -1 and init_end != -1:
        # Format layout_json as formatted javascript object
        json_str = json.dumps(layout_json, indent=2, ensure_ascii=False)
        # Indent each line by 2 spaces
        indented_json = "\n".join("  " + line for line in json_str.splitlines())
        new_init_block = f"  const INITIAL_LAYOUT = {indented_json[2:]};\n\n"
        app_content = app_content[:init_start] + new_init_block + app_content[init_end:]
        print("Updated INITIAL_LAYOUT in app.js successfully.")
    else:
        print("Warning: could not locate INITIAL_LAYOUT bounds.")

    # Update layerState in app.js to include clearSpan and walls
    old_layer_state = """  const layerState = {
    grid: true,
    dims: true,
    aisles: true,
    clearance: true,
    mezzanine: true,
    handrails: true,
    stairs: true
  };"""
    new_layer_state = """  const layerState = {
    grid: true,
    clearSpan: true,
    walls: true,
    dims: true,
    aisles: true,
    clearance: true,
    mezzanine: true,
    handrails: true,
    stairs: true
  };"""
    if old_layer_state in app_content:
        app_content = app_content.replace(old_layer_state, new_layer_state)
        print("Updated layerState in app.js.")

    # Update isColumnExcluded helper
    is_col_excluded_helper = """
  // Column Exclusion Check (e.g. ADH Clear-Span Red Zone)
  function isColumnExcluded(xm, ym) {
    const zones = (layoutData.grid && layoutData.grid.column_exclusion_zones) || [];
    for (const z of zones) {
      if (xm >= z.x1 && xm <= z.x2 && ym >= z.y1 && ym <= z.y2) {
        return true;
      }
    }
    return false;
  }
"""
    # Insert before renderSvg if not present
    if "function isColumnExcluded" not in app_content:
        app_content = app_content.replace(
            "  // --- Render Full Layout SVG ---",
            is_col_excluded_helper + "  // --- Render Full Layout SVG ---"
        )
        print("Added isColumnExcluded helper.")

    # Update 1F column rendering in renderSvg to skip excluded columns
    old_col_loop = """        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < COLS_X; i++) {
          for (let j = 0; j < COLS_Y; j++) {
            const cx = OFFSET_X + i * BAY_SIZE_M * SCALE - colPx / 2;
            const cy = OFFSET_Y + j * BAY_SIZE_M * SCALE - colPx / 2;
            html += `<rect x="${cx}" y="${cy}" width="${colPx}" height="${colPx}" fill="var(--cad-column)" stroke="var(--cad-wall)" stroke-width="1.2"/>`;
          }
        }"""

    new_col_loop = """        const colPx = COL_SIZE_M * SCALE;
        for (let i = 0; i < COLS_X; i++) {
          for (let j = 0; j < COLS_Y; j++) {
            const xm = i * BAY_SIZE_M;
            const ym = j * BAY_SIZE_M;
            if (isColumnExcluded(xm, ym)) {
              continue; // 排除無柱大跨距紅色區域內部柱子
            }
            const cx = OFFSET_X + xm * SCALE - colPx / 2;
            const cy = OFFSET_Y + ym * SCALE - colPx / 2;
            html += `<rect x="${cx}" y="${cy}" width="${colPx}" height="${colPx}" fill="var(--cad-column)" stroke="var(--cad-wall)" stroke-width="1.2"/>`;
          }
        }"""
    if old_col_loop in app_content:
        app_content = app_content.replace(old_col_loop, new_col_loop)
        print("Updated 1F column rendering in app.js with exclusion logic.")

    # Update wall rendering to double-line architectural wall polygons
    old_walls_render = """    // 2. Walls Layer (Building Perimeter & Partitions)
    html += `<g id="layerWalls" opacity="${is2F ? '0.35' : (isOverlay ? '0.55' : '1.0')}">`;
    layoutData.walls.forEach(w => {
      const p1 = metersToSvg(w.x1, w.y1);
      const p2 = metersToSvg(w.x2, w.y2);
      const strokeW = w.type === "exterior" ? 4.5 : 2.5;
      const strokeCol = w.type === "exterior" ? "var(--cad-wall)" : "var(--cad-column)";
      html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${strokeCol}" stroke-width="${strokeW}" stroke-linecap="round"/>`;
    });
    html += `</g>`;"""

    new_walls_render = """    // Helper: calculate 4-vertex polygon for double-line wall
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
        c2: metersToSvg(w.x2, w.y2)
      };
    }

    // 2. Walls Layer (雙筆劃實體建築牆體)
    if (layerState.walls) {
      html += `<g id="layerWalls" opacity="${is2F ? '0.35' : (isOverlay ? '0.55' : '1.0')}">`;
      (layoutData.walls || []).forEach(w => {
        const poly = getWallPolygon(w);
        if (!poly) return;
        html += `
          <polygon points="${poly.points}" class="wall-double-poly" stroke-linejoin="round"/>
          <line x1="${poly.c1.x}" y1="${poly.c1.y}" x2="${poly.c2.x}" y2="${poly.c2.y}" class="wall-centerline"/>
        `;
      });
      html += `</g>`;
    }

    // 2.1 ADH Clear Span Red Zone (無柱大跨距空間 - 紅色警示線與標章)
    if (layerState.clearSpan && (is1F || isOverlay)) {
      html += `<g id="layerClearSpan">`;
      const zones = (layoutData.grid && layoutData.grid.column_exclusion_zones) || [];
      zones.forEach(z => {
        const p1 = metersToSvg(0.0, 0.0);
        const p2 = metersToSvg(35.0, 20.0);
        const rw = p2.x - p1.x;
        const rh = p2.y - p1.y;
        html += `
          <rect x="${p1.x + 2}" y="${p1.y + 2}" width="${rw - 4}" height="${rh - 4}" class="clear-span-outline" rx="6"/>
          <!-- Badge overlay -->
          <g transform="translate(${p1.x + 16}, ${p1.y + rh - 42})">
            <rect width="360" height="30" class="clear-span-badge" rx="6"/>
            <text x="180" y="16" font-size="12" font-weight="800" fill="#DC2626" text-anchor="middle" dominant-baseline="central">
              【ADH貼合區 無柱大跨距空間 · 35M × 20M 淨空】
            </text>
          </g>
        `;
      });
      html += `</g>`;
    }"""

    if old_walls_render in app_content:
        app_content = app_content.replace(old_walls_render, new_walls_render)
        print("Updated wall rendering to double-line polygons & added clear span layer in app.js.")

    # Update 1F Dimension Chain text:
    old_dim_depth = 'text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">主廠房基準深度 40.00 M (8 跨 × 5.00 M)</text>'
    new_dim_depth = 'text-anchor="end" dominant-baseline="central" transform="rotate(-90 ${dimX2 - 10} ${(totalY1 + totalY2) / 2})">廠房總深度 50.00 M (10 跨 × 5.00 M)</text>'
    if old_dim_depth in app_content:
        app_content = app_content.replace(old_dim_depth, new_dim_depth)
        print("Updated 1F depth dimension chain text.")

    # Update switchFloor 100M x 40M to 100M x 50M
    app_content = app_content.replace(
        'mezzanineStatsEl.innerHTML = "廠房總跨度: <strong>100.0 M × 40.0 M</strong>";',
        'mezzanineStatsEl.innerHTML = "廠房總跨度: <strong>100.0 M × 50.0 M</strong> (無柱大跨距 · 雙實線牆)";'
    )

    # In updateNearestColumn, skip excluded columns
    old_dist_cols = """      for (let i = 0; i < COLS_X; i++) {
        for (let j = 0; j < COLS_Y; j++) {
          const cx = i * BAY_SIZE_M;
          const cy = j * BAY_SIZE_M;
          const dx = Math.max(eq.x - cx, 0, cx - (eq.x + eq.width));
          const dy = Math.max(eq.y - cy, 0, cy - (eq.y + eq.height));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDistCol) minDistCol = d;
        }
      }"""
    new_dist_cols = """      for (let i = 0; i < COLS_X; i++) {
        for (let j = 0; j < COLS_Y; j++) {
          const cx = i * BAY_SIZE_M;
          const cy = j * BAY_SIZE_M;
          if (isColumnExcluded(cx, cy)) continue;
          const dx = Math.max(eq.x - cx, 0, cx - (eq.x + eq.width));
          const dy = Math.max(eq.y - cy, 0, cy - (eq.y + eq.height));
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDistCol) minDistCol = d;
        }
      }"""
    if old_dist_cols in app_content:
        app_content = app_content.replace(old_dist_cols, new_dist_cols)
        print("Updated updateNearestColumn to skip excluded columns.")

    # In DXF generation, update column insertion to skip excluded columns and draw double-line walls
    old_dxf_cols = """    for (let i = 0; i < COLS_X; i++) {
      for (let j = 0; j < COLS_Y; j++) {
        dxf.push("0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", `${i * bayMm}`, "20", `${j * bayMm}`, "30", "0.0");
      }
    }"""
    new_dxf_cols = """    for (let i = 0; i < COLS_X; i++) {
      for (let j = 0; j < COLS_Y; j++) {
        if (isColumnExcluded(i * BAY_SIZE_M, j * BAY_SIZE_M)) continue;
        dxf.push("0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", `${i * bayMm}`, "20", `${j * bayMm}`, "30", "0.0");
      }
    }

    // Clear span zone red box in DXF
    dxf.push(
      "0", "POLYLINE", "8", "04_CLEAR_SPAN_ZONE", "66", "1", "70", "1",
      "0", "VERTEX", "8", "04_CLEAR_SPAN_ZONE", "10", "0.0", "20", "0.0", "30", "0.0",
      "0", "VERTEX", "8", "04_CLEAR_SPAN_ZONE", "10", "35000.0", "20", "0.0", "30", "0.0",
      "0", "VERTEX", "8", "04_CLEAR_SPAN_ZONE", "10", "35000.0", "20", "20000.0", "30", "0.0",
      "0", "VERTEX", "8", "04_CLEAR_SPAN_ZONE", "10", "0.0", "20", "20000.0", "30", "0.0",
      "0", "SEQEND",
      "0", "TEXT", "8", "07_TEXT", "10", "17500.0", "20", "10000.0", "30", "0.0", "40", "600.0",
      "1", "CLEAR SPAN ZONE (NO COLUMNS) 35M x 20M",
      "72", "1", "11", "17500.0", "21", "10000.0", "31", "0.0"
    );"""
    if old_dxf_cols in app_content:
        app_content = app_content.replace(old_dxf_cols, new_dxf_cols)
        print("Updated DXF column export with exclusion logic and clear span zone.")

    # Write updated app.js
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("Saved app.js successfully.")

if __name__ == '__main__':
    update_codebase()
