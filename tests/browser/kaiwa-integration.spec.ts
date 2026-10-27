import { test, expect } from "@playwright/test";
const nav = (page: any) =>
  page.locator(
    page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar",
  );
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("textbook lesson 44 opens its integrated dialogue, shows attribution and returns from shared vocabulary", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page)
    .getByRole("button", { name: "情境對話", exact: true })
    .click();
  await page.getByLabel("講義課次", { exact: true }).selectOption("44");
  await expect(page.locator(".dialogue-tile")).toHaveCount(1);
  await page.getByRole("button", { name: "開始對話", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "確認姓名讀音與字形", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dialogue-register")).toContainText("不同讀法");
  await page.locator(".dialogue-source>summary").click();
  await expect(page.locator(".dialogue-source")).toContainText(
    "G1KaiwaPDF-41-basii.pdf",
  );
  await expect(page.locator(".dialogue-source")).toContainText(
    "Sonic-Learning.com",
  );
  await page
    .locator(".dialogue-terms>div")
    .filter({ has: page.locator("dt", { hasText: "名刺" }) })
    .getByRole("button", { name: "收藏至共用單字複習", exact: true })
    .click();
  await nav(page)
    .getByRole("button", { name: "學習總表", exact: true })
    .click();
  await page.getByLabel("教材範圍", { exact: true }).selectOption("會話");
  await page.getByRole("textbox", { name: "搜尋單字總表" }).fill("名刺");
  await expect(page.locator(".library-item")).toHaveCount(1);
  await page.getByRole("button", { name: "範例", exact: true }).click();
  await expect(page.locator(".library-detail")).toContainText("名片");
  await page.getByRole("button", { name: "回到情境對話", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "確認姓名讀音與字形", exact: true }),
  ).toBeVisible();
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some((e: any) => e.key === "favorite:vdlg-kaiwa-17" && e.value),
  ).toBeTruthy();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
});
test("new event workflow includes textbook expression corrections and four response explanations", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page)
    .getByRole("button", { name: "情境對話", exact: true })
    .click();
  await page.getByLabel("搜尋情境").fill("活動準備的順序與交接");
  await page.getByRole("button", { name: "開始對話", exact: true }).click();
  await expect(page.locator(".dialogue-bubble")).toHaveCount(6);
  await expect(page.locator(".dialogue-register")).toContainText("とりあえず");
  await page.getByLabel("顯示完整中文", { exact: true }).check();
  await expect(page.locator(".dialogue-phrase-grid")).toContainText("先、暫且");
  await page.locator(".dialogue-exercise .options button").first().click();
  await page.getByRole("button", { name: "確認回應", exact: true }).click();
  await expect(
    page.locator(".dialogue-exercise .option-explanations li"),
  ).toHaveCount(4);
});
