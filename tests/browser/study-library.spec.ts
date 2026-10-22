import { test, expect } from "@playwright/test";
import { wordEvidence } from "../../src/study-priority";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
});
test("vocabulary table searches, shows translated examples, favorites and real quick cards", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /單字總表/ }).click();
  await expect(page.locator(".library-item")).toHaveCount(20);
  await page
    .getByRole("combobox", { name: "排序方式", exact: true })
    .selectOption("daily");
  const ids = await page
    .locator(".library-item")
    .evaluateAll((rows) => rows.map((r) => r.getAttribute("data-item-id")!));
  const ranks = ids.map((id) => wordEvidence[id].rank!);
  expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  await page.getByRole("button", { name: "下一頁", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "總表分頁" }),
  ).toContainText("2 /");
  await page.getByRole("textbox", { name: "搜尋單字總表" }).fill("予定");
  await expect(page.locator(".library-item")).toHaveCount(1);
  await page.getByRole("button", { name: "範例", exact: true }).click();
  await expect(page.locator(".library-detail .translation")).toContainText(
    "下週的行程",
  );
  await expect(page.locator(".library-detail ruby")).not.toHaveCount(0);
  await page.getByRole("button", { name: "收藏予定", exact: true }).click();
  await page
    .getByRole("combobox", { name: "複習範圍", exact: true })
    .selectOption("favorite");
  await expect(page.locator(".library-item")).toHaveCount(1);
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(before.some((e: any) => e.key === "learned:v001")).toBeFalsy();
  await page.getByRole("button", { name: "開始單字字卡", exact: true }).click();
  await page.getByRole("button", { name: "翻卡看答案", exact: true }).click();
  await page
    .getByRole("button", { name: "記得 依紀錄安排", exact: true })
    .click();
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(after.some((e: any) => e.key === "review:v001")).toBeTruthy();
});
test("grammar cards allow skipping, preserve position and flip state, then schedule only rated items", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /文法總表/ }).click();
  await page.getByRole("textbox", { name: "搜尋文法總表" }).fill("はず");
  await expect(page.locator(".library-item")).toHaveCount(2);
  await page.getByRole("button", { name: "範例", exact: true }).first().click();
  await expect(page.locator(".library-detail")).toContainText("接續");
  await page.getByRole("button", { name: "開始文法字卡", exact: true }).click();
  await page.getByRole("button", { name: "下一張", exact: true }).click();
  await page
    .getByRole("button", { name: "翻卡看文法答案", exact: true })
    .click();
  await expect(page.locator(".grammar-flashcard")).toContainText("常見錯誤");
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "跳至文法字卡" }),
  ).toHaveValue("1");
  await expect(page.locator(".grammar-flashcard")).toContainText("相似句型");
  let events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some((e: any) => e.key.startsWith("learned:gn3-16-")),
  ).toBeFalsy();
  await page
    .getByRole("button", { name: "記得 依紀錄安排", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "跳至文法字卡" }),
  ).toHaveValue("0");
  events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.filter((e: any) => e.key.startsWith("learned:gn3-16-")),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "翻卡看文法答案", exact: true })
    .click();
  await page
    .getByRole("button", { name: "忘記 10 分鐘後", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "回到文法總表", exact: true }),
  ).toBeVisible();
  events = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hiyori-events-v1:guest") || "[]"),
  );
  expect(
    events.some(
      (e: any) => e.key.startsWith("review:gn3-16-") && e.value.interval === 0,
    ),
  ).toBeTruthy();
});
test("reference filters and priority route preserve the full course and disclose evidence", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /文法總表/ }).click();
  await page
    .getByRole("combobox", { name: "教材範圍", exact: true })
    .selectOption("N4");
  await expect(page.locator(".library-item").first()).toContainText("N4");
  await page
    .getByRole("textbox", { name: "搜尋文法總表" })
    .fill("不存在的句型");
  await expect(
    page.getByRole("heading", { name: "目前沒有符合的內容" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "重設篩選", exact: true }).click();
  await expect(page.locator(".library-item")).toHaveCount(20);
  await page.getByText("排序依據與網路來源", { exact: true }).click();
  await expect(page.locator(".library-sources")).toContainText(
    "OpenSubtitles2018",
  );
  await expect(page.locator(".library-sources")).toContainText(
    "不是日檢出題率",
  );
  await page
    .getByText("建議複習路線：N3 衝刺／日常溝通", { exact: true })
    .click();
  await page.getByText("N3 衝刺先掌握", { exact: true }).click();
  await page
    .getByRole("button", { name: "判斷推測的確定程度", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "判斷推測的確定程度", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
