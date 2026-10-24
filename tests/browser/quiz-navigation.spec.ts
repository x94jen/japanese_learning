import { test, expect } from "@playwright/test";
import { questions } from "../../src/content";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("finishing reading practice after reload returns to the same lesson and reading section", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程", exact: true }).click();
  await page.locator(".unit-row").filter({ hasText: "讓學習成為習慣" }).click();
  await page.getByRole("button", { name: /閱讀理解/ }).click();
  await page.getByRole("button", { name: "做這篇閱讀題", exact: true }).click();
  const text = await page.locator(".question-prompt").textContent();
  const q = questions.find((q) => q.unit === 4 && q.prompt === text)!;
  expect(q).toBeTruthy();
  await page
    .locator(".options button")
    .filter({ has: page.getByText(q.options[q.answer], { exact: true }) })
    .click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
  await page.getByRole("button", { name: "查看本次結果", exact: true }).click();
  await page.getByRole("button", { name: "返回課程", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "讓學習成為習慣", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "做這篇閱讀題", exact: true }),
  ).toBeVisible();
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(events.filter((e: any) => e.key === "lessonStep:4").at(-1).value).toBe(
    3,
  );
});
test("pausing a lesson exercise also returns to its section and keeps its answer", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await page.getByRole("button", { name: /文法重點/ }).click();
  await page
    .locator('[data-grammar-id="g1"]')
    .getByRole("button", { name: /練習這個文法/ })
    .click();
  await page
    .getByRole("button", { name: "暫停，保留進度", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "把行程安排好", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.grammar-card [data-grammar-id="g1"]'),
  ).toBeVisible();
});
