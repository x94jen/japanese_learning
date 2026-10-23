import { test } from "node:test";
import assert from "node:assert/strict";
import { authFailure, authRequest } from "../src/auth-feedback";
test("email failures distinguish rate limits, delivery restrictions, provider errors and invalid OTP", () => {
  assert.match(
    authFailure(
      {
        status: 429,
        code: "over_email_send_rate_limit",
        message: "rate exceeded",
      },
      "send",
    ),
    /限制.*頻率/,
  );
  assert.match(
    authFailure(
      { code: "email_address_not_authorized", message: "not authorized" },
      "send",
    ),
    /收件地址/,
  );
  assert.match(
    authFailure(
      { status: 500, message: "Error sending confirmation email" },
      "send",
    ),
    /Auth Logs/,
  );
  assert.match(
    authFailure(
      { code: "otp_expired", message: "Token has expired or is invalid" },
      "verify",
    ),
    /錯誤、過期或已使用/,
  );
});
test("a stalled auth request times out without claiming delivery or retrying the request", async () => {
  let calls = 0;
  const request = new Promise(() => {
    calls++;
  });
  await assert.rejects(
    authRequest(request, 10),
    (e: any) => e.code === "client_timeout",
  );
  assert.equal(calls, 1);
  assert.match(
    authFailure({ code: "client_timeout" }, "send"),
    /無法確認是否已受理/,
  );
  assert.equal(await authRequest(Promise.resolve("ok"), 10), "ok");
});
