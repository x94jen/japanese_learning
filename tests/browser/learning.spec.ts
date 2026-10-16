import { test, expect } from "@playwright/test";
import { questions } from "../../src/content";
// These tests exercise the explicitly selected guest learning workflow.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("card recall, favorites, persistence and manual review work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "今天，也讓日文進步一點。" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "開始 5 分鐘任務" }).click();
  await expect(page.getByRole("button", { name: "翻卡看答案" })).toBeVisible();
  await page.getByRole("button", { name: "加入收藏", exact: true }).click();
  await page.getByRole("button", { name: "翻卡看答案" }).click();
  await expect(page.getByRole("heading", { name: "預定、計畫" })).toBeVisible();
  await page.getByRole("button", { name: "忘記 10 分鐘後" }).click();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(page.getByText("2 / 10", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "暫停，保留進度" }).click();
  await page.getByRole("button", { name: "我的收藏", exact: true }).click();
  await expect(page.getByRole("heading", { name: /予定/ })).toBeVisible();
  await page.getByRole("button", { name: "取消收藏", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "目前沒有符合的內容" }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  expect(errors).toEqual([]);
});
test("question feedback, wrong-answer storage, review and resume work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page
    .getByRole("combobox", { name: "練習範圍" })
    .selectOption("漢字讀音");
  await page.getByRole("button", { name: "開始練習", exact: true }).click();
  const prompt = await page.locator(".question-prompt").textContent();
  const q = questions.find((q) => q.prompt === prompt)!;
  const wrong = q.options[(q.answer + 1) % 4];
  await page
    .locator(".options>button")
    .filter({ has: page.getByText(wrong, { exact: true }) })
    .click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  await expect(page.getByText("這題值得再練一次。")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(page.getByText("這題值得再練一次。")).toBeVisible();
  await page.getByRole("button", { name: "暫停，保留進度" }).click();
  const nav =
    page.viewportSize()!.width < 600
      ? page.locator(".mobile-bottom")
      : page.locator(".sidebar nav");
  await nav.getByRole("button", { name: "複習中心" }).click();
  await page.getByRole("button", { name: "錯題本", exact: true }).click();
  await page.getByText("查看上次錯誤與解析").click();
  await expect(page.getByText(q.trap)).toBeVisible();
  await page.getByRole("button", { name: "重新作答" }).click();
  await page
    .locator(".options>button")
    .filter({ has: page.getByText(q.options[q.answer], { exact: true }) })
    .click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
  await page.getByRole("button", { name: "查看本次結果" }).click();
  await expect(
    page.getByText("本次範圍 1 題，已作答 1 題，未作答 0 題。"),
  ).toBeVisible();
});
test("lesson steps persist and completion is gated by actual work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("heading", { name: "把行程安排好" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await expect(
    page.getByRole("heading", { name: "先回想，再翻卡" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("heading", { name: "先回想，再翻卡" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /6\s*單元練習/ }).click();
  await expect(
    page.getByRole("button", { name: "標記單元完成" }),
  ).toBeDisabled();
});
test("account screen does not pretend cloud sync is configured", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "帳號與雲端同步" }).click();
  await expect(
    page.getByText("雲端服務尚未連接", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "寄送登入連結" })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("complete an actual lesson and see its completion saved", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "繼續學習" }).click();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "完成這段，繼續" }).click();
  await expect(
    page.getByRole("button", { name: "標記單元完成" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "開始單元練習" }).click();
  const count = questions.filter((q) => q.unit === 1).length;
  for (let i = 0; i < count; i++) {
    const prompt = await page.locator(".question-prompt").textContent();
    const q = questions.find((q) => q.prompt === prompt)!;
    expect(q).toBeTruthy();
    await page
      .locator(".options>button")
      .filter({ has: page.locator(".jp", { hasText: q.options[q.answer] }) })
      .click();
    await page.getByRole("button", { name: "確認答案", exact: true }).click();
    await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
    await page
      .getByRole("button", {
        name: i === count - 1 ? "查看本次結果" : "下一題",
        exact: true,
      })
      .click();
  }
  await page.getByRole("button", { name: "返回課程" }).click();
  await page.getByRole("button", { name: /01.*把行程安排好/ }).click();
  await page.getByRole("button", { name: "標記單元完成" }).click();
  await expect(
    page.getByRole("button", { name: "單元已完成", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "繼續學習" }).click();
  await expect(
    page.getByRole("button", { name: "單元已完成", exact: true }),
  ).toBeVisible();
});
test("timed practice does not reset its deadline on resume", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-16T00:00:00Z") });
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程" }).click();
  await page.getByRole("button", { name: "開始計時練習" }).click();
  await page.clock.fastForward(601000);
  await expect(page.getByText("計時結束", { exact: true })).toBeVisible();
  await expect(
    page.getByText("本次範圍 80 題，已作答 0 題，未作答 80 題。"),
  ).toBeVisible();
});
test("backup export and import preserve data, reject invalid sessions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "開始 5 分鐘任務" }).click();
  await page.getByRole("button", { name: "加入收藏", exact: true }).click();
  if (page.viewportSize()!.width < 600)
    await page.getByRole("button", { name: "開啟選單" }).click();
  await page.getByRole("button", { name: "偏好與資料", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 JSON" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  const backup = JSON.parse(await readFile(path!, "utf8"));
  expect(
    backup.events.some(
      (e: any) => e.key === "favorite:v001" && e.value === true,
    ),
  ).toBeTruthy();
  expect(JSON.stringify(backup)).not.toContain("access_token");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "hiyori-v1",
        events: [
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            at: new Date().toISOString(),
            key: "quizSession",
            value: { oops: true },
          },
        ],
      }),
    ),
  });
  await expect(page.getByText(/檔案格式不正確/)).toBeVisible();
  await page.locator("input[type=file]").setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByText(/已合併.*筆事件/)).toBeVisible();
});
