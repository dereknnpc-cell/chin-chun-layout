# CHIN CHUN 金讚科技 — 廠房工程平面配置系統 (CAD Factory Layout System)

金讚鋼鐵與貼合加工廠房正式工程圖與模組化設備配置系統，支援 140M×90M 全廠區（含廠外 8 米環廠雙向重車道、40 呎貨櫃裝卸碼頭、大門地磅站）、多樓層設計、獨立單面牆磁吸編輯、辦公室傢俱模組、SVG / DXF 匯出、即時歷史復原，以及 Supabase 跨裝置雲端同步。

## ⌖ V2.7.3 舊端點自動回正

- 點選已停在柱邊的舊牆端點時，立即校正到最近柱中心，不需要先拖動超過 0.5m 網格門檻。
- 修正微幅拖曳被網格量化為零，導致吸附程式未執行、端點持續停在柱邊的問題。

## ⌖ V2.7.2 柱中心吸附修正

- 柱中心改為最高吸附順位；柱子附近即使存在位於柱邊的舊牆端點，也不再攔截柱中心吸附。
- 5.00m 柱距的相鄰柱中心牆段會顯示 5.00m，不再停在少半個柱寬的 4.75m。

## ◇ V2.7.1 圖層接合顯示修正

- 鎖定柱子維持完全不透明，牆線與柱網軸線不再穿透柱身。
- 選取牆面時只將端點、中心點與尺寸標籤提升到 L4；牆體本身固定留在 L1，並由 L2 柱子正確遮蔽到柱外緣。

## ◇ V2.7.0 圖層分級、中心控制點與鎖定

- 疊放分級固定為 L1 牆面、L2 柱網／柱子、L3 設備、L4 選取控制點，避免控制點被其他物件遮住。
- 牆面新增紫色菱形中心控制點；拖曳中心移動整面牆，拖曳兩端圓點則改變長度與角度。
- 端點吸附依序為柱中心、牆面端點、牆面中心與牆線投影，重疊時採用較高優先級目標。
- 柱子預設鎖定；牆面與設備可各自鎖定或隱藏。鎖定狀態會隨本機配置與 Supabase 雲端配置一起儲存。
- 手機版上方工具列保留圖層控制，可左右滑動操作眼睛與鎖頭。

## 🧱 V2.6.1 牆面端點與角度修正

- 端點拖曳改用相對位移吸附，保留原有小數座標，不再因點選而跳動。
- 牆面屬性新增角度欄位與 ±90° 按鈕；旋轉固定起點 P1 並保持牆長。
- 選取牆面後按 `R`，也可直接順時針旋轉 90°。

## 📐 V2.6 EPS 幾何校正

1F 基準已依 `2026 Layout for AI.eps` 的向量座標重新建立，而非以截圖目測估算：

- 柱網修正為 X1–X21、Y1–Y9（100M×40M），共 152 支實際可見結構柱。
- 51 個來源設備／區域重新校正位置與尺寸。
- 建築外牆、辦公區、貨梯、東側附屬區與 CNC 防塵室牆線重新對齊。
- 舊版瀏覽器或雲端配置首次載入時會自動套用本次基準修正，並保留使用者自行新增的設備。

幾何資料可由 `python3 update_eps_geometry.py` 重建，再以 `python3 embed_layout_data.py` 同步至前端程式。

---

## 🚀 部署上線給其他員工使用的方式

介面仍是純前端靜態架構（HTML5 + CSS3 + Vanilla JavaScript），由 Vercel 託管；共用配置、員工權限與登入則使用 Supabase。

## ☁ 雲端同步與員工登入

1. 開啟正式網址後，點擊上方的「雲端帳號」。
2. 輸入已加入員工名單的 Email，至信箱點擊一次性登入連結。
3. 第一次由管理員登入時，這台裝置目前的配置會建立為第一份雲端版本；之後登入的裝置會載入同一份共用配置。
4. 管理員可在「雲端帳號」視窗新增或移除員工 Email。

未登入時仍可使用本機模式；修改只存在該瀏覽器。登入後每次修改會同時儲存在本機與雲端，其他已登入裝置也會收到最新版本。

### 方案一：GitHub + Vercel 自動部署（最推薦，全自動更新）

1. **推送到 GitHub**：
   在終端機中執行：
   ```bash
   git add .
   git commit -m "feat: release Chin Chun Factory CAD System V2.4"
   git remote add origin https://github.com/<您的GitHub帳號>/chin-chun-layout.git
   git push -u origin main
   ```

2. **登入 Vercel 連結 GitHub**：
   - 開啟 [Vercel 官網 (https://vercel.com)](https://vercel.com)，使用 GitHub 帳號免費登入。
   - 點擊 **「Add New...」->「Project」**。
   - 選擇您的 `chin-chun-layout` 儲存庫，點擊 **「Import」**。
   - **Framework Preset** 選擇 **Other**；建置指令使用 `npm run build`。
   - 點擊 **「Deploy」**！

3. **立即取得全公司共用網址**：
   - 30 秒內即可獲得專屬 HTTPS 網址（例如：`https://chin-chun-layout.vercel.app`）。
   - 員工只要在任何電腦（Mac / Windows）、平板或手機開啟此網址，即可直接使用！
   - 未來您在本地只要 `git push`，Vercel 就會自動編譯更新，全體員工隨時享有最新版本。

---

### 方案二：GitHub Pages 一鍵免費發布（免註冊任何外部服務）

如果您不想使用 Vercel，也可以直接使用 GitHub 內建的免費網頁代管：
1. 將專案推送到 GitHub。
2. 進入該 GitHub 倉庫的 **「Settings」->「Pages」**。
3. 在 **Branch** 選擇 `main` 分支，資料夾選擇 `/ (root)`，點擊 **Save**。
4. 數十秒後即可獲得 `https://<您的帳號>.github.io/chin-chun-layout/` 永久網址。

---

### 方案三：安裝為桌面應用程式 (PWA 模式，免打包最輕量)

本專案已內建完整的 PWA（Progressive Web App）標準：
1. 員工用 Google Chrome 或 Microsoft Edge 開啟網址（如 `https://chin-chun-layout.vercel.app`）。
2. 在網址列右側會出現一個 **「安裝應用程式 (Install App)」** 的小圖示（電腦螢幕帶有向下的箭頭）。
3. 點擊「安裝」後，系統會將它直接變成**電腦桌面上的獨立軟體圖示**（Windows 桌面 / Mac 應用程式 Launchpad）。
4. 開啟時擁有獨立的視窗，無瀏覽器網址列干擾，操作體驗與原生桌面 CAD 軟體完全一致！

---

### 方案四：打包成 Windows (.exe) 或 Mac (.dmg / .app) 獨立安裝檔

如果您希望打包成完全離線、不依賴網路的 `.exe` 安裝檔給員工點兩下安裝：
使用 Electron 或 Nativefier 即可一鍵打包：
```bash
# 使用 npx 直接免安裝打包 (以 Nativefier 為例)
npx nativefier --name "金讚廠房配置系統" "http://localhost:8080" --icon favicon.svg
```
或者使用 Electron 打包離線檔案。

---

## 🛠 本地開發與除錯

在本地終端機啟動：
```bash
python3 -m http.server 4173
```
開啟瀏覽器訪問：`http://127.0.0.1:4173/index.html`

修改 `cloud-sync-source.js` 後，執行下列指令重新產生瀏覽器版本：

```bash
npm ci
npm run build
```
