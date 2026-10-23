import { test, expect } from "@playwright/test";
const raw =
  "1\n00:00:01,000 --> 00:00:04,000\n予定を確認します。\n\n2\n00:00:05,000 --> 00:00:08,000\n忘れないうちに、メモします。";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
async function addSong(page: any) {
  await page.goto("/");
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "日文歌", exact: true })
    .click();
  await page.getByRole("button", { name: "新增歌曲與字幕" }).click();
  await page.getByLabel("歌名", { exact: true }).fill("自編測試");
  await page
    .getByLabel("YouTube 影片網址", { exact: true })
    .fill("https://youtu.be/abcdefghijk");
  await page.getByLabel("或貼上有時間軸的字幕").fill(raw);
  await page.getByRole("button", { name: "建立歌曲教材" }).click();
}
test("song import, line notes, shared vocabulary, favorites and resuming work on both layouts", async ({
  page,
}) => {
  await addSong(page);
  await expect(
    page.getByRole("heading", { name: "自編測試", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".song-caption-list>button")).toHaveCount(2);
  await page.getByRole("button", { name: "下一句", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /第 2 句 · 拆句筆記/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "編輯中文與拆句筆記" }).click();
  await page
    .getByLabel("完整中文翻譯", { exact: true })
    .fill("趁還沒忘記，先記下來。");
  await page
    .getByLabel("意思、語氣與文法筆記", { exact: true })
    .fill("うちに：趁某狀態仍持續；忘れる→忘れない。");
  await page.getByRole("button", { name: "儲存本句筆記" }).click();
  await page.getByLabel("顯示中文", { exact: true }).check();
  await expect(page.locator(".song-notes .translation").first()).toHaveText(
    "趁還沒忘記，先記下來。",
  );
  await page.getByRole("button", { name: "收藏句子", exact: true }).click();
  await page.getByLabel("只看收藏", { exact: true }).check();
  await expect(page.locator(".song-caption-list>button")).toHaveCount(1);
  await page.locator("summary").filter({ hasText: "從共用文法庫" }).click();
  await page.getByLabel("搜尋相關文法").fill("うちに");
  await page.getByRole("button", { name: /〜うちに ·/ }).click();
  await expect(
    page.locator('.song-notes [data-grammar-id="g2"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "收藏文法至複習中心" }).click();
  await page.getByRole("button", { name: "上一句", exact: true }).click();
  await page.locator("summary").filter({ hasText: "從共用單字庫" }).click();
  await page.getByLabel("搜尋相關單字").fill("予定");
  await page.getByRole("button", { name: /^予定 ·/ }).click();
  await expect(page.locator(".song-word")).toContainText("よてい");
  await page.getByRole("button", { name: "收藏單字至複習中心" }).click();
  await page.getByRole("button", { name: "下一句", exact: true }).click();
  const events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some((e: any) => e.key === "favorite:g2" && e.value === true),
  ).toBeTruthy();
  await page.reload();
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "日文歌", exact: true })
    .click();
  await page.getByRole("button", { name: /自編測試/ }).click();
  await expect(
    page.getByRole("heading", { name: /第 2 句 · 拆句筆記/ }),
  ).toBeVisible();
  await expect(page.locator(".song-note-text")).toContainText(
    "忘れる→忘れない",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});
test("video time drives captions, seeking, single-line loop and playback rate", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__videoTime = 0;
    (window as any).__seeks = [];
    (window as any).YT = {
      Player: class {
        constructor(element: any, options: any) {
          element.textContent = "影片播放器測試替身";
          setTimeout(() => options.events.onReady({ target: this }), 0);
        }
        getCurrentTime() {
          return (window as any).__videoTime;
        }
        seekTo(t: number) {
          (window as any).__videoTime = t;
          (window as any).__seeks.push(t);
        }
        getAvailablePlaybackRates() {
          return [0.5, 1, 1.5];
        }
        setPlaybackRate(r: number) {
          (window as any).__rate = r;
        }
        playVideo() {}
        pauseVideo() {}
        destroy() {}
      },
    };
  });
  await addSong(page);
  await page.getByRole("button", { name: "載入影片", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "播放", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => {
    (window as any).__videoTime = 5.5;
  });
  await expect(
    page.locator('.song-caption-list>button[aria-current="true"]'),
  ).toContainText("忘れないうちに");
  await page.getByRole("button", { name: "單句循環", exact: true }).click();
  await page.evaluate(() => {
    (window as any).__videoTime = 8.2;
  });
  await expect
    .poll(() => page.evaluate(() => (window as any).__videoTime))
    .toBe(5);
  await page.getByRole("combobox", { name: "影片速度" }).selectOption("0.5");
  expect(await page.evaluate(() => (window as any).__rate)).toBe(0.5);
  await page.getByRole("button", { name: "上一句", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__seeks.at(-1))).toBe(1);
  await page.getByLabel("顯示日文字幕", { exact: true }).uncheck();
  await expect(page.locator(".song-caption-list")).not.toContainText(
    "予定を確認します",
  );
});
