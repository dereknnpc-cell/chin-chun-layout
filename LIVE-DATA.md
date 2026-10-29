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
live.use(live.providers.supabase(client, { workspaceId }));                        // Supabase 資料表 + Realtime
live.use(live.providers.simulation());                                              // 示範模擬
live.stop();
```

Twin 工具列「即時層」選單：關／模擬／雲端資料庫（需登入的工作區成員）／Gateway（網址帶 `?live=wss://gateway/twin` 時出現）。

雲端資料庫模式：完成啟用中的 `rtls_calibrations`、`equipment_bindings` 與最新狀態快照後才顯示資料；載入期間的 Realtime 更新先保留，之後依時間套用。校正或對照表在載入途中改動會重讀，既有原始 RTLS 座標與軌跡依新校正重新換算，不讓舊快照蓋掉新位置。查詢失敗會退避重試，停止或登出會取消重試與訂閱；晚到的舊資料也不能修改新來源的對照或校正。資料庫 `alarm = null` 會清除舊警報。模擬：人員／堆高機沿 CAD `flows` 與 `aisles` 中線移動，機台狀態隨機，非現場數據。

自訂 provider：`{ name, start({ ingest, getLayout }), stop() }`。

停止或切換來源時會清除舊狀態、取消過期計時器並中止未完成的 REST 請求。每次啟動來源都使用獨立的事件入口；即使舊請求、WebSocket 或自訂 provider 稍後才回傳，也不會覆蓋新來源。啟動失敗時會停止該 provider 並回到關閉狀態。

## 資料表（`supabase/migrations/20261029072106_add_live_twin_data.sql`）

所有表以 `workspace_id` 隔離，沿用既有 `private.current_workspace_role()` 權限。

| 表 | 用途 | 寫入 | 讀取 |
|---|---|---|---|
| `equipment_status_events` | 機台狀態歷史（稼動率、停機分析） | gateway（service role） | 成員 |
| `equipment_status_current` | 每台最新狀態，由 trigger 維護，Realtime 推播 | 僅 trigger | 成員 |
| `rtls_positions` | 定位歷史（軌跡回放、人流熱圖、模擬比對） | gateway（service role） | 成員 |
| `rtls_tags_current` | 每個 tag 最新位置，由 trigger 維護，Realtime 推播 | 僅 trigger | 成員 |
| `equipment_bindings` | MES／IoT 代號 → CAD id（`source`, `source_id` → `cad_id`）；gateway 寫入前以此換成 CAD id，Twin 另以 `source_id` 作備援比對 | owner／editor | 成員 |
| `rtls_calibrations` | 校正點 `pairs`（同 `calibrate()` 格式），每個 workspace 僅一筆 `is_active` | owner／editor | 成員 |

- 欄位與事件格式一致：`status` 限 run／idle／setup／down／offline；`kind` 限 person／forklift／cart／asset；`frame` 為 rtls 或 cad；座標拒收 NaN／Infinity。
- 時間倒退的資料只進歷史表，不覆蓋 current；current 的工單、產量等欄位在新事件未帶值時保留舊值，`alarm` 以最新事件為準。
- 一般登入者（含 editor）不能直接寫入狀態或定位，只有持 service role 的 gateway 可以；匿名無存取權。
- 歷史表無自動清除。RTLS 高頻寫入時，請依保存期限定期刪除舊資料（例如 `pg_cron` 每日刪除 90 天前的 `rtls_positions`）。
