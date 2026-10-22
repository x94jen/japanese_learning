import { test, expect } from "@playwright/test";
test("door example shows あき and sends the same reading to speech synthesis", async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("hiyori-guest", "true");
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
          (window as any).__spokenText = u.text;
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /單字總表/ }).click();
  await page
    .getByRole("combobox", { name: "教材範圍", exact: true })
    .selectOption("all");
  await page.getByRole("textbox", { name: "搜尋單字總表" }).fill("開く");
  await page.getByRole("button", { name: "範例", exact: true }).click();
  const example = page.locator(".library-detail .example");
  await expect(
    example.locator("ruby").filter({ hasText: "開き" }).locator("rt"),
  ).toHaveText("あき");
  await expect(example).toContainText("ドアが");
  await page
    .locator(".library-detail")
    .getByRole("button", { name: "播放音訊", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).__spokenText)).toBe(
    "ドアがあきました。",
  );
});
