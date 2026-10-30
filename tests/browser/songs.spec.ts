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
  await page.getByRole("button", { name: "單句循環", exact: true }).click();
  await page.locator("summary").filter({ hasText: "歌詞時間校正" }).click();
  await page.evaluate(() => {
    (window as any).__videoTime = 7;
  });
  await page
    .getByRole("button", { name: "將本句對齊現在", exact: true })
    .click();
  await expect(page.locator(".song-alignment summary")).toContainText(
    "+2.0 秒",
  );
  await page.getByRole("button", { name: "上一句", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__seeks.at(-1))).toBe(3);
  await page.getByRole("button", { name: "重設校正", exact: true }).click();
  await expect(page.locator(".song-alignment summary")).toContainText("0.0 秒");
  await page.getByLabel("顯示日文字幕", { exact: true }).uncheck();
  await expect(page.locator(".song-caption-list")).not.toContainText(
    "予定を確認します",
  );
});

test("private JSON lesson imports without video, exposes readings and teaching, and supports later timing", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "日文歌", exact: true })
    .click();
  const cue = {
    start: 0,
    end: 0,
    timed: false,
    text: "予定を確認します。",
    reading: "よていをかくにんします。",
    translation: "我要確認行程。",
    note: "自編測試教材，不是歌詞。",
    words: [],
    grammar: [],
    marked: "[w:予定]を確認します。",
    terms: [{ word: "予定", reading: "よてい", meaning: "預定、行程" }],
    patterns: [
      {
        pattern: "を",
        formation: "名詞＋を＋動詞",
        meaning: "動作的對象",
        warning: "不是主語",
      },
    ],
  };
  await page.getByLabel("匯入含翻譯與解析的歌曲教材（JSON）").setInputFiles({
    name: "private.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        title: "私人閱讀課",
        artist: "本站測試",
        videoId: "",
        source: "",
        cues: [cue],
      }),
    ),
  });
  await expect(
    page.getByRole("heading", { name: "私人閱讀課", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".song-reading")).toContainText("よてい");
  await expect(page.locator(".song-notes")).toContainText("名詞＋を＋動詞");
  await expect(page.locator(".song-caption-list")).toContainText("未校時");
  await expect(
    page.getByRole("button", { name: "單句循環", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "編輯中文與拆句筆記" }).click();
  await page.getByRole("button", { name: "儲存本句筆記" }).click();
  await expect(page.locator(".song-caption-list")).toContainText("未校時");
  await page
    .getByLabel("加入本曲 YouTube 影片")
    .fill("https://youtu.be/abcdefghijk");
  await page.getByRole("button", { name: "連接影片", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "載入影片", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "編輯中文與拆句筆記" }).click();
  await page.getByLabel("字幕開始時間（秒）").fill("2");
  await page.getByLabel("字幕結束時間（秒）").fill("4");
  await page.getByRole("button", { name: "儲存本句筆記" }).click();
  await expect(page.locator(".song-caption-list")).toContainText("00:02");
  await expect(
    page.getByRole("button", { name: "單句循環", exact: true }),
  ).toBeEnabled();
});

test("LRCLIB search imports a chosen timeline and singing mode preserves study notes", async ({
  page,
}) => {
  await page.route("https://lrclib.net/api/search?**", (route) =>
    route.fulfill({
      json: [
        {
          id: 1,
          trackName: "自編歌曲",
          artistName: "測試歌手",
          albumName: "測試版",
          duration: 20,
          syncedLyrics: "[00:01.00]こんにちは\n[00:05.00]ありがとう",
        },
      ],
    }),
  );
  await page.goto("/");
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "日文歌", exact: true })
    .click();
  await page.getByRole("button", { name: "新增歌曲與字幕" }).click();
  await page.getByLabel("歌名", { exact: true }).fill("自編歌曲");
  await page.getByRole("button", { name: "搜尋逐句歌詞", exact: true }).click();
  await page.getByRole("button", { name: /自編歌曲 · 測試歌手/ }).click();
  await page
    .getByLabel("YouTube 影片網址", { exact: true })
    .fill("https://youtu.be/abcdefghijk");
  await page.getByRole("button", { name: "建立歌曲教材", exact: true }).click();
  await expect(page.locator(".song-caption-list>button")).toHaveCount(2);
  await page.getByLabel("顯示羅馬拼音", { exact: true }).check();
  await expect(page.locator(".song-romaji").first()).toHaveText("konnichiha");
  await page.getByRole("button", { name: "跟唱模式", exact: true }).click();
  await expect(page.locator(".song-notes")).toBeHidden();
  await page.getByRole("button", { name: "下一句", exact: true }).click();
  await expect(
    page.locator('.song-caption-list>button[aria-current="true"]'),
  ).toContainText("ありがとう");
  const activeRow = page.locator(
    '.song-caption-list>button[aria-current="true"]',
  );
  await expect
    .poll(async () =>
      activeRow.evaluate((el) => {
        const list = el.parentElement!;
        const a = el.getBoundingClientRect(),
          b = list.getBoundingClientRect();
        return a.top >= b.top && a.bottom <= b.bottom;
      }),
    )
    .toBeTruthy();
  await page.getByRole("button", { name: "拆句學習", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /第 2 句 · 拆句筆記/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});
