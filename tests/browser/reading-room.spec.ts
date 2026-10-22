import { test, expect } from "@playwright/test";
test.use({ timezoneId: "Asia/Taipei" });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("window follows local time and manual lamp choice persists without changing study data", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-22T15:59:45+08:00") });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-ambience",
    "morning",
  );
  await page.clock.fastForward(30000);
  await expect(page.locator("html")).toHaveAttribute(
    "data-ambience",
    "evening",
  );
  await page.clock.fastForward(3 * 3600000);
  await expect(page.locator("html")).toHaveAttribute("data-ambience", "night");
  const before = await page.evaluate(() =>
    localStorage.getItem("hiyori-events-v1:guest"),
  );
  await page.getByRole("button", { name: "關閉桌燈，切換晨光" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-ambience",
    "morning",
  );
  await expect(
    page.getByRole("button", { name: "窗景：晨光", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() => localStorage.getItem("hiyori-events-v1:guest")),
  ).toBe(before);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-ambience",
    "morning",
  );
  await page.getByRole("button", { name: "窗景：隨時間", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-ambience", "night");
});
test("room controls work by keyboard, respect reduced motion and load real scene assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "窗景與閱讀燈", exact: true }).click();
  const dialog = page.getByRole("dialog");
  for (const scene of ["晨光", "夕暮", "夜讀"]) {
    await dialog
      .getByRole("button", { name: `窗景：${scene}`, exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(dialog.locator(".scene-illustration")).toHaveJSProperty(
      "complete",
      true,
    );
    await expect
      .poll(() =>
        dialog
          .locator(".scene-illustration")
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  await dialog.getByRole("button", { name: "減少動態", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-room-motion",
    "quiet",
  );
  await expect(dialog.locator(".coffee-steam")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-room-motion",
    "quiet",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".coffee-steam")).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(errors).toEqual([]);
});
test("room and primary actions fit narrow phones and tablets", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    await expect(
      page.getByRole("button", { name: "繼續學習", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "文法總表", exact: false }).click();
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    const nav =
      width <= 800
        ? page.locator(".mobile-bottom")
        : page.locator(".sidebar nav");
    await nav.getByRole("button", { name: "今日學習", exact: true }).click();
  }
});
