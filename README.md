# CHIN CHUN 金讚科技 — 廠房工程平面配置系統 (CAD Factory Layout System)

金讚鋼鐵與貼合加工廠房正式工程圖與模組化設備配置系統，支援 140M×90M 全廠區（含廠外 8 米環廠雙向重車道、40 呎貨櫃裝卸碼頭、大門地磅站）、多樓層設計、獨立單面牆磁吸編輯、辦公室傢俱模組、SVG / DXF 匯出與即時歷史復原 (Undo/Redo)。

---

## 🚀 部署上線給其他員工使用的方式

本系統為純前端靜態架構（HTML5 + CSS3 + Vanilla JavaScript），**不需要任何後端資料庫或伺服器環境**，零維護成本，可透過以下方式讓全公司員工隨時使用：

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
   - **Framework Preset** 選擇 **Other**（純靜態網頁，無需填寫 Build Command）。
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
python3 -m http.server 8080
```
開啟瀏覽器訪問：`http://localhost:8080/index.html`
