# 使用 GitHub Pages 上線

網站由 GitHub Pages 提供，無需 Vercel，也不用持續開著電腦。目前已準備部署設定，尚未推送或上線。

## 1. 把網站程式碼放到 GitHub

將本專案的程式碼推送到 `x94jen/japanese_learning` 的 `main` 分支。根目錄應看得到 `package.json`、`src/`、`vite.config.ts` 與 `.github/workflows/deploy-pages.yml`。不要上傳 `node_modules/`、`.env.local` 或私密金鑰。

目前雲端工作區的程式碼不會自動出現在 GitHub；若儲存庫仍為空，需要先完成提交與推送。單純下載或上傳 `dist` 不會啟用本專案的自動建置流程。

## 2. 啟用 GitHub Pages

1. 開啟 GitHub 儲存庫，進入 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選 **GitHub Actions**，不選 Deploy from a branch。
3. 若找不到 Pages，先確認自己有儲存庫管理權限，以及儲存庫可見性／帳號方案是否支援 Pages。

## 3. 同步功能可以稍後再設定

沒有 Supabase 也可以先部署，使用本機保存的課程、字卡、答題及複習功能；兩個裝置不會自動同步。

若已有 Supabase，進入 GitHub 儲存庫 **Settings → Secrets and variables → Actions → Variables**，點 **New repository variable**，新增：

| Name                     | Value                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase 的 Project URL，例如 `https://你的專案代碼.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 的 Publishable key，或舊式 anon key                     |

這裡使用 **Variables** 分頁的 Repository variables。兩項會被打包進瀏覽器，是公開連線資料。不要填入 `service_role`、`sb_secret_…` 或資料庫密碼。資料庫須先套用 `supabase/schema.sql` 的 RLS 權限。

## 4. 執行部署

1. 進入儲存庫上方 **Actions**。
2. 若 GitHub 要求啟用 Actions，先啟用。
3. 選 **Deploy GitHub Pages → Run workflow**，選擇包含設定的 `main` 分支。
4. 等 `build` 與 `deploy` 都變成綠色。
5. 由部署結果或 **Settings → Pages** 開啟實際網站網址。

未設定自訂網域時，這個儲存庫的預期網址是 `https://x94jen.github.io/japanese_learning/`；請以 GitHub 顯示的實際網址為準，此處不表示已上線。

之後每次推送到 `main` 都會自動測試、建置並部署。修改 Repository variables 後，也要再執行一次 workflow。

## 5. 設定 Supabase 登入返回網址（有啟用同步才需要）

到 **Supabase → Authentication → URL Configuration**，在 Site URL 和 Redirect URLs 都填入實際網站網址，包含 `/japanese_learning/` 路徑與結尾斜線。例如：

```text
https://x94jen.github.io/japanese_learning/
```

不要只填 `https://x94jen.github.io/`，也不要填 Supabase 自己的 API 網址。若使用自訂網域，改填實際自訂網域網址。接著按 README 的步驟，在手機與電腦用同一電子郵件登入並驗證同步。

## 網址路徑與建置

開發模式維持 `/`。一般正式建置預設 `/japanese_learning/`；workflow 會從 GitHub Pages 設定自動取得正確路徑，也支援自訂網域根目錄。沒有伺服器端路由，不需加 404 重新導向。

若手動部署到其他路徑，建置時設定 `VITE_BASE_PATH`，例如 `VITE_BASE_PATH=/ npm run build` 可建置根目錄版本。不要將開發伺服器網址當成永久網站。
