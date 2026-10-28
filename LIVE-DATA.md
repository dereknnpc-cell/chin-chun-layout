# 即時資料層（IoT／MES／RTLS）

`live-twin.js` 提供 `window.ChinChunLive`：把機台狀態與定位資料疊在 2.5D Twin 上。唯讀，不寫入 `layoutData`、雲端配置或 Supabase。

```
IoT 感測 / PLC ─┐
MES 工單 / 產量 ─┼─> Gateway（Node-RED / MQTT bridge / 中介 API）─> WebSocket 或 REST ─> ChinChunLive.ingest ─> Twin overlay
RTLS 引擎 ──────┘
```

瀏覽器不直接連 MQTT／資料庫；由 gateway 正規化成下列事件。

## 事件格式

一則訊息可以是單一事件或陣列。`ts` 為 epoch ms 或 ISO 字串，省略時取接收時間。

```jsonc
// 機台狀態（IoT／MES）
{ "type": "equipment", "id": "A1-1", "status": "run",        // run | idle | setup | down | offline
  "workOrder": "WO-20261024-01", "product": "P-123", "count": 120, "target": 500,
  "oee": 0.82, "alarm": "E-17", "source": "mes", "ts": 1792300000000 }

// 定位（RTLS）
{ "type": "position", "tag": "EMP-0031", "kind": "person",    // person | forklift | cart | asset
  "label": "王小明", "x": 12.3, "y": 4.5, "floor": "1F",
  "frame": "rtls",                                             // rtls（預設，套用校正）| cad（已是 CAD 公尺）
  "ts": "2026-10-24T08:00:00Z" }
```

- 未知 `status` 保留上一狀態；超過 `options.staleMs`（預設 30 s）未更新視為 `offline`，定位點隱藏。過期會自動通知 Twin 重繪，不必等下一則訊息或手動操作視角。
- 機台狀態與定位舊於已收資料（`ts` 倒退）會丟棄；機台代號、CAD ID 和 MES 別名共用同一個時間順序。同時間戳可補齊工單、產量等欄位。每個 tag 保留最近 `options.trail`（24）點軌跡。

## 機台對應

`id` 依序比對：`bind()` 對照表 → CAD 設備 `id` → 設備代號 `code`（不分大小寫）。MES 工作中心代號與 CAD 不同時：

```js
ChinChunLive.bind({ 'WC-CUT-07': 'eq_dc_n1_1', 'PLC-192.168.1.40': 'A1-1' });
```

對照表右側可填 CAD ID 或設備代號；設備代號不分大小寫，最後一律以實際 CAD ID 儲存狀態，供畫面上的機台讀取。

## RTLS 座標校正

CAD 座標：公尺，x 向右，y 向圖面下方。以現場錨點／量測點對應：

```js
// 2 組：旋轉＋等比縮放＋平移；3 組以上：最小平方仿射（可處理 Y 軸翻轉）
ChinChunLive.calibrate([
  { rtls: [0, 0],    cad: [5, 40] },
  { rtls: [95, 0],   cad: [100, 40] },
  { rtls: [0, 40],   cad: [5, 0] }
]);
```

## 連線

```js
const live = ChinChunLive;
live.use(live.providers.websocket('wss://gateway/twin', { map: raw => raw }));   // 推播
live.use(live.providers.poll('/api/mes/status', { intervalMs: 5000 }));           // MES 只有快照 API
live.use(live.providers.simulation());                                              // 示範模擬
live.stop();
```

Twin 工具列「即時層」按鈕：網址帶 `?live=wss://gateway/twin` 時連該 gateway，否則啟動模擬。模擬：人員／堆高機沿 CAD `flows` 與 `aisles` 中線移動，機台狀態隨機，非現場數據。

自訂 provider：`{ name, start({ ingest, getLayout }), stop() }`。

停止或切換來源時會清除舊狀態、取消過期計時器並中止未完成的 REST 請求。每次啟動來源都使用獨立的事件入口；即使舊請求、WebSocket 或自訂 provider 稍後才回傳，也不會覆蓋新來源。啟動失敗時會停止該 provider 並回到關閉狀態。

## 建議資料表（未套用，待 MES／RTLS 規格確認）

```sql
create table equipment_binding (source_id text primary key, cad_id text not null, source text not null); -- MES/IoT id -> CAD id
create table equipment_status  (cad_id text, status text, work_order text, count int, target int, ts timestamptz, primary key (cad_id, ts));
create table rtls_position     (tag text, kind text, x real, y real, floor text, ts timestamptz, primary key (tag, ts));
create table rtls_calibration  (id serial primary key, pairs jsonb not null, created_at timestamptz default now());
```

歷史資料（軌跡回放、稼動率、人流熱圖、模擬比對）以這些表為來源；Twin 只需最新事件串流。
