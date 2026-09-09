import json

with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Grid to 100M x 50M
data["grid"]["cols_x"] = 21 # 100M
data["grid"]["cols_y"] = 11 # 50M (10 bays x 5.0m)
data["grid"]["bay_size"] = 5.0
data["grid"]["factory_width"] = 100.0
data["grid"]["factory_depth"] = 50.0

# 2. Add Clear Span Exclusion Zone (Red Area with NO columns)
data["grid"]["column_exclusion_zones"] = [
    {
        "id": "adh_clear_span_red_zone",
        "name": "ADH 貼合區無柱大跨距空間 (紅色區域)",
        "x1": 0.5, # Exclude strictly inside
        "y1": 0.5,
        "x2": 34.5,
        "y2": 19.5,
        "reason": "大型貼合機主機與自動裁斷無柱作業空間"
    }
]

# 3. Update Architectural Double-line Walls (雙筆劃牆體)
# Each wall has x1, y1, x2, y2, thickness (meters), type, and double_line: true
data["walls"] = [
    # --- 外牆 Exterior Walls (300mm = 0.3m 雙實線) ---
    { "x1": 0.0, "y1": 0.0, "x2": 100.0, "y2": 0.0, "thickness": 0.3, "type": "exterior", "name": "北側建築外牆" },
    { "x1": 100.0, "y1": 0.0, "x2": 100.0, "y2": 50.0, "thickness": 0.3, "type": "exterior", "name": "東側建築外牆" },
    { "x1": 100.0, "y1": 50.0, "x2": 100.0, "y2": 67.0, "thickness": 0.3, "type": "exterior", "name": "東南側CNC外牆" },
    { "x1": 100.0, "y1": 67.0, "x2": 80.0, "y2": 67.0, "thickness": 0.3, "type": "exterior", "name": "CNC南側外牆" },
    { "x1": 80.0, "y1": 67.0, "x2": 80.0, "y2": 50.0, "thickness": 0.3, "type": "interior", "name": "CNC西側隔間牆" },
    { "x1": 100.0, "y1": 50.0, "x2": 0.0, "y2": 50.0, "thickness": 0.3, "type": "exterior", "name": "南側主要建築外牆" },
    { "x1": 0.0, "y1": 50.0, "x2": 0.0, "y2": 0.0, "thickness": 0.3, "type": "exterior", "name": "西側建築外牆" },

    # --- 貨車裝卸月台隔牆 (Double-line Wall at Y=35, with truck bays) ---
    { "x1": 0.0, "y1": 35.0, "x2": 35.0, "y2": 35.0, "thickness": 0.25, "type": "exterior", "name": "裝卸月台厚實體隔牆 (Truck Dock Wall)" },

    # --- 辦公室隔間牆 (Office 200mm = 0.2m 雙實線) ---
    { "x1": 35.0, "y1": 28.0, "x2": 47.0, "y2": 28.0, "thickness": 0.2, "type": "interior", "name": "辦公室北側牆" },
    { "x1": 47.0, "y1": 28.0, "x2": 47.0, "y2": 39.0, "thickness": 0.2, "type": "interior", "name": "辦公室東側牆" },
    { "x1": 47.0, "y1": 39.0, "x2": 35.0, "y2": 39.0, "thickness": 0.2, "type": "interior", "name": "辦公室南側牆" },
    { "x1": 35.0, "y1": 39.0, "x2": 35.0, "y2": 28.0, "thickness": 0.2, "type": "interior", "name": "辦公室西側牆" },

    # --- ADH 貼合區東側分區隔間牆 (X=35, Y=0 to 20) ---
    { "x1": 35.0, "y1": 0.0, "x2": 35.0, "y2": 20.0, "thickness": 0.2, "type": "interior", "name": "ADH區東側分隔牆" },

    # --- 北側貨梯井道 (Lift 1 Enclosure) ---
    { "x1": 28.0, "y1": 0.0, "x2": 28.0, "y2": 6.0, "thickness": 0.2, "type": "interior", "name": "北貨梯西牆" },
    { "x1": 28.0, "y1": 6.0, "x2": 34.0, "y2": 6.0, "thickness": 0.2, "type": "interior", "name": "北貨梯南牆" },
    { "x1": 34.0, "y1": 6.0, "x2": 34.0, "y2": 0.0, "thickness": 0.2, "type": "interior", "name": "北貨梯東牆" },

    # --- 西側樓梯與貨梯間隔牆 (West Stairs & Lift) ---
    { "x1": 13.0, "y1": 29.5, "x2": 24.5, "y2": 29.5, "thickness": 0.2, "type": "interior", "name": "西側梯廳北牆" },
    { "x1": 24.5, "y1": 29.5, "x2": 24.5, "y2": 35.0, "thickness": 0.2, "type": "interior", "name": "西側梯廳東牆" },
    { "x1": 13.0, "y1": 29.5, "x2": 13.0, "y2": 35.0, "thickness": 0.2, "type": "interior", "name": "西側梯廳西牆" },

    # --- CNC 防塵密閉隔間牆 (CNC Clean Enclosure) ---
    { "x1": 80.0, "y1": 55.0, "x2": 100.0, "y2": 55.0, "thickness": 0.2, "type": "interior", "name": "CNC防塵室北牆" },
    { "x1": 80.0, "y1": 55.0, "x2": 80.0, "y2": 67.0, "thickness": 0.2, "type": "interior", "name": "CNC防塵室西牆" }
]

# 4. Update Aisles
data["aisles"] = [
    { "x": 0.0, "y": 44.0, "width": 80.0, "height": 4.0, "name": "中央主幹物流道 (Main Forklift Aisle 4.0M)" },
    { "x": 48.0, "y": 11.0, "width": 3.0, "height": 33.0, "name": "南北向連通走道 (North-South Connector)" },
    { "x": 75.0, "y": 48.0, "width": 3.5, "height": 19.0, "name": "CNC 聯絡通道 (CNC Access Aisle)" }
]

# Save updated json
with open('factory_layout_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Successfully updated factory_layout_data.json with 100Mx50M and double-line walls!')
