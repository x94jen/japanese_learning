import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("verb sentence exercise persists mistakes and can return from review to foundations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "開啟基礎工具" }).click();
  await page.getByRole("button", { name: "動詞變化練習", exact: true }).click();
  await page.getByLabel("練習類型").selectOption("sentence");
  await page
    .getByRole("combobox", { name: "練習形式", exact: true })
    .selectOption("te");
  await page.getByRole("button", { name: "開始動詞練習" }).click();
  await expect(page.locator(".question-card")).toContainText("請去車站");
  await expect(page.locator(".passage")).toContainText("駅へ＿＿ください");
  await expect(page.locator(".options ruby")).toHaveCount(0);
  await page.locator(".options button").filter({ hasText: "行った" }).click();
  await page.getByRole("button", { name: "確認答案" }).click();
  await expect(page.locator(".question-card")).toContainText("變化規則");
  await expect(page.locator(".options .correct")).toHaveCount(1);
  expect(
    await page.locator(".options .correct").evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("rt").forEach((rt) => rt.remove());
      return copy.textContent;
    }),
  ).toContain("行って");
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(page.locator(".options .correct")).toHaveCount(1);
  expect(
    await page.locator(".options .correct").evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("rt").forEach((rt) => rt.remove());
      return copy.textContent;
    }),
  ).toContain("行って");
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some(
      (e: any) => e.key === "mistake:qverb-sentence-iku-te" && e.value.active,
    ),
  ).toBeTruthy();
  expect(
    events.some((e: any) => e.key === "review:qverb-sentence-iku-te"),
  ).toBeTruthy();
  await page.getByRole("button", { name: "暫停，保留進度" }).click();
  await expect(
    page.getByRole("heading", { name: "五十音與動詞變化，一次查清楚。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "動詞變化詳解", exact: true }).click();
  await page.getByLabel("選擇變化").selectOption("potential");
  await page.getByRole("button", { name: "練習這個變化" }).click();
  await expect(
    page.getByRole("combobox", { name: "練習形式", exact: true }),
  ).toHaveValue("potential");
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
