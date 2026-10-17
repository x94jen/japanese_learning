import { test, expect } from "@playwright/test";
import { questions } from "../../src/content";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("N3 catalog supports grammar search and categories beyond the first six units", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程", exact: true }).click();
  await expect(page.locator(".unit-row")).toHaveCount(30);
  await page.getByRole("textbox", { name: "搜尋 N3 單元或文法" }).fill("はず");
  await expect(page.locator(".unit-row")).toHaveCount(1);
  await expect(page.locator(".unit-row")).toContainText("判斷推測的確定程度");
  await page.getByRole("textbox", { name: "搜尋 N3 單元或文法" }).fill("");
  await page
    .getByRole("combobox", { name: "主題分類", exact: true })
    .selectOption("人際與敬語");
  await expect(page.locator(".unit-row")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "主題分類", exact: true })
    .selectOption("all");
  await page
    .getByRole("textbox", { name: "搜尋 N3 單元或文法" })
    .fill("沒有這個文法");
  await expect(page.locator(".unit-row")).toHaveCount(0);
  await expect(
    page.getByText("沒有符合的單元，請調整關鍵字或主題分類。"),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "搜尋 N3 單元或文法" }).fill("");
  await page.locator(".unit-row").filter({ hasText: "掌握時間的先後" }).click();
  await page.getByRole("button", { name: /文法重點/ }).click();
  await expect(page.locator(".grammar-card")).toHaveCount(4);
  await expect(
    page.locator(".grammar-card").first().locator("ruby"),
  ).not.toHaveCount(0);
  await page
    .locator(".grammar-card")
    .first()
    .getByRole("button", { name: "加入收藏", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /閱讀理解/ }).click();
  await page.getByRole("button", { name: "查看完整中文", exact: true }).click();
  await expect(page.locator(".translation.full")).toContainText("抵達車站時");
  await page.getByRole("button", { name: /聽力與跟讀/ }).click();
  await expect(
    page.getByRole("heading", { name: "先聽，再核對文字" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /單元練習/ }).click();
  await page.getByRole("button", { name: "開始單元練習", exact: true }).click();
  const prompt = await page.locator(".question-prompt").textContent();
  const q = questions.find((q) => q.unit === 7 && q.prompt === prompt)!;
  expect(q).toBeTruthy();
  const correct = q.options[q.answer];
  await page
    .locator(".options button")
    .filter({ has: page.getByText(correct, { exact: true }) })
    .click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some(
      (e: any) => e.key.startsWith("favorite:gn3-07-") && e.value === true,
    ),
  ).toBeTruthy();
  expect(
    events.some((e: any) => e.key === `answer:${q.id}` && e.value.correct),
  ).toBeTruthy();
  expect(events.some((e: any) => e.key === `review:${q.id}`)).toBeTruthy();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  expect(errors).toEqual([]);
});
test("finishing original six units recommends the expanded path without resetting progress", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("hiyori-events-v1:guest")) return;
    localStorage.setItem(
      "hiyori-events-v1:guest",
      JSON.stringify(
        Array.from({ length: 6 }, (_, i) => ({
          id: crypto.randomUUID(),
          key: `completed:${i + 1}`,
          value: true,
          at: new Date().toISOString(),
        })),
      ),
    );
  });
  await page.goto("/");
  await expect(page.locator(".course-preview").first()).toContainText(
    "掌握時間的先後",
  );
  await page.getByRole("button", { name: "完整課程", exact: true }).click();
  await expect(page.locator(".unit-row").first()).toContainText("已完成");
  await page.locator(".unit-row").filter({ hasText: "抓住文章的邏輯" }).click();
  await page
    .getByRole("button", { name: "完成這段，繼續", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "先回想，再翻卡" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "先回想，再翻卡" }),
  ).toBeVisible();
});
