import json

with open('factory_layout_data.json', 'r', encoding='utf-8') as f:
    layout_data = json.load(f)

json_str = json.dumps(layout_data, ensure_ascii=False, indent=2)

with open('app_template.js', 'r', encoding='utf-8') as f:
    template = f.read()

output = template.replace('__INITIAL_LAYOUT_JSON__', json_str)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(output)

print("Generated app.js successfully!")
