import json

def update_layout_json():
    with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Remove column_exclusion_zones from grid
    if "column_exclusion_zones" in data["grid"]:
        del data["grid"]["column_exclusion_zones"]

    # 2. Build 213 interactive columns
    cols_x = data["grid"]["cols_x"]  # 21
    cols_y = data["grid"]["cols_y"]  # 11
    bay_size = data["grid"]["bay_size"]  # 5.0

    columns = []
    excluded_count = 0
    for i in range(cols_x):
        for j in range(cols_y):
            xm = i * bay_size
            ym = j * bay_size
            # ADH area where columns are omitted initially:
            # i in 1..6 (xm=5..30) and j in 1..3 (ym=5..15)
            if 1 <= i <= 6 and 1 <= j <= 3:
                excluded_count += 1
                continue
            
            col_obj = {
                "id": f"col_x{i+1}_y{j+1}",
                "code": f"C-X{i+1}-Y{j+1}",
                "name": f"結構柱 X{i+1}-Y{j+1}",
                "x": round(xm, 2),
                "y": round(ym, 2),
                "width": 0.5,
                "height": 0.5,
                "rotation": 0,
                "color": "#334155",
                "category": "Column",
                "floor": "1F"
            }
            columns.append(col_obj)

    data["columns"] = columns
    print(f"Generated {len(columns)} columns (omitted {excluded_count} columns in ADH area).")

    with open('factory_layout_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Updated factory_layout_data.json successfully.")

if __name__ == '__main__':
    update_layout_json()
