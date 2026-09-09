import json
import math

def get_wall_offset_lines(w):
    x1, y1 = w["x1"], w["y1"]
    x2, y2 = w["x2"], w["y2"]
    thickness = w.get("thickness", 0.3)
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length < 0.001:
        return None
    nx = -dy / length
    ny = dx / length
    ht = thickness / 2.0
    ox = nx * ht
    oy = ny * ht
    return {
        "line1": (x1 + ox, y1 + oy, x2 + ox, y2 + oy),
        "line2": (x1 - ox, y1 - oy, x2 - ox, y2 - oy),
        "center": (x1, y1, x2, y2),
        "poly": [
            (x1 + ox, y1 + oy),
            (x2 + ox, y2 + oy),
            (x2 - ox, y2 - oy),
            (x1 - ox, y1 - oy)
        ]
    }

def generate_dxf(layout_data, output_path):
    grid = layout_data["grid"]
    bay_m = grid["bay_size"]
    bay_mm = bay_m * 1000
    cols_x = grid["cols_x"]
    cols_y = grid["cols_y"]
    columns = layout_data.get("columns", [])
    equipment_1f = layout_data.get("equipment", [])
    equipment_2f = layout_data.get("equipment_2f", [])
    walls = layout_data.get("walls", [])
    aisles = layout_data.get("aisles", [])
    flows = layout_data.get("flows", [])
    m2f = layout_data["mezzanine_2f"]

    dxf = []
    # Header
    dxf.extend(["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "9", "$INSUNITS", "70", "4", "0", "ENDSEC"])

    # Tables (Layers)
    dxf.extend([
        "0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", "15",
        "0", "LAYER", "2", "01_GRID_AXIS", "70", "0", "62", "1", "6", "CENTER",
        "0", "LAYER", "2", "02_COLUMNS", "70", "0", "62", "7", "6", "CONTINUOUS",
        "0", "LAYER", "2", "03_WALLS", "70", "0", "62", "7", "6", "CONTINUOUS",
        "0", "LAYER", "2", "04_AISLES", "70", "0", "62", "2", "6", "DASHED",
        "0", "LAYER", "2", "05_EQUIPMENT_1F", "70", "0", "62", "4", "6", "CONTINUOUS",
        "0", "LAYER", "2", "06_DIMENSIONS", "70", "0", "62", "3", "6", "CONTINUOUS",
        "0", "LAYER", "2", "07_TEXT", "70", "0", "62", "7", "6", "CONTINUOUS",
        "0", "LAYER", "2", "08_TITLE_BLOCK", "70", "0", "62", "6", "6", "CONTINUOUS",
        "0", "LAYER", "2", "09_2F_MEZZANINE", "70", "0", "62", "5", "6", "CONTINUOUS",
        "0", "LAYER", "2", "10_2F_HANDRAIL", "70", "0", "62", "2", "6", "DASHED",
        "0", "LAYER", "2", "11_FLOW_ROUTES", "70", "0", "62", "1", "6", "DASHED",
        "0", "LAYER", "2", "12_ARCH_DOORS_WINDOWS", "70", "0", "62", "4", "6", "CONTINUOUS",
        "0", "LAYER", "2", "13_FURNITURE", "70", "0", "62", "8", "6", "CONTINUOUS",
        "0", "ENDTAB", "0", "ENDSEC"
    ])

    # Blocks
    dxf.extend(["0", "SECTION", "2", "BLOCKS"])
    
    # Column Block (500x500mm)
    dxf.extend([
        "0", "BLOCK", "2", "BLK_COLUMN", "70", "0", "10", "0.0", "20", "0.0", "30", "0.0", "3", "BLK_COLUMN",
        "0", "POLYLINE", "8", "02_COLUMNS", "66", "1", "70", "1",
        "0", "VERTEX", "8", "02_COLUMNS", "10", "-250.0", "20", "-250.0", "30", "0.0",
        "0", "VERTEX", "8", "02_COLUMNS", "10", "250.0", "20", "-250.0", "30", "0.0",
        "0", "VERTEX", "8", "02_COLUMNS", "10", "250.0", "20", "250.0", "30", "0.0",
        "0", "VERTEX", "8", "02_COLUMNS", "10", "-250.0", "20", "250.0", "30", "0.0",
        "0", "SEQEND", "0", "ENDBLK"
    ])
    dxf.extend(["0", "ENDSEC"])

    # Entities
    dxf.extend(["0", "SECTION", "2", "ENTITIES"])

    # 1. Grid Lines (X1~X21, Y1~Y11)
    for i in range(cols_x):
        xm = i * bay_mm
        dxf.extend([
            "0", "LINE", "8", "01_GRID_AXIS", "10", str(xm), "20", "-3000.0", "30", "0.0", "11", str(xm), "21", "68000.0", "31", "0.0",
            "0", "CIRCLE", "8", "01_GRID_AXIS", "10", str(xm), "20", "-4000.0", "30", "0.0", "40", "800.0",
            "0", "TEXT", "8", "07_TEXT", "10", str(xm), "20", "-4000.0", "30", "0.0", "40", "500.0", "1", f"X{i+1}",
            "72", "1", "11", str(xm), "21", "-4000.0", "31", "0.0"
        ])
    for j in range(cols_y):
        ym = j * bay_mm
        x_max = (cols_x - 1) * bay_mm + 3000
        dxf.extend([
            "0", "LINE", "8", "01_GRID_AXIS", "10", "-3000.0", "20", str(ym), "30", "0.0", "11", str(x_max), "21", str(ym), "31", "0.0",
            "0", "CIRCLE", "8", "01_GRID_AXIS", "10", "-4000.0", "20", str(ym), "30", "0.0", "40", "800.0",
            "0", "TEXT", "8", "07_TEXT", "10", "-4000.0", "20", str(ym), "30", "0.0", "40", "500.0", "1", f"Y{j+1}",
            "72", "1", "11", "-4000.0", "21", str(ym), "31", "0.0"
        ])

    # 2. Insert Columns (only existing active columns)
    for col in columns:
        dxf.extend(["0", "INSERT", "8", "02_COLUMNS", "2", "BLK_COLUMN", "10", str(col["x"] * 1000), "20", str(col["y"] * 1000), "30", "0.0"])

    # 3. Double-line Walls
    for w in walls:
        offsets = get_wall_offset_lines(w)
        if not offsets:
            continue
        poly = offsets["poly"]
        dxf.extend([
            "0", "POLYLINE", "8", "03_WALLS", "66", "1", "70", "1",
            "0", "VERTEX", "8", "03_WALLS", "10", str(poly[0][0] * 1000), "20", str(poly[0][1] * 1000), "30", "0.0",
            "0", "VERTEX", "8", "03_WALLS", "10", str(poly[1][0] * 1000), "20", str(poly[1][1] * 1000), "30", "0.0",
            "0", "VERTEX", "8", "03_WALLS", "10", str(poly[2][0] * 1000), "20", str(poly[2][1] * 1000), "30", "0.0",
            "0", "VERTEX", "8", "03_WALLS", "10", str(poly[3][0] * 1000), "20", str(poly[3][1] * 1000), "30", "0.0",
            "0", "SEQEND"
        ])
        c = offsets["center"]
        dxf.extend([
            "0", "LINE", "8", "01_GRID_AXIS",
            "10", str(c[0] * 1000), "20", str(c[1] * 1000), "30", "0.0",
            "11", str(c[2] * 1000), "21", str(c[3] * 1000), "31", "0.0"
        ])

    # 4. Aisles (04_AISLES)
    for a in aisles:
        ax1 = a["x"] * 1000
        ay1 = a["y"] * 1000
        ax2 = (a["x"] + a["width"]) * 1000
        ay2 = (a["y"] + a["height"]) * 1000
        dxf.extend([
            "0", "POLYLINE", "8", "04_AISLES", "66", "1", "70", "1",
            "0", "VERTEX", "8", "04_AISLES", "10", str(ax1), "20", str(ay1), "30", "0.0",
            "0", "VERTEX", "8", "04_AISLES", "10", str(ax2), "20", str(ay1), "30", "0.0",
            "0", "VERTEX", "8", "04_AISLES", "10", str(ax2), "20", str(ay2), "30", "0.0",
            "0", "VERTEX", "8", "04_AISLES", "10", str(ax1), "20", str(ay2), "30", "0.0",
            "0", "SEQEND",
            "0", "TEXT", "8", "07_TEXT", "10", str((ax1 + ax2) / 2), "20", str((ay1 + ay2) / 2), "30", "0.0", "40", "300.0", "1", a["name"],
            "72", "1", "11", str((ax1 + ax2) / 2), "21", str((ay1 + ay2) / 2), "31", "0.0"
        ])

    # 5. Flow Routes (11_FLOW_ROUTES)
    for f in flows:
        pts = f.get("points", [])
        if len(pts) >= 2:
            for k in range(len(pts) - 1):
                dxf.extend([
                    "0", "LINE", "8", "11_FLOW_ROUTES",
                    "10", str(pts[k]["x"] * 1000), "20", str(pts[k]["y"] * 1000), "30", "0.0",
                    "11", str(pts[k+1]["x"] * 1000), "21", str(pts[k+1]["y"] * 1000), "31", "0.0"
                ])

    # 6. 2F Mezzanine Zones Outlines
    for z in m2f["zones"]:
        x1 = z["x"] * 1000
        y1 = z["y"] * 1000
        x2 = (z["x"] + z["width"]) * 1000
        y2 = (z["y"] + z["height"]) * 1000
        dxf.extend([
            "0", "POLYLINE", "8", "09_2F_MEZZANINE", "66", "1", "70", "1",
            "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", str(x1), "20", str(y1), "30", "0.0",
            "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", str(x2), "20", str(y1), "30", "0.0",
            "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", str(x2), "20", str(y2), "30", "0.0",
            "0", "VERTEX", "8", "09_2F_MEZZANINE", "10", str(x1), "20", str(y2), "30", "0.0",
            "0", "SEQEND",
            "0", "TEXT", "8", "07_TEXT", "10", str((x1 + x2) / 2), "20", str((y1 + y2) / 2), "30", "0.0", "40", "400.0", "1", f"{z['name']} (+4.40M)",
            "72", "1", "11", str((x1 + x2) / 2), "21", str((y1 + y2) / 2), "31", "0.0"
        ])

    # 7. 2F Handrails
    for hr in m2f["handrails"]:
        dxf.extend([
            "0", "LINE", "8", "10_2F_HANDRAIL", "10", str(hr["x1"] * 1000), "20", str(hr["y1"] * 1000), "30", "0.0",
            "11", str(hr["x2"] * 1000), "21", str(hr["y2"] * 1000), "31", "0.0"
        ])

    # 8. Equipment & Architectural Components
    all_eq = equipment_1f + equipment_2f
    for eq in all_eq:
        x_mm = eq["x"] * 1000
        y_mm = eq["y"] * 1000
        w_mm = eq["width"] * 1000
        h_mm = eq["height"] * 1000
        cat = eq.get("category", "General")
        layer = "12_ARCH_DOORS_WINDOWS" if cat in ["Door", "Window"] else \
                "13_FURNITURE" if cat in ["Furniture", "Sanitary"] else "05_EQUIPMENT_1F"

        dxf.extend([
            "0", "POLYLINE", "8", layer, "66", "1", "70", "1",
            "0", "VERTEX", "8", layer, "10", str(x_mm), "20", str(y_mm), "30", "0.0",
            "0", "VERTEX", "8", layer, "10", str(x_mm + w_mm), "20", str(y_mm), "30", "0.0",
            "0", "VERTEX", "8", layer, "10", str(x_mm + w_mm), "20", str(y_mm + h_mm), "30", "0.0",
            "0", "VERTEX", "8", layer, "10", str(x_mm), "20", str(y_mm + h_mm), "30", "0.0",
            "0", "SEQEND",
            "0", "TEXT", "8", "07_TEXT", "10", str(x_mm + w_mm / 2), "20", str(y_mm + h_mm / 2), "30", "0.0", "40", "250.0", "1", eq["code"],
            "72", "1", "11", str(x_mm + w_mm / 2), "21", str(y_mm + h_mm / 2), "31", "0.0"
        ])

    dxf.extend(["0", "ENDSEC", "0", "EOF"])

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(dxf))


def generate_svg(layout_data, output_path):
    SCALE = 24.0
    OFFSET_X = 260
    OFFSET_Y = 220
    grid = layout_data["grid"]
    total_w_m = (grid["cols_x"] - 1) * grid["bay_size"]  # 100.0m
    total_h_m = 70.0                                     # 70.0m
    cols_x = grid["cols_x"]
    cols_y = grid["cols_y"]
    columns = layout_data.get("columns", [])

    svg_w = int(total_w_m * SCALE + OFFSET_X + 280)
    svg_h = int(total_h_m * SCALE + OFFSET_Y + 160)

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="{svg_w}" height="{svg_h}">')
    svg.append("""
    <defs>
      <pattern id="aisleStripe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="20" fill="#ECC94B" fill-opacity="0.3"/>
        <rect x="10" width="10" height="20" fill="#4A5568" fill-opacity="0.15"/>
      </pattern>
      <pattern id="mezzanineGrating" width="12" height="6" patternUnits="userSpaceOnUse">
        <rect width="12" height="6" fill="#EBF8FF" fill-opacity="0.85"/>
        <line x1="0" y1="0" x2="12" y2="0" stroke="#3182CE" stroke-width="0.8" stroke-opacity="0.4"/>
        <line x1="0" y1="3" x2="12" y2="3" stroke="#90CDF4" stroke-width="0.5" stroke-opacity="0.3"/>
      </pattern>
      <pattern id="existingMezzHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="14" height="14" fill="#EDF2F7" fill-opacity="0.9"/>
        <line x1="0" y1="0" x2="0" y2="14" stroke="#4A5568" stroke-width="1.2" stroke-opacity="0.55"/>
        <line x1="7" y1="0" x2="7" y2="14" stroke="#718096" stroke-width="0.8" stroke-opacity="0.35"/>
      </pattern>
      <marker id="dim-arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 10 2 L 0 5 L 10 8 Z" fill="#2563EB"/>
      </marker>
      <marker id="dim-arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 2 L 10 5 L 0 8 Z" fill="#2563EB"/>
      </marker>
      <!-- Flow markers -->
      <marker id="arrowForklift" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 2 2 L 10 6 L 2 10 Z" fill="#F59E0B"/>
      </marker>
      <marker id="arrowPedestrian" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 2 2 L 10 6 L 2 10 Z" fill="#10B981"/>
      </marker>
      <marker id="arrowProcess" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 2 2 L 10 6 L 2 10 Z" fill="#3B82F6"/>
      </marker>
      <marker id="arrowEvacuation" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 2 2 L 10 6 L 2 10 Z" fill="#EF4444"/>
      </marker>
    </defs>
    """)

    # Background
    svg.append(f'<rect width="{svg_w}" height="{svg_h}" fill="#F8FAFC"/>')
    svg.append(f'<rect x="{OFFSET_X - 10}" y="{OFFSET_Y - 10}" width="{total_w_m * SCALE + 20}" height="{total_h_m * SCALE + 20}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" rx="4"/>')

    # Grid axes
    bay_m = grid["bay_size"]
    for i in range(cols_x):
        xm = i * bay_m
        px = OFFSET_X + xm * SCALE
        py1 = OFFSET_Y - 40
        py2 = OFFSET_Y + total_h_m * SCALE + 20
        svg.append(f'<line x1="{px}" y1="{py1}" x2="{px}" y2="{py2}" stroke="#DC2626" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.45"/>')
        svg.append(f'<circle cx="{px}" cy="{py1 - 18}" r="12" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>')
        svg.append(f'<text x="{px}" y="{py1 - 18}" font-family="sans-serif" font-size="11px" font-weight="bold" fill="#DC2626" text-anchor="middle" dominant-baseline="central">X{i+1}</text>')

    for j in range(cols_y):
        ym = j * bay_m
        py = OFFSET_Y + ym * SCALE
        px1 = OFFSET_X - 40
        px2 = OFFSET_X + total_w_m * SCALE + 20
        svg.append(f'<line x1="{px1}" y1="{py}" x2="{px2}" y2="{py}" stroke="#DC2626" stroke-width="1.2" stroke-dasharray="8,4,2,4" stroke-opacity="0.45"/>')
        svg.append(f'<circle cx="{px1 - 18}" cy="{py}" r="12" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>')
        svg.append(f'<text x="{px1 - 18}" y="{py}" font-family="sans-serif" font-size="11px" font-weight="bold" fill="#DC2626" text-anchor="middle" dominant-baseline="central">Y{j+1}</text>')

    # Aisles Layer
    for a in layout_data.get("aisles", []):
        ax = OFFSET_X + a["x"] * SCALE
        ay = OFFSET_Y + a["y"] * SCALE
        aw = a["width"] * SCALE
        ah = a["height"] * SCALE
        svg.append(f'<rect x="{ax}" y="{ay}" width="{aw}" height="{ah}" fill="url(#aisleStripe)" stroke="#D97706" stroke-width="1.5" stroke-dasharray="6,4" rx="2"/>')
        svg.append(f'<text x="{ax + aw/2}" y="{ay + ah/2}" font-family="sans-serif" font-size="11px" font-weight="bold" fill="#B45309" text-anchor="middle" dominant-baseline="central">{a["name"]}</text>')

    # Columns
    col_px = 0.5 * SCALE
    for col in columns:
        cx = OFFSET_X + col["x"] * SCALE - col_px / 2
        cy = OFFSET_Y + col["y"] * SCALE - col_px / 2
        svg.append(f'<g class="svg-column-group">')
        svg.append(f'<rect x="{cx}" y="{cy}" width="{col_px}" height="{col_px}" fill="#334155" stroke="#0F172A" stroke-width="1.2" rx="1.5"/>')
        svg.append(f'<line x1="{cx}" y1="{cy}" x2="{cx + col_px}" y2="{cy + col_px}" stroke="#94A3B8" stroke-width="0.8" stroke-opacity="0.6"/>')
        svg.append(f'<line x1="{cx + col_px}" y1="{cy}" x2="{cx}" y2="{cy + col_px}" stroke="#94A3B8" stroke-width="0.8" stroke-opacity="0.6"/>')
        svg.append(f'</g>')

    # Double-line Walls
    for w in layout_data.get("walls", []):
        offsets = get_wall_offset_lines(w)
        if not offsets:
            continue
        poly_pts = " ".join(f"{OFFSET_X + p[0]*SCALE:.1f},{OFFSET_Y + p[1]*SCALE:.1f}" for p in offsets["poly"])
        c = offsets["center"]
        cx1 = OFFSET_X + c[0] * SCALE
        cy1 = OFFSET_Y + c[1] * SCALE
        cx2 = OFFSET_X + c[2] * SCALE
        cy2 = OFFSET_Y + c[3] * SCALE
        is_ext = w.get("type") == "exterior"
        fill_col = "#E2E8F0" if is_ext else "#F1F5F9"
        stroke_col = "#0F172A" if is_ext else "#334155"
        svg.append(f'<polygon points="{poly_pts}" fill="{fill_col}" stroke="{stroke_col}" stroke-width="1.4" stroke-linejoin="round"/>')
        svg.append(f'<line x1="{cx1}" y1="{cy1}" x2="{cx2}" y2="{cy2}" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="4,3"/>')

    # Circulation Flow Routes Layer
    for f in layout_data.get("flows", []):
        pts = f.get("points", [])
        if len(pts) >= 2:
            d = f"M {OFFSET_X + pts[0]['x']*SCALE:.1f} {OFFSET_Y + pts[0]['y']*SCALE:.1f}"
            for pt in pts[1:]:
                d += f" L {OFFSET_X + pt['x']*SCALE:.1f} {OFFSET_Y + pt['y']*SCALE:.1f}"
            col = f.get("color", "#F59E0B")
            dash = f.get("dash", "8,4")
            m_id = "arrowForklift" if f["type"] == "forklift" else \
                   "arrowPedestrian" if f["type"] == "pedestrian" else \
                   "arrowProcess" if f["type"] == "process" else "arrowEvacuation"
            # Band
            band_w = (f.get("width_m", 2.0)) * SCALE * 0.4
            svg.append(f'<path d="{d}" stroke="{col}" stroke-width="{band_w}" stroke-opacity="0.18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
            # Centerline
            svg.append(f'<path d="{d}" stroke="{col}" stroke-width="2.2" stroke-dasharray="{dash}" fill="none" marker-end="url(#{m_id})" stroke-linecap="round" stroke-linejoin="round"/>')
            # Label
            mid = pts[len(pts)//2]
            mx = OFFSET_X + mid["x"] * SCALE
            my = OFFSET_Y + mid["y"] * SCALE
            svg.append(f'<rect x="{mx - 40}" y="{my - 9}" width="80" height="18" rx="3" fill="#FFFFFF" stroke="{col}" stroke-width="1" fill-opacity="0.9"/>')
            svg.append(f'<text x="{mx}" y="{my}" font-family="sans-serif" font-size="8.5px" font-weight="bold" fill="{col}" text-anchor="middle" dominant-baseline="central">{f["name"].split()[0]}</text>')

    # 2F Mezzanine Structure
    m2f = layout_data["mezzanine_2f"]
    for z in m2f["zones"]:
        zx = OFFSET_X + z["x"] * SCALE
        zy = OFFSET_Y + z["y"] * SCALE
        zw = z["width"] * SCALE
        zh = z["height"] * SCALE
        pat = "url(#existingMezzHatch)" if z.get("pattern") == "hatch_diagonal" else "url(#mezzanineGrating)"
        svg.append(f'<rect x="{zx}" y="{zy}" width="{zw}" height="{zh}" fill="{pat}" stroke="#2563EB" stroke-width="2" rx="2"/>')
        svg.append(f'<rect x="{zx + zw/2 - 75}" y="{zy + zh/2 - 20}" width="150" height="40" rx="4" fill="rgba(255,255,255,0.92)" stroke="#2563EB" stroke-width="1"/>')
        svg.append(f'<text x="{zx + zw/2}" y="{zy + zh/2 - 6}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1E3A8A" text-anchor="middle">{z["thai_name"]} {z["name"].split()[0]}</text>')
        svg.append(f'<text x="{zx + zw/2}" y="{zy + zh/2 + 8}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#DC2626" text-anchor="middle">[2] EL. +4.40M ({z["area_sqm"]}m²)</text>')

    # 2F Handrails
    for hr in m2f["handrails"]:
        x1 = OFFSET_X + hr["x1"] * SCALE
        y1 = OFFSET_Y + hr["y1"] * SCALE
        x2 = OFFSET_X + hr["x2"] * SCALE
        y2 = OFFSET_Y + hr["y2"] * SCALE
        svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#D97706" stroke-width="3" stroke-dasharray="6,3"/>')

    # 1F Equipment & Architectural Components
    for eq in layout_data["equipment"]:
        ex = OFFSET_X + eq["x"] * SCALE
        ey = OFFSET_Y + eq["y"] * SCALE
        ew = eq["width"] * SCALE
        eh = eq["height"] * SCALE
        col = eq.get("color", "#4A90E2")
        cat = eq.get("category", "General")

        if cat == "Door":
            svg.append(f'<rect x="{ex}" y="{ey}" width="{ew}" height="{eh}" fill="none" stroke="#2563EB" stroke-width="1.2"/>')
            svg.append(f'<path d="M {ex} {ey + eh} A {ew} {ew} 0 0 1 {ex + ew} {ey}" fill="rgba(59,130,246,0.1)" stroke="#3B82F6" stroke-width="1.2" stroke-dasharray="3,3"/>')
            svg.append(f'<line x1="{ex}" y1="{ey + eh}" x2="{ex}" y2="{ey}" stroke="#1D4ED8" stroke-width="2.5"/>')
            svg.append(f'<text x="{ex + ew/2}" y="{ey - 4}" font-family="sans-serif" font-size="8px" font-weight="bold" fill="#1D4ED8" text-anchor="middle">{eq["code"]}</text>')
        elif cat == "Window":
            svg.append(f'<rect x="{ex}" y="{ey}" width="{ew}" height="{eh}" fill="#E0F2FE" stroke="#0284C7" stroke-width="1.6"/>')
            svg.append(f'<line x1="{ex}" y1="{ey + eh/2}" x2="{ex + ew}" y2="{ey + eh/2}" stroke="#0284C7" stroke-width="1.5"/>')
            svg.append(f'<text x="{ex + ew/2}" y="{ey + eh/2}" font-family="sans-serif" font-size="8px" font-weight="bold" fill="#0369A1" text-anchor="middle" dominant-baseline="central">{eq["code"]}</text>')
        else:
            svg.append(f'<rect x="{ex}" y="{ey}" width="{ew}" height="{eh}" fill="{col}" fill-opacity="0.28" stroke="{col}" stroke-width="1.8" rx="3"/>')
            svg.append(f'<text x="{ex + ew/2}" y="{ey + eh/2 - 4}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle">{eq["code"]}</text>')
            svg.append(f'<text x="{ex + ew/2}" y="{ey + eh/2 + 8}" font-family="sans-serif" font-size="8" fill="#475569" text-anchor="middle">{eq["name"][:8]}</text>')

    # Dimensions Chains (100.0M Width, 50.0M Depth)
    dim_y_top = OFFSET_Y - 125
    svg.append(f'<line x1="{OFFSET_X}" y1="{OFFSET_Y - 30}" x2="{OFFSET_X}" y2="{dim_y_top - 5}" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="2,2"/>')
    svg.append(f'<line x1="{OFFSET_X + total_w_m * SCALE}" y1="{OFFSET_Y - 30}" x2="{OFFSET_X + total_w_m * SCALE}" y2="{dim_y_top - 5}" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="2,2"/>')
    svg.append(f'<line x1="{OFFSET_X + 4}" y1="{dim_y_top}" x2="{OFFSET_X + total_w_m * SCALE - 4}" y2="{dim_y_top}" stroke="#2563EB" stroke-width="1.5" marker-start="url(#dim-arrow-start)" marker-end="url(#dim-arrow-end)"/>')
    svg.append(f'<text x="{OFFSET_X + (total_w_m * SCALE) / 2}" y="{dim_y_top - 8}" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E3A8A" text-anchor="middle">廠房總寬度 100.00 M (20 跨 × 5.00 M)</text>')

    dim_x_left = OFFSET_X - 125
    y_factory_depth_px = (cols_y - 1) * bay_m * SCALE
    svg.append(f'<line x1="{OFFSET_X - 30}" y1="{OFFSET_Y}" x2="{dim_x_left - 5}" y2="{OFFSET_Y}" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="2,2"/>')
    svg.append(f'<line x1="{OFFSET_X - 30}" y1="{OFFSET_Y + y_factory_depth_px}" x2="{dim_x_left - 5}" y2="{OFFSET_Y + y_factory_depth_px}" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="2,2"/>')
    svg.append(f'<line x1="{dim_x_left}" y1="{OFFSET_Y + 4}" x2="{dim_x_left}" y2="{OFFSET_Y + y_factory_depth_px - 4}" stroke="#2563EB" stroke-width="1.5" marker-start="url(#dim-arrow-start)" marker-end="url(#dim-arrow-end)"/>')
    svg.append(f'<text x="{dim_x_left - 10}" y="{OFFSET_Y + y_factory_depth_px / 2}" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E3A8A" text-anchor="end" dominant-baseline="central" transform="rotate(-90 {dim_x_left - 10} {OFFSET_Y + y_factory_depth_px / 2})">廠房總深度 50.00 M (10 跨 × 5.00 M)</text>')

    # Title Block
    tb_w = 460
    tb_h = 175
    tb_x = svg_w - tb_w - 40
    tb_y = svg_h - tb_h - 40
    svg.append(f'''
    <g transform="translate({tb_x}, {tb_y})">
      <rect width="{tb_w}" height="{tb_h}" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
      <rect width="{tb_w}" height="45" fill="#1E3A8A"/>
      <text x="20" y="28" font-family="sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">金讚科技 · 廠房平面配置工程圖</text>
      <line x1="0" y1="45" x2="{tb_w}" y2="45" stroke="#CBD5E1" stroke-width="1"/>
      <line x1="0" y1="88" x2="{tb_w}" y2="88" stroke="#CBD5E1" stroke-width="1"/>
      <line x1="0" y1="130" x2="{tb_w}" y2="130" stroke="#CBD5E1" stroke-width="1"/>
      <line x1="150" y1="45" x2="150" y2="{tb_h}" stroke="#CBD5E1" stroke-width="1"/>
      <line x1="310" y1="45" x2="310" y2="{tb_h}" stroke="#CBD5E1" stroke-width="1"/>
      
      <text x="15" y="62" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">圖名 / TITLE</text>
      <text x="15" y="78" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">1F生產動線、建築元件與2F倉庫</text>
      <text x="165" y="62" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">圖號 / DWG NO.</text>
      <text x="165" y="78" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">CC-ENG-2026-004</text>
      <text x="325" y="62" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">版次 / REV</text>
      <text x="325" y="78" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">REV V2.0 (100M×50M)</text>

      <text x="15" y="104" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">繪製 / DESIGNER</text>
      <text x="15" y="120" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">Derek Yeh</text>
      <text x="165" y="104" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">標高 / ELEVATION</text>
      <text x="165" y="120" font-family="sans-serif" font-size="11" fill="#DC2626" font-weight="bold">1F +0.6M / 2F +4.4M</text>
      <text x="325" y="104" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">日期 / DATE</text>
      <text x="325" y="120" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">2026/09/07</text>

      <text x="15" y="146" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">規格 / SPEC</text>
      <text x="15" y="162" font-family="sans-serif" font-size="11" fill="#16A34A" font-weight="bold">100M×50M · 牆體/動線/元件</text>
      <text x="165" y="146" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">比例 / SCALE</text>
      <text x="165" y="162" font-family="sans-serif" font-size="11" fill="#0F172A" font-weight="bold">1:150 (Metric)</text>
      <text x="325" y="146" font-family="sans-serif" font-size="9" fill="#64748B" font-weight="600">狀態 / STATUS</text>
      <text x="325" y="162" font-family="sans-serif" font-size="11" fill="#16A34A" font-weight="800">APPROVED 正式版</text>
    </g>
    ''')

    svg.append('</svg>')

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg))

def update_all():
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Generate DXF
    generate_dxf(data, 'chin_chun_factory_layout.dxf')
    print('Generated chin_chun_factory_layout.dxf')

    # 2. Generate SVG
    generate_svg(data, 'chin_chun_factory_layout.svg')
    print('Generated chin_chun_factory_layout.svg')

if __name__ == '__main__':
    update_all()
