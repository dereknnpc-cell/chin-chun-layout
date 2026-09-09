import json
import re

def apply_updates():
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        layout_json = json.load(f)

    with open('app.js', 'r', encoding='utf-8') as f:
        app_code = f.read()

    # 1. Update INITIAL_LAYOUT in app.js
    init_start = app_code.find("  const INITIAL_LAYOUT = {")
    init_end = app_code.find("  // --- State Variables ---", init_start)
    if init_start != -1 and init_end != -1:
        json_str = json.dumps(layout_json, indent=2, ensure_ascii=False)
        indented_json = "\n".join("  " + line for line in json_str.splitlines())
        new_init_block = f"  const INITIAL_LAYOUT = {indented_json[2:]};\n\n"
        app_code = app_code[:init_start] + new_init_block + app_code[init_end:]
        print("Updated INITIAL_LAYOUT with columns list in app.js.")
    else:
        raise Exception("Could not find INITIAL_LAYOUT bounds.")

    # 2. Update layerState: remove clearSpan
    app_code = re.sub(
        r'const layerState = \{[^}]*\};',
        '''const layerState = {
    grid: true,
    walls: true,
    dims: true,
    aisles: true,
    clearance: true,
    mezzanine: true,
    handrails: true,
    stairs: true
  };''',
        app_code
    )

    # 3. Remove isColumnExcluded helper and old red clear span layer
    app_code = re.sub(
        r'// Column Exclusion Check.*?function isColumnExcluded\(.*?\n  \}',
        '',
        app_code,
        flags=re.DOTALL
    )

    # Remove layerClearSpan if present
    app_code = re.sub(
        r'// 2\.1 ADH Clear Span Red Zone.*?html \+= `</g>`;\n    \}',
        '',
        app_code,
        flags=re.DOTALL
    )

    # 4. Helper function to find any item (equipment, equipment_2f, or column)
    find_item_helper = """
  // Helper to find equipment or column by ID
  function findItemById(id) {
    if (!id) return null;
    let item = (layoutData.equipment || []).find(e => e.id === id);
    if (item) return item;
    if (layoutData.equipment_2f) {
      item = layoutData.equipment_2f.find(e => e.id === id);
      if (item) return item;
    }
    if (layoutData.columns) {
      item = layoutData.columns.find(e => e.id === id);
      if (item) return item;
    }
    return null;
  }
"""
    if "function findItemById" not in app_code:
        app_code = app_code.replace(
            "  // --- Coordinate Transformations ---",
            find_item_helper + "\n  // --- Coordinate Transformations ---"
        )

    # 5. In renderSvg: Update 1F column rendering to render interactive columns from layoutData.columns
    # Find columns rendering in 1F
    # Currently lines are drawn and then columns are drawn
    old_grid_cols_pattern = r'// Structural Columns \(1~8, A~G\).*?(?=html \+= `</g>`;)'
    # Let's inspect the exact grid section in app.js
    # Let's replace the 1F column loop inside layerGrid
    old_col_loop_marker = "const colPx = COL_SIZE_M * SCALE;"
    # Let's check how layerGrid ends in 1F
    new_1f_columns_code = """        // --- Interactive Movable & Deletable 1F Columns (可移動與刪除之結構柱) ---
        (layoutData.columns || []).forEach(col => {
          const cw = (col.width || COL_SIZE_M) * SCALE;
          const ch = (col.height || COL_SIZE_M) * SCALE;
          // col.x and col.y represent center coordinates of the column
          const cx = OFFSET_X + col.x * SCALE - cw / 2;
          const cy = OFFSET_Y + col.y * SCALE - ch / 2;
          const isSelected = col.id === selectedEquipmentId;

          html += `
            <g id="${col.id}" class="svg-column-group svg-equipment-group ${isSelected ? 'selected' : ''}"
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
"""

    # Replace the old column loop:
    pattern_old_loop = r'const colPx = COL_SIZE_M \* SCALE;\s+for \(let i = 0; i < COLS_X; i\+\+\) \{.*?\}\s+html \+= `</g>`;'
    if re.search(pattern_old_loop, app_code, re.DOTALL):
        app_code = re.sub(pattern_old_loop, new_1f_columns_code + "\n      }\n      html += `</g>`;", app_code, flags=re.DOTALL)
        print("Replaced 1F column loop with interactive layoutData.columns rendering.")
    else:
        print("Warning: could not match pattern_old_loop")

    # 6. Update selectEquipment to handle columns
    old_select_eq = """    let eq = (layoutData.equipment || []).find(e => e.id === id);
    if (!eq && layoutData.equipment_2f) {
      eq = layoutData.equipment_2f.find(e => e.id === id);
    }"""
    new_select_eq = """    let eq = findItemById(id);"""
    app_code = app_code.replace(old_select_eq, new_select_eq)

    # In selectEquipment: display zone for column
    app_code = app_code.replace(
        'propZone.value = `${eq.floor || \'1F\'} · ${eq.zone || eq.category}`;',
        'propZone.value = eq.category === "Column" ? "1F · 建築結構柱 (可移動/刪除)" : `${eq.floor || \'1F\'} · ${eq.zone || eq.category}`;'
    )

    # 7. Update deleteSelected to delete from layoutData.columns
    old_del = """    let idx = (layoutData.equipment || []).findIndex(item => item.id === selectedEquipmentId);
    if (idx !== -1) {
      layoutData.equipment.splice(idx, 1);
    } else if (layoutData.equipment_2f) {
      idx = layoutData.equipment_2f.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.equipment_2f.splice(idx, 1);
    }"""
    new_del = """    let idx = (layoutData.equipment || []).findIndex(item => item.id === selectedEquipmentId);
    if (idx !== -1) {
      layoutData.equipment.splice(idx, 1);
    } else if (layoutData.equipment_2f) {
      idx = layoutData.equipment_2f.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.equipment_2f.splice(idx, 1);
    } else if (layoutData.columns) {
      idx = layoutData.columns.findIndex(item => item.id === selectedEquipmentId);
      if (idx !== -1) layoutData.columns.splice(idx, 1);
    }"""
    app_code = app_code.replace(old_del, new_del)

    # 8. Update duplicateBtn listener to duplicate column if selected
    old_dup = """      let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
      let targetList = layoutData.equipment;
      if (!eq && layoutData.equipment_2f) {
        eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        targetList = layoutData.equipment_2f;
      }
      if (!eq) return;"""
    new_dup = """      let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
      let targetList = layoutData.equipment;
      if (!eq && layoutData.equipment_2f) {
        eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        targetList = layoutData.equipment_2f;
      }
      if (!eq && layoutData.columns) {
        eq = layoutData.columns.find(item => item.id === selectedEquipmentId);
        targetList = layoutData.columns;
      }
      if (!eq) return;"""
    app_code = app_code.replace(old_dup, new_dup)

    # 9. Update mousedown and mousemove dragging logic to use findItemById
    old_mouse_drag = """        let eq = (layoutData.equipment || []).find(item => item.id === id);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === id);
        }"""
    new_mouse_drag = """        let eq = findItemById(id);"""
    app_code = app_code.replace(old_mouse_drag, new_mouse_drag)

    old_move_drag = """        let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        }"""
    new_move_drag = """        let eq = findItemById(selectedEquipmentId);"""
    app_code = app_code.replace(old_move_drag, new_move_drag)

    # 10. In property inputs listener, use findItemById
    old_prop_input = """        let eq = (layoutData.equipment || []).find(item => item.id === selectedEquipmentId);
        if (!eq && layoutData.equipment_2f) {
          eq = layoutData.equipment_2f.find(item => item.id === selectedEquipmentId);
        }"""
    new_prop_input = """        let eq = findItemById(selectedEquipmentId);"""
    app_code = app_code.replace(old_prop_input, new_prop_input)

    # 11. In populateLibrary: add "結構立柱" category so user can create columns
    old_lib_categories = '"公用與倉儲物流": ['
    new_lib_categories = """"建築結構構件": [
        { code: "COL-500", name: "標準混凝土柱 (500×500)", w: 0.5, h: 0.5, cat: "Column", col: "#334155" },
        { code: "COL-600", name: "重載鋼構柱 (600×600)", w: 0.6, h: 0.6, cat: "Column", col: "#1E293B" }
      ],
      "公用與倉儲物流": ["""
    if '"建築結構構件"' not in app_code:
        app_code = app_code.replace(old_lib_categories, new_lib_categories)

    # In library item click handler, add to layoutData.columns if cat === "Column"
    old_lib_add = """        if (targetFloor === "2F") {
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newEq);
        } else {
          layoutData.equipment.push(newEq);
        }"""
    new_lib_add = """        if (cat === "Column") {
          if (!layoutData.columns) layoutData.columns = [];
          newEq.id = `col_${Date.now()}`;
          newEq.category = "Column";
          layoutData.columns.push(newEq);
        } else if (targetFloor === "2F") {
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newEq);
        } else {
          layoutData.equipment.push(newEq);
        }"""
    app_code = app_code.replace(old_lib_add, new_lib_add)

    # 12. In DXF generator, output columns from layoutData.columns
    # Find dxf column insertion
    old_dxf_cols = re.search(r'for \(let i = 0; i < COLS_X; i\+\+\) \{.*?BLK_COLUMN.*?\}', app_code, re.DOTALL)
    if old_dxf_cols:
        new_dxf_cols = """    // Export interactive columns
    (layoutData.columns || []).forEach(col => {
      dxf.push("0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", `${col.x * 1000}`, "20", `${col.y * 1000}`, "30", "0.0");
    });"""
        # Also remove any CLEAR_SPAN_ZONE polyline from DXF
        app_code = app_code.replace(old_dxf_cols.group(0), new_dxf_cols)
        print("Updated browser DXF generation to export layoutData.columns.")

    # Remove CLEAR_SPAN_ZONE block in DXF if present
    app_code = re.sub(r'// Clear span zone red box in DXF.*?CLEAR SPAN ZONE.*?\);', '', app_code, flags=re.DOTALL)

    # 13. Update updateClearanceReadouts to check against layoutData.columns
    old_dist_calc = re.search(r'for \(let i = 0; i < COLS_X; i\+\+\) \{.*?minDistCol = d;\s+\}\s+\}', app_code, re.DOTALL)
    if old_dist_calc:
        new_dist_calc = """      for (const col of (layoutData.columns || [])) {
        const dx = Math.max(eq.x - col.x, 0, col.x - (eq.x + eq.width));
        const dy = Math.max(eq.y - col.y, 0, col.y - (eq.y + eq.height));
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDistCol) minDistCol = d;
      }"""
        app_code = app_code.replace(old_dist_calc.group(0), new_dist_calc)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_code)
    print("Successfully saved updated app.js.")

if __name__ == '__main__':
    apply_updates()
