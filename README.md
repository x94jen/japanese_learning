# 日和 HIYORI · N3 衝刺學習

以繁體中文為介面的個人日文學習網站。手機與電腦可用，N3 主線搭配按需 N4 補強。備考目標預設 **2026/12/05**，可在設定修改；這是使用者目標日期，不代表官方考試日期。

## 啟動

Node.js 24（`.nvmrc`；最低支援 22）。在現有 checkout 操作，不需要建立 Git worktree。

```sh
cd /workspace/japanese_learning
npm ci --cache /tmp/n3-npm-cache
npm run dev -- --port 5173
```

正式建置：`npm run build`。已設定 **GitHub Pages 自動部署**：推送到 `main` 後，由 GitHub Actions 執行測試、建置並發布 `dist/`。請先依 [GitHub Pages 上線步驟](docs/GITHUB_PAGES.md) 在儲存庫啟用 Pages；目前尚未推送或上線。正式網址是手機和電腦共同使用的網站入口，不必一直開著電腦。

沒有雲端設定也能執行本機學習，但**跨裝置同步尚不可用**。登入按鈕只在配置連線後啟用，不會假裝同步成功。沒有離線快取、service worker 或安裝功能。

## 登入入口

未登入時先顯示登入頁，使用同一電子郵件接續手機與電腦的進度。若選「暫不登入，以訪客使用」，則明確提示只有本機保存；既有訪客資料不會刪除或自動搬移。手機郵件 App 與瀏覽器不同、連結過期，以及驗證碼郵件設定請見 [登入說明](docs/LOGIN.md)。

## 第一次建立 Supabase 並連接

以下需要你在瀏覽器操作自己的服務帳號；不需要提供管理密鑰給聊天或寫入網站。

1. 開啟 <https://supabase.com/dashboard>，建立帳號、Organization 與新 Project。選擇適合自己的區域；資料庫密碼只保存在你的密碼管理器，不用填到網站。費用與免費方案限制請以當時服務頁面為準。
2. 等專案準備完成，進入 **SQL Editor**。複製 [`supabase/schema.sql`](supabase/schema.sql) 的完整內容，執行一次。此腳本只建立本站資料表與自己的權限，不會清空其他資料表，可重跑。
3. 在 **Authentication → Providers / Sign In** 確認 Email 登入已啟用。在 **Authentication → URL Configuration** 設定 Site URL 為正式網站的 HTTPS 網址，把正式網址列入允許的 Redirect URLs。本機開發時再加入 `http://localhost:5173/` 及實際使用的開發來源；不要使用任意來源的寬鬆萬用允許值。
4. 在專案的 **Connect** 或 **Settings → API / API Keys** 取得 **Project URL** 與 **Publishable key**（舊式專案可使用 `anon` key）。介面名稱可能隨服務更新。這兩項可供瀏覽器使用；**不要使用 `service_role`、`sb_secret_…` 或資料庫密碼**。RLS 才是保護個人資料的必要機制。
5. 連接網站可選一種方式：
   - **快速連接目前裝置**：網站右上角雲端圖示 →「連接自己的雲端專案」，填入公開 Project URL 與 Publishable／anon key。每個裝置都需填一次。
   - **建議正式部署**：在 GitHub 儲存庫 **Settings → Secrets and variables → Actions → Variables** 新增 Repository variables `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`，再重新執行部署 workflow。這兩項會打包進瀏覽器程式，是公開資訊。不要放任何私密服務金鑰。
6. 在網站輸入電子郵件，按「寄送登入連結」，在同一裝置開信完成登入。若你設定的郵件範本寄送驗證碼，使用驗證碼入口。每個裝置使用**同一電子郵件帳號**登入。
7. 建立一筆收藏或作答紀錄，查看帳號面板是否顯示「已同步」。在另一裝置登入並按「立即同步」，確認收藏、作答與單元位置一致。**必須完成此步，才算真實跨裝置驗證成功。**

初期 Supabase 內建郵件服務可能限制收件人或寄送頻率；若遇到寄信限制，依 Supabase Authentication 的提示配置自己的 SMTP，勿繞過驗證。本站會保留錯誤並顯示寄信／同步失敗，不會回覆固定的成功訊息。

訪客與登入帳號的資料分開。搬移訪客紀錄：登入前從「偏好與資料」匯出 JSON；登入後匯入到帳號，再同步。不要在公共裝置保留學習資料。

## 實際功能

- 6 個 N3 順序單元、4 個 N4 按需補強；自由選讀，非強制鎖課。
- 100 個主線選詞、12 個文法重點、80 題自編練習。8 篇閱讀（短文、較長文章與資訊查找）、6 組合成語音。**不是完整 N3 教材，尚未涵蓋完整考試閱讀範圍或正式模擬考。**
- 3／5／10 分鐘估計任務；字卡辨義、讀音回想與聽音辨詞。
- 收藏、已學與熟悉分開。每次自評才安排複習；連續成功至少 3 次、間隔至少 21 天才標為熟悉。
- 答題後顯示答案與混淆點；錯題保留選項與解析，答對後標為已改正，仍可查歷史錯誤。
- 到期複習、手動選範圍、文法與例句回想、題型與單元篩選。
- 單元位置、字卡翻面及題目作答狀態會保存；首頁接續未完成練習。
- 計時練習保存起始時間，重新開啟不重置倒數。
- JSON 備份匯入／匯出（不含登入憑證）；訪客與各帳號獨立資料空間。

## N5／N4 講義補充

已加入 49 個濃縮補充單元、96 個新詞卡與 98 題自編練習，對照使用者提供的 49 份講義課綱。從「考檢定 → N5 基礎補充／N4 基礎補強」進入，支援字卡、解析、收藏、錯題、接續與共用複習。N3 主線、原有題庫及紀錄保留。GL02 未提供，原始 PDF 不公開。範圍、來源及紀錄相容性見 [補充教材說明](docs/SUPPLEMENT.md)。

## 基礎工具與課程進度

「考檢定 → 開啟基礎工具」提供五十音平／片假名、讀音重點、24 種常用動詞形式詳解與統整表。字卡支援前後切換與跳卡，課程目錄及內頁提供進度條。操作及計算規則見 [字卡、基礎工具與進度說明](docs/BASICS_AND_PROGRESS.md)。

## 音訊限制

使用 `speechSynthesis` 的裝置日文語音，非真人錄音。支援逐句播放、循環、速度、字幕、聽後重複空檔與影子跟讀。需在手機／電腦安裝日文語音；找不到語音時會明確顯示錯誤。不同瀏覽器可能限制背景播放，尚不保證鎖定螢幕後可連續播放。沒有錄音、發音評分或假 AI 批改。

## 同步設計與資料安全

Supabase Email Auth + `study_events` append-only 事件表。瀏覽器每筆操作產生 UUID，在各帳號的 localStorage 先保存；雲端以 `(user_id, id)` 去重。同一 key 的最新時間事件生效；同時間用 UUID 固定排序。不同項目不互相覆蓋，同項目若兩裝置同時修改，採最後時間事件。裝置時間需正確；這不是協同編輯系統。

登入後自動同步，切回頁面、恢復連線與每 45 秒再次檢查。失敗會顯示訊息並保留本機資料。RLS 只允許 authenticated 使用者讀寫自己 user_id 的事件；不授權修改或刪除事件，不使用 service role。程式會分頁讀取，避免只同步前 1,000 筆。

## 教材來源與品質

`src/vocabulary.json`：本站自編選詞、釋義與例句，參考使用者講義及公開詞表選詞方向；未直接重製第三方整批釋義、版面或音訊。詞表分級不是 JLPT 官方分級。來源連結與限制也在網站「教材與來源」頁公開。

- <https://github.com/elzup/jlpt-word-list>
- <https://github.com/stephenmk/yomitan-jlpt-vocab>
- <https://www.jlpt.jp/samples/forlearners.html>（題型參考連結，未重製題目）

沒有教師或母語者審訂聲明。假名由 Kuromoji／IPADIC 產生初稿，詞頭用教材指定讀音；多音字需人工持續校對。可執行 `npm run readings` 重新產生 `src/readings.json`，修改教材後應檢查輸出。Kuromoji 與字典的授權見 `docs/THIRD_PARTY.md`。

## 驗證

```sh
npm test                 # 排程、事件合併、資料完整性、資料庫 RLS 等測試
npm run test:e2e          # 桌機與 390px 手機操作、保存與錯題流程
npm run build
```

E2E 預設使用 `/usr/bin/chromium`；其他機器可透過 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 設定 Chromium 執行檔位置，或依 Playwright 官方步驟安裝瀏覽器後調整設定。RLS 測試使用 PGlite 的本機 PostgreSQL 執行實際 SQL；**不代表已連接真實 Supabase**。裝置語音需要實機驗收。

專案結構：`src/main.tsx` 介面與互動、`src/engine.ts` 排程與合併、`src/store.ts` 本機保存、`src/cloud.ts` 同步、`src/content.ts` 課程與題目、`supabase/schema.sql` 資料庫權限。
