import json
import subprocess

with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
    layout_data = json.load(f)

m2f = layout_data["mezzanine_2f"]
mezz_x = m2f["grid_x"]
mezz_y = m2f["grid_y"]
SCALE = 36.0 # Higher resolution for 2F close-up
OFFSET_X = 140
OFFSET_Y = 160

width_m = mezz_x["total_width"] # 35.0m
depth_m = mezz_y["total_depth"] # 28.5m

svg_w = int(width_m * SCALE + OFFSET_X + 160)
svg_h = int(depth_m * SCALE + OFFSET_Y + 160)

svg = []
svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="{svg_w}" height="{svg_h}">')
svg.append("""
<defs>
  <pattern id="mezzGrating" width="12" height="6" patternUnits="userSpaceOnUse">
    <rect width="12" height="6" fill="#F0F9FF"/>
    <line x1="0" y1="0" x2="12" y2="0" stroke="#38BDF8" stroke-width="0.8" stroke-opacity="0.5"/>
    <line x1="0" y1="3" x2="12" y2="3" stroke="#BAE6FD" stroke-width="0.5" stroke-opacity="0.4"/>
  </pattern>
  <pattern id="exHatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="14" height="14" fill="#F1F5F9"/>
    <line x1="0" y1="0" x2="0" y2="14" stroke="#475569" stroke-width="1.2" stroke-opacity="0.55"/>
  </pattern>
  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M 0 2 L 10 5 L 0 8 Z" fill="#4F46E5"/>
  </marker>
  <marker id="arrowAmber" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M 0 2 L 10 5 L 0 8 Z" fill="#D97706"/>
  </marker>
</defs>
""")

# Canvas Background
svg.append(f'<rect width="{svg_w}" height="{svg_h}" fill="#F8FAFC"/>')
svg.append(f'<rect x="{OFFSET_X - 10}" y="{OFFSET_Y - 10}" width="{width_m * SCALE + 20}" height="{depth_m * SCALE + 20}" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="4"/>')

# Grid Lines (1 to 8)
for i, (name, xm) in enumerate(zip(mezz_x["names"], mezz_x["coords"])):
    px = OFFSET_X + xm * SCALE
    py1 = OFFSET_Y - 30
    py2 = OFFSET_Y + depth_m * SCALE + 20
    svg.append(f'<line x1="{px}" y1="{py1}" x2="{px}" y2="{py2}" stroke="#6366F1" stroke-width="1" stroke-dasharray="6,3" stroke-opacity="0.7"/>')
    svg.append(f'<circle cx="{px}" cy="{py1 - 15}" r="12" fill="#FFFFFF" stroke="#4F46E5" stroke-width="1.8"/>')
    svg.append(f'<text x="{px}" y="{py1 - 15}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">{name}</text>')

# Grid Lines (A to G)
for j, (name, ym) in enumerate(zip(mezz_y["names"], mezz_y["coords"])):
    py = OFFSET_Y + ym * SCALE
    px1 = OFFSET_X - 30
    px2 = OFFSET_X + width_m * SCALE + 20
    svg.append(f'<line x1="{px1}" y1="{py}" x2="{px2}" y2="{py}" stroke="#6366F1" stroke-width="1" stroke-dasharray="6,3" stroke-opacity="0.7"/>')
    svg.append(f'<circle cx="{px1 - 15}" cy="{py}" r="12" fill="#FFFFFF" stroke="#4F46E5" stroke-width="1.8"/>')
    svg.append(f'<text x="{px1 - 15}" y="{py}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#4F46E5" text-anchor="middle" dominant-baseline="central">{name}</text>')

# Mezzanine Decks
for z in m2f["zones"]:
    zx = OFFSET_X + z["x"] * SCALE
    zy = OFFSET_Y + z["y"] * SCALE
    zw = z["width"] * SCALE
    zh = z["height"] * SCALE
    pat = "url(#exHatch)" if z["pattern"] == "hatch_diagonal" else "url(#mezzGrating)"
    svg.append(f'<rect x="{zx}" y="{zy}" width="{zw}" height="{zh}" fill="{pat}" stroke="#2563EB" stroke-width="2.5" rx="2"/>')
    svg.append(f'<rect x="{zx + zw/2 - 80}" y="{zy + zh/2 - 20}" width="160" height="40" rx="6" fill="rgba(255,255,255,0.94)" stroke="#2563EB" stroke-width="1.2"/>')
    svg.append(f'<text x="{zx + zw/2}" y="{zy + zh/2 - 6}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1E40AF" text-anchor="middle">{z["thai_name"]} {z["name"].split()[0]}</text>')
    svg.append(f'<text x="{zx + zw/2}" y="{zy + zh/2 + 8}" font-family="sans-serif" font-size="9.5" font-weight="bold" fill="#DC2626" text-anchor="middle">[2] EL. +4.40M ({z["area_sqm"]}m²)</text>')

# Handrails
for hr in m2f["handrails"]:
    x1 = OFFSET_X + hr["x1"] * SCALE
    y1 = OFFSET_Y + hr["y1"] * SCALE
    x2 = OFFSET_X + hr["x2"] * SCALE
    y2 = OFFSET_Y + hr["y2"] * SCALE
    svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#FEF3C7" stroke-width="6" stroke-linecap="round" opacity="0.6"/>')
    svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#D97706" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="6,3"/>')

# Stairs & Lift
vc = m2f["vertical_circulation"]
lx = OFFSET_X + vc["lift"]["x"] * SCALE
ly = OFFSET_Y + vc["lift"]["y"] * SCALE
lw = vc["lift"]["width"] * SCALE
lh = vc["lift"]["height"] * SCALE
svg.append(f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="#334155" stroke="#94A3B8" stroke-width="2" rx="3"/>')
svg.append(f'<text x="{lx + lw/2}" y="{ly + lh/2}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#38BDF8" text-anchor="middle" dominant-baseline="central">LIFT 貨梯</text>')

sx = OFFSET_X + vc["stair"]["x"] * SCALE
sy = OFFSET_Y + vc["stair"]["y"] * SCALE
sw = vc["stair"]["width"] * SCALE
sh = vc["stair"]["height"] * SCALE
svg.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" fill="#F8FAFC" stroke="#475569" stroke-width="2" rx="2"/>')
for s in range(1, 14):
    step_y = sy + s * (sh / 14)
    svg.append(f'<line x1="{sx}" y1="{step_y}" x2="{sx + sw}" y2="{step_y}" stroke="#94A3B8" stroke-width="1"/>')
svg.append(f'<text x="{sx + sw/2}" y="{sy - 8}" font-family="sans-serif" font-size="9" font-weight="bold" fill="#1D4ED8" text-anchor="middle">STAIR ST-01 (S-05)</text>')

# 2F Racks
for eq in layout_data["equipment_2f"]:
    ex = OFFSET_X + eq["x"] * SCALE
    ey = OFFSET_Y + eq["y"] * SCALE
    ew = eq["width"] * SCALE
    eh = eq["height"] * SCALE
    col = eq.get("color", "#3182CE")
    svg.append(f'<rect x="{ex}" y="{ey}" width="{ew}" height="{eh}" fill="{col}" fill-opacity="0.3" stroke="{col}" stroke-width="2" rx="2"/>')
    svg.append(f'<text x="{ex + ew/2}" y="{ey + eh/2 - 4}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0F172A" text-anchor="middle">{eq["code"]}</text>')
    svg.append(f'<text x="{ex + ew/2}" y="{ey + eh/2 + 7}" font-family="sans-serif" font-size="8" font-weight="600" fill="#334155" text-anchor="middle">{eq["name"]}</text>')

# Top Dimensions (5.00m each)
for i in range(len(mezz_x["coords"]) - 1):
    x1 = OFFSET_X + mezz_x["coords"][i] * SCALE
    x2 = OFFSET_X + mezz_x["coords"][i+1] * SCALE
    y = OFFSET_Y - 55
    svg.append(f'<line x1="{x1 + 4}" y1="{y}" x2="{x2 - 4}" y2="{y}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#arrow)" marker-end="url(#arrow)"/>')
    svg.append(f'<text x="{(x1 + x2)/2}" y="{y - 5}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#4F46E5" text-anchor="middle">5.00 m</text>')

# Left Dimensions (4.75m each)
for j in range(len(mezz_y["coords"]) - 1):
    y1 = OFFSET_Y + mezz_y["coords"][j] * SCALE
    y2 = OFFSET_Y + mezz_y["coords"][j+1] * SCALE
    x = OFFSET_X - 55
    svg.append(f'<line x1="{x}" y1="{y1 + 4}" x2="{x}" y2="{y2 - 4}" stroke="#4F46E5" stroke-width="1.3" marker-start="url(#arrow)" marker-end="url(#arrow)"/>')
    svg.append(f'<text x="{x - 6}" y="{(y1 + y2)/2}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#4F46E5" text-anchor="end" dominant-baseline="central">4.75 m</text>')

# Overall Titles
svg.append(f'<text x="{OFFSET_X + (width_m * SCALE)/2}" y="{OFFSET_Y - 85}" font-family="sans-serif" font-size="14" font-weight="800" fill="#1E1B4B" text-anchor="middle">二樓倉庫總寬度 35.00 M (1~8 軸 · 7 跨 × 5.00 M)</text>')
svg.append(f'<text x="{OFFSET_X - 85}" y="{OFFSET_Y + (depth_m * SCALE)/2}" font-family="sans-serif" font-size="13" font-weight="800" fill="#1E1B4B" text-anchor="middle" transform="rotate(-90 {OFFSET_X - 85} {OFFSET_Y + (depth_m * SCALE)/2})">倉庫總深度 28.50 M (A~G 軸 · 6 跨 × 4.75 M)</text>')

svg.append('</svg>')

output_svg = '/Users/derek_thomas/.gemini/antigravity-ide/brain/a3f8e1bf-a8a8-4854-b28b-91e9a8ae5c57/warehouse_2f_view.svg'
with open(output_svg, 'w', encoding='utf-8') as f:
    f.write('\n'.join(svg))

print('Generated warehouse_2f_view.svg')
subprocess.run(['qlmanage', '-t', '-s', '2000', '-o', '/Users/derek_thomas/.gemini/antigravity-ide/brain/a3f8e1bf-a8a8-4854-b28b-91e9a8ae5c57', output_svg])
print('Rendered thumbnail PNG')
