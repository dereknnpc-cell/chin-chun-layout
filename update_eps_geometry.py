"""Apply the authoritative 2026 Layout for AI.eps geometry to baseline data.

The EPS uses a 5 m structural grid.  Its first column centre is at
(144.856 pt, 107.754 pt) and adjacent grid centres are 35.433 pt apart.
The measurements below were read from the vector objects, not from a raster
screenshot.  Coordinates in the application remain metres from X1/Y1.
"""

from __future__ import annotations

import json
from pathlib import Path


DATA_PATH = Path(__file__).with_name("factory_layout_data.json")
SOURCE_REVISION = "2026-layout-for-ai-eps-v1.2-r2"


# x, y, width, height in metres, transformed from the EPS vector bounds.
EQUIPMENT_GEOMETRY = {
    "eq_dc_n1_1": (5.24, 1.06, 1.35, 3.74),
    "eq_vcut2_j1_1": (10.00, 0.73, 4.45, 4.57),
    "eq_tcut2": (18.84, 0.73, 4.45, 2.68),
    "eq_tcut1": (18.84, 3.92, 4.45, 2.68),
    "eq_adh1_m1_1": (4.75, 6.15, 30.25, 4.00),
    "eq_lift_north": (29.75, 0.00, 5.48, 5.30),
    "eq_compressor": (44.00, -2.50, 6.00, 2.20),
    "eq_foam_f1_1": (40.01, 0.95, 15.00, 3.80),
    "eq_eva1_a1_1": (65.00, 0.95, 13.60, 3.70),
    "eq_latex_h1_1": (82.08, 7.50, 14.82, 2.00),
    "eq_adh2_m2_1": (4.85, 15.20, 25.00, 4.30),
    "eq_qa2_q2_2": (23.91, 19.89, 4.00, 2.65),
    "eq_qa1_q2_1": (23.95, 22.94, 4.00, 2.65),
    "eq_qa3_q2_3": (11.55, 25.18, 2.65, 4.00),
    "eq_lift_west": (20.09, 30.24, 3.00, 2.50),
    "eq_stairs": (35.00, 20.20, 5.00, 5.00),
    "eq_office": (45.12, 30.23, 5.03, 9.64),
    "eq_af1_g2_1": (51.20, 15.25, 2.40, 4.19),
    "eq_af2_g2_2": (45.23, 21.64, 4.00, 2.40),
    "eq_qc4_b1_4": (56.97, 15.22, 2.35, 5.00),
    "eq_qc3_b1_3": (60.53, 15.18, 2.20, 5.00),
    "eq_qc2_b1_2": (66.63, 15.10, 2.85, 5.00),
    "eq_qc1_b1_1": (70.59, 15.13, 2.85, 5.00),
    "eq_eva3": (85.36, 15.72, 13.60, 3.70),
    "eq_pf1_c1_1": (59.89, 30.55, 20.23, 4.20),
    "eq_autocut2_e1_2": (81.19, 30.77, 5.03, 2.00),
    "eq_autocut1_e1_1": (81.19, 36.28, 5.03, 1.99),
    "eq_vcut1_j1_2": (75.25, 35.34, 4.45, 4.57),
    "eq_pf2_c1_2": (66.62, 35.59, 6.75, 4.20),
    "eq_diecut_l4_1": (60.20, 36.73, 3.25, 3.00),
    "eq_vcut3_j1_3": (59.97, 40.51, 4.45, 4.57),
    "eq_diecut_sub": (55.76, 40.90, 3.25, 3.00),
    "eq_eva2_a1_2": (65.07, 41.47, 20.23, 2.00),
    "eq_slice1_d1_1": (90.31, 41.99, 4.20, 12.09),
    "eq_welding": (94.65, 43.45, 4.20, 9.00),
    "eq_fdc_i1_1": (92.36, 30.65, 2.20, 1.80),
    "eq_fdc_i1_5": (96.65, 30.65, 2.20, 1.80),
    "eq_fdc_k1_1": (90.69, 33.18, 2.00, 1.52),
    "eq_fdc_k1_2": (93.43, 33.30, 2.00, 1.52),
    "eq_fdc_i1_4": (96.65, 32.90, 2.20, 1.80),
    "eq_cnc_room": (81.01, 56.48, 19.72, 10.12),
    "eq_cnc_p1_1": (91.16, 63.88, 2.50, 2.50),
    "eq_cnc_p1_2": (94.40, 63.88, 2.50, 2.50),
    "eq_cnc_p1_3": (97.64, 63.88, 2.50, 2.50),
    "eq_cnc_p1_4": (97.64, 60.28, 2.50, 2.50),
    "eq_cnc_p1_5": (97.64, 57.16, 2.50, 2.50),
    "eq_guard": (-5.00, 55.67, 4.52, 8.00),
    "eq_gate": (-5.00, 42.00, 4.50, 12.00),
    "eq_pallet_1": (38.00, 52.25, 18.00, 4.00),
    "eq_pallet_2": (60.00, 52.25, 17.00, 4.00),
    "eq_pallet_3": (78.00, 52.25, 8.00, 4.00),
}


CATEGORY_OVERRIDES = {
    "eq_lift_north": "Elevator",
    "eq_lift_west": "Elevator",
    "eq_stairs": "Stairs",
}


def wall(identifier, name, x1, y1, x2, y2, thickness=0.20, kind="interior"):
    return {
        "id": identifier,
        "name": name,
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2,
        "thickness": thickness,
        "type": kind,
    }


# Architectural lines visible in the EPS.  Openings are intentionally left open.
WALLS = [
    wall("wall_1", "主廠房西側外牆", 0.00, 0.00, 0.00, 40.00, 0.30, "exterior"),
    wall("wall_2", "主廠房北側外牆（西段）", 0.00, 0.00, 55.00, 0.00, 0.30, "exterior"),
    wall("wall_3", "東側建築外牆", 100.00, 0.00, 100.00, 40.00, 0.30, "exterior"),
    wall("wall_4", "東側附屬區西牆", 90.00, 20.00, 90.00, 40.00),
    wall("wall_5", "東側附屬區北牆", 90.00, 20.00, 100.00, 20.00),
    wall("wall_6", "東側附屬區 Y6 分隔牆", 90.00, 25.00, 100.00, 25.00),
    wall("wall_7", "東側附屬區 Y7 分隔牆", 90.00, 30.00, 100.00, 30.00),
    wall("wall_8", "東側附屬區 Y8 分隔牆", 90.00, 35.00, 100.00, 35.00),
    wall("wall_9", "東側附屬區南牆", 90.00, 40.00, 100.00, 40.00),
    wall("wall_10", "主廠房南牆（中央段）", 55.00, 40.00, 85.25, 40.00),
    wall("wall_11", "裝卸月台北側牆", 0.00, 35.00, 15.00, 35.00, 0.25),
    wall("wall_12", "北側貨梯西牆", 29.75, 0.00, 29.75, 5.30),
    wall("wall_13", "北側貨梯東牆", 35.25, 0.00, 35.25, 5.30),
    wall("wall_14", "北側貨梯南牆", 29.75, 5.30, 35.25, 5.30),
    wall("wall_15", "辦公區北側牆", 35.25, 30.00, 45.00, 30.00),
    wall("wall_16", "辦公區西側牆", 35.00, 30.20, 35.00, 35.00),
    wall("wall_17", "辦公區中央隔牆", 40.00, 30.20, 40.00, 34.90),
    wall("wall_18", "辦公區東側牆", 45.00, 30.20, 45.00, 40.00),
    wall("wall_19", "辦公區中段橫牆", 40.25, 35.00, 45.00, 35.00),
    wall("wall_20", "西側梯廳東牆", 30.00, 35.25, 30.00, 40.00),
    wall("wall_21", "西側梯廳北牆", 20.00, 35.00, 30.00, 35.00),
    wall("wall_22", "CNC 防塵室北牆", 81.00, 56.50, 100.70, 56.50),
    wall("wall_23", "CNC 防塵室西牆", 81.00, 56.50, 81.00, 66.60),
    wall("wall_24", "CNC 防塵室南牆", 81.00, 66.60, 100.70, 66.60),
    wall("wall_25", "CNC 防塵室東牆", 100.70, 56.50, 100.70, 66.60),
]


# Missing markers measured from the EPS.  Everything else in the 21 x 9 grid exists.
MISSING_COLUMNS = {
    (19, 1), (20, 1), (21, 1),
    (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (19, 2), (20, 2), (21, 2),
    (2, 3), (3, 3), (4, 3), (5, 3), (6, 3), (19, 3), (20, 3), (21, 3),
    (2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (19, 4), (20, 4), (21, 4),
    (5, 5), (6, 5), (5, 6), (6, 6),
    (2, 8), (3, 8), (4, 8), (2, 9), (3, 9), (4, 9),
}


def build_columns():
    columns = []
    for row in range(1, 10):
        for column in range(1, 22):
            if (column, row) in MISSING_COLUMNS:
                continue
            columns.append(
                {
                    "id": f"col_x{column}_y{row}",
                    "code": f"C-X{column}-Y{row}",
                    "name": f"結構柱 X{column}-Y{row}",
                    "x": (column - 1) * 5.0,
                    "y": (row - 1) * 5.0,
                    "width": 0.5,
                    "height": 0.5,
                    "rotation": 0,
                    "color": "#334155",
                    "category": "Column",
                    "floor": "1F",
                }
            )
    return columns


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    data["version"] = "V2.6"
    data["source_geometry_revision"] = SOURCE_REVISION
    data["source_geometry_file"] = "2026 Layout for AI.eps"
    data["grid"].update(
        {
            "cols_x": 21,
            "cols_y": 9,
            "factory_width": 100.0,
            "factory_depth": 40.0,
        }
    )

    updated = set()
    for equipment in data["equipment"]:
        geometry = EQUIPMENT_GEOMETRY.get(equipment["id"])
        if geometry:
            equipment["x"], equipment["y"], equipment["width"], equipment["height"] = geometry
            updated.add(equipment["id"])
        if equipment["id"] in CATEGORY_OVERRIDES:
            equipment["category"] = CATEGORY_OVERRIDES[equipment["id"]]

    missing_equipment = set(EQUIPMENT_GEOMETRY) - updated
    if missing_equipment:
        raise RuntimeError(f"Missing baseline equipment IDs: {sorted(missing_equipment)}")

    data["walls"] = WALLS
    data["columns"] = build_columns()
    if len(data["columns"]) != 152:
        raise RuntimeError(f"Expected 152 EPS columns, got {len(data['columns'])}")

    if isinstance(data.get("title_block"), dict):
        data["title_block"]["rev"] = "REV V2.6"
        data["title_block"]["date"] = "2026/09/14"
        data["title_block"]["spec"] = "EPS V1.2 校正 · 100M×40M 柱網"

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Applied {SOURCE_REVISION}: {len(updated)} equipment, "
        f"{len(data['walls'])} walls, {len(data['columns'])} columns."
    )


if __name__ == "__main__":
    main()
