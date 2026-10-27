import { test, expect } from "@playwright/test";
import { dialogues } from "../../src/dialogue-content";
async function openDialogues(page: any) {
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "情境對話", exact: true })
    .click();
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("dialogue filters, hints, reading progress, four explanations and continuation persist", async ({
  page,
}) => {
  await page.goto("/");
  await openDialogues(page);
  await expect(page.locator(".dialogue-tile")).toHaveCount(dialogues.length);
  await page.getByRole("button", { name: "台日交流工作", exact: true }).click();
  await expect(page.locator(".dialogue-tile")).toHaveCount(
    dialogues.filter((d) => d.category === "台日交流工作").length,
  );
  await page.getByLabel("搜尋情境").fill("附件");
  await expect(page.locator(".dialogue-tile")).toHaveCount(1);
  await page.getByRole("button", { name: "開始對話", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "寄資料與確認附件", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".dialogue-bubble")).toHaveCount(6);
  await expect(
    page.locator(".dialogue-transcript .dialogue-reading"),
  ).toHaveCount(0);
  await page.getByLabel("顯示假名", { exact: true }).check();
  await page.getByLabel("顯示完整中文", { exact: true }).check();
  await expect(
    page.locator(".dialogue-transcript .dialogue-reading"),
  ).toHaveCount(6);
  await expect(page.locator(".dialogue-transcript")).toContainText(
    "附件無法開啟",
  );
  await page.getByRole("button", { name: "下一句", exact: true }).click();
  await expect(
    page.getByRole("progressbar", { name: "目前對話完成進度" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await page
    .getByRole("button", { name: "我理解了，下一句", exact: true })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "目前對話完成進度" }),
  ).toHaveAttribute("aria-valuenow", "14");
  await page.getByRole("button", { name: "收藏對話", exact: true }).click();
  const d = dialogues.find((d) => d.id === "materials")!;
  await expect(
    page.locator(".dialogue-exercise .option-explanations"),
  ).toHaveCount(0);
  await page
    .locator(".dialogue-exercise .options button")
    .filter({ hasText: d.question.options[d.question.answer] })
    .click();
  await page.getByRole("button", { name: "確認回應", exact: true }).click();
  await expect(
    page.locator(".dialogue-exercise .option-explanations li"),
  ).toHaveCount(4);
  await page.reload();
  await openDialogues(page);
  await page.getByLabel("對話範圍").selectOption("favorites");
  await expect(page.locator(".dialogue-tile")).toHaveCount(1);
  await page.getByRole("button", { name: "接續這段對話", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "第 3 句 · 拆句與使用", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".dialogue-exercise .option-explanations li"),
  ).toHaveCount(4);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
});
test("dialogue speech uses the supplied reading and repeat correct practice cannot inflate review interval", async ({
  page,
}) => {
  await page.addInitScript(() => {
    class Utterance {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: Utterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ lang: "ja-JP", name: "Japanese test voice" }],
        cancel: () => {},
        speak: (u: { text: string }) => {
          (window as any).__spoken = u.text;
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
  await page.goto("/");
  await openDialogues(page);
  await page.getByLabel("搜尋情境").fill("搭車與確認轉乘");
  await page.getByRole("button", { name: "開始對話", exact: true }).click();
  await page.getByText("播放這一句／聽後重複", { exact: true }).click();
  await page
    .locator(".dialogue-focus")
    .getByRole("button", { name: "播放音訊", exact: true })
    .click();
  const d = dialogues.find((d) => d.id === "train")!;
  expect(await page.evaluate(() => (window as any).__spoken)).toBe(
    d.turns[0].reading,
  );
  const choose = async () => {
    await page
      .locator(".dialogue-exercise .options button")
      .filter({ hasText: d.question.options[0] })
      .click();
    await page.getByRole("button", { name: "確認回應", exact: true }).click();
  };
  await choose();
  let before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]").filter(
      (e: any) => e.key === "dialogueReview:train",
    ),
  );
  expect(before).toHaveLength(1);
  await page.getByRole("button", { name: "重新練習這個情境" }).click();
  await choose();
  let after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]").filter(
      (e: any) => e.key === "dialogueReview:train",
    ),
  );
  expect(after).toHaveLength(1);
});
