# 驗證紀錄

本次已在目前雲端機器執行並通過：

- `npm ci --cache /tmp/n3-npm-cache --no-audit --no-fund`：依鎖檔重新安裝成功。
- `npm test`：10 項通過、0 項失敗、0 項略過。涵蓋間隔複習、熟悉門檻、事件合併、台北時區倒數、80 題資料結構、同步分頁及 PostgreSQL RLS。
- `npm run test:e2e`：14 項通過、0 項失敗、0 項略過。桌機 1440px 及手機 390px 各 7 個流程：字卡／收藏／保存、錯題與重新作答、單元位置、尚未連接雲端的真實狀態、完整單元完成、計時截止及備份匯入／匯出。
- `npm run build`：TypeScript 與正式建置成功。
- 已用 Chromium 實際啟動開發網站並檢查首頁及手機版，390px 沒有水平溢出。

測試時曾遇到測試定位器把「ないよ」和「ないよう」一起選到的問題，已改為精確比對；最終完整測試通過。假名初稿由 Kuromoji/IPADIC 產生，不代表完成母語審訂。

## 尚未驗證／外部 prerequisites

- 尚無真實 Supabase 專案：沒有執行真實登入、寄信或兩裝置同步。SQL RLS 在本機 PGlite/PostgreSQL 實際執行驗證；同步分頁使用測試替身，非遠端服務。
- 尚未部署 HTTPS 正式網站，也沒有發布雲端環境快照。手機在外部使用需要網站部署。
- Chromium 測試沒有驗證真實日文發聲、音質與鎖屏播放。需在使用者裝置安裝日文語音後實測。
- 釋義、文法、例句與自編題尚未經教師／母語者審訂；自動假名可能有多音字或斷詞誤判。已檢查結構、來源標示、關聯與答案欄位，不宣稱完成外部語言審訂。
- 沒有提供 AI、錄音評分、離線或完整模擬考，相關範圍在網站內如實標示。

建立與連接 Supabase 的操作步驟見 [README](../README.md)。

## GitHub Pages 部署調整

已加入 `.github/workflows/deploy-pages.yml`，在 `main` 推送或手動執行時建置並部署。已核對 configure-pages v5 的 `base_path` 輸出。正式預設路徑為 `/japanese_learning/`，也可由 workflow／`VITE_BASE_PATH` 覆寫。

本機正式建置通過；以 Chromium 的 390px 手機視窗開啟正式預覽 `/japanese_learning/`，確認 JavaScript／CSS 路徑正確、沒有 HTTP 或 JavaScript 錯誤，並完成翻卡、自評、重新整理及接續下一張卡。

尚未推送 GitHub、啟用儲存庫 Pages 或執行遠端 Actions，因此不宣稱已上線。部署操作見 [GitHub Pages 說明](GITHUB_PAGES.md)。
