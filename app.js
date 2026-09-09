/**
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

  // Expanded Site Master Plan Bounds (140M x 90M default)
  const SITE_EXP_W_M = 140.0;
  const SITE_EXP_H_M = 90.0;
  const SITE_MARGIN_X_M = 20.0; // 20m West & East outdoor space
  const SITE_MARGIN_Y_M = 20.0; // 20m North & South outdoor space

  const SVG_WIDTH = Math.round((SITE_EXP_W_M + 40) * SCALE + OFFSET_X);
  const SVG_HEIGHT = Math.round((SITE_EXP_H_M + 40) * SCALE + OFFSET_Y);

  // --- Storage Keys ---
  const STORAGE_KEY_LAYOUT = "chin_chun_layout_custom_v2";
  const STORAGE_KEY_CUSTOM_LIB = "chin_chun_custom_equipment_lib_v2";

  // --- Initial Factory Baseline Data ---
  const INITIAL_LAYOUT = {
  "title": "金讚廠房工程平面配置圖 (Chin Chun Layout)",
  "drawing_number": "CC-ENG-2026-001",
  "author": "Derek Yeh",
  "version": "V1.3",
  "date": "2026/08/05",
  "grid": {
    "bay_size": 5.0,
    "cols_x": 21,
    "cols_y": 11,
    "col_size": 0.5,
    "origin_x": 0.0,
    "origin_y": 0.0,
    "factory_width": 100.0,
    "factory_depth": 50.0
  },
  "equipment": [
    {
      "id": "eq_dc_n1_1",
      "code": "N1-1",
      "name": "DC (集塵設備/DC)",
      "zone": "ADH 1",
      "x": 3.5,
      "y": 2.0,
      "width": 3.2,
      "height": 3.8,
      "color": "#4A90E2",
      "category": "ADH",
      "floor": "1F"
    },
    {
      "id": "eq_vcut2_j1_1",
      "code": "J1-1",
      "name": "V Cut 2 (V型裁斷機)",
      "zone": "ADH 1",
      "x": 9.5,
      "y": 1.2,
      "width": 4.5,
      "height": 4.6,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_tcut2",
      "code": "T Cut 2",
      "name": "T Cut 2 (裁切機 2)",
      "zone": "ADH 1",
      "x": 18.2,
      "y": 1.2,
      "width": 4.5,
      "height": 2.7,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_tcut1",
      "code": "T Cut 1",
      "name": "T Cut 1 (裁切機 1)",
      "zone": "ADH 1",
      "x": 18.2,
      "y": 4.3,
      "width": 4.5,
      "height": 2.7,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_adh1_m1_1",
      "code": "M1-1",
      "name": "ADH 1 (貼合機主機 M1-1)",
      "zone": "ADH 1",
      "x": 9.0,
      "y": 7.5,
      "width": 9.5,
      "height": 2.2,
      "color": "#2B6CB0",
      "category": "ADH",
      "floor": "1F"
    },
    {
      "id": "eq_lift_north",
      "code": "Lift 1",
      "name": "貨梯 (北側貨梯)",
      "zone": "Utility",
      "x": 28.5,
      "y": 1.0,
      "width": 4.8,
      "height": 4.5,
      "color": "#718096",
      "category": "Utility",
      "floor": "1F"
    },
    {
      "id": "eq_compressor",
      "code": "ปั๊มลม",
      "name": "空壓機房 (Air Compressor)",
      "zone": "Utility",
      "x": 44.0,
      "y": -2.5,
      "width": 6.0,
      "height": 2.2,
      "color": "#4A5568",
      "category": "Utility",
      "floor": "1F"
    },
    {
      "id": "eq_foam_f1_1",
      "code": "F1-1",
      "name": "Foam (發泡線主機 F1-1)",
      "zone": "Foam/Latex",
      "x": 42.0,
      "y": 2.0,
      "width": 14.5,
      "height": 4.2,
      "color": "#319795",
      "category": "Foam",
      "floor": "1F"
    },
    {
      "id": "eq_eva1_a1_1",
      "code": "A1-1",
      "name": "EVA 1 (EVA 生產線 A1-1)",
      "zone": "EVA",
      "x": 64.5,
      "y": 2.0,
      "width": 18.0,
      "height": 4.5,
      "color": "#2C7A7B",
      "category": "EVA",
      "floor": "1F"
    },
    {
      "id": "eq_latex_h1_1",
      "code": "H1-1",
      "name": "Latex (乳膠加工機 H1-1)",
      "zone": "Foam/Latex",
      "x": 84.0,
      "y": 6.5,
      "width": 12.5,
      "height": 4.0,
      "color": "#319795",
      "category": "Latex",
      "floor": "1F"
    },
    {
      "id": "eq_adh2_m2_1",
      "code": "M2-1",
      "name": "ADH 2 (貼合機主機 M2-1)",
      "zone": "ADH 2",
      "x": 9.0,
      "y": 14.5,
      "width": 11.5,
      "height": 2.5,
      "color": "#2B6CB0",
      "category": "ADH",
      "floor": "1F"
    },
    {
      "id": "eq_qa2_q2_2",
      "code": "Q2-2",
      "name": "QA 2 (品管檢測站 2)",
      "zone": "ADH 2",
      "x": 23.5,
      "y": 19.5,
      "width": 2.8,
      "height": 2.2,
      "color": "#3182CE",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_qa1_q2_1",
      "code": "Q2-1",
      "name": "QA 1 (品管檢測站 1)",
      "zone": "ADH 2",
      "x": 23.5,
      "y": 22.5,
      "width": 2.8,
      "height": 2.2,
      "color": "#3182CE",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_qa3_q2_3",
      "code": "Q2-3",
      "name": "QA 3 (品管檢測站 3)",
      "zone": "ADH 2",
      "x": 10.5,
      "y": 24.5,
      "width": 2.2,
      "height": 4.8,
      "color": "#3182CE",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_lift_west",
      "code": "貨梯",
      "name": "貨梯 (西側重型貨梯)",
      "zone": "Utility",
      "x": 19.0,
      "y": 29.5,
      "width": 4.8,
      "height": 4.8,
      "color": "#718096",
      "category": "Utility",
      "floor": "1F"
    },
    {
      "id": "eq_stairs",
      "code": "連通道",
      "name": "連通道 / 樓梯間",
      "zone": "Utility",
      "x": 13.5,
      "y": 32.5,
      "width": 5.0,
      "height": 3.2,
      "color": "#48BB78",
      "category": "Utility",
      "floor": "1F"
    },
    {
      "id": "eq_office",
      "code": "Office",
      "name": "廠務辦公室 (Office)",
      "zone": "Office",
      "x": 35.5,
      "y": 28.5,
      "width": 11.5,
      "height": 10.5,
      "color": "#CBD5E0",
      "category": "Office",
      "floor": "1F"
    },
    {
      "id": "eq_af1_g2_1",
      "code": "G2-1",
      "name": "AF 1 (自動化設備 1)",
      "zone": "QC Line",
      "x": 51.0,
      "y": 14.5,
      "width": 2.4,
      "height": 5.5,
      "color": "#4A90E2",
      "category": "Automation",
      "floor": "1F"
    },
    {
      "id": "eq_af2_g2_2",
      "code": "G2-2",
      "name": "AF 2 (自動化設備 2)",
      "zone": "QC Line",
      "x": 44.5,
      "y": 22.5,
      "width": 4.8,
      "height": 3.8,
      "color": "#4A90E2",
      "category": "Automation",
      "floor": "1F"
    },
    {
      "id": "eq_qc4_b1_4",
      "code": "B1-4",
      "name": "QC 4 (品檢桌 4)",
      "zone": "QC Line",
      "x": 56.5,
      "y": 14.0,
      "width": 2.5,
      "height": 5.2,
      "color": "#63B3ED",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_qc3_b1_3",
      "code": "B1-3",
      "name": "QC 3 (品檢桌 3)",
      "zone": "QC Line",
      "x": 60.0,
      "y": 14.0,
      "width": 2.5,
      "height": 5.2,
      "color": "#63B3ED",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_qc2_b1_2",
      "code": "B1-2",
      "name": "QC 2 (品檢桌 2)",
      "zone": "QC Line",
      "x": 66.5,
      "y": 14.0,
      "width": 2.5,
      "height": 5.2,
      "color": "#63B3ED",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_qc1_b1_1",
      "code": "B1-1",
      "name": "QC 1 (品檢桌 1)",
      "zone": "QC Line",
      "x": 70.5,
      "y": 14.0,
      "width": 2.5,
      "height": 5.2,
      "color": "#63B3ED",
      "category": "QC",
      "floor": "1F"
    },
    {
      "id": "eq_eva3",
      "code": "EVA 3",
      "name": "EVA 3 (EVA 產線 3)",
      "zone": "EVA",
      "x": 78.5,
      "y": 15.0,
      "width": 11.0,
      "height": 7.5,
      "color": "#2C7A7B",
      "category": "EVA",
      "floor": "1F"
    },
    {
      "id": "eq_pf1_c1_1",
      "code": "C1-1",
      "name": "PF 1 (精密切斷機 1)",
      "zone": "Cutting",
      "x": 58.0,
      "y": 28.5,
      "width": 18.5,
      "height": 3.8,
      "color": "#D69E2E",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_autocut2_e1_2",
      "code": "E1-2",
      "name": "Auto Cut 2 (自動裁斷機 2)",
      "zone": "Cutting",
      "x": 81.0,
      "y": 29.5,
      "width": 5.0,
      "height": 2.2,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_autocut1_e1_1",
      "code": "E1-1",
      "name": "Auto Cut 1 (自動裁斷機 1)",
      "zone": "Cutting",
      "x": 81.0,
      "y": 35.0,
      "width": 5.0,
      "height": 2.2,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_vcut1_j1_2",
      "code": "J1-2",
      "name": "V Cut 1 (V型裁斷機 1)",
      "zone": "Cutting",
      "x": 75.0,
      "y": 34.0,
      "width": 4.5,
      "height": 4.5,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_pf2_c1_2",
      "code": "C1-2",
      "name": "PF 2 (精密切斷機 2)",
      "zone": "Cutting",
      "x": 66.0,
      "y": 34.0,
      "width": 7.5,
      "height": 3.5,
      "color": "#D69E2E",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_diecut_l4_1",
      "code": "L4-1",
      "name": "Die Cut (模切機 L4-1)",
      "zone": "Cutting",
      "x": 58.5,
      "y": 34.0,
      "width": 4.2,
      "height": 4.0,
      "color": "#ECC94B",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_vcut3_j1_3",
      "code": "J1-3",
      "name": "V Cut 3 (V型裁斷機 3)",
      "zone": "Cutting",
      "x": 59.5,
      "y": 39.5,
      "width": 4.5,
      "height": 4.5,
      "color": "#F5A623",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_diecut_sub",
      "code": "Die Cut",
      "name": "Die Cut (沖床模切機)",
      "zone": "Cutting",
      "x": 55.0,
      "y": 39.5,
      "width": 3.8,
      "height": 4.0,
      "color": "#ECC94B",
      "category": "Cutting",
      "floor": "1F"
    },
    {
      "id": "eq_eva2_a1_2",
      "code": "A1-2",
      "name": "EVA 2 (EVA 生產線 A1-2)",
      "zone": "EVA",
      "x": 65.5,
      "y": 39.5,
      "width": 18.0,
      "height": 3.5,
      "color": "#2C7A7B",
      "category": "EVA",
      "floor": "1F"
    },
    {
      "id": "eq_slice1_d1_1",
      "code": "D1-1",
      "name": "Slice 1 (分切機 D1-1)",
      "zone": "Slicing",
      "x": 90.5,
      "y": 42.0,
      "width": 4.5,
      "height": 9.5,
      "color": "#9F7AEA",
      "category": "Slicing",
      "floor": "1F"
    },
    {
      "id": "eq_welding",
      "code": "Welding",
      "name": "Welding (焊接工作站)",
      "zone": "Welding",
      "x": 95.5,
      "y": 42.0,
      "width": 4.5,
      "height": 9.5,
      "color": "#805AD5",
      "category": "Welding",
      "floor": "1F"
    },
    {
      "id": "eq_fdc_k1_1",
      "code": "K1-1",
      "name": "FDC 物料架 K1-1",
      "zone": "Storage",
      "x": 89.5,
      "y": 28.5,
      "width": 2.4,
      "height": 2.8,
      "color": "#38A169",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_fdc_k1_2",
      "code": "K1-2",
      "name": "FDC 物料架 K1-2",
      "zone": "Storage",
      "x": 92.5,
      "y": 28.5,
      "width": 2.4,
      "height": 2.8,
      "color": "#38A169",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_fdc_i1_1",
      "code": "I1-1",
      "name": "FDC 棧板區 I1-1",
      "zone": "Storage",
      "x": 92.0,
      "y": 32.0,
      "width": 2.4,
      "height": 2.8,
      "color": "#38A169",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_fdc_i1_4",
      "code": "I1-4",
      "name": "FDC 棧板區 I1-4",
      "zone": "Storage",
      "x": 95.5,
      "y": 32.0,
      "width": 2.4,
      "height": 2.8,
      "color": "#38A169",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_fdc_i1_5",
      "code": "I1-5",
      "name": "FDC 棧板區 I1-5",
      "zone": "Storage",
      "x": 95.5,
      "y": 28.5,
      "width": 2.4,
      "height": 2.8,
      "color": "#38A169",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_cnc_room",
      "code": "CNC Room",
      "name": "CNC 精密加工區 (防塵隔間)",
      "zone": "CNC",
      "x": 81.0,
      "y": 55.5,
      "width": 19.5,
      "height": 11.5,
      "color": "#E2E8F0",
      "category": "CNC",
      "is_room": true,
      "floor": "1F"
    },
    {
      "id": "eq_cnc_p1_1",
      "code": "P1-1",
      "name": "CNC 機台 P1-1",
      "zone": "CNC",
      "x": 90.5,
      "y": 62.0,
      "width": 2.4,
      "height": 2.4,
      "color": "#4A5568",
      "category": "CNC",
      "floor": "1F"
    },
    {
      "id": "eq_cnc_p1_2",
      "code": "P1-2",
      "name": "CNC 機台 P1-2",
      "zone": "CNC",
      "x": 93.8,
      "y": 62.0,
      "width": 2.4,
      "height": 2.4,
      "color": "#4A5568",
      "category": "CNC",
      "floor": "1F"
    },
    {
      "id": "eq_cnc_p1_3",
      "code": "P1-3",
      "name": "CNC 機台 P1-3",
      "zone": "CNC",
      "x": 97.0,
      "y": 62.0,
      "width": 2.4,
      "height": 2.4,
      "color": "#4A5568",
      "category": "CNC",
      "floor": "1F"
    },
    {
      "id": "eq_cnc_p1_4",
      "code": "P1-4",
      "name": "CNC 機台 P1-4",
      "zone": "CNC",
      "x": 97.0,
      "y": 58.5,
      "width": 2.4,
      "height": 2.4,
      "color": "#4A5568",
      "category": "CNC",
      "floor": "1F"
    },
    {
      "id": "eq_cnc_p1_5",
      "code": "P1-5",
      "name": "CNC 機台 P1-5",
      "zone": "CNC",
      "x": 97.0,
      "y": 55.2,
      "width": 2.4,
      "height": 2.4,
      "color": "#4A5568",
      "category": "CNC",
      "floor": "1F"
    },
    {
      "id": "eq_guard",
      "code": "Guard",
      "name": "大門警衛室 (Guard Booth)",
      "zone": "Infrastructure",
      "x": -5.0,
      "y": 55.5,
      "width": 4.5,
      "height": 6.5,
      "color": "#ED64A6",
      "category": "Infrastructure",
      "floor": "1F"
    },
    {
      "id": "eq_gate",
      "code": "GATE",
      "name": "廠區正門出入口 (Main Gate)",
      "zone": "Infrastructure",
      "x": -5.5,
      "y": 42.0,
      "width": 5.0,
      "height": 12.0,
      "color": "#ED8936",
      "category": "Infrastructure",
      "floor": "1F"
    },
    {
      "id": "eq_pallet_1",
      "code": "PL-1",
      "name": "物料暫存棧板排 A",
      "zone": "Storage",
      "x": 42.0,
      "y": 46.5,
      "width": 11.5,
      "height": 3.0,
      "color": "#2F855A",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_pallet_2",
      "code": "PL-2",
      "name": "物料暫存棧板排 B",
      "zone": "Storage",
      "x": 58.0,
      "y": 46.5,
      "width": 12.5,
      "height": 3.0,
      "color": "#2F855A",
      "category": "Storage",
      "floor": "1F"
    },
    {
      "id": "eq_pallet_3",
      "code": "PL-3",
      "name": "成品棧板出貨區 C",
      "zone": "Storage",
      "x": 73.0,
      "y": 46.5,
      "width": 8.0,
      "height": 3.0,
      "color": "#2F855A",
      "category": "Storage",
      "floor": "1F"
    },
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
  ],
  "walls": [
    {
      "x1": 0.0,
      "y1": 0.0,
      "x2": 100.0,
      "y2": 0.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "北側建築外牆",
      "id": "wall_1"
    },
    {
      "x1": 100.0,
      "y1": 0.0,
      "x2": 100.0,
      "y2": 50.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "東側建築外牆",
      "id": "wall_2"
    },
    {
      "x1": 100.0,
      "y1": 50.0,
      "x2": 100.0,
      "y2": 67.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "東南側CNC外牆",
      "id": "wall_3"
    },
    {
      "x1": 100.0,
      "y1": 67.0,
      "x2": 80.0,
      "y2": 67.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "CNC南側外牆",
      "id": "wall_4"
    },
    {
      "x1": 80.0,
      "y1": 67.0,
      "x2": 80.0,
      "y2": 50.0,
      "thickness": 0.3,
      "type": "interior",
      "name": "CNC西側隔間牆",
      "id": "wall_5"
    },
    {
      "x1": 100.0,
      "y1": 50.0,
      "x2": 0.0,
      "y2": 50.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "南側主要建築外牆",
      "id": "wall_6"
    },
    {
      "x1": 0.0,
      "y1": 50.0,
      "x2": 0.0,
      "y2": 0.0,
      "thickness": 0.3,
      "type": "exterior",
      "name": "西側建築外牆",
      "id": "wall_7"
    },
    {
      "x1": 0.0,
      "y1": 35.0,
      "x2": 35.0,
      "y2": 35.0,
      "thickness": 0.25,
      "type": "exterior",
      "name": "裝卸月台厚實體隔牆 (Truck Dock Wall)",
      "id": "wall_8"
    },
    {
      "x1": 35.0,
      "y1": 28.0,
      "x2": 47.0,
      "y2": 28.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "辦公室北側牆",
      "id": "wall_9"
    },
    {
      "x1": 47.0,
      "y1": 28.0,
      "x2": 47.0,
      "y2": 39.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "辦公室東側牆",
      "id": "wall_10"
    },
    {
      "x1": 47.0,
      "y1": 39.0,
      "x2": 35.0,
      "y2": 39.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "辦公室南側牆",
      "id": "wall_11"
    },
    {
      "x1": 35.0,
      "y1": 39.0,
      "x2": 35.0,
      "y2": 28.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "辦公室西側牆",
      "id": "wall_12"
    },
    {
      "x1": 35.0,
      "y1": 0.0,
      "x2": 35.0,
      "y2": 20.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "ADH區東側分隔牆",
      "id": "wall_13"
    },
    {
      "x1": 28.0,
      "y1": 0.0,
      "x2": 28.0,
      "y2": 6.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "北貨梯西牆",
      "id": "wall_14"
    },
    {
      "x1": 28.0,
      "y1": 6.0,
      "x2": 34.0,
      "y2": 6.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "北貨梯南牆",
      "id": "wall_15"
    },
    {
      "x1": 34.0,
      "y1": 6.0,
      "x2": 34.0,
      "y2": 0.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "北貨梯東牆",
      "id": "wall_16"
    },
    {
      "x1": 13.0,
      "y1": 29.5,
      "x2": 24.5,
      "y2": 29.5,
      "thickness": 0.2,
      "type": "interior",
      "name": "西側梯廳北牆",
      "id": "wall_17"
    },
    {
      "x1": 24.5,
      "y1": 29.5,
      "x2": 24.5,
      "y2": 35.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "西側梯廳東牆",
      "id": "wall_18"
    },
    {
      "x1": 13.0,
      "y1": 29.5,
      "x2": 13.0,
      "y2": 35.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "西側梯廳西牆",
      "id": "wall_19"
    },
    {
      "x1": 80.0,
      "y1": 55.0,
      "x2": 100.0,
      "y2": 55.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "CNC防塵室北牆",
      "id": "wall_20"
    },
    {
      "x1": 80.0,
      "y1": 55.0,
      "x2": 80.0,
      "y2": 67.0,
      "thickness": 0.2,
      "type": "interior",
      "name": "CNC防塵室西牆",
      "id": "wall_21"
    }
  ],
  "aisles": [
    {
      "x": 0.0,
      "y": 44.0,
      "width": 80.0,
      "height": 4.0,
      "name": "中央主幹物流道 (Main Forklift Aisle 4.0M)",
      "id": "aisle_1"
    },
    {
      "x": 48.0,
      "y": 11.0,
      "width": 3.0,
      "height": 33.0,
      "name": "南北向連通走道 (North-South Connector)",
      "id": "aisle_2"
    },
    {
      "x": 75.0,
      "y": 48.0,
      "width": 3.5,
      "height": 19.0,
      "name": "CNC 聯絡通道 (CNC Access Aisle)",
      "id": "aisle_3"
    }
  ],
  "mezzanine_2f": {
    "title": "二樓新建倉庫工程平面圖 (2F Warehouse Mezzanine)",
    "dwg_scale": "1:150",
    "elevation_1f": "+0.60M",
    "elevation_2f": "+4.40M",
    "clear_height": "3.80M",
    "grid_x": {
      "names": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
      ],
      "coords": [
        0.0,
        5.0,
        10.0,
        15.0,
        20.0,
        25.0,
        30.0,
        35.0
      ],
      "bay_size": 5.0,
      "total_width": 35.0
    },
    "grid_y": {
      "names": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G"
      ],
      "coords": [
        0.0,
        4.75,
        9.5,
        14.25,
        19.0,
        23.75,
        28.5
      ],
      "bay_size": 4.75,
      "total_depth": 28.5
    },
    "zones": [
      {
        "id": "zone_existing",
        "name": "既有夾層 (Existing Mezzanine)",
        "thai_name": "พื้นที่ชั้นลอยเดิม",
        "elevation": "+4.40M",
        "x": 0.0,
        "y": 19.0,
        "width": 15.0,
        "height": 4.75,
        "area_sqm": 71.25,
        "pattern": "hatch_diagonal",
        "color": "#CBD5E0"
      },
      {
        "id": "zone_b",
        "name": "新建夾層 ZONE B (Mezzanine Zone B)",
        "thai_name": "ชั้นลอย ZONE B",
        "elevation": "+4.40M",
        "x": 0.0,
        "y": 9.5,
        "width": 15.0,
        "height": 9.5,
        "area_sqm": 142.5,
        "pattern": "steel_deck_grating",
        "color": "#4299E1"
      },
      {
        "id": "zone_a_north",
        "name": "新建夾層 ZONE A (北翼突起部)",
        "thai_name": "ชั้นลอย ZONE A",
        "elevation": "+4.40M",
        "x": 30.0,
        "y": 14.25,
        "width": 5.0,
        "height": 4.75,
        "area_sqm": 23.75,
        "pattern": "steel_deck_grating",
        "color": "#3182CE"
      },
      {
        "id": "zone_a_main",
        "name": "新建夾層 ZONE A (主倉儲區)",
        "thai_name": "ชั้นลอย ZONE A",
        "elevation": "+4.40M",
        "x": 20.0,
        "y": 19.0,
        "width": 15.0,
        "height": 9.5,
        "area_sqm": 142.5,
        "pattern": "steel_deck_grating",
        "color": "#3182CE"
      },
      {
        "id": "zone_connector",
        "name": "連通走廊與梯廳",
        "thai_name": "ทางเชื่อม",
        "elevation": "+4.40M",
        "x": 15.0,
        "y": 19.0,
        "width": 3.2,
        "height": 4.75,
        "area_sqm": 15.2,
        "pattern": "steel_deck_grating",
        "color": "#3182CE"
      }
    ],
    "handrails": [
      {
        "x1": 0.0,
        "y1": 9.5,
        "x2": 15.0,
        "y2": 9.5,
        "name": "Zone B 北側防護欄杆 (Hand Rail)"
      },
      {
        "x1": 15.0,
        "y1": 9.5,
        "x2": 15.0,
        "y2": 19.0,
        "name": "Zone B 東側防護欄杆 (Hand Rail)"
      },
      {
        "x1": 30.0,
        "y1": 14.25,
        "x2": 35.0,
        "y2": 14.25,
        "name": "Zone A 北側防護欄杆 (Hand Rail)"
      },
      {
        "x1": 30.0,
        "y1": 14.25,
        "x2": 30.0,
        "y2": 19.0,
        "name": "Zone A 西側防護欄杆 (Hand Rail)"
      },
      {
        "x1": 20.0,
        "y1": 19.0,
        "x2": 30.0,
        "y2": 19.0,
        "name": "Zone A 中段防護欄杆 (Hand Rail)"
      },
      {
        "x1": 15.0,
        "y1": 19.0,
        "x2": 16.8,
        "y2": 19.0,
        "name": "連通道北側欄杆 (Hand Rail)"
      },
      {
        "x1": 16.8,
        "y1": 21.2,
        "x2": 16.8,
        "y2": 23.75,
        "name": "貨梯南側防墜護欄 (Hand Rail)"
      },
      {
        "x1": 18.2,
        "y1": 19.0,
        "x2": 18.2,
        "y2": 23.75,
        "name": "樓梯側向防護欄杆 (Hand Rail)"
      }
    ],
    "vertical_circulation": {
      "lift": {
        "x": 16.8,
        "y": 19.0,
        "width": 1.4,
        "height": 2.2,
        "name": "貨梯 (LIFT EL. +0.60M ~ +4.40M)",
        "code": "LIFT"
      },
      "stair": {
        "x": 18.2,
        "y": 19.0,
        "width": 1.8,
        "height": 4.75,
        "name": "安全樓梯 STAIR ST-01 (DWG. NO. : S-05)",
        "code": "ST-01"
      },
      "ramp": {
        "x": 15.0,
        "y": 23.75,
        "width": 5.0,
        "height": 2.75,
        "name": "一樓大門出入口斜坡 (ENTRANCE & RAMP)",
        "code": "RAMP"
      }
    },
    "support_posts": [
      {
        "x": 5.0,
        "y": 9.5,
        "name": "立柱 C2"
      },
      {
        "x": 10.0,
        "y": 9.5,
        "name": "立柱 C3"
      },
      {
        "x": 15.0,
        "y": 9.5,
        "name": "立柱 C4"
      },
      {
        "x": 5.0,
        "y": 14.25,
        "name": "立柱 D2"
      },
      {
        "x": 10.0,
        "y": 14.25,
        "name": "立柱 D3"
      },
      {
        "x": 15.0,
        "y": 14.25,
        "name": "立柱 D4"
      }
    ]
  },
  "equipment_2f": [
    {
      "id": "eq2f_rk_b1",
      "code": "RK-B1",
      "name": "重型鋼製物料架 B1",
      "zone": "Zone B 倉庫",
      "floor": "2F",
      "x": 1.5,
      "y": 10.5,
      "width": 5.5,
      "height": 1.8,
      "rotation": 0,
      "color": "#3182CE",
      "category": "2F Storage"
    },
    {
      "id": "eq2f_rk_b2",
      "code": "RK-B2",
      "name": "重型鋼製物料架 B2",
      "zone": "Zone B 倉庫",
      "floor": "2F",
      "x": 8.5,
      "y": 10.5,
      "width": 5.5,
      "height": 1.8,
      "rotation": 0,
      "color": "#3182CE",
      "category": "2F Storage"
    },
    {
      "id": "eq2f_rk_b3",
      "code": "RK-B3",
      "name": "重型鋼製物料架 B3",
      "zone": "Zone B 倉庫",
      "floor": "2F",
      "x": 1.5,
      "y": 14.5,
      "width": 5.5,
      "height": 1.8,
      "rotation": 0,
      "color": "#3182CE",
      "category": "2F Storage"
    },
    {
      "id": "eq2f_rk_b4",
      "code": "RK-B4",
      "name": "重型鋼製物料架 B4",
      "zone": "Zone B 倉庫",
      "floor": "2F",
      "x": 8.5,
      "y": 14.5,
      "width": 5.5,
      "height": 1.8,
      "rotation": 0,
      "color": "#3182CE",
      "category": "2F Storage"
    },
    {
      "id": "eq2f_pl_a1",
      "code": "PL-A1",
      "name": "棧板儲存排 A1",
      "zone": "Zone A 倉庫",
      "floor": "2F",
      "x": 21.0,
      "y": 20.5,
      "width": 6.0,
      "height": 2.4,
      "rotation": 0,
      "color": "#2F855A",
      "category": "2F Pallets"
    },
    {
      "id": "eq2f_pl_a2",
      "code": "PL-A2",
      "name": "棧板儲存排 A2",
      "zone": "Zone A 倉庫",
      "floor": "2F",
      "x": 28.0,
      "y": 20.5,
      "width": 6.0,
      "height": 2.4,
      "rotation": 0,
      "color": "#2F855A",
      "category": "2F Pallets"
    },
    {
      "id": "eq2f_pl_a3",
      "code": "PL-A3",
      "name": "棧板儲存排 A3",
      "zone": "Zone A 倉庫",
      "floor": "2F",
      "x": 21.0,
      "y": 24.5,
      "width": 6.0,
      "height": 2.4,
      "rotation": 0,
      "color": "#2F855A",
      "category": "2F Pallets"
    },
    {
      "id": "eq2f_pl_a4",
      "code": "PL-A4",
      "name": "棧板儲存排 A4",
      "zone": "Zone A 倉庫",
      "floor": "2F",
      "x": 28.0,
      "y": 24.5,
      "width": 6.0,
      "height": 2.4,
      "rotation": 0,
      "color": "#2F855A",
      "category": "2F Pallets"
    },
    {
      "id": "eq2f_ex_1",
      "code": "EX-1",
      "name": "既有夾層物料排 1",
      "zone": "既有夾層",
      "floor": "2F",
      "x": 2.0,
      "y": 20.0,
      "width": 5.0,
      "height": 2.5,
      "rotation": 0,
      "color": "#718096",
      "category": "2F Existing"
    },
    {
      "id": "eq2f_ex_2",
      "code": "EX-2",
      "name": "既有夾層物料排 2",
      "zone": "既有夾層",
      "floor": "2F",
      "x": 8.5,
      "y": 20.0,
      "width": 5.0,
      "height": 2.5,
      "rotation": 0,
      "color": "#718096",
      "category": "2F Existing"
    },
    {
      "id": "eq2f_staging",
      "code": "STG-2F",
      "name": "貨梯前置緩衝進出貨區",
      "zone": "垂直梯廳",
      "floor": "2F",
      "x": 15.2,
      "y": 20.0,
      "width": 2.8,
      "height": 2.8,
      "rotation": 0,
      "color": "#DD6B20",
      "category": "2F Staging"
    }
  ],
  "columns": [
    {
      "id": "col_x1_y1",
      "code": "C-X1-Y1",
      "name": "結構柱 X1-Y1",
      "x": 0.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y2",
      "code": "C-X1-Y2",
      "name": "結構柱 X1-Y2",
      "x": 0.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y3",
      "code": "C-X1-Y3",
      "name": "結構柱 X1-Y3",
      "x": 0.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y4",
      "code": "C-X1-Y4",
      "name": "結構柱 X1-Y4",
      "x": 0.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y5",
      "code": "C-X1-Y5",
      "name": "結構柱 X1-Y5",
      "x": 0.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y6",
      "code": "C-X1-Y6",
      "name": "結構柱 X1-Y6",
      "x": 0.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y7",
      "code": "C-X1-Y7",
      "name": "結構柱 X1-Y7",
      "x": 0.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y8",
      "code": "C-X1-Y8",
      "name": "結構柱 X1-Y8",
      "x": 0.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y9",
      "code": "C-X1-Y9",
      "name": "結構柱 X1-Y9",
      "x": 0.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y10",
      "code": "C-X1-Y10",
      "name": "結構柱 X1-Y10",
      "x": 0.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x1_y11",
      "code": "C-X1-Y11",
      "name": "結構柱 X1-Y11",
      "x": 0.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y1",
      "code": "C-X2-Y1",
      "name": "結構柱 X2-Y1",
      "x": 5.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y5",
      "code": "C-X2-Y5",
      "name": "結構柱 X2-Y5",
      "x": 5.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y6",
      "code": "C-X2-Y6",
      "name": "結構柱 X2-Y6",
      "x": 5.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y7",
      "code": "C-X2-Y7",
      "name": "結構柱 X2-Y7",
      "x": 5.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y8",
      "code": "C-X2-Y8",
      "name": "結構柱 X2-Y8",
      "x": 5.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y9",
      "code": "C-X2-Y9",
      "name": "結構柱 X2-Y9",
      "x": 5.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y10",
      "code": "C-X2-Y10",
      "name": "結構柱 X2-Y10",
      "x": 5.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x2_y11",
      "code": "C-X2-Y11",
      "name": "結構柱 X2-Y11",
      "x": 5.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y1",
      "code": "C-X3-Y1",
      "name": "結構柱 X3-Y1",
      "x": 10.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y5",
      "code": "C-X3-Y5",
      "name": "結構柱 X3-Y5",
      "x": 10.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y6",
      "code": "C-X3-Y6",
      "name": "結構柱 X3-Y6",
      "x": 10.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y7",
      "code": "C-X3-Y7",
      "name": "結構柱 X3-Y7",
      "x": 10.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y8",
      "code": "C-X3-Y8",
      "name": "結構柱 X3-Y8",
      "x": 10.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y9",
      "code": "C-X3-Y9",
      "name": "結構柱 X3-Y9",
      "x": 10.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y10",
      "code": "C-X3-Y10",
      "name": "結構柱 X3-Y10",
      "x": 10.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x3_y11",
      "code": "C-X3-Y11",
      "name": "結構柱 X3-Y11",
      "x": 10.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y1",
      "code": "C-X4-Y1",
      "name": "結構柱 X4-Y1",
      "x": 15.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y5",
      "code": "C-X4-Y5",
      "name": "結構柱 X4-Y5",
      "x": 15.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y6",
      "code": "C-X4-Y6",
      "name": "結構柱 X4-Y6",
      "x": 15.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y7",
      "code": "C-X4-Y7",
      "name": "結構柱 X4-Y7",
      "x": 15.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y8",
      "code": "C-X4-Y8",
      "name": "結構柱 X4-Y8",
      "x": 15.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y9",
      "code": "C-X4-Y9",
      "name": "結構柱 X4-Y9",
      "x": 15.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y10",
      "code": "C-X4-Y10",
      "name": "結構柱 X4-Y10",
      "x": 15.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x4_y11",
      "code": "C-X4-Y11",
      "name": "結構柱 X4-Y11",
      "x": 15.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y1",
      "code": "C-X5-Y1",
      "name": "結構柱 X5-Y1",
      "x": 20.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y5",
      "code": "C-X5-Y5",
      "name": "結構柱 X5-Y5",
      "x": 20.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y6",
      "code": "C-X5-Y6",
      "name": "結構柱 X5-Y6",
      "x": 20.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y7",
      "code": "C-X5-Y7",
      "name": "結構柱 X5-Y7",
      "x": 20.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y8",
      "code": "C-X5-Y8",
      "name": "結構柱 X5-Y8",
      "x": 20.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y9",
      "code": "C-X5-Y9",
      "name": "結構柱 X5-Y9",
      "x": 20.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y10",
      "code": "C-X5-Y10",
      "name": "結構柱 X5-Y10",
      "x": 20.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x5_y11",
      "code": "C-X5-Y11",
      "name": "結構柱 X5-Y11",
      "x": 20.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y1",
      "code": "C-X6-Y1",
      "name": "結構柱 X6-Y1",
      "x": 25.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y5",
      "code": "C-X6-Y5",
      "name": "結構柱 X6-Y5",
      "x": 25.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y6",
      "code": "C-X6-Y6",
      "name": "結構柱 X6-Y6",
      "x": 25.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y7",
      "code": "C-X6-Y7",
      "name": "結構柱 X6-Y7",
      "x": 25.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y8",
      "code": "C-X6-Y8",
      "name": "結構柱 X6-Y8",
      "x": 25.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y9",
      "code": "C-X6-Y9",
      "name": "結構柱 X6-Y9",
      "x": 25.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y10",
      "code": "C-X6-Y10",
      "name": "結構柱 X6-Y10",
      "x": 25.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x6_y11",
      "code": "C-X6-Y11",
      "name": "結構柱 X6-Y11",
      "x": 25.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y1",
      "code": "C-X7-Y1",
      "name": "結構柱 X7-Y1",
      "x": 30.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y5",
      "code": "C-X7-Y5",
      "name": "結構柱 X7-Y5",
      "x": 30.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y6",
      "code": "C-X7-Y6",
      "name": "結構柱 X7-Y6",
      "x": 30.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y7",
      "code": "C-X7-Y7",
      "name": "結構柱 X7-Y7",
      "x": 30.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y8",
      "code": "C-X7-Y8",
      "name": "結構柱 X7-Y8",
      "x": 30.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y9",
      "code": "C-X7-Y9",
      "name": "結構柱 X7-Y9",
      "x": 30.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y10",
      "code": "C-X7-Y10",
      "name": "結構柱 X7-Y10",
      "x": 30.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x7_y11",
      "code": "C-X7-Y11",
      "name": "結構柱 X7-Y11",
      "x": 30.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y1",
      "code": "C-X8-Y1",
      "name": "結構柱 X8-Y1",
      "x": 35.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y2",
      "code": "C-X8-Y2",
      "name": "結構柱 X8-Y2",
      "x": 35.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y3",
      "code": "C-X8-Y3",
      "name": "結構柱 X8-Y3",
      "x": 35.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y4",
      "code": "C-X8-Y4",
      "name": "結構柱 X8-Y4",
      "x": 35.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y5",
      "code": "C-X8-Y5",
      "name": "結構柱 X8-Y5",
      "x": 35.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y6",
      "code": "C-X8-Y6",
      "name": "結構柱 X8-Y6",
      "x": 35.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y7",
      "code": "C-X8-Y7",
      "name": "結構柱 X8-Y7",
      "x": 35.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y8",
      "code": "C-X8-Y8",
      "name": "結構柱 X8-Y8",
      "x": 35.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y9",
      "code": "C-X8-Y9",
      "name": "結構柱 X8-Y9",
      "x": 35.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y10",
      "code": "C-X8-Y10",
      "name": "結構柱 X8-Y10",
      "x": 35.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x8_y11",
      "code": "C-X8-Y11",
      "name": "結構柱 X8-Y11",
      "x": 35.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y1",
      "code": "C-X9-Y1",
      "name": "結構柱 X9-Y1",
      "x": 40.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y2",
      "code": "C-X9-Y2",
      "name": "結構柱 X9-Y2",
      "x": 40.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y3",
      "code": "C-X9-Y3",
      "name": "結構柱 X9-Y3",
      "x": 40.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y4",
      "code": "C-X9-Y4",
      "name": "結構柱 X9-Y4",
      "x": 40.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y5",
      "code": "C-X9-Y5",
      "name": "結構柱 X9-Y5",
      "x": 40.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y6",
      "code": "C-X9-Y6",
      "name": "結構柱 X9-Y6",
      "x": 40.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y7",
      "code": "C-X9-Y7",
      "name": "結構柱 X9-Y7",
      "x": 40.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y8",
      "code": "C-X9-Y8",
      "name": "結構柱 X9-Y8",
      "x": 40.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y9",
      "code": "C-X9-Y9",
      "name": "結構柱 X9-Y9",
      "x": 40.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y10",
      "code": "C-X9-Y10",
      "name": "結構柱 X9-Y10",
      "x": 40.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x9_y11",
      "code": "C-X9-Y11",
      "name": "結構柱 X9-Y11",
      "x": 40.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y1",
      "code": "C-X10-Y1",
      "name": "結構柱 X10-Y1",
      "x": 45.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y2",
      "code": "C-X10-Y2",
      "name": "結構柱 X10-Y2",
      "x": 45.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y3",
      "code": "C-X10-Y3",
      "name": "結構柱 X10-Y3",
      "x": 45.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y4",
      "code": "C-X10-Y4",
      "name": "結構柱 X10-Y4",
      "x": 45.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y5",
      "code": "C-X10-Y5",
      "name": "結構柱 X10-Y5",
      "x": 45.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y6",
      "code": "C-X10-Y6",
      "name": "結構柱 X10-Y6",
      "x": 45.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y7",
      "code": "C-X10-Y7",
      "name": "結構柱 X10-Y7",
      "x": 45.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y8",
      "code": "C-X10-Y8",
      "name": "結構柱 X10-Y8",
      "x": 45.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y9",
      "code": "C-X10-Y9",
      "name": "結構柱 X10-Y9",
      "x": 45.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y10",
      "code": "C-X10-Y10",
      "name": "結構柱 X10-Y10",
      "x": 45.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x10_y11",
      "code": "C-X10-Y11",
      "name": "結構柱 X10-Y11",
      "x": 45.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y1",
      "code": "C-X11-Y1",
      "name": "結構柱 X11-Y1",
      "x": 50.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y2",
      "code": "C-X11-Y2",
      "name": "結構柱 X11-Y2",
      "x": 50.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y3",
      "code": "C-X11-Y3",
      "name": "結構柱 X11-Y3",
      "x": 50.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y4",
      "code": "C-X11-Y4",
      "name": "結構柱 X11-Y4",
      "x": 50.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y5",
      "code": "C-X11-Y5",
      "name": "結構柱 X11-Y5",
      "x": 50.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y6",
      "code": "C-X11-Y6",
      "name": "結構柱 X11-Y6",
      "x": 50.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y7",
      "code": "C-X11-Y7",
      "name": "結構柱 X11-Y7",
      "x": 50.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y8",
      "code": "C-X11-Y8",
      "name": "結構柱 X11-Y8",
      "x": 50.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y9",
      "code": "C-X11-Y9",
      "name": "結構柱 X11-Y9",
      "x": 50.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y10",
      "code": "C-X11-Y10",
      "name": "結構柱 X11-Y10",
      "x": 50.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x11_y11",
      "code": "C-X11-Y11",
      "name": "結構柱 X11-Y11",
      "x": 50.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y1",
      "code": "C-X12-Y1",
      "name": "結構柱 X12-Y1",
      "x": 55.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y2",
      "code": "C-X12-Y2",
      "name": "結構柱 X12-Y2",
      "x": 55.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y3",
      "code": "C-X12-Y3",
      "name": "結構柱 X12-Y3",
      "x": 55.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y4",
      "code": "C-X12-Y4",
      "name": "結構柱 X12-Y4",
      "x": 55.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y5",
      "code": "C-X12-Y5",
      "name": "結構柱 X12-Y5",
      "x": 55.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y6",
      "code": "C-X12-Y6",
      "name": "結構柱 X12-Y6",
      "x": 55.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y7",
      "code": "C-X12-Y7",
      "name": "結構柱 X12-Y7",
      "x": 55.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y8",
      "code": "C-X12-Y8",
      "name": "結構柱 X12-Y8",
      "x": 55.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y9",
      "code": "C-X12-Y9",
      "name": "結構柱 X12-Y9",
      "x": 55.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y10",
      "code": "C-X12-Y10",
      "name": "結構柱 X12-Y10",
      "x": 55.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x12_y11",
      "code": "C-X12-Y11",
      "name": "結構柱 X12-Y11",
      "x": 55.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y1",
      "code": "C-X13-Y1",
      "name": "結構柱 X13-Y1",
      "x": 60.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y2",
      "code": "C-X13-Y2",
      "name": "結構柱 X13-Y2",
      "x": 60.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y3",
      "code": "C-X13-Y3",
      "name": "結構柱 X13-Y3",
      "x": 60.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y4",
      "code": "C-X13-Y4",
      "name": "結構柱 X13-Y4",
      "x": 60.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y5",
      "code": "C-X13-Y5",
      "name": "結構柱 X13-Y5",
      "x": 60.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y6",
      "code": "C-X13-Y6",
      "name": "結構柱 X13-Y6",
      "x": 60.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y7",
      "code": "C-X13-Y7",
      "name": "結構柱 X13-Y7",
      "x": 60.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y8",
      "code": "C-X13-Y8",
      "name": "結構柱 X13-Y8",
      "x": 60.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y9",
      "code": "C-X13-Y9",
      "name": "結構柱 X13-Y9",
      "x": 60.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y10",
      "code": "C-X13-Y10",
      "name": "結構柱 X13-Y10",
      "x": 60.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x13_y11",
      "code": "C-X13-Y11",
      "name": "結構柱 X13-Y11",
      "x": 60.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y1",
      "code": "C-X14-Y1",
      "name": "結構柱 X14-Y1",
      "x": 65.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y2",
      "code": "C-X14-Y2",
      "name": "結構柱 X14-Y2",
      "x": 65.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y3",
      "code": "C-X14-Y3",
      "name": "結構柱 X14-Y3",
      "x": 65.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y4",
      "code": "C-X14-Y4",
      "name": "結構柱 X14-Y4",
      "x": 65.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y5",
      "code": "C-X14-Y5",
      "name": "結構柱 X14-Y5",
      "x": 65.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y6",
      "code": "C-X14-Y6",
      "name": "結構柱 X14-Y6",
      "x": 65.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y7",
      "code": "C-X14-Y7",
      "name": "結構柱 X14-Y7",
      "x": 65.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y8",
      "code": "C-X14-Y8",
      "name": "結構柱 X14-Y8",
      "x": 65.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y9",
      "code": "C-X14-Y9",
      "name": "結構柱 X14-Y9",
      "x": 65.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y10",
      "code": "C-X14-Y10",
      "name": "結構柱 X14-Y10",
      "x": 65.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x14_y11",
      "code": "C-X14-Y11",
      "name": "結構柱 X14-Y11",
      "x": 65.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y1",
      "code": "C-X15-Y1",
      "name": "結構柱 X15-Y1",
      "x": 70.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y2",
      "code": "C-X15-Y2",
      "name": "結構柱 X15-Y2",
      "x": 70.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y3",
      "code": "C-X15-Y3",
      "name": "結構柱 X15-Y3",
      "x": 70.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y4",
      "code": "C-X15-Y4",
      "name": "結構柱 X15-Y4",
      "x": 70.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y5",
      "code": "C-X15-Y5",
      "name": "結構柱 X15-Y5",
      "x": 70.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y6",
      "code": "C-X15-Y6",
      "name": "結構柱 X15-Y6",
      "x": 70.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y7",
      "code": "C-X15-Y7",
      "name": "結構柱 X15-Y7",
      "x": 70.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y8",
      "code": "C-X15-Y8",
      "name": "結構柱 X15-Y8",
      "x": 70.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y9",
      "code": "C-X15-Y9",
      "name": "結構柱 X15-Y9",
      "x": 70.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y10",
      "code": "C-X15-Y10",
      "name": "結構柱 X15-Y10",
      "x": 70.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x15_y11",
      "code": "C-X15-Y11",
      "name": "結構柱 X15-Y11",
      "x": 70.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y1",
      "code": "C-X16-Y1",
      "name": "結構柱 X16-Y1",
      "x": 75.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y2",
      "code": "C-X16-Y2",
      "name": "結構柱 X16-Y2",
      "x": 75.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y3",
      "code": "C-X16-Y3",
      "name": "結構柱 X16-Y3",
      "x": 75.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y4",
      "code": "C-X16-Y4",
      "name": "結構柱 X16-Y4",
      "x": 75.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y5",
      "code": "C-X16-Y5",
      "name": "結構柱 X16-Y5",
      "x": 75.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y6",
      "code": "C-X16-Y6",
      "name": "結構柱 X16-Y6",
      "x": 75.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y7",
      "code": "C-X16-Y7",
      "name": "結構柱 X16-Y7",
      "x": 75.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y8",
      "code": "C-X16-Y8",
      "name": "結構柱 X16-Y8",
      "x": 75.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y9",
      "code": "C-X16-Y9",
      "name": "結構柱 X16-Y9",
      "x": 75.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y10",
      "code": "C-X16-Y10",
      "name": "結構柱 X16-Y10",
      "x": 75.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x16_y11",
      "code": "C-X16-Y11",
      "name": "結構柱 X16-Y11",
      "x": 75.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y1",
      "code": "C-X17-Y1",
      "name": "結構柱 X17-Y1",
      "x": 80.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y2",
      "code": "C-X17-Y2",
      "name": "結構柱 X17-Y2",
      "x": 80.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y3",
      "code": "C-X17-Y3",
      "name": "結構柱 X17-Y3",
      "x": 80.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y4",
      "code": "C-X17-Y4",
      "name": "結構柱 X17-Y4",
      "x": 80.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y5",
      "code": "C-X17-Y5",
      "name": "結構柱 X17-Y5",
      "x": 80.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y6",
      "code": "C-X17-Y6",
      "name": "結構柱 X17-Y6",
      "x": 80.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y7",
      "code": "C-X17-Y7",
      "name": "結構柱 X17-Y7",
      "x": 80.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y8",
      "code": "C-X17-Y8",
      "name": "結構柱 X17-Y8",
      "x": 80.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y9",
      "code": "C-X17-Y9",
      "name": "結構柱 X17-Y9",
      "x": 80.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y10",
      "code": "C-X17-Y10",
      "name": "結構柱 X17-Y10",
      "x": 80.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x17_y11",
      "code": "C-X17-Y11",
      "name": "結構柱 X17-Y11",
      "x": 80.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y1",
      "code": "C-X18-Y1",
      "name": "結構柱 X18-Y1",
      "x": 85.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y2",
      "code": "C-X18-Y2",
      "name": "結構柱 X18-Y2",
      "x": 85.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y3",
      "code": "C-X18-Y3",
      "name": "結構柱 X18-Y3",
      "x": 85.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y4",
      "code": "C-X18-Y4",
      "name": "結構柱 X18-Y4",
      "x": 85.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y5",
      "code": "C-X18-Y5",
      "name": "結構柱 X18-Y5",
      "x": 85.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y6",
      "code": "C-X18-Y6",
      "name": "結構柱 X18-Y6",
      "x": 85.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y7",
      "code": "C-X18-Y7",
      "name": "結構柱 X18-Y7",
      "x": 85.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y8",
      "code": "C-X18-Y8",
      "name": "結構柱 X18-Y8",
      "x": 85.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y9",
      "code": "C-X18-Y9",
      "name": "結構柱 X18-Y9",
      "x": 85.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y10",
      "code": "C-X18-Y10",
      "name": "結構柱 X18-Y10",
      "x": 85.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x18_y11",
      "code": "C-X18-Y11",
      "name": "結構柱 X18-Y11",
      "x": 85.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y1",
      "code": "C-X19-Y1",
      "name": "結構柱 X19-Y1",
      "x": 90.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y2",
      "code": "C-X19-Y2",
      "name": "結構柱 X19-Y2",
      "x": 90.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y3",
      "code": "C-X19-Y3",
      "name": "結構柱 X19-Y3",
      "x": 90.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y4",
      "code": "C-X19-Y4",
      "name": "結構柱 X19-Y4",
      "x": 90.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y5",
      "code": "C-X19-Y5",
      "name": "結構柱 X19-Y5",
      "x": 90.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y6",
      "code": "C-X19-Y6",
      "name": "結構柱 X19-Y6",
      "x": 90.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y7",
      "code": "C-X19-Y7",
      "name": "結構柱 X19-Y7",
      "x": 90.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y8",
      "code": "C-X19-Y8",
      "name": "結構柱 X19-Y8",
      "x": 90.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y9",
      "code": "C-X19-Y9",
      "name": "結構柱 X19-Y9",
      "x": 90.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y10",
      "code": "C-X19-Y10",
      "name": "結構柱 X19-Y10",
      "x": 90.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x19_y11",
      "code": "C-X19-Y11",
      "name": "結構柱 X19-Y11",
      "x": 90.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y1",
      "code": "C-X20-Y1",
      "name": "結構柱 X20-Y1",
      "x": 95.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y2",
      "code": "C-X20-Y2",
      "name": "結構柱 X20-Y2",
      "x": 95.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y3",
      "code": "C-X20-Y3",
      "name": "結構柱 X20-Y3",
      "x": 95.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y4",
      "code": "C-X20-Y4",
      "name": "結構柱 X20-Y4",
      "x": 95.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y5",
      "code": "C-X20-Y5",
      "name": "結構柱 X20-Y5",
      "x": 95.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y6",
      "code": "C-X20-Y6",
      "name": "結構柱 X20-Y6",
      "x": 95.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y7",
      "code": "C-X20-Y7",
      "name": "結構柱 X20-Y7",
      "x": 95.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y8",
      "code": "C-X20-Y8",
      "name": "結構柱 X20-Y8",
      "x": 95.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y9",
      "code": "C-X20-Y9",
      "name": "結構柱 X20-Y9",
      "x": 95.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y10",
      "code": "C-X20-Y10",
      "name": "結構柱 X20-Y10",
      "x": 95.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x20_y11",
      "code": "C-X20-Y11",
      "name": "結構柱 X20-Y11",
      "x": 95.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y1",
      "code": "C-X21-Y1",
      "name": "結構柱 X21-Y1",
      "x": 100.0,
      "y": 0.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y2",
      "code": "C-X21-Y2",
      "name": "結構柱 X21-Y2",
      "x": 100.0,
      "y": 5.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y3",
      "code": "C-X21-Y3",
      "name": "結構柱 X21-Y3",
      "x": 100.0,
      "y": 10.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y4",
      "code": "C-X21-Y4",
      "name": "結構柱 X21-Y4",
      "x": 100.0,
      "y": 15.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y5",
      "code": "C-X21-Y5",
      "name": "結構柱 X21-Y5",
      "x": 100.0,
      "y": 20.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y6",
      "code": "C-X21-Y6",
      "name": "結構柱 X21-Y6",
      "x": 100.0,
      "y": 25.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y7",
      "code": "C-X21-Y7",
      "name": "結構柱 X21-Y7",
      "x": 100.0,
      "y": 30.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y8",
      "code": "C-X21-Y8",
      "name": "結構柱 X21-Y8",
      "x": 100.0,
      "y": 35.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y9",
      "code": "C-X21-Y9",
      "name": "結構柱 X21-Y9",
      "x": 100.0,
      "y": 40.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y10",
      "code": "C-X21-Y10",
      "name": "結構柱 X21-Y10",
      "x": 100.0,
      "y": 45.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    },
    {
      "id": "col_x21_y11",
      "code": "C-X21-Y11",
      "name": "結構柱 X21-Y11",
      "x": 100.0,
      "y": 50.0,
      "width": 0.5,
      "height": 0.5,
      "rotation": 0,
      "color": "#334155",
      "category": "Column",
      "floor": "1F"
    }
  ],
  "flows": [
    {
      "id": "flow_forklift_main",
      "name": "中央物流幹道主動線 (Main Forklift Corridor)",
      "type": "forklift",
      "points": [
        {
          "x": 0.0,
          "y": 46.0
        },
        {
          "x": 80.0,
          "y": 46.0
        }
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
        {
          "x": 49.5,
          "y": 11.0
        },
        {
          "x": 49.5,
          "y": 44.0
        }
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
        {
          "x": 35.0,
          "y": 41.5
        },
        {
          "x": 48.0,
          "y": 41.5
        },
        {
          "x": 48.0,
          "y": 26.0
        }
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
        {
          "x": 18.0,
          "y": 7.5
        },
        {
          "x": 23.0,
          "y": 7.5
        },
        {
          "x": 23.0,
          "y": 14.0
        }
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
        {
          "x": 35.0,
          "y": 32.0
        },
        {
          "x": 10.0,
          "y": 32.0
        },
        {
          "x": 0.0,
          "y": 35.0
        }
      ],
      "width_m": 1.5,
      "color": "#EF4444",
      "dash": "6,3",
      "arrow_direction": "forward"
    }
  ]
};

  // --- State Variables ---
  let layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
  try {
    const savedLayout = localStorage.getItem(STORAGE_KEY_LAYOUT);
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      if (parsed && (parsed.equipment || parsed.dimensions)) {
        layoutData = parsed;
      }
    }
  } catch (err) {
    console.warn("Could not load layout from localStorage:", err);
  }

  let customEquipmentLib = [];
  try {
    const savedLib = localStorage.getItem(STORAGE_KEY_CUSTOM_LIB);
    if (savedLib) {
      customEquipmentLib = JSON.parse(savedLib);
    }
  } catch (err) {
    console.warn("Could not load custom lib from localStorage:", err);
  }

  let siteViewMode = "expanded"; // 'expanded' (140x90m) | 'indoor' (100x50m) | 'max' (160x100m)
  let currentFloor = "1F";
  let selectedId = null;
  let selectedItemType = null; // 'equipment' | 'column' | 'wall' | 'aisle' | 'zone' | 'flow' | 'title_block'
  let selectedWaypointIndex = -1;

  // Initialize Dynamic Floors if not present
  if (!layoutData.floors || !Array.isArray(layoutData.floors) || layoutData.floors.length === 0) {
    layoutData.floors = [
      { id: "1F", name: "主廠房生產線", elev: "EL. +0.60M", desc: "100M×50M 主生產基地" },
      { id: "2F", name: "左側倉庫夾層", elev: "EL. +4.40M", desc: "380m² 夾層倉儲區" },
      { id: "OVERLAY", name: "雙層透視疊加", elev: "ALL", desc: "1F+2F 結構對齊" }
    ];
  }

  // Initialize Title Block Data if not present
  if (!layoutData.title_block) {
    layoutData.title_block = {
      company: "金讚科技 · 廠房平面配置工程圖",
      title: "1F生產動線、建築元件與全廠區配置",
      dwg_no: "CC-ENG-2026-004",
      rev: "REV V2.2",
      designer: "Derek Yeh",
      elevation: "1F +0.6M / 2F +4.4M",
      date: "2026/09/09",
      spec: "140M×90M · 廠區/車道/設備",
      scale: "1:150 (Metric)",
      status: "APPROVED 正式版",
      x: null, // null = docked at bottom-right
      y: null,
      width: 460,
      height: 175
    };
  }

  // --- Undo / Redo History Engine ---
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 35;
  let dragInitialLayoutSnapshot = null;
  let dragHasMoved = false;

  function pushHistoryState(actionName) {
    const snapshot = JSON.stringify(layoutData);
    undoStack.push({ name: actionName, data: snapshot, floor: currentFloor });
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
    updateUndoRedoButtons();
  }

  function undo() {
    if (undoStack.length === 0) {
      showToast("無更早的歷史動作可復原", "info", 1500);
      return;
    }
    const currentSnapshot = JSON.stringify(layoutData);
    const lastState = undoStack.pop();
    redoStack.push({ name: lastState.name, data: currentSnapshot, floor: currentFloor });

    layoutData = JSON.parse(lastState.data);
    if (lastState.floor && lastState.floor !== currentFloor) {
      currentFloor = lastState.floor;
      renderFloorSelector();
    }
    deselectAll();
    renderSvg();
    saveToLocalStorage();
    updateUndoRedoButtons();
    showToast(`↶ 已復原: ${lastState.name}`, "info", 2000);
  }

  function redo() {
    if (redoStack.length === 0) {
      showToast("已是最新步驟，無可重做", "info", 1500);
      return;
    }
    const currentSnapshot = JSON.stringify(layoutData);
    const nextState = redoStack.pop();
    undoStack.push({ name: nextState.name, data: currentSnapshot, floor: currentFloor });

    layoutData = JSON.parse(nextState.data);
    if (nextState.floor && nextState.floor !== currentFloor) {
      currentFloor = nextState.floor;
      renderFloorSelector();
    }
    deselectAll();
    renderSvg();
    saveToLocalStorage();
    updateUndoRedoButtons();
    showToast(`↷ 已重做: ${nextState.name}`, "info", 2000);
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById("btnUndo");
    const btnRedo = document.getElementById("btnRedo");
    if (btnUndo) {
      btnUndo.disabled = undoStack.length === 0;
      btnUndo.title = undoStack.length > 0 ? `復原: ${undoStack[undoStack.length - 1].name} (Ctrl+Z / Cmd+Z)` : "回到上一步 (Ctrl+Z / Cmd+Z)";
    }
    if (btnRedo) {
      btnRedo.disabled = redoStack.length === 0;
      btnRedo.title = redoStack.length > 0 ? `重做: ${redoStack[redoStack.length - 1].name} (Ctrl+Y / Cmd+Shift+Z)` : "重做下一步 (Ctrl+Y / Cmd+Shift+Z)";
    }
  }

  // --- Magnetic Wall Snapping Engine ---
  let currentWallSnapInfo = null;

  function findWallSnap(curWall, dragType, curX, curY) {
    const SNAP_THRESHOLD = 0.40; // 0.40 meters
    let bestSnap = null;
    let minDist = SNAP_THRESHOLD;

    const allWalls = layoutData.walls || [];
    const otherWalls = allWalls.filter(w => w.id !== curWall.id);

    for (const ow of otherWalls) {
      // 1. Endpoint to Endpoint Snap
      const endpoints = [
        { x: ow.x1, y: ow.y1, name: "端點 P1" },
        { x: ow.x2, y: ow.y2, name: "端點 P2" }
      ];

      for (const ep of endpoints) {
        const d = Math.hypot(curX - ep.x, curY - ep.y);
        if (d < minDist) {
          minDist = d;
          bestSnap = {
            snapX: ep.x,
            snapY: ep.y,
            desc: "端點自動吸附對齊",
            targetWall: ow
          };
        }
      }

      // 2. T-junction Perpendicular Projection
      const dx = ow.x2 - ow.x1;
      const dy = ow.y2 - ow.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq > 0.04) {
        const t = Math.max(0, Math.min(1, ((curX - ow.x1) * dx + (curY - ow.y1) * dy) / lenSq));
        const projX = ow.x1 + t * dx;
        const projY = ow.y1 + t * dy;
        const dProj = Math.hypot(curX - projX, curY - projY);
        if (dProj < minDist && dProj < 0.35) {
          minDist = dProj;
          bestSnap = {
            snapX: Math.round(projX * 100) / 100,
            snapY: Math.round(projY * 100) / 100,
            desc: "T型牆垂直接合",
            targetWall: ow
          };
        }
      }

      // 3. Parallel double wall snap (吸附成雙面隔牆)
      if (dragType === "translate") {
        const curIsH = Math.abs(curWall.y2 - curWall.y1) < 0.15;
        const owIsH = Math.abs(ow.y2 - ow.y1) < 0.15;
        const combinedThick = (curWall.thickness || 0.3) / 2 + (ow.thickness || 0.3) / 2;

        if (curIsH && owIsH) {
          const dyH = Math.abs(curWall.y1 - ow.y1);
          if (Math.abs(dyH - combinedThick) < SNAP_THRESHOLD) {
            const snapY = curWall.y1 > ow.y1 ? ow.y1 + combinedThick : ow.y1 - combinedThick;
            bestSnap = {
              snapX: curWall.x1,
              snapY: snapY,
              desc: "雙面牆平行吸附",
              targetWall: ow,
              isParallel: true,
              axis: "y",
              offsetY: snapY - curWall.y1
            };
          }
        }

        const curIsV = Math.abs(curWall.x2 - curWall.x1) < 0.15;
        const owIsV = Math.abs(ow.x2 - ow.x1) < 0.15;
        if (curIsV && owIsV) {
          const dxV = Math.abs(curWall.x1 - ow.x1);
          if (Math.abs(dxV - combinedThick) < SNAP_THRESHOLD) {
            const snapX = curWall.x1 > ow.x1 ? ow.x1 + combinedThick : ow.x1 - combinedThick;
            bestSnap = {
              snapX: snapX,
              snapY: curWall.y1,
              desc: "雙面牆平行吸附",
              targetWall: ow,
              isParallel: true,
              axis: "x",
              offsetX: snapX - curWall.x1
            };
          }
        }
      }
    }

    return bestSnap;
  }
  
  // --- Floating Toast Notifications ---
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `cad-toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✔' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(12px) scale(0.9)";
      setTimeout(() => toast.remove(), 320);
    }, 2800);
  }

  // --- Auto-save to LocalStorage ---
  let autoSaveTimer = null;
  function saveToLocalStorage() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(layoutData));
        const ind = document.getElementById("autoSaveIndicator");
        if (ind) {
          ind.style.opacity = "1";
          ind.textContent = "✓ 已自動儲存";
        }
      } catch (e) {
        console.warn("Auto-save failed:", e);
      }
    }, 250);
  }

  function saveCustomLibToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_LIB, JSON.stringify(customEquipmentLib));
    } catch (e) {
      console.warn("Custom lib save failed:", e);
    }
  }

  
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

    // 0. Title Block
    if (id === "title_block") {
      return { item: layoutData.title_block, type: "title_block" };
    }

    // 1. equipment (1F)
    let item = (layoutData.equipment || []).find(e => e.id === id);
    if (item) return { item, type: item.category === 'Column' ? 'column' : 'equipment', collection: layoutData.equipment };

    // 2. equipment_2f
    if (layoutData.equipment_2f) {
      item = layoutData.equipment_2f.find(e => e.id === id);
      if (item) return { item, type: 'equipment', collection: layoutData.equipment_2f };
    }

    // Dynamic Floor Equipment Arrays (e.g. equipment_3f, equipment_roof, etc.)
    for (const key of Object.keys(layoutData)) {
      if (key.startsWith("equipment_") && Array.isArray(layoutData[key])) {
        item = layoutData[key].find(e => e.id === id);
        if (item) return { item, type: 'equipment', collection: layoutData[key] };
      }
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
    
    renderFloorSelector();
    populateLibrary();
    renderSvg();
    bindEvents();
    fitToScreen();
    updateViewBox();
    updateUndoRedoButtons();

    setTimeout(() => {
      showToast("🚀 系統已升級 V2.4：即時縮放%、Ctrl+滾輪縮放、Ctrl鍵置中、Undo/Redo、單面牆磁吸與辦公傢俱", "info", 5000);
    }, 600);
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


  // --- Render Outdoor Space & Site Master Plan Elements ---
  function renderOutdoorSiteMasterPlan() {
    if (siteViewMode === "indoor") return "";

    const marginX = siteViewMode === "max" ? 30.0 : SITE_MARGIN_X_M;
    const marginY = siteViewMode === "max" ? 25.0 : SITE_MARGIN_Y_M;
    const siteW_M = TOTAL_W_M + marginX * 2;
    const siteH_M = TOTAL_H_M + marginY * 2;

    const siteX = OFFSET_X - marginX * SCALE;
    const siteY = OFFSET_Y - marginY * SCALE;
    const siteW = siteW_M * SCALE;
    const siteH = siteH_M * SCALE;

    let outHtml = `
      <!-- Layer: Outdoor Master Plan -->
      <g id="layerOutdoorSite" opacity="0.95">
        <!-- Site Boundary Property Ground -->
        <rect x="${siteX}" y="${siteY}" width="${siteW}" height="${siteH}" fill="#F8FAFC" rx="8"/>

        <!-- Outer Landscape Green Buffer (2.5M) -->
        <rect x="${siteX + 4}" y="${siteY + 4}" width="${siteW - 8}" height="${siteH - 8}" fill="none" stroke="#86EFAC" stroke-width="16" stroke-opacity="0.35" rx="6"/>

        <!-- Property Line (CAD Dash-dot Boundary) -->
        <rect x="${siteX}" y="${siteY}" width="${siteW}" height="${siteH}" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="14,4,3,4" rx="8"/>
        <text x="${siteX + 20}" y="${siteY + 22}" font-size="11" font-weight="800" fill="#B91C1C">金讚廠區總地籍境界線 · 全區 140.0M × 90.0M (地坪約 12,600 m²)</text>
        <text x="${siteX + siteW - 20}" y="${siteY + 22}" font-size="10" font-weight="700" fill="#B91C1C" text-anchor="end">建築覆蓋率: 45.2% · 容積率: 86.5%</text>

        <!-- Perimeter Truck Ring Road Band (8.0M Dual Carriage Way) -->
        <!-- West Truck Road -->
        <rect x="${OFFSET_X - 18 * SCALE}" y="${OFFSET_Y - 14 * SCALE}" width="${16 * SCALE}" height="${(TOTAL_H_M + 28) * SCALE}" class="outdoor-road-band" rx="4"/>
        <line x1="${OFFSET_X - 10 * SCALE}" y1="${OFFSET_Y - 12 * SCALE}" x2="${OFFSET_X - 10 * SCALE}" y2="${OFFSET_Y + (TOTAL_H_M + 12) * SCALE}" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="8,6"/>
        <text x="${OFFSET_X - 10 * SCALE}" y="${OFFSET_Y + 25 * SCALE}" font-size="11" font-weight="800" fill="#64748B" text-anchor="middle" transform="rotate(-90 ${OFFSET_X - 10 * SCALE} ${OFFSET_Y + 25 * SCALE})">環廠西側重車物流專用道 8.0M (雙向通車)</text>

        <!-- North Truck Road -->
        <rect x="${OFFSET_X - 18 * SCALE}" y="${OFFSET_Y - 16 * SCALE}" width="${(TOTAL_W_M + 34) * SCALE}" height="${14 * SCALE}" class="outdoor-road-band" rx="4"/>
        <line x1="${OFFSET_X - 12 * SCALE}" y1="${OFFSET_Y - 9 * SCALE}" x2="${OFFSET_X + (TOTAL_W_M + 12) * SCALE}" y2="${OFFSET_Y - 9 * SCALE}" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="8,6"/>
        <text x="${OFFSET_X + 50 * SCALE}" y="${OFFSET_Y - 9 * SCALE}" font-size="11" font-weight="800" fill="#64748B" text-anchor="middle" dominant-baseline="central">環廠北側貨櫃物流道 8.0M · 保持淨空禁停</text>

        <!-- East Truck Road -->
        <rect x="${OFFSET_X + TOTAL_W_M * SCALE + 2 * SCALE}" y="${OFFSET_Y - 14 * SCALE}" width="${16 * SCALE}" height="${(TOTAL_H_M + 28) * SCALE}" class="outdoor-road-band" rx="4"/>
        <line x1="${OFFSET_X + TOTAL_W_M * SCALE + 10 * SCALE}" y1="${OFFSET_Y - 12 * SCALE}" x2="${OFFSET_X + TOTAL_W_M * SCALE + 10 * SCALE}" y2="${OFFSET_Y + (TOTAL_H_M + 12) * SCALE}" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="8,6"/>
        <text x="${OFFSET_X + TOTAL_W_M * SCALE + 10 * SCALE}" y="${OFFSET_Y + 25 * SCALE}" font-size="11" font-weight="800" fill="#64748B" text-anchor="middle" transform="rotate(90 ${OFFSET_X + TOTAL_W_M * SCALE + 10 * SCALE} ${OFFSET_Y + 25 * SCALE})">環廠東側物流車道 8.0M (重車道)</text>

        <!-- South Truck Road -->
        <rect x="${OFFSET_X - 18 * SCALE}" y="${OFFSET_Y + TOTAL_H_M * SCALE + 2 * SCALE}" width="${(TOTAL_W_M + 34) * SCALE}" height="${14 * SCALE}" class="outdoor-road-band" rx="4"/>
        <line x1="${OFFSET_X - 12 * SCALE}" y1="${OFFSET_Y + TOTAL_H_M * SCALE + 9 * SCALE}" x2="${OFFSET_X + (TOTAL_W_M + 12) * SCALE}" y2="${OFFSET_Y + TOTAL_H_M * SCALE + 9 * SCALE}" stroke="#F59E0B" stroke-width="1.8" stroke-dasharray="8,6"/>
        <text x="${OFFSET_X + 50 * SCALE}" y="${OFFSET_Y + TOTAL_H_M * SCALE + 9 * SCALE}" font-size="11" font-weight="800" fill="#64748B" text-anchor="middle" dominant-baseline="central">環廠南側車道 8.0M · 消防緊急通道</text>

        <!-- 40FT Container Loading Docks along West Wall -->
        <g id="outdoorLoadingDocks">
    `;

    // 4 Container Loading Docks (West Wall, Y = 10m, 20m, 30m, 40m)
    for (let d = 0; d < 4; d++) {
      const dy = OFFSET_Y + (8 + d * 10) * SCALE;
      const dx = OFFSET_X - 14 * SCALE;
      const dw = 13 * SCALE;
      const dh = 6.5 * SCALE;

      outHtml += `
        <rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" class="outdoor-dock-bay" rx="3"/>
        <line x1="${dx + dw}" y1="${dy}" x2="${dx + dw}" y2="${dy + dh}" stroke="#B45309" stroke-width="4"/>
        <text x="${dx + dw / 2}" y="${dy + dh / 2 - 4}" font-size="10" font-weight="800" fill="#B45309" text-anchor="middle">40FT 貨櫃泊位 D0${d + 1}</text>
        <text x="${dx + dw / 2}" y="${dy + dh / 2 + 10}" font-size="8.5" font-family="'JetBrains Mono', monospace" fill="#78350F" text-anchor="middle">12.5M × 3.5M 裝卸月台</text>
      `;
    }

    // Main Security Gate, Guardhouse & Truck Scale (North-West Entrance)
    const gateX = OFFSET_X - 18 * SCALE;
    const gateY = OFFSET_Y - 18 * SCALE;
    outHtml += `
      <!-- Main Entrance Gate & Guardhouse -->
      <rect x="${gateX + 2 * SCALE}" y="${gateY + 2 * SCALE}" width="${5 * SCALE}" height="${4 * SCALE}" fill="#1E293B" stroke="#0F172A" stroke-width="2" rx="3"/>
      <text x="${gateX + 4.5 * SCALE}" y="${gateY + 4.5 * SCALE}" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">警衛崗亭</text>

      <!-- Truck Weighbridge (地磅站 18M x 3.5M) -->
      <rect x="${gateX + 8 * SCALE}" y="${gateY + 2 * SCALE}" width="${18 * SCALE}" height="${3.5 * SCALE}" fill="#334155" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4,2" rx="2"/>
      <text x="${gateX + 17 * SCALE}" y="${gateY + 4 * SCALE}" font-size="9.5" font-weight="800" fill="#F8FAFC" text-anchor="middle" dominant-baseline="central">進出廠重車地磅站 (100T / 18.0M)</text>

      <!-- Main Sliding Gate -->
      <line x1="${gateX}" y1="${gateY + 7 * SCALE}" x2="${gateX + 16 * SCALE}" y2="${gateY + 7 * SCALE}" stroke="#2563EB" stroke-width="4"/>
      <text x="${gateX + 8 * SCALE}" y="${gateY + 9 * SCALE}" font-size="10" font-weight="800" fill="#1D4ED8" text-anchor="middle">廠區正門出入口 (16M 主大門)</text>
    `;

    // Parking Bays along North Road
    const parkX = OFFSET_X + 15 * SCALE;
    const parkY = OFFSET_Y - 14 * SCALE;
    for (let p = 0; p < 8; p++) {
      const px = parkX + p * 3.0 * SCALE;
      outHtml += `
        <rect x="${px}" y="${parkY}" width="${2.8 * SCALE}" height="${5.5 * SCALE}" class="outdoor-parking-bay" rx="2"/>
        <text x="${px + 1.4 * SCALE}" y="${parkY + 2.8 * SCALE}" font-size="8" font-weight="700" fill="#64748B" text-anchor="middle">P${p + 1}</text>
      `;
    }

    outHtml += `
        </g>
      </g>
    `;
    return outHtml;
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

      ${renderOutdoorSiteMasterPlan()}

      <!-- Factory Building Main Envelope Ground (No fixed stroke - formed by independent single walls) -->
      <rect x="${OFFSET_X - 10}" y="${OFFSET_Y - 10}" width="${TOTAL_W_M * SCALE + 20}" height="${TOTAL_H_M * SCALE + 20}" fill="var(--bg-panel)" stroke="none" rx="6"/>
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

    // 2. Double-line Architectural Walls Layer (可選取、移動、調整端點與厚度、刪除之單面實體雙線牆)
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

      // Render Active Magnetic Snap Guide & Indicator
      if (currentWallSnapInfo) {
        const spx = metersToSvg(currentWallSnapInfo.snapX, currentWallSnapInfo.snapY);
        html += `
          <g class="wall-snap-indicator">
            <circle cx="${spx.x}" cy="${spx.y}" r="12" class="wall-snap-ring"/>
            <circle cx="${spx.x}" cy="${spx.y}" r="4" class="wall-snap-dot"/>
            <rect x="${spx.x - 55}" y="${spx.y - 30}" width="110" height="20" rx="4" fill="#BE185D" opacity="0.92"/>
            <text x="${spx.x}" y="${spx.y - 16}" class="wall-snap-badge-text" text-anchor="middle">⌖ ${currentWallSnapInfo.desc}</text>
          </g>
        `;
      }

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

        // Midpoint label showing full route name
        if (f.points && f.points.length >= 2) {
          const midIdx = Math.floor(f.points.length / 2);
          const pMid = metersToSvg(f.points[midIdx].x, f.points[midIdx].y);
          const displayName = f.name || "動線";
          const labelW = Math.max(70, displayName.length * 12 + 16);
          html += `
            <rect x="${pMid.x - labelW / 2}" y="${pMid.y - 11}" width="${labelW}" height="22" rx="4" fill="var(--bg-panel)" stroke="${strokeCol}" stroke-width="1.2" fill-opacity="0.95"/>
            <text x="${pMid.x}" y="${pMid.y}" font-size="9" font-weight="700" fill="${strokeCol}" text-anchor="middle" dominant-baseline="central">${displayName}</text>
          `;
        }

        // Draggable waypoint handles when selected (with title tooltip)
        if (isSelected && f.points) {
          f.points.forEach((pt, idx) => {
            const svgPt = metersToSvg(pt.x, pt.y);
            const isWpSel = idx === selectedWaypointIndex;
            html += `
              <circle cx="${svgPt.x}" cy="${svgPt.y}" r="${isWpSel ? 8 : 6}" class="flow-waypoint-handle ${isWpSel ? 'active-waypoint' : ''}"
                      data-flow-id="${f.id}" data-point-index="${idx}"
                      fill="${isWpSel ? '#EF4444' : '#FFFFFF'}" stroke="${isWpSel ? '#FFFFFF' : '#2563EB'}" stroke-width="2.5">
                <title>端點 ${idx + 1} (按住滑鼠拖曳移動 / 滑鼠右鍵點擊可刪除此端點)</title>
              </circle>
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

    // 8. Movable & Editable Engineering Title Block
    const tb = layoutData.title_block || {};
    const tbW = tb.width || 460;
    const tbH = tb.height || 175;
    const defaultTbX = OFFSET_X + TOTAL_W_M * SCALE - tbW;
    const defaultTbY = OFFSET_Y + TOTAL_H_M * SCALE - tbH;
    const curTbX = typeof tb.x === "number" ? tb.x : defaultTbX;
    const curTbY = typeof tb.y === "number" ? tb.y : defaultTbY;
    const isTbSelected = selectedId === "title_block";

    html += `
      <g id="layerTitleBlock" class="svg-interactive-item svg-title-block-group ${isTbSelected ? 'selected' : ''}"
         data-id="title_block" transform="translate(${curTbX}, ${curTbY})">
        <rect width="${tbW}" height="${tbH}" fill="var(--bg-panel)" stroke="${isTbSelected ? 'var(--cad-selection)' : 'var(--cad-wall)'}" stroke-width="${isTbSelected ? '3' : '2'}" rx="4"/>
        <rect width="${tbW}" height="45" fill="#1E3A8A" rx="4"/>
        <rect y="40" width="${tbW}" height="5" fill="#1E3A8A"/>
        <text x="20" y="28" font-size="15" font-weight="800" fill="#FFFFFF">${tb.company || '金讚科技 · 廠房平面配置工程圖'}</text>
        <line x1="0" y1="45" x2="${tbW}" y2="45" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="88" x2="${tbW}" y2="88" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="0" y1="130" x2="${tbW}" y2="130" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="150" y1="45" x2="150" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1.2"/>
        <line x1="310" y1="45" x2="310" y2="${tbH}" stroke="var(--border-cad)" stroke-width="1.2"/>

        <text x="15" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖名 / TITLE</text>
        <text x="15" y="78" font-size="11" fill="var(--text-main)" font-weight="800">${tb.title || '1F生產動線、建築元件與全廠區配置'}</text>
        <text x="165" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">圖號 / DWG NO.</text>
        <text x="165" y="78" font-size="11" fill="var(--text-main)" font-weight="800">${tb.dwg_no || 'CC-ENG-2026-004'}</text>
        <text x="325" y="62" font-size="9" fill="var(--text-muted)" font-weight="600">版次 / REV</text>
        <text x="325" y="78" font-size="11" fill="var(--text-main)" font-weight="800">${tb.rev || 'REV V2.2'}</text>

        <text x="15" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">繪製 / DESIGNER</text>
        <text x="15" y="120" font-size="11" fill="var(--text-main)" font-weight="800">${tb.designer || 'Derek Yeh'}</text>
        <text x="165" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">標高 / ELEVATION</text>
        <text x="165" y="120" font-size="11" fill="#DC2626" font-weight="800">${tb.elevation || '1F +0.6M / 2F +4.4M'}</text>
        <text x="325" y="104" font-size="9" fill="var(--text-muted)" font-weight="600">日期 / DATE</text>
        <text x="325" y="120" font-size="11" fill="var(--text-main)" font-weight="800">${tb.date || '2026/09/09'}</text>

        <text x="15" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">規格 / SPEC</text>
        <text x="15" y="162" font-size="11" fill="#16A34A" font-weight="800">${tb.spec || '140M×90M · 廠區/車道/設備'}</text>
        <text x="165" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">比例 / SCALE</text>
        <text x="165" y="162" font-size="11" fill="var(--text-main)" font-weight="800">${tb.scale || '1:150 (Metric)'}</text>
        <text x="325" y="146" font-size="9" fill="var(--text-muted)" font-weight="600">狀態 / STATUS</text>
        <text x="325" y="162" font-size="11" fill="#16A34A" font-weight="800">${tb.status || 'APPROVED 正式版'}</text>
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
      // High-precision Architectural Office Furniture
      const c = eq.code || "";
      if (c.startsWith("CONF")) {
        // Conference Table with Chairs
        const chairsX = Math.max(2, Math.floor((ew - 20) / 24));
        itemHtml += `
          <rect class="main-box furniture-conf-top" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" rx="8"/>
          <rect x="${pos.x + 8}" y="${pos.y + 6}" width="${ew - 16}" height="${eh - 12}" fill="none" stroke="#94A3B8" stroke-width="0.8" stroke-dasharray="2,2" rx="4"/>
        `;
        for (let i = 0; i < chairsX; i++) {
          const chX = pos.x + 12 + i * (ew - 24) / chairsX;
          itemHtml += `
            <rect x="${chX}" y="${pos.y - 7}" width="13" height="5" rx="2" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
            <rect x="${chX}" y="${pos.y + eh + 2}" width="13" height="5" rx="2" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          `;
        }
        itemHtml += `
          <text x="${centerX}" y="${centerY - 4}" font-size="9.5" font-weight="800" fill="#1E3A8A" text-anchor="middle">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 8}" font-size="8" font-weight="600" fill="#64748B" text-anchor="middle">${eq.name}</text>
        `;
      } else if (c.startsWith("STAFF") || c.startsWith("TEAM")) {
        // 4P or 6P Cubicle / Workstation Island with Partition Screen
        itemHtml += `
          <rect class="main-box furniture-desk-top" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" rx="3"/>
          <line x1="${pos.x}" y1="${centerY}" x2="${pos.x + ew}" y2="${centerY}" class="furniture-screen-line"/>
        `;
        const bays = c.startsWith("TEAM") ? 3 : 2;
        const bayW = ew / bays;
        for (let b = 0; b < bays; b++) {
          const bx = pos.x + b * bayW;
          if (b > 0) itemHtml += `<line x1="${bx}" y1="${pos.y}" x2="${bx}" y2="${pos.y + eh}" stroke="#CBD5E1" stroke-width="1"/>`;
          itemHtml += `
            <rect x="${bx + bayW / 2 - 10}" y="${centerY - 8}" width="20" height="3" fill="#334155" rx="1"/>
            <rect x="${bx + bayW / 2 - 10}" y="${centerY + 5}" width="20" height="3" fill="#334155" rx="1"/>
            <circle cx="${bx + bayW / 2}" cy="${pos.y + 7}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
            <circle cx="${bx + bayW / 2}" cy="${pos.y + eh - 7}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          `;
        }
        itemHtml += `
          <rect x="${centerX - 35}" y="${centerY - 8}" width="70" height="16" fill="rgba(255,255,255,0.9)" rx="3"/>
          <text x="${centerX}" y="${centerY}" font-size="8.5" font-weight="800" fill="#0369A1" text-anchor="middle" dominant-baseline="central">${eq.code} (${eq.name.split(' ')[0]})</text>
        `;
      } else if (c.startsWith("L-DESK")) {
        // L-Shaped Executive Desk
        itemHtml += `
          <path d="M ${pos.x} ${pos.y} L ${pos.x + ew} ${pos.y} L ${pos.x + ew} ${pos.y + eh * 0.45} L ${pos.x + ew * 0.55} ${pos.y + eh * 0.45} L ${pos.x + ew * 0.55} ${pos.y + eh} L ${pos.x} ${pos.y + eh} Z"
                class="main-box furniture-desk-top"/>
          <rect x="${pos.x + 10}" y="${pos.y + 6}" width="20" height="4" fill="#334155" rx="1"/>
          <circle cx="${pos.x + 22}" cy="${pos.y + 24}" r="7" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1"/>
          <text x="${pos.x + ew * 0.6}" y="${pos.y + eh * 0.75}" font-size="8.5" font-weight="800" fill="#1E293B" text-anchor="middle">${eq.code}</text>
        `;
      } else if (c.startsWith("ROUND")) {
        // Round Meeting Table
        const r = Math.min(ew, eh) / 2;
        itemHtml += `
          <circle class="main-box furniture-conf-top" cx="${centerX}" cy="${centerY}" r="${r}"/>
          <circle cx="${centerX}" cy="${centerY}" r="${r * 0.6}" fill="none" stroke="#CBD5E1" stroke-width="0.8"/>
          <circle cx="${centerX}" cy="${centerY - r - 4}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          <circle cx="${centerX}" cy="${centerY + r + 4}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          <circle cx="${centerX - r - 4}" cy="${centerY}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          <circle cx="${centerX + r + 4}" cy="${centerY}" r="5" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          <text x="${centerX}" y="${centerY}" font-size="9" font-weight="800" fill="#1E293B" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
        `;
      } else if (c.startsWith("SOFA")) {
        // Lounge Sofa
        itemHtml += `
          <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#E2E8F0" stroke="#475569" stroke-width="1.6" rx="6"/>
          <rect x="${pos.x + 4}" y="${pos.y + 4}" width="8" height="${eh - 8}" fill="#CBD5E1" rx="3"/>
          <rect x="${pos.x + ew - 12}" y="${pos.y + 4}" width="8" height="${eh - 8}" fill="#CBD5E1" rx="3"/>
          <rect x="${pos.x + 14}" y="${pos.y + 4}" width="${ew - 28}" height="${eh * 0.35}" fill="#94A3B8" rx="3"/>
          <text x="${centerX}" y="${centerY + 6}" font-size="9" font-weight="800" fill="#334155" text-anchor="middle">${eq.code} 沙發</text>
        `;
      } else if (c.startsWith("FILE") || c.startsWith("SIDE") || c.startsWith("CAB")) {
        // File Cabinet / Lateral Credenza
        itemHtml += `
          <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#F1F5F9" stroke="#64748B" stroke-width="1.5" rx="2"/>
          <line x1="${pos.x + ew / 2}" y1="${pos.y}" x2="${pos.x + ew / 2}" y2="${pos.y + eh}" stroke="#94A3B8" stroke-width="1"/>
          <line x1="${pos.x + 6}" y1="${pos.y + 3}" x2="${pos.x + ew / 2 - 6}" y2="${pos.y + 3}" stroke="#334155" stroke-width="1.5"/>
          <line x1="${pos.x + ew / 2 + 6}" y1="${pos.y + 3}" x2="${pos.x + ew - 6}" y2="${pos.y + 3}" stroke="#334155" stroke-width="1.5"/>
          <text x="${centerX}" y="${centerY}" font-size="8.5" font-weight="800" fill="#475569" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
        `;
      } else if (c.startsWith("PRINTER")) {
        // Multi-function Printer Station
        itemHtml += `
          <rect class="main-box" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" fill="#0F766E" fill-opacity="0.15" stroke="#0F766E" stroke-width="1.8" rx="4"/>
          <rect x="${pos.x + 6}" y="${pos.y + 6}" width="${ew * 0.6}" height="${eh - 12}" fill="#FFFFFF" stroke="#0F766E" stroke-width="1" rx="2"/>
          <rect x="${pos.x + ew * 0.7}" y="${pos.y + 8}" width="${ew * 0.22}" height="${eh * 0.4}" fill="#047857" rx="2"/>
          <text x="${centerX}" y="${centerY}" font-size="8" font-weight="800" fill="#065F46" text-anchor="middle" dominant-baseline="central">事務機</text>
        `;
      } else {
        // Standard Desk
        itemHtml += `
          <rect class="main-box furniture-desk-top" x="${pos.x}" y="${pos.y}" width="${ew}" height="${eh}" rx="3"/>
          <rect x="${centerX - 10}" y="${pos.y + 5}" width="20" height="4" fill="#334155" rx="1"/>
          <circle cx="${centerX}" cy="${pos.y + eh - 6}" r="6" fill="#3B82F6" stroke="#1D4ED8" stroke-width="0.8"/>
          <text x="${centerX}" y="${centerY - 2}" font-size="9" font-weight="800" fill="#334155" text-anchor="middle">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 10}" font-size="7.5" fill="#64748B" text-anchor="middle">${eq.name}</text>
        `;
      }
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

      if (eh > 34) {
        itemHtml += `
          <text x="${centerX}" y="${centerY - 8}" font-size="11" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 6}" font-size="9" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${eq.name}</text>
          <text x="${centerX}" y="${centerY + 18}" font-size="8" font-family="'JetBrains Mono', monospace" fill="var(--cad-dim-text)" text-anchor="middle">${eq.width.toFixed(1)}m × ${eq.height.toFixed(1)}m</text>
        `;
      } else if (eh > 18) {
        itemHtml += `
          <text x="${centerX}" y="${centerY - 4}" font-size="9.5" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code}</text>
          <text x="${centerX}" y="${centerY + 6}" font-size="8" font-weight="600" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="central">${eq.name}</text>
        `;
      } else {
        itemHtml += `<text x="${centerX}" y="${centerY}" font-size="9" font-weight="800" fill="var(--text-main)" text-anchor="middle" dominant-baseline="central">${eq.code} · ${eq.name}</text>`;
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

  // --- Attach Event Listeners to SVG Inner Elements (Called after innerHTML re-render) ---
  function attachSvgClickListeners() {
    // 1. Interactive Item Selection & Double-click Quick Rename
    svgEl.querySelectorAll(".svg-interactive-item").forEach(el => {
      el.addEventListener("click", (e) => {
        if (isDrawingRoute) return;
        e.stopPropagation();
        const id = el.getAttribute("data-id");
        selectItem(id);
      });

      // Double-click to quick rename directly on canvas
      el.addEventListener("dblclick", (e) => {
        if (isDrawingRoute) return;
        e.stopPropagation();
        e.preventDefault();
        const id = el.getAttribute("data-id");
        selectItem(id);
        openQuickRenameBox(id, e.clientX, e.clientY);
      });
    });

    // 2. Flow Waypoint Right-click (Delete Waypoint) & Selection
    svgEl.querySelectorAll(".flow-waypoint-handle").forEach(handle => {
      handle.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fid = handle.getAttribute("data-flow-id");
        const pidx = parseInt(handle.getAttribute("data-point-index"), 10);
        const rec = findItemRecord(fid);
        if (rec && rec.item && rec.item.points) {
          if (rec.item.points.length <= 2) {
            alert("動線至少需保留起點與終點 2 個折點。如需刪除整條動線，請點擊右側「刪除物件」或按 Delete 鍵。");
            return;
          }
          rec.item.points.splice(pidx, 1);
          selectedWaypointIndex = -1;
          saveToLocalStorage();
          renderSvg();
          selectItem(fid);
        }
      });

      handle.addEventListener("click", (e) => {
        e.stopPropagation();
        const pidx = parseInt(handle.getAttribute("data-point-index"), 10);
        selectedWaypointIndex = pidx;
        renderSvg();
      });
    });

    // 3. Flow Line Click (Insert New Waypoint into Selected Flow)
    svgEl.querySelectorAll(".svg-flow-group.selected .flow-hit-area").forEach(hitArea => {
      hitArea.addEventListener("click", (e) => {
        if (isDrawingRoute) return;
        e.stopPropagation();
        const group = hitArea.closest(".svg-flow-group");
        if (!group) return;
        const fid = group.getAttribute("data-id");
        const rec = findItemRecord(fid);
        if (!rec || !rec.item || !rec.item.points || rec.item.points.length < 2) return;

        const svgPt = clientToSvgCoords(e.clientX, e.clientY);
        const mPt = svgToMeters(svgPt.x, svgPt.y);
        const snapX = snapValue(mPt.x, currentSnapM);
        const snapY = snapValue(mPt.y, currentSnapM);

        // Find the closest segment to insert the new point
        const pts = rec.item.points;
        let bestIdx = 0;
        let minSegDist = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dist = distToSegment({ x: snapX, y: snapY }, p1, p2);
          if (dist < minSegDist) {
            minSegDist = dist;
            bestIdx = i + 1;
          }
        }
        pts.splice(bestIdx, 0, { x: snapX, y: snapY });
        selectedWaypointIndex = bestIdx;
        saveToLocalStorage();
        renderSvg();
        selectItem(fid);
      });
    });
  }

  // Distance from point P to line segment AB (in meters)
  function distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
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

    const cardTitleBlockProps = document.getElementById("cardTitleBlockProps");

    // Configure card visibility based on item type
    if (rec.type === "title_block") {
      selectionBadge.textContent = "📑 工程圖說明欄 (可拖曳)";
      selectionBadge.classList.add("active");

      cardStandardDims.style.display = "none";
      cardStandardCoords.style.display = "none";
      cardFlowProps.style.display = "none";
      cardWallProps.style.display = "none";
      cardClearance.style.display = "none";
      if (cardTitleBlockProps) cardTitleBlockProps.style.display = "block";

      const tb = rec.item;
      const propTbTitle = document.getElementById("propTbTitle");
      const propTbDwgNo = document.getElementById("propTbDwgNo");
      const propTbRev = document.getElementById("propTbRev");
      const propTbDesigner = document.getElementById("propTbDesigner");
      const propTbElevation = document.getElementById("propTbElevation");
      const propTbDate = document.getElementById("propTbDate");
      const propTbStatus = document.getElementById("propTbStatus");
      const propTbSpec = document.getElementById("propTbSpec");

      if (propTbTitle) propTbTitle.value = tb.title || "";
      if (propTbDwgNo) propTbDwgNo.value = tb.dwg_no || "";
      if (propTbRev) propTbRev.value = tb.rev || "";
      if (propTbDesigner) propTbDesigner.value = tb.designer || "";
      if (propTbElevation) propTbElevation.value = tb.elevation || "";
      if (propTbDate) propTbDate.value = tb.date || "";
      if (propTbStatus) propTbStatus.value = tb.status || "";
      if (propTbSpec) propTbSpec.value = tb.spec || "";

      renderSvg();
      return;
    }

    if (cardTitleBlockProps) cardTitleBlockProps.style.display = "none";

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

    pushHistoryState(`刪除物件 ${rec.item.name || rec.item.code || ''}`);
    const idx = rec.collection.findIndex(item => item.id === selectedId);
    if (idx !== -1) {
      rec.collection.splice(idx, 1);
    }
    deselectAll();
    saveToLocalStorage();
    renderSvg();
    showToast("已刪除所選物件 (可按 Ctrl+Z 復原)", "info", 1800);
  }

  // --- Universal Duplication ---
  function duplicateSelected() {
    if (!selectedId) return;
    const rec = findItemRecord(selectedId);
    if (!rec) return;

    const item = rec.item;
    const cloned = JSON.parse(JSON.stringify(item));
    cloned.id = `${rec.type}_${Date.now()}`;

    pushHistoryState(`複製物件 ${item.name || item.code || ''}`);

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

    pushHistoryState(`旋轉物件 ${item.code || item.name || ''}`);
    item.rotation = ((item.rotation || 0) + delta + 360) % 360;
    rotationAngleDisplay.textContent = `${item.rotation}°`;
    saveToLocalStorage();
    renderSvg();
  }

  // --- Populate Equipment & Architectural Library ---
  function populateLibrary() {
    const container = document.getElementById("libraryContainer");
    if (!container) return;

    const categories = {};

    // 1. My Custom Equipment Library (if any)
    if (customEquipmentLib && customEquipmentLib.length > 0) {
      categories["⭐ 我的自訂設備庫 (Custom)"] = customEquipmentLib;
    }

    // Standard preset categories
    Object.assign(categories, {
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
      "🪑 辦公室傢俱模組 (Office Furniture)": [
        { code: "EXEC-DESK", name: "總裁/主管大辦公桌 (2.2×1.1M)", w: 2.2, h: 1.1, cat: "Furniture", col: "#1E293B" },
        { code: "L-DESK", name: "L型經理辦公桌組 (1.8×1.6M)", w: 1.8, h: 1.6, cat: "Furniture", col: "#334155" },
        { code: "DESK-STD", name: "標準職員辦公桌組 (1.6×0.8M)", w: 1.6, h: 0.8, cat: "Furniture", col: "#475569" },
        { code: "STAFF-4P", name: "4人對向屏風辦公卡座 (2.8×1.4M)", w: 2.8, h: 1.4, cat: "Furniture", col: "#0284C7" },
        { code: "TEAM-6P", name: "6人團隊對向工作島 (4.2×1.4M)", w: 4.2, h: 1.4, cat: "Furniture", col: "#0284C7" },
        { code: "CONF-12P", name: "12人大型實木會議桌 (4.2×1.5M)", w: 4.2, h: 1.5, cat: "Furniture", col: "#1E3A8A" },
        { code: "CONF-8P", name: "8人中型會議長桌 (3.2×1.2M)", w: 3.2, h: 1.2, cat: "Furniture", col: "#1E293B" },
        { code: "ROUND-4P", name: "4人圓形洽談討論桌 (1.5×1.5M)", w: 1.5, h: 1.5, cat: "Furniture", col: "#475569" },
        { code: "FILE-CAB", name: "高載重檔案收納鐵櫃 (1.2×0.45M)", w: 1.2, h: 0.45, cat: "Furniture", col: "#64748B" },
        { code: "SIDE-CAB", name: "矮型側邊資料矮櫃 (1.6×0.5M)", w: 1.6, h: 0.5, cat: "Furniture", col: "#64748B" },
        { code: "PRINTER-STN", name: "多功能事務影印工作站 (1.2×0.8M)", w: 1.2, h: 0.8, cat: "Furniture", col: "#0F766E" },
        { code: "PANTRY-BAR", name: "員工茶水間流理台 (2.0×0.6M)", w: 2.0, h: 0.6, cat: "Furniture", col: "#0D9488" },
        { code: "SOFA-L", name: "接待區L型沙發茶几組 (2.8×2.0M)", w: 2.8, h: 2.0, cat: "Furniture", col: "#475569" },
        { code: "SOFA-2P", name: "休憩區商務雙人沙發 (1.8×0.85M)", w: 1.8, h: 0.85, cat: "Furniture", col: "#475569" },
        { code: "PART-GLASS", name: "辦公隔屏玻璃矮屏風 (2.4×0.15M)", w: 2.4, h: 0.15, cat: "Furniture", col: "#0284C7" }
      ],
      "🚻 衛浴與廠務 (Sanitary & Utility)": [
        { code: "WC-STALLS", name: "洗手間隔間組 (3.0×2.0M)", w: 3.0, h: 2.0, cat: "Sanitary", col: "#0284C7" },
        { code: "SINK-IND", name: "工業洗手台水槽 (1.8×0.6M)", w: 1.8, h: 0.6, cat: "Sanitary", col: "#0284C7" },
        { code: "PANTRY", name: "茶水間流理台 (2.4×0.7M)", w: 2.4, h: 0.7, cat: "Sanitary", col: "#0D9488" },
        { code: "ELEC-PANEL", name: "高低壓主配電盤 (2.0×0.8M)", w: 2.0, h: 0.8, cat: "Utility", col: "#DC2626" },
        { code: "FIRE-HOSE", name: "廠房消防栓箱 (0.8×0.4M)", w: 0.8, h: 0.4, cat: "Utility", col: "#EF4444" }
      ],
      "🧱 結構構件與牆體 (Columns & Walls)": [
        { code: "WALL-SINGLE", name: "單面實體隔間雙線牆 (5.0×0.3M)", w: 5.0, h: 0.3, cat: "WallItem", col: "#475569" },
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
    });

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
            <div class="lib-item-actions">
              <span class="lib-badge" style="border-color: ${item.col}; color: ${item.col}">${item.code}</span>
              <button type="button" class="lib-item-add-btn" title="立即放置到圖面中央">＋ 放置</button>
              ${item.isCustom ? `<button type="button" class="lib-item-custom-delete" data-del-code="${item.code}" title="從自訂庫移除">×</button>` : ''}
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
    }
    container.innerHTML = html;

    // Custom item deletion handler
    container.querySelectorAll(".lib-item-custom-delete").forEach(delBtn => {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const codeToDel = delBtn.getAttribute("data-del-code");
        if (confirm(`確定要將自訂設備 [${codeToDel}] 從設備庫中移除嗎？`)) {
          customEquipmentLib = customEquipmentLib.filter(c => c.code !== codeToDel);
          saveCustomLibToStorage();
          populateLibrary();
        }
      });
    });

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

        if (cat === "WallItem") {
          addNewWall();
          return;
        }

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

        pushHistoryState(`放置 ${name}`);

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
        saveToLocalStorage();
        renderSvg();
        showToast(`✔ 已將 [${name}] 放置於圖面中央！可在圖面上拖曳擺位`, "success");
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
  // --- Flow Route Drawing Controls ---
  function startDrawingRoute() {
    isDrawingRoute = true;
    activeRoutePoints = [];
    deselectAll();

    if (btnDrawRoute) {
      btnDrawRoute.classList.add("drawing-mode");
      btnDrawRoute.innerHTML = `<span class="btn-icon">🛑</span> 繪製中...`;
    }

    const routeBar = document.getElementById("routeDrawingBar");
    if (routeBar) routeBar.style.display = "flex";
    const countEl = document.getElementById("routePointCount");
    if (countEl) countEl.textContent = "0";

    viewportEl.style.cursor = "crosshair";
    renderSvg();
  }

  function cancelDrawingRoute() {
    isDrawingRoute = false;
    activeRoutePoints = [];

    if (btnDrawRoute) {
      btnDrawRoute.classList.remove("drawing-mode");
      btnDrawRoute.innerHTML = `<span class="btn-icon">📍</span> 繪製動線`;
    }

    const routeBar = document.getElementById("routeDrawingBar");
    if (routeBar) routeBar.style.display = "none";

    viewportEl.style.cursor = "default";
    renderSvg();
  }

  function toggleDrawingRoute() {
    if (isDrawingRoute) {
      cancelDrawingRoute();
    } else {
      startDrawingRoute();
    }
  }

  function undoRoutePoint() {
    if (activeRoutePoints.length > 0) {
      activeRoutePoints.pop();
      const countEl = document.getElementById("routePointCount");
      if (countEl) countEl.textContent = activeRoutePoints.length;
      renderSvg();
    }
  }

  function finishDrawingRoute() {
    if (activeRoutePoints.length >= 2) {
      const typeSelect = document.getElementById("drawRouteTypeSelect");
      const fType = typeSelect ? typeSelect.value : "forklift";
      const fColor = fType === "forklift" ? "#F59E0B" :
                     fType === "pedestrian" ? "#10B981" :
                     fType === "process" ? "#3B82F6" : "#EF4444";
      const fWidth = fType === "forklift" ? 3.0 :
                     fType === "pedestrian" ? 1.5 : 2.0;
      const typeName = fType === "forklift" ? "叉車主動線" :
                       fType === "pedestrian" ? "人行安全動線" :
                       fType === "process" ? "製程物流動線" : "消防逃生動線";

      if (!layoutData.flows) layoutData.flows = [];
      const newFlow = {
        id: `flow_${Date.now()}`,
        name: `${typeName} ${layoutData.flows.length + 1}`,
        type: fType,
        points: JSON.parse(JSON.stringify(activeRoutePoints)),
        width_m: fWidth,
        color: fColor,
        dash: "8,4",
        arrow_direction: "both"
      };
      layoutData.flows.push(newFlow);
      cancelDrawingRoute();
      saveToLocalStorage();
      selectItem(newFlow.id);
      renderSvg();
    } else {
      alert("動線至少需在圖面上點選 2 個折點才能完成。如欲退出請點擊取消。");
    }
  }

  // --- Add Aisle Zone Function ---
  function addNewAisle() {
    const centerSvg = {
      x: viewBox.x + viewBox.width / 2,
      y: viewBox.y + viewBox.height / 2
    };
    const centerM = svgToMeters(centerSvg.x, centerSvg.y);
    const snapX = snapValue(centerM.x - 4.0, currentSnapM);
    const snapY = snapValue(centerM.y - 1.5, currentSnapM);

    if (!layoutData.aisles) layoutData.aisles = [];
    const newAisle = {
      id: `aisle_${Date.now()}`,
      name: `物流通道 ${layoutData.aisles.length + 1}`,
      x: Math.max(0, snapX),
      y: Math.max(0, snapY),
      width: 8.0,
      height: 3.0
    };

    layoutData.aisles.push(newAisle);
    saveToLocalStorage();
    selectItem(newAisle.id);
    renderSvg();
  }


  // --- Quick Rename Box Controller (Double-click on Canvas) ---
  let activeRenameId = null;

  function openQuickRenameBox(id, clientX, clientY) {
    const rec = findItemRecord(id);
    if (!rec) return;
    activeRenameId = id;

    const box = document.getElementById("quickRenameBox");
    const titleEl = document.getElementById("quickRenameTitle");
    const nameInp = document.getElementById("quickRenameName");
    const codeInp = document.getElementById("quickRenameCode");
    const codeGroup = document.getElementById("quickRenameCodeGroup");

    const item = rec.item;
    titleEl.textContent = `✏️ 編輯名稱 (${item.code || rec.type.toUpperCase()})`;
    nameInp.value = item.name || item.description || "";
    
    if (item.code !== undefined) {
      codeGroup.style.display = "flex";
      codeInp.value = item.code || "";
    } else {
      codeGroup.style.display = "none";
    }

    // Position box near mouse cursor
    const vpRect = viewportEl.getBoundingClientRect();
    let left = clientX - vpRect.left + 15;
    let top = clientY - vpRect.top + 15;
    if (left + 300 > vpRect.width) left = vpRect.width - 310;
    if (top + 180 > vpRect.height) top = vpRect.height - 190;
    left = Math.max(10, left);
    top = Math.max(10, top);

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.display = "flex";

    nameInp.focus();
    nameInp.select();
  }

  function closeQuickRenameBox() {
    activeRenameId = null;
    const box = document.getElementById("quickRenameBox");
    if (box) box.style.display = "none";
  }

  function saveQuickRename() {
    if (!activeRenameId) return;
    const rec = findItemRecord(activeRenameId);
    if (!rec) { closeQuickRenameBox(); return; }

    const nameInp = document.getElementById("quickRenameName");
    const codeInp = document.getElementById("quickRenameCode");
    const newName = nameInp.value.trim();
    const newCode = codeInp.value.trim();

    if (rec.type === "wall") {
      rec.item.description = newName || rec.item.description;
    } else {
      if (newName) rec.item.name = newName;
      if (newCode && rec.item.code !== undefined) rec.item.code = newCode;
    }

    closeQuickRenameBox();
    saveToLocalStorage();
    selectItem(rec.item.id);
    renderSvg();
  }

  // --- Add Custom Equipment Modal Controller ---
  function openAddEquipmentModal() {
    const modal = document.getElementById("addEquipmentModal");
    if (!modal) return;
    modal.style.display = "flex";

    // Auto-generate code
    const nameInp = document.getElementById("newEqName");
    const codeInp = document.getElementById("newEqCode");
    nameInp.value = "";
    codeInp.value = `M${(layoutData.equipment ? layoutData.equipment.length : 0) + 1}-1`;
    document.getElementById("newEqWidth").value = "4.0";
    document.getElementById("newEqHeight").value = "2.0";
    updateModalStats();
    nameInp.focus();
  }

  function closeAddEquipmentModal() {
    const modal = document.getElementById("addEquipmentModal");
    if (modal) modal.style.display = "none";
  }

  function updateModalStats() {
    const w = Math.max(0.2, parseFloat(document.getElementById("newEqWidth").value) || 1.0);
    const h = Math.max(0.2, parseFloat(document.getElementById("newEqHeight").value) || 1.0);
    const areaEl = document.getElementById("newEqArea");
    const mmEl = document.getElementById("newEqMm");
    if (areaEl) areaEl.textContent = (w * h).toFixed(2);
    if (mmEl) mmEl.textContent = `${Math.round(w * 1000)} × ${Math.round(h * 1000)} mm`;
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
      name: "單面實體隔間牆",
      description: "新建單面實體雙線牆 (可端點拉伸與自動磁吸)"
    };

    if (!layoutData.walls) layoutData.walls = [];
    pushHistoryState("新增單面牆體");
    layoutData.walls.push(newWall);
    saveToLocalStorage();
    selectItem(newWall.id);
    renderSvg();
    showToast("已新增單面隔間雙線牆！可自由拖曳端點與長度，靠近其他牆體自動磁吸", "success", 3000);
  }

  // --- Zoom & Pan Helper Functions ---
  function updateViewBox() {
    svgEl.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    const zoomResetBtn = document.getElementById("zoomResetBtn");
    if (zoomResetBtn) {
      const zoomPct = Math.round((SVG_WIDTH / viewBox.width) * 100);
      zoomResetBtn.textContent = `${zoomPct}%`;
      zoomResetBtn.title = `當前縮放 ${zoomPct}% · 點擊或單按 Control 鍵恢復 100% 置中`;
    }
  }

  function resetToCenter100() {
    viewBox = { x: 0, y: 0, width: SVG_WIDTH, height: SVG_HEIGHT };
    updateViewBox();
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
      let targetW, targetH, targetOffsetX = 0, targetOffsetY = 0;
      if (siteViewMode === "indoor") {
        targetW = TOTAL_W_M * SCALE + OFFSET_X + 160;
        targetH = TOTAL_H_M * SCALE + OFFSET_Y + 120;
      } else {
        const marginX = siteViewMode === "max" ? 30.0 : SITE_MARGIN_X_M;
        const marginY = siteViewMode === "max" ? 25.0 : SITE_MARGIN_Y_M;
        targetW = (TOTAL_W_M + marginX * 2) * SCALE + OFFSET_X + 200;
        targetH = (TOTAL_H_M + marginY * 2) * SCALE + OFFSET_Y + 160;
        targetOffsetX = -(marginX * SCALE) / 2;
        targetOffsetY = -(marginY * SCALE) / 2;
      }
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


  // --- Dynamic Floor Management Controller ---
  function renderFloorSelector() {
    const selector = document.getElementById("floorSelector");
    if (!selector) return;

    let html = "";
    (layoutData.floors || []).forEach(f => {
      const isActive = currentFloor === f.id;
      const isOverlay = f.id === "OVERLAY";
      const pillClass = isOverlay ? "pill-overlay" : (f.id === "2F" ? "pill-2f" : "");

      html += `
        <button class="floor-btn ${isActive ? 'active' : ''}" data-floor="${f.id}" id="btnFloor_${f.id}" title="${f.desc || ''}">
          <span class="floor-pill ${pillClass}">${f.id}</span>
          <span class="floor-name">${f.name}</span>
          <span class="floor-elev">${f.elev}</span>
        </button>
      `;
    });

    selector.innerHTML = html;

    // Attach click listeners to floor buttons
    selector.querySelectorAll(".floor-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-floor");
        switchFloor(target);
      });
    });

    // Also populate modal floor dropdown
    const modalFloorSelect = document.getElementById("newEqFloor");
    if (modalFloorSelect) {
      let fOpts = "";
      (layoutData.floors || []).forEach(f => {
        if (f.id !== "OVERLAY") {
          fOpts += `<option value="${f.id}" ${f.id === currentFloor ? 'selected' : ''}>${f.id} ${f.name} (${f.elev})</option>`;
        }
      });
      modalFloorSelect.innerHTML = fOpts;
    }
  }

  function openFloorManageModal() {
    const modal = document.getElementById("floorManageModal");
    if (!modal) return;
    document.getElementById("newFloorCode").value = `3F`;
    document.getElementById("newFloorName").value = "研發與辦公中心";
    document.getElementById("newFloorElevation").value = "EL. +8.20M";
    document.getElementById("newFloorDesc").value = "新建研發大樓分層";
    modal.style.display = "flex";
  }

  function closeFloorManageModal() {
    const modal = document.getElementById("floorManageModal");
    if (modal) modal.style.display = "none";
  }

  function submitFloorModal(e) {
    e.preventDefault();
    const code = document.getElementById("newFloorCode").value.trim().toUpperCase();
    const name = document.getElementById("newFloorName").value.trim();
    const elev = document.getElementById("newFloorElevation").value.trim();
    const desc = document.getElementById("newFloorDesc").value.trim();

    if (!code || !name) {
      alert("請輸入樓層代號與名稱！");
      return;
    }

    const existing = (layoutData.floors || []).find(f => f.id === code);
    if (existing) {
      alert(`樓層代號 [${code}] 已存在！`);
      return;
    }

    if (!layoutData.floors) layoutData.floors = [];
    layoutData.floors.push({ id: code, name, elev, desc });

    closeFloorManageModal();
    saveToLocalStorage();
    renderFloorSelector();
    switchFloor(code);
    showToast(`✔ 成功建立樓層 [${code} ${name}] 並切換！`, "success");
  }

  // --- Floor Switching Controller ---
  function switchFloor(targetFloor) {
    currentFloor = targetFloor;

    const selector = document.getElementById("floorSelector");
    if (selector) {
      selector.querySelectorAll(".floor-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-floor") === targetFloor);
      });
    }

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

    // Site View Mode Switcher
    const siteViewSelect = document.getElementById("siteViewSelect");
    if (siteViewSelect) {
      siteViewSelect.addEventListener("change", (e) => {
        siteViewMode = e.target.value;
        fitToScreen();
        renderSvg();
        showToast(`已切換至：${e.target.options[e.target.selectedIndex].text}`, "info");
      });
    }

    // Floor Modal Triggers
    const btnAddFloorModalBtn = document.getElementById("btnAddFloorModalBtn");
    if (btnAddFloorModalBtn) btnAddFloorModalBtn.addEventListener("click", openFloorManageModal);

    const closeFloorModalBtn = document.getElementById("closeFloorModalBtn");
    if (closeFloorModalBtn) closeFloorModalBtn.addEventListener("click", closeFloorManageModal);

    const cancelFloorModalBtn = document.getElementById("cancelFloorModalBtn");
    if (cancelFloorModalBtn) cancelFloorModalBtn.addEventListener("click", closeFloorManageModal);

    const addFloorForm = document.getElementById("addFloorForm");
    if (addFloorForm) addFloorForm.addEventListener("submit", submitFloorModal);

    // Big Custom Add Equipment Banner Trigger
    const btnSidebarAddCustomBig = document.getElementById("btnSidebarAddCustomBig");
    if (btnSidebarAddCustomBig) btnSidebarAddCustomBig.addEventListener("click", openAddEquipmentModal);

    const btnEmptyStateAddCustom = document.getElementById("btnEmptyStateAddCustom");
    if (btnEmptyStateAddCustom) btnEmptyStateAddCustom.addEventListener("click", openAddEquipmentModal);

    const btnInspectorAddCustom = document.getElementById("btnInspectorAddCustom");
    if (btnInspectorAddCustom) btnInspectorAddCustom.addEventListener("click", openAddEquipmentModal);

    // Title Block Live Input Bindings
    ["propTbTitle", "propTbDwgNo", "propTbRev", "propTbDesigner", "propTbElevation", "propTbDate", "propTbStatus", "propTbSpec"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          if (!layoutData.title_block) return;
          const key = id.replace("propTb", "").toLowerCase();
          const keyMap = {
            title: "title",
            dwgno: "dwg_no",
            rev: "rev",
            designer: "designer",
            elevation: "elevation",
            date: "date",
            status: "status",
            spec: "spec"
          };
          layoutData.title_block[keyMap[key] || key] = e.target.value;
          saveToLocalStorage();
          renderSvg();
        });
      }
    });

    // Title Block Quick Corner Docking Buttons
    const btnTbDockBR = document.getElementById("btnTbDockBR");
    if (btnTbDockBR) {
      btnTbDockBR.addEventListener("click", () => {
        if (!layoutData.title_block) return;
        layoutData.title_block.x = null;
        layoutData.title_block.y = null;
        saveToLocalStorage();
        renderSvg();
        showToast("工程說明欄已靠齊：右下角", "info");
      });
    }

    const btnTbDockBL = document.getElementById("btnTbDockBL");
    if (btnTbDockBL) {
      btnTbDockBL.addEventListener("click", () => {
        if (!layoutData.title_block) return;
        layoutData.title_block.x = OFFSET_X + 20;
        layoutData.title_block.y = OFFSET_Y + TOTAL_H_M * SCALE - 175;
        saveToLocalStorage();
        renderSvg();
        showToast("工程說明欄已靠齊：左下角", "info");
      });
    }

    const btnTbDockTR = document.getElementById("btnTbDockTR");
    if (btnTbDockTR) {
      btnTbDockTR.addEventListener("click", () => {
        if (!layoutData.title_block) return;
        layoutData.title_block.x = OFFSET_X + TOTAL_W_M * SCALE - 460;
        layoutData.title_block.y = OFFSET_Y + 20;
        saveToLocalStorage();
        renderSvg();
        showToast("工程說明欄已靠齊：右上角", "info");
      });
    }

    const btnTbDockTL = document.getElementById("btnTbDockTL");
    if (btnTbDockTL) {
      btnTbDockTL.addEventListener("click", () => {
        if (!layoutData.title_block) return;
        layoutData.title_block.x = OFFSET_X + 20;
        layoutData.title_block.y = OFFSET_Y + 20;
        saveToLocalStorage();
        renderSvg();
        showToast("工程說明欄已靠齊：左上角", "info");
      });
    }

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

      cursorXEl.textContent = mPt.x.toFixed(2);
      cursorYEl.textContent = mPt.y.toFixed(2);

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

          if (rec.type === "title_block") {
            const tb = rec.item;
            const curX = typeof tb.x === "number" ? tb.x : (OFFSET_X + TOTAL_W_M * SCALE - 460);
            const curY = typeof tb.y === "number" ? tb.y : (OFFSET_Y + TOTAL_H_M * SCALE - 175);
            tb.x = Math.round(curX + deltaX * SCALE);
            tb.y = Math.round(curY + deltaY * SCALE);
            dragStartM.x = mPt.x;
            dragStartM.y = mPt.y;
            renderSvg();
            return;
          }

          if (rec.type === "wall") {
            const w = rec.item;
            const snX = snapValue(deltaX, currentSnapM);
            const snY = snapValue(deltaY, currentSnapM);
            if (snX !== 0 || snY !== 0) {
              const candX1 = Math.round((w.x1 + snX) * 100) / 100;
              const candY1 = Math.round((w.y1 + snY) * 100) / 100;
              const candX2 = Math.round((w.x2 + snX) * 100) / 100;
              const candY2 = Math.round((w.y2 + snY) * 100) / 100;

              // Test parallel magnetic snapping when translating the whole wall
              const snap = findWallSnap(w, "translate", candX1, candY1);
              if (snap && snap.isParallel) {
                if (snap.axis === "y") {
                  w.y1 = candY1 + snap.offsetY;
                  w.y2 = candY2 + snap.offsetY;
                  w.x1 = candX1;
                  w.x2 = candX2;
                } else if (snap.axis === "x") {
                  w.x1 = candX1 + snap.offsetX;
                  w.x2 = candX2 + snap.offsetX;
                  w.y1 = candY1;
                  w.y2 = candY2;
                }
                currentWallSnapInfo = { snapX: (w.x1 + w.x2) / 2, snapY: (w.y1 + w.y2) / 2, desc: snap.desc };
              } else {
                w.x1 = candX1;
                w.y1 = candY1;
                w.x2 = candX2;
                w.y2 = candY2;
                currentWallSnapInfo = null;
              }
              dragStartM.x += snX;
              dragStartM.y += snY;
              dragHasMoved = true;
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
              dragHasMoved = true;
              renderSvg();
            }
          } else {
            // Equipment, Columns, Aisles, Zones
            const item = rec.item;
            const rawX = mPt.x - dragOffset.x;
            const rawY = mPt.y - dragOffset.y;
            item.x = snapValue(rawX, currentSnapM);
            item.y = snapValue(rawY, currentSnapM);
            dragHasMoved = true;
            propX.value = item.x.toFixed(2);
            propY.value = item.y.toFixed(2);
            updateClearanceReadouts(item);
            renderSvg();
          }

        } else if (dragMode === "wall-p1") {
          const w = rec.item;
          const rawX = snapValue(mPt.x, currentSnapM);
          const rawY = snapValue(mPt.y, currentSnapM);
          const snap = findWallSnap(w, "p1", rawX, rawY);
          if (snap) {
            w.x1 = snap.snapX;
            w.y1 = snap.snapY;
            currentWallSnapInfo = { snapX: snap.snapX, snapY: snap.snapY, desc: snap.desc };
          } else {
            w.x1 = rawX;
            w.y1 = rawY;
            currentWallSnapInfo = null;
          }
          dragHasMoved = true;
          propWallX1.value = w.x1.toFixed(2);
          propWallY1.value = w.y1.toFixed(2);
          propWallLength.textContent = Math.hypot(w.x2 - w.x1, w.y2 - w.y1).toFixed(2);
          renderSvg();

        } else if (dragMode === "wall-p2") {
          const w = rec.item;
          const rawX = snapValue(mPt.x, currentSnapM);
          const rawY = snapValue(mPt.y, currentSnapM);
          const snap = findWallSnap(w, "p2", rawX, rawY);
          if (snap) {
            w.x2 = snap.snapX;
            w.y2 = snap.snapY;
            currentWallSnapInfo = { snapX: snap.snapX, snapY: snap.snapY, desc: snap.desc };
          } else {
            w.x2 = rawX;
            w.y2 = rawY;
            currentWallSnapInfo = null;
          }
          dragHasMoved = true;
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

      dragInitialLayoutSnapshot = JSON.stringify(layoutData);
      dragHasMoved = false;

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
      if (isDragging) {
        if (dragHasMoved && dragInitialLayoutSnapshot) {
          undoStack.push({ name: "移動或拉伸物件", data: dragInitialLayoutSnapshot, floor: currentFloor });
          if (undoStack.length > MAX_HISTORY) undoStack.shift();
          redoStack.length = 0;
          updateUndoRedoButtons();
        }
        dragInitialLayoutSnapshot = null;
        dragHasMoved = false;
        currentWallSnapInfo = null;
        saveToLocalStorage();
        renderSvg();
      }
      isDragging = false;
      isPanning = false;
      dragPointIndex = -1;
      dragMode = "translate";
      viewportEl.style.cursor = isDrawingRoute ? "crosshair" : "default";
    });

    let ctrlKeyDownTimestamp = 0;
    let ctrlWheelHappened = false;

    viewportEl.addEventListener("wheel", (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        ctrlWheelHappened = true;
        const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
        const mouseSvg = clientToSvgCoords(e.clientX, e.clientY);

        const newW = viewBox.width * zoomFactor;
        const newH = viewBox.height * zoomFactor;

        viewBox.x = mouseSvg.x - (mouseSvg.x - viewBox.x) * (newW / viewBox.width);
        viewBox.y = mouseSvg.y - (mouseSvg.y - viewBox.y) * (newH / viewBox.height);
        viewBox.width = newW;
        viewBox.height = newH;
        updateViewBox();
      } else {
        // Normal wheel scrolls: pan vertically and horizontally
        const panFactorX = viewBox.width / viewportEl.clientWidth;
        const panFactorY = viewBox.height / viewportEl.clientHeight;
        viewBox.x += e.deltaX * panFactorX;
        viewBox.y += e.deltaY * panFactorY;
        updateViewBox();
      }
    }, { passive: false });

    // Inspector Live Input Bindings with Full Object Type Support
    propName.addEventListener("input", (e) => {
      if (!selectedId) return;
      const rec = findItemRecord(selectedId);
      if (!rec || !rec.item) return;
      const val = e.target.value;
      if (rec.type === "wall") {
        rec.item.description = val;
      } else {
        rec.item.name = val;
      }
      saveToLocalStorage();
      renderSvg();
    });

    propCode.addEventListener("input", (e) => {
      if (!selectedId) return;
      const rec = findItemRecord(selectedId);
      if (!rec || !rec.item) return;
      if (rec.item.code !== undefined) {
        rec.item.code = e.target.value;
        saveToLocalStorage();
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
        saveToLocalStorage();
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

    // Keyboard Shortcuts & History Navigation
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      if (e.key === "Control") {
        ctrlKeyDownTimestamp = Date.now();
        ctrlWheelHappened = false;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
      if (((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z"))) {
        e.preventDefault();
        redo();
        return;
      }

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

    window.addEventListener("keyup", (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      if (e.key === "Control") {
        const dur = Date.now() - ctrlKeyDownTimestamp;
        if (!ctrlWheelHappened && dur > 10 && dur < 400) {
          resetToCenter100();
          showToast("已重設為置中 100% 最佳視圖", "info", 1500);
        }
        ctrlWheelHappened = false;
      }
    });

    // Undo & Redo Toolbar Buttons
    const btnUndo = document.getElementById("btnUndo");
    if (btnUndo) btnUndo.addEventListener("click", undo);

    const btnRedo = document.getElementById("btnRedo");
    if (btnRedo) btnRedo.addEventListener("click", redo);

    // --- SVG Canvas Click & Double-Click (Single Binding to Avoid Leak) ---
    svgEl.addEventListener("click", (e) => {
      if (isDrawingRoute) {
        const svgPt = clientToSvgCoords(e.clientX, e.clientY);
        const mPt = svgToMeters(svgPt.x, svgPt.y);
        const snapX = Math.round(snapValue(mPt.x, currentSnapM) * 100) / 100;
        const snapY = Math.round(snapValue(mPt.y, currentSnapM) * 100) / 100;

        // Prevent duplicate consecutive points
        const lastPt = activeRoutePoints[activeRoutePoints.length - 1];
        if (lastPt && Math.abs(lastPt.x - snapX) < 0.1 && Math.abs(lastPt.y - snapY) < 0.1) {
          return;
        }

        activeRoutePoints.push({ x: snapX, y: snapY });
        const countEl = document.getElementById("routePointCount");
        if (countEl) countEl.textContent = activeRoutePoints.length;
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

    // --- Route Floating Bar Buttons ---
    const btnFinishRoute = document.getElementById("btnFinishRoute");
    if (btnFinishRoute) btnFinishRoute.addEventListener("click", finishDrawingRoute);

    const btnUndoRoutePoint = document.getElementById("btnUndoRoutePoint");
    if (btnUndoRoutePoint) btnUndoRoutePoint.addEventListener("click", undoRoutePoint);

    const btnCancelRoute = document.getElementById("btnCancelRoute");
    if (btnCancelRoute) btnCancelRoute.addEventListener("click", cancelDrawingRoute);

    // --- Add Aisle Button ---
    const btnAddAisle = document.getElementById("btnAddAisle");
    if (btnAddAisle) btnAddAisle.addEventListener("click", addNewAisle);

    // --- Flow Actions in Inspector ---
    const btnReverseFlow = document.getElementById("btnReverseFlow");
    if (btnReverseFlow) {
      btnReverseFlow.addEventListener("click", () => {
        if (!selectedId) return;
        const rec = findItemRecord(selectedId);
        if (!rec || rec.type !== "flow") return;
        const f = rec.item;
        if (f.points) f.points.reverse();
        if (f.arrow_direction === "forward") f.arrow_direction = "backward";
        else if (f.arrow_direction === "backward") f.arrow_direction = "forward";
        saveToLocalStorage();
        renderSvg();
      });
    }

    const btnDeleteSelectedWaypoint = document.getElementById("btnDeleteSelectedWaypoint");
    if (btnDeleteSelectedWaypoint) {
      btnDeleteSelectedWaypoint.addEventListener("click", () => {
        if (!selectedId) return;
        const rec = findItemRecord(selectedId);
        if (!rec || rec.type !== "flow") return;
        const f = rec.item;
        if (!f.points || f.points.length <= 2) {
          alert("動線至少需保留 2 個端點。如欲刪除整條動線請點擊「刪除物件」。");
          return;
        }
        const idxToDel = selectedWaypointIndex >= 0 ? selectedWaypointIndex : f.points.length - 1;
        f.points.splice(idxToDel, 1);
        selectedWaypointIndex = -1;
        saveToLocalStorage();
        renderSvg();
        selectItem(f.id);
      });
    }

    // --- Quick Rename Box Handlers ---
    const btnQuickSave = document.getElementById("quickRenameSave");
    if (btnQuickSave) btnQuickSave.addEventListener("click", saveQuickRename);

    const btnQuickCancel = document.getElementById("quickRenameCancel");
    if (btnQuickCancel) btnQuickCancel.addEventListener("click", closeQuickRenameBox);

    const btnQuickClose = document.getElementById("quickRenameClose");
    if (btnQuickClose) btnQuickClose.addEventListener("click", closeQuickRenameBox);

    const quickRenameNameInp = document.getElementById("quickRenameName");
    if (quickRenameNameInp) {
      quickRenameNameInp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveQuickRename();
        else if (e.key === "Escape") closeQuickRenameBox();
      });
    }

    // --- Add Equipment Modal Handlers ---
    const btnOpenAddModal = document.getElementById("btnOpenAddModal");
    if (btnOpenAddModal) btnOpenAddModal.addEventListener("click", openAddEquipmentModal);

    const btnSidebarAddCustom = document.getElementById("btnSidebarAddCustom");
    if (btnSidebarAddCustom) btnSidebarAddCustom.addEventListener("click", openAddEquipmentModal);

    const closeAddModalBtn = document.getElementById("closeAddModalBtn");
    if (closeAddModalBtn) closeAddModalBtn.addEventListener("click", closeAddEquipmentModal);

    const cancelAddModalBtn = document.getElementById("cancelAddModalBtn");
    if (cancelAddModalBtn) cancelAddModalBtn.addEventListener("click", closeAddEquipmentModal);

    // Color Swatch Selection
    const colorPicker = document.getElementById("newEqColorPicker");
    document.querySelectorAll(".color-swatch").forEach(swatch => {
      swatch.addEventListener("click", () => {
        document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        const col = swatch.getAttribute("data-color");
        if (colorPicker) colorPicker.value = col;
      });
    });

    if (colorPicker) {
      colorPicker.addEventListener("input", () => {
        document.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
      });
    }

    // Live Stats update in Modal
    ["newEqWidth", "newEqHeight"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", updateModalStats);
    });

    // Form Submit: Place New Equipment on Canvas
    const addEquipmentForm = document.getElementById("addEquipmentForm");
    if (addEquipmentForm) {
      addEquipmentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("newEqName").value.trim();
        const code = document.getElementById("newEqCode").value.trim();
        const cat = document.getElementById("newEqCategory").value;
        const w = Math.max(0.2, parseFloat(document.getElementById("newEqWidth").value) || 2.0);
        const h = Math.max(0.2, parseFloat(document.getElementById("newEqHeight").value) || 2.0);
        const floor = document.getElementById("newEqFloor").value;
        const col = colorPicker ? colorPicker.value : "#2563EB";
        const saveToLib = document.getElementById("saveToCustomLibCheck").checked;

        const centerSvg = {
          x: viewBox.x + viewBox.width / 2,
          y: viewBox.y + viewBox.height / 2
        };
        const centerM = svgToMeters(centerSvg.x, centerSvg.y);
        const snapX = snapValue(centerM.x - w / 2, currentSnapM);
        const snapY = snapValue(centerM.y - h / 2, currentSnapM);

        const newObj = {
          id: `${cat.toLowerCase()}_${Date.now()}`,
          code: code,
          name: name,
          zone: cat,
          floor: floor,
          x: Math.max(0, snapX),
          y: Math.max(0, snapY),
          width: w,
          height: h,
          rotation: 0,
          color: col,
          category: cat
        };

        if (floor === "2F") {
          if (!layoutData.equipment_2f) layoutData.equipment_2f = [];
          layoutData.equipment_2f.push(newObj);
        } else {
          if (!layoutData.equipment) layoutData.equipment = [];
          layoutData.equipment.push(newObj);
        }

        // Add to custom library if checked
        if (saveToLib) {
          const existingIdx = customEquipmentLib.findIndex(c => c.code === code);
          const libItem = { code, name, cat, w, h, col, isCustom: true };
          if (existingIdx >= 0) {
            customEquipmentLib[existingIdx] = libItem;
          } else {
            customEquipmentLib.unshift(libItem);
          }
          saveCustomLibToStorage();
          populateLibrary();
        }

        closeAddEquipmentModal();
        saveToLocalStorage();
        selectItem(newObj.id);
        renderSvg();
      });
    }

    // --- JSON Import Action ---
    const importInput = document.getElementById("importJsonInput");
    if (importInput) {
      importInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const imported = JSON.parse(evt.target.result);
            if (imported && (imported.equipment || imported.dimensions)) {
              layoutData = imported;
              saveToLocalStorage();
              deselectAll();
              renderSvg();
              alert("成功匯入廠房配置檔！");
            } else {
              alert("檔案格式不符合廠房平面配置規格。");
            }
          } catch (err) {
            alert("讀取檔案失敗，請確認 JSON 語法格式無誤。");
          }
        };
        reader.readAsText(file);
        importInput.value = "";
      });
    }

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

    const forceReloadBtn = document.getElementById("forceReloadBtn");
    if (forceReloadBtn) {
      forceReloadBtn.addEventListener("click", () => {
        try {
          localStorage.removeItem(STORAGE_KEY_LAYOUT);
          localStorage.removeItem(STORAGE_KEY_CUSTOM_LIB);
        } catch (e) {}
        showToast("已清除快取與本地配置，正在載入最新系統...", "info", 1200);
        setTimeout(() => {
          window.location.reload(true);
        }, 300);
      });
    }

    document.getElementById("resetLayoutBtn").addEventListener("click", () => {
      if (confirm("確定要重設為工廠初始基準配置嗎？所有新增的自訂設備、牆體與動線將被重設。")) {
        try {
          localStorage.removeItem(STORAGE_KEY_LAYOUT);
        } catch (e) {}
        layoutData = JSON.parse(JSON.stringify(INITIAL_LAYOUT));
        deselectAll();
        renderSvg();
        const ind = document.getElementById("autoSaveIndicator");
        if (ind) ind.textContent = "已重設為原廠基準";
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
