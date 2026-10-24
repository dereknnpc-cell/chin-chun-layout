"""Refresh app.js's embedded baseline without replacing the application engine."""

import json
from pathlib import Path


ROOT = Path(__file__).parent
APP_PATH = ROOT / "app.js"
DATA_PATH = ROOT / "factory_layout_data.json"
START_MARKER = "  const INITIAL_LAYOUT = "
END_MARKER = "\n\n  const SOURCE_GEOMETRY_REVISION ="


app = APP_PATH.read_text(encoding="utf-8")
start = app.index(START_MARKER) + len(START_MARKER)
end = app.index(END_MARKER, start)
layout = json.loads(DATA_PATH.read_text(encoding="utf-8"))
embedded = json.dumps(layout, ensure_ascii=False, indent=2)
APP_PATH.write_text(app[:start] + embedded + ";" + app[end:], encoding="utf-8")
print("Refreshed app.js baseline")
