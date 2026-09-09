import json

def update_layout():
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Ensure all walls have unique id
    for idx, w in enumerate(data.get("walls", [])):
        if "id" not in w:
            w["id"] = f"wall_{idx + 1}"

    # 2. Ensure all aisles have unique id
    for idx, a in enumerate(data.get("aisles", [])):
        if "id" not in a:
            a["id"] = f"aisle_{idx + 1}"

    # 3. Add initial flows (動線)
    data["flows"] = [
        {
            "id": "flow_forklift_main",
            "name": "中央物流幹道主動線 (Main Forklift Corridor)",
            "type": "forklift",
            "points": [
                {"x": 0.0, "y": 46.0},
                {"x": 80.0, "y": 46.0}
            ],
            "width_m": 3.0,
            "color": "#F59E0B",
            "dash": "8,4",
            "arrow_direction": "both"
        },
        {
            "id": "flow_connector_ns",
            "name": "南北物料聯絡動線 (North-South Connector)",
            "type": "forklift",
            "points": [
                {"x": 49.5, "y": 11.0},
                {"x": 49.5, "y": 44.0}
            ],
            "width_m": 2.2,
            "color": "#F59E0B",
            "dash": "8,4",
            "arrow_direction": "both"
        },
        {
            "id": "flow_pedestrian_1",
            "name": "作業人員安全步行動線 (Pedestrian Walkway)",
            "type": "pedestrian",
            "points": [
                {"x": 35.0, "y": 41.5},
                {"x": 48.0, "y": 41.5},
                {"x": 48.0, "y": 26.0}
            ],
            "width_m": 1.2,
            "color": "#10B981",
            "dash": "4,4",
            "arrow_direction": "forward"
        },
        {
            "id": "flow_process_adh_cut",
            "name": "貼合至裁切原料製程流向 (Process Flow)",
            "type": "process",
            "points": [
                {"x": 18.0, "y": 7.5},
                {"x": 23.0, "y": 7.5},
                {"x": 23.0, "y": 14.0}
            ],
            "width_m": 1.5,
            "color": "#3B82F6",
            "dash": "6,3",
            "arrow_direction": "forward"
        },
        {
            "id": "flow_evacuation_dock",
            "name": "西側逃生避難動線 (Emergency Evacuation)",
            "type": "evacuation",
            "points": [
                {"x": 35.0, "y": 32.0},
                {"x": 10.0, "y": 32.0},
                {"x": 0.0, "y": 35.0}
            ],
            "width_m": 1.5,
            "color": "#EF4444",
            "dash": "6,3",
            "arrow_direction": "forward"
        }
    ]

    # 4. Add initial architectural sample components into equipment list
    # (Office conference table, office single door, dock roll-up door)
    sample_arch = [
        {
            "id": "arch_door_office",
            "code": "DOOR-090",
            "name": "辦公室單開木門",
            "zone": "辦公室",
            "floor": "1F",
            "x": 35.0,
            "y": 32.0,
            "width": 0.9,
            "height": 0.15,
            "rotation": 90,
            "color": "#92400E",
            "category": "Door"
        },
        {
            "id": "arch_door_dock",
            "code": "ROLL-400",
            "name": "裝卸月台電動捲門",
            "zone": "裝卸區",
            "floor": "1F",
            "x": 0.0,
            "y": 36.0,
            "width": 4.0,
            "height": 0.35,
            "rotation": 90,
            "color": "#475569",
            "category": "Door"
        },
        {
            "id": "arch_conf_table",
            "code": "CONF-08",
            "name": "8人主管會議長桌組",
            "zone": "辦公室",
            "floor": "1F",
            "x": 38.5,
            "y": 32.0,
            "width": 3.6,
            "height": 1.4,
            "rotation": 0,
            "color": "#854D0E",
            "category": "Furniture"
        },
        {
            "id": "arch_win_office_1",
            "code": "WIN-150",
            "name": "辦公室南側採光氣密窗",
            "zone": "辦公室",
            "floor": "1F",
            "x": 39.0,
            "y": 39.0,
            "width": 1.5,
            "height": 0.2,
            "rotation": 0,
            "color": "#0284C7",
            "category": "Window"
        }
    ]

    existing_eq_ids = {eq["id"] for eq in data["equipment"]}
    for arch in sample_arch:
        if arch["id"] not in existing_eq_ids:
            data["equipment"].append(arch)

    with open('factory_layout_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Updated factory_layout_data.json: {len(data['walls'])} walls with IDs, {len(data['flows'])} flows, {len(data['equipment'])} equipment & components.")

if __name__ == '__main__':
    update_layout()
