export async function authRequest<T>(
  request: PromiseLike<T>,
  milliseconds = 20000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              Object.assign(new Error("連線逾時"), { code: "client_timeout" }),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
export function authFailure(error: unknown, action: "send" | "verify") {
  const e = error as { code?: string; status?: number; message?: string };
  const code = e?.code || "",
    message = e?.message || "未知錯誤";
  let help = "";
  if (code === "client_timeout")
    help =
      action === "send"
        ? "等待 Supabase 回應逾時，無法確認是否已受理寄信。請檢查網路並稍候查看信箱，勿連續重寄。"
        : "驗證回應逾時，請檢查網路與登入狀態。";
  else if (
    e?.status === 429 ||
    /rate_limit|over_email_send_rate_limit/.test(code)
  )
    help =
      "Supabase 已限制寄送或驗證頻率。請稍後再試；60 秒倒數不是服務端額度恢復的保證。";
  else if (
    code === "email_address_not_authorized" ||
    /only.*authorized|not authorized|not allowed.*email/i.test(message)
  )
    help =
      "Supabase 郵件服務限制此收件地址；請在 Auth Logs 確認，可能需要設定自訂 SMTP。";
  else if (code === "email_provider_disabled")
    help =
      "Supabase 尚未啟用 Email 登入，請檢查 Authentication 的 Email provider。";
  else if (code === "signup_disabled")
    help =
      "Supabase 未允許新帳號註冊；請確認這個電子郵件已有帳號，或調整註冊設定。";
  else if (
    action === "verify" &&
    (code === "otp_expired" ||
      code === "otp_disabled" ||
      /expired|invalid.*token/i.test(message))
  )
    help =
      "驗證碼可能錯誤、過期或已使用。請核對電子郵件並使用最新一封郵件中的數字驗證碼。";
  else if ((e?.status || 0) >= 500)
    help =
      "Supabase 或郵件服務回報錯誤，請查看 Auth Logs 的同一時間紀錄；更改回跳網址不會修復寄信服務。";
  else if (/fetch|network/i.test(message))
    help = "無法連上 Supabase，請確認網路、Project URL 與專案是否可用。";
  return `${action === "send" ? "寄信失敗" : "驗證失敗"}：${help || message}${help && code !== "client_timeout" ? `（${code || e?.status || "服務錯誤"}：${message}）` : ""}`;
}
