import { test, expect } from "@playwright/test";
import { supplementalLessons, questions, vocab } from "../../src/content";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("N5 lesson, shared cards, answer review and completion persist", async ({
  page,
}) => {
  const lesson = supplementalLessons.find((l) => l.code === "GL03")!;
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "N5 基礎補充", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋基礎課程" }).fill("GL03");
  await page.locator(".supplement-catalog .unit-row").click();
  await expect(
    page.getByRole("heading", { name: lesson.title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "顯示完整中文" }).click();
  await expect(
    page.getByText(lesson.examples[0].zh, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await page.getByRole("button", { name: "開始本課字卡" }).click();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await expect(
    page.getByRole("heading", {
      name: vocab.find((v) => v.id === lesson.vocabIds[0])!.meaning,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "記得 依紀錄安排" }).click();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(page.getByText("2 / 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "暫停，保留進度" }).click();
  const nav =
    page.viewportSize()!.width < 600
      ? page.locator(".mobile-bottom")
      : page.locator(".sidebar nav");
  await nav.getByRole("button", { name: "今日學習" }).click();
  // Finish the remaining card, then return to the preserved lesson.
  await page.getByRole("button", { name: "繼續學習" }).click();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await page.getByRole("button", { name: "容易 較長間隔" }).click();
  await page.getByRole("button", { name: "查看複習中心" }).click();
  await nav.getByRole("button", { name: "今日學習" }).click();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("heading", { name: "本課共用字卡" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await expect(
    page.getByRole("button", { name: "標記補充完成" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "開始本課練習" }).click();
  for (let i = 0; i < 2; i++) {
    const prompt = await page.locator(".question-prompt").textContent();
    const q = questions.find((q) => q.prompt === prompt)!;
    const selected = i === 0 ? (q.answer + 1) % 4 : q.answer;
    await page
      .locator(".options>button")
      .filter({ has: page.getByText(q.options[selected], { exact: true }) })
      .click();
    await page.getByRole("button", { name: "確認答案", exact: true }).click();
    await page
      .getByRole("button", {
        name: i === 0 ? "下一題" : "查看本次結果",
        exact: true,
      })
      .click();
  }
  await page.getByRole("button", { name: "返回課程" }).click();
  await nav.getByRole("button", { name: "今日學習" }).click();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await page.getByRole("button", { name: "標記補充完成" }).click();
  await expect(
    page.getByRole("button", { name: "補充單元已完成", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("button", { name: "補充單元已完成", exact: true }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "複習中心" }).click();
  await page.getByRole("button", { name: "錯題本", exact: true }).click();
  await expect(page.locator(".review-item")).toHaveCount(1);
  await page.getByRole("button", { name: "回到補強單元" }).click();
  await expect(
    page.getByRole("heading", { name: lesson.title, exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
test("N4 lookup links to N3 and prerequisite lessons", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "N4 基礎補強", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋基礎課程" }).fill("GL49");
  await page.locator(".supplement-catalog .unit-row").click();
  await expect(
    page.getByRole("heading", { name: "目的與原因：ために、ように" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /GL37/ }).click();
  await expect(
    page.getByRole("heading", { name: "可能形：能力與條件允許", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "N3 04 讓學習成為習慣" }).click();
  await expect(
    page.getByRole("heading", { name: "讓學習成為習慣", exact: true }),
  ).toBeVisible();
});
