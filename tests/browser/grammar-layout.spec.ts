import { test, expect } from "@playwright/test";
test("course grammar formulas keep full-width rows with readable horizontal text at phone, tablet and desktop widths", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "完整課程", exact: true }).click();
  await page.locator(".unit-row").filter({ hasText: "讓學習成為習慣" }).click();
  await page.getByRole("button", { name: /文法重點/ }).click();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ["g7", "g8"]) {
      const list = page.locator(
        `.grammar-card [data-grammar-id="${id}"] .formula-rows`,
      );
      await expect(list).toBeVisible();
      const layout = await list.evaluate((el) => ({
        display: getComputedStyle(el).display,
        width: el.getBoundingClientRect().width,
        rows: Array.from(el.children).map((row) => {
          const r = row.getBoundingClientRect(),
            dd = row.querySelector("dd")!.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            width: r.width,
            definitionWidth: dd.width,
          };
        }),
      }));
      expect(layout.display, `${id} at ${width}px`).toBe("block");
      for (let i = 0; i < layout.rows.length; i++) {
        const r = layout.rows[i];
        expect(r.width).toBeGreaterThanOrEqual(layout.width - 2);
        expect(r.definitionWidth).toBeGreaterThan(150);
        if (i)
          expect(r.top).toBeGreaterThanOrEqual(layout.rows[i - 1].bottom - 1);
        expect(r.right).toBeLessThanOrEqual(width + 1);
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
});
