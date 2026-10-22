import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("grammar guide shows formulas, colored sentence parts, furigana and expanded situations without mobile overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /文法總表/ }).click();
  await page.getByRole("textbox", { name: "搜尋文法總表" }).fill("並不是說");
  await page.getByRole("button", { name: "範例", exact: true }).first().click();
  const guide = page.locator('[data-grammar-id="g5"]');
  await expect(guide).toBeVisible();
  for (const role of ["grammar", "form", "vocabulary"])
    await expect(
      guide.locator(`[data-syntax-role="${role}"]`).first(),
    ).toBeVisible();
  const ruby = guide.locator(".grammar-primary-example ruby");
  expect(await ruby.count()).toBeGreaterThan(0);
  await guide.getByRole("button", { name: "關閉重點標色" }).click();
  await expect(guide.locator("[data-syntax-role]")).toHaveCount(0);
  expect(await ruby.count()).toBeGreaterThan(0);
  await guide.getByRole("button", { name: "開啟重點標色" }).click();
  await guide.locator(".grammar-full-guide>summary").click();
  await expect(guide.locator(".formula-rows>div")).toHaveCount(4);
  await expect(guide).toContainText("N＝名詞");
  await expect(guide).toContainText("普通形");
  await guide.locator(".grammar-more-examples>summary").click();
  await expect(guide.locator(".grammar-scenario")).toHaveCount(8);
  await expect(guide).toContainText("時間配合不上");
  await expect(guide.getByRole("link", { name: /時雨の町/ })).toHaveAttribute(
    "href",
    "https://www.sigure.tw/learn-japanese/grammar/n3/128",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
  await guide.getByRole("button", { name: /練習這個文法/ }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  await expect(page.locator(".question-card [data-syntax-role]")).toHaveCount(
    0,
  );
});
test("grammar cards reveal the detailed guide only after recall", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /文法總表/ }).click();
  await page.getByRole("textbox", { name: "搜尋文法總表" }).fill("並不是說");
  await page.getByRole("button", { name: "開始文法字卡", exact: true }).click();
  await expect(page.locator(".grammar-teaching")).toHaveCount(0);
  await page.getByRole("button", { name: "翻卡看文法答案" }).click();
  await expect(page.locator(".grammar-teaching")).toBeVisible();
  await expect(
    page.locator('.grammar-teaching [data-syntax-role="grammar"]').first(),
  ).toBeVisible();
});
