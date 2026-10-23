import { test, expect, type Page } from "@playwright/test";
const project = "https://test-project.supabase.co";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "learner@example.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
function authResponse() {
  const now = Math.floor(Date.now() / 1000);
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: user.id,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url"),
    Buffer.from("test-signature-only").toString("base64url"),
  ].join(".");
  return {
    access_token: token,
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user,
  };
}
async function configured(page: Page) {
  await page.addInitScript(
    ({ project }) =>
      localStorage.setItem(
        "hiyori-cloud",
        JSON.stringify({ url: project, key: "sb_publishable_test_only" }),
      ),
    { project },
  );
  await page.route(`${project}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        path.endsWith("/user")
          ? user
          : path.endsWith("/verify")
            ? authResponse()
            : path.includes("/rest/")
              ? []
              : {},
      ),
    });
  });
}
test("first visit offers login and requires an explicit guest choice", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "先登入，讓進度跟著你。" }),
  ).toBeVisible();
  await expect(
    page.getByText("雲端服務尚未連接", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "暫不登入，以訪客使用" }).click();
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "帳號與雲端同步" }),
  ).toContainText("登入同步");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
});
test("email and OTP login works in the same browser and survives reload (mock auth)", async ({
  page,
}) => {
  await configured(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "先登入，讓進度跟著你。" }),
  ).toBeVisible();
  await page.getByLabel("電子郵件", { exact: true }).fill(user.email);
  const request = page.waitForRequest(`${project}/auth/v1/otp*`);
  await page.getByRole("button", { name: "寄送驗證郵件", exact: true }).click();
  expect((await request).postDataJSON().email).toBe(user.email);
  await expect(
    page.getByText("下一步：輸入郵件中的驗證碼", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("驗證碼", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "驗證並登入" }).click();
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "帳號與雲端同步" }).click();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "登出", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "先登入，讓進度跟著你。" }),
  ).toBeVisible();
});
test("mail link callback signs in and removes the auth fragment (mock auth)", async ({
  page,
}) => {
  await configured(page);
  const response = authResponse();
  const fragment = new URLSearchParams({
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_in: "3600",
    token_type: "bearer",
    type: "magiclink",
  });
  await page.goto("/#" + fragment.toString());
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
  await expect.poll(() => new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: "帳號與雲端同步" }).click();
  await expect(page.getByText("已登入", { exact: true })).toBeVisible();
});
test("expired mail links show a useful login error instead of silent guest mode", async ({
  page,
}) => {
  await configured(page);
  await page.goto(
    "/#error=access_denied&error_code=otp_expired&error_description=untrusted-description",
  );
  await expect(
    page.getByRole("heading", { name: "先登入，讓進度跟著你。" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("登入連結已過期或已使用");
  await expect(
    page.getByText("untrusted-description", { exact: true }),
  ).toHaveCount(0);
});

test("login sends the deployment callback and exposes no keys in redirect diagnostics", async ({
  page,
}) => {
  await configured(page);
  await page.goto("/?from=old-bookmark#section");
  await page.getByLabel("電子郵件", { exact: true }).fill(user.email);
  const request = page.waitForRequest(`${project}/auth/v1/otp*`);
  await page.getByRole("button", { name: "寄送驗證郵件", exact: true }).click();
  const url = new URL((await request).url());
  expect(url.searchParams.get("redirect_to")).toBe(
    new URL("/", page.url()).href,
  );
  await page.locator(".login-redirect-help>summary").click();
  await expect(page.locator(".login-redirect-help")).toContainText(
    new URL("/", page.url()).href,
  );
  await expect(page.locator(".login-redirect-help")).toContainText(project);
  await expect(page.locator(".login-redirect-help")).toContainText(
    "{{ .ConfirmationURL }}",
  );
  await expect(page.locator(".login-redirect-help")).not.toContainText(
    "sb_publishable_test_only",
  );
});

test("email rate limits are explained and repeat sends are disabled", async ({
  page,
}) => {
  await configured(page);
  await page.route(`${project}/auth/v1/otp*`, (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        code: "over_email_send_rate_limit",
        msg: "Email rate limit exceeded",
      }),
    }),
  );
  await page.goto("/");
  await expect(page.getByLabel("驗證碼", { exact: true })).toBeVisible();
  await page.getByLabel("電子郵件", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "寄送驗證郵件", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("限制寄送或驗證頻率");
  await expect(page.getByRole("button", { name: /稍後重寄/ })).toBeDisabled();
  await expect(page.locator(".login-next-step")).toHaveCount(0);
});
test("accepted email does not claim delivery and invalid code keeps the learner on the same page", async ({
  page,
}) => {
  await configured(page);
  await page.route(`${project}/auth/v1/verify`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({
        code: "otp_expired",
        msg: "Token has expired or is invalid",
      }),
    }),
  );
  await page.goto("/");
  await page.getByLabel("電子郵件", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "寄送驗證郵件", exact: true }).click();
  await expect(page.getByText(/Supabase 已受理登入郵件請求/)).toContainText(
    "不代表已送達",
  );
  await page.getByLabel("驗證碼", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "驗證並登入" }).click();
  await expect(page.getByText(/驗證失敗：/)).toContainText(
    "錯誤、過期或已使用",
  );
  await expect(page.getByLabel("驗證碼", { exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
});
