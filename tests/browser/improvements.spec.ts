import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("cards support previous, next, jump and resume without marking skipped cards learned", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "開始 5 分鐘任務" }).click();
  await expect(
    page.getByRole("button", { name: "上一張", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "下一張", exact: true }).click();
  await expect(page.getByText("2 / 10", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "字卡自評進度" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "上一張", exact: true }).click();
  await expect(page.getByText("1 / 10", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "跳至字卡" }).selectOption("9");
  await expect(
    page.getByRole("button", { name: "下一張", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(page.getByText("10 / 10", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await page.getByRole("button", { name: "記得 依紀錄安排" }).click();
  await expect(page.getByText("1 / 10", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "字卡自評進度" }),
  ).toHaveAttribute("aria-valuenow", "1");
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(data.filter((e: any) => e.key.startsWith("learned:"))).toHaveLength(1);
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
test("all rated cards can be browsed again without repeating ratings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("textbox", { name: "搜尋單字" }).fill("予定");
  await page.locator(".word-list>button").first().click();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await page.getByRole("button", { name: "記得 依紀錄安排" }).click();
  await page.getByRole("button", { name: "回看這組字卡" }).click();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await expect(page.getByText(/這組字卡已自評完成/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "記得 依紀錄安排" }),
  ).toHaveCount(0);
});
test("kana tables and verb reference are usable on mobile and save reading progress", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "開啟基礎工具" }).click();
  await expect(
    page.getByRole("heading", { name: "五十音與動詞變化，一次查清楚。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "選取 あ ア", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "選取 ん ン", exact: true }).click();
  await expect(page.locator(".kana-player h3")).toContainText("ん");
  await page
    .getByRole("button", { name: "完成這節閱讀", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("progressbar", { name: "基礎工具閱讀進度" }),
  ).toHaveAttribute("aria-valuenow", "1");
  await page.getByRole("button", { name: "動詞變化詳解", exact: true }).click();
  await page.getByRole("combobox", { name: "選擇動詞" }).selectOption("kuru");
  await page
    .getByRole("combobox", { name: "選擇變化" })
    .selectOption("negative");
  await expect(page.locator(".conjugation-result strong")).toHaveText("来ない");
  await expect(page.locator(".conjugation-result p")).toHaveText("こない");
  await page.getByRole("button", { name: "動詞統整表", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋動詞變化表" }).fill("使役被動");
  await expect(page.locator(".conjugation-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".conjugation-table")).toContainText(
    "書かせられる",
  );
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  await page.reload();
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "開啟基礎工具" }).click();
  await expect(
    page.getByRole("progressbar", { name: "基礎工具閱讀進度" }),
  ).toHaveAttribute("aria-valuenow", "1");
});
test("N3 and supplementary course progress changes only after saved work and survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await expect(
    page.getByRole("progressbar", { name: "課程 1 進度", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: /01.*把行程安排好/ }).click();
  await page.getByRole("button", { name: /6\s*單元練習/ }).click();
  await expect(
    page.getByRole("progressbar", { name: "課程 1 進度", exact: true }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: /1\s*開始這一課/ }).click();
  await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await expect(
    page.getByRole("progressbar", { name: "課程 1 進度", exact: true }),
  ).not.toHaveAttribute("aria-valuenow", "0");
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("progressbar", { name: "課程 1 進度", exact: true }),
  ).not.toHaveAttribute("aria-valuenow", "0");
  const nav =
    page.viewportSize()!.width < 600
      ? page.locator(".mobile-bottom")
      : page.locator(".sidebar nav");
  await nav.getByRole("button", { name: "考檢定" }).click();
  await page.getByRole("button", { name: "N5 基礎補充", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋基礎課程" }).fill("GL03");
  await page.locator(".supplement-catalog .unit-row").click();
  await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await expect(
    page.getByRole("progressbar", { name: "課程 103 進度", exact: true }),
  ).toHaveAttribute("aria-valuenow", "20");
});
