# 手機與電腦登入

未登入時會先顯示登入頁。輸入相同電子郵件，手機與電腦各自在自己的裝置寄送、開啟最新的登入郵件。不要重複使用另一台裝置已點過的連結。成功後進入學習首頁，帳號面板顯示電子郵件與「立即同步」。

「暫不登入，以訪客使用」是明確的選項，訪客進度只保存在目前瀏覽器，不會自動同步。原有訪客紀錄保留，登入前先匯出、登入後可手動匯入。

## 手機郵件 App 與瀏覽器不同時

登入可能完成於郵件 App 的內建瀏覽器，另一個 Safari／Chrome 不會因此同時登入。請將新的確認／登入連結開啟於平常學習的瀏覽器。連結若顯示過期或已使用，回手機網站重新寄送，並使用最新郵件。

登入頁也提供驗證碼入口；只有郵件確實包含數字驗證碼時才能使用，網站不會自行產生或假裝寄送驗證碼。

## 驗證碼郵件的服務端設定

網站現在優先顯示數字驗證碼輸入欄位。若希望手機不用透過連結切換瀏覽器，必須讓郵件確實包含驗證碼。可在自己的 Supabase 專案 **Authentication → Email Templates**（或 Emails → Templates）調整郵件：

**前置條件：** 使用者目前的 Supabase 畫面顯示「Set up custom SMTP to edit templates」。在此設定下，必須先連接自訂 SMTP 才能修改郵件範本；前端呼叫 signInWithOtp 並不會自動把預設連結郵件改為數字碼郵件。SMTP 服務的免費額度、寄件驗證與費用依供應商而定，本次未建立服務或啟用付費方案。

1. 開啟 **Confirm signup**，保留原本的確認連結，在內容加入以下段落並儲存。
2. 開啟 **Magic Link**，同樣加入並儲存。
3. 回到手機網站重新寄送郵件，輸入新信件中的驗證碼。

```html
<p>你的日和登入驗證碼：</p>
<p style="font-size:28px;letter-spacing:4px">{{ .Token }}</p>
<p>請回到原本開啟的日和網站，在「輸入驗證碼登入」輸入此碼。</p>
```

請勿用固定數字取代 `{{ .Token }}`，也不要將驗證碼貼到聊天或公開位置。郵件的寄送與有效期限由 Supabase 管理。若服務方案限制寄信，仍需依 Supabase 提示設定 SMTP。

本次只修改網站，沒有存取或修改你的 Supabase 郵件設定。自動測試以替身服務驗證登入、回跳與保存，不代表已確認實際手機和 Supabase 的登入成功。

## 搬到 Vercel 後仍跳回舊站

網站沒有寫死 GitHub 登入網址。寄信請求使用目前網站 origin 與部署 base 作為 `emailRedirectTo`；不攜帶查詢參數或登入 fragment。登入頁「登入後跳到舊網址？查看連線資訊」顯示這次請求的回跳網址及 Supabase Project URL，供與後台比對，不顯示金鑰。

若從 Vercel 新寄出的信仍回 GitHub，檢查顯示的 Supabase 專案：

1. Authentication → URL Configuration：Site URL 設為 `https://japanese-learning-olive.vercel.app/`，Redirect URLs 加入完全相同網址，儲存。
2. Authentication → Email Templates（或 Emails → Templates）：Confirm signup 與 Magic Link 的登入連結應使用 `href="{{ .ConfirmationURL }}"`，不要改成固定 GitHub 網址或僅 `{{ .SiteURL }}`。若有自行製作 token_hash 驗證流程，先核對該流程，不直接套用此範本建議。
3. 從 Vercel 重新寄信，點最新一封；舊郵件的連結不會跟著設定更新。郵件含數字驗證碼時，也可留在原瀏覽器驗證。

Supabase 不允許請求的 redirect URL 時可能回到 Site URL；郵件範本直接使用 Site URL 也可能忽略請求的回跳位置。僅由前端程式不能確認或修改這兩項服務設定。不要把含 token 的完整登入連結貼到聊天或公開位置。

Vercel 建置預設 base 已改為 `/`；GitHub Pages workflow 仍透過 VITE_BASE_PATH 指定 Pages 子路徑。已在 Vercel 手動設過 VITE_BASE_PATH 時，該值仍優先，應保留 `/`。本次沒有修改 Supabase 的帳號、資料庫或存取權限。


## 寄送沒有反應或沒有收到信

前端等待每次寄信／驗證回應最多 20 秒；逾時只表示未能確認結果，不會自動重寄或宣稱送達。每次發起寄送後，提供 60 秒防連按倒數；服務端限制仍由 Supabase 決定，倒數結束不代表額度必然恢復。驗證碼不持久化。

API 接受請求時，畫面顯示「已受理」，不代表收件人收到信。依 Auth 錯誤代碼顯示寄信頻率限制、未授權收件地址、Email provider 未啟用、註冊停用、郵件服務錯誤、網路錯誤及驗證碼錯誤／過期。若沒有錯誤但未收到信，需查詢實際 Supabase Auth Logs 與郵件服務紀錄，再確認信箱、垃圾郵件與供應商送達狀態。本次沒有存取使用者雲端日誌，不能判定某次郵件未送達的真實原因。

驗證：38 項單元／資料測試、16 項相關桌機／手機瀏覽器案例及正式建置通過；寄信與驗證服務以替身測試，尚未完成真實寄信驗收。
