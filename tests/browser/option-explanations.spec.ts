import { test, expect } from "@playwright/test";
import { questions } from "../../src/content";
function sessionFor(id: string) {
  return {
    id: crypto.randomUUID(),
    ids: [id],
    index: 0,
    choice: null,
    submitted: false,
    answers: 0,
    correct: 0,
    finished: false,
    orders: [[2, 0, 3, 1]],
    timed: false,
    startedAt: Date.now(),
    limit: 600000,
  };
}
test("all four explanations match shuffled choices, stay hidden before submission and appear in mistake review", async ({
  page,
}) => {
  await page.addInitScript(
    ({ quiz }) => {
      sessionStorage.setItem("hiyori-guest", "true");
      if (!localStorage.getItem("hiyori-events-v1:guest"))
        localStorage.setItem(
          "hiyori-events-v1:guest",
          JSON.stringify([
            {
              id: crypto.randomUUID(),
              key: "quizSession",
              value: quiz,
              at: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              key: "lastStudyRoute",
              value: "quiz",
              at: new Date().toISOString(),
            },
          ]),
        );
    },
    { quiz: sessionFor("q3") },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(page.locator(".option-explanations")).toHaveCount(0);
  await page.locator(".options button").first().click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  const items = page.locator(".answer-panel .option-explanations li");
  await expect(items).toHaveCount(4);
  expect(
    await items.evaluateAll((rows) =>
      rows.map((r) => Number(r.getAttribute("data-option-index"))),
    ),
  ).toEqual([2, 0, 3, 1]);
  await expect(items.nth(0)).toContainText("第三格");
  await expect(items.nth(0)).toContainText("你的選擇");
  await expect(items.nth(3)).toContainText("正確答案");
  await page.reload();
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await expect(
    page.locator(".answer-panel .option-explanations li"),
  ).toHaveCount(4);
  await page
    .locator(page.viewportSize()!.width < 850 ? ".mobile-bottom" : ".sidebar")
    .getByRole("button", { name: "複習中心", exact: true })
    .click();
  await page.getByRole("button", { name: "錯題本", exact: true }).click();
  await page.getByText("查看上次錯誤與解析", { exact: true }).click();
  await expect(
    page.locator(".review-item .option-explanations li"),
  ).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});
test("correctly answered vocabulary question also shows every distractor explanation", async ({
  page,
}) => {
  const q = questions.find((q) => q.id === "qn3-07-word-1")!;
  await page.addInitScript(
    ({ quiz }) => {
      sessionStorage.setItem("hiyori-guest", "true");
      localStorage.setItem(
        "hiyori-events-v1:guest",
        JSON.stringify([
          {
            id: crypto.randomUUID(),
            key: "quizSession",
            value: quiz,
            at: new Date().toISOString(),
          },
        ]),
      );
    },
    { quiz: sessionFor(q.id) },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "繼續學習", exact: true }).click();
  await page.locator(".options button").nth(1).click();
  await page.getByRole("button", { name: "確認答案", exact: true }).click();
  await expect(page.getByText("答對了，看看為什麼。")).toBeVisible();
  await expect(page.locator(".option-explanations li")).toHaveCount(4);
  await expect(page.locator(".option-explanations li").first()).toContainText(
    "讀音",
  );
});

test("flashcard sentence-choice practice explains four distinct meanings after answering", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("hiyori-guest", "true"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /單字總表/ }).click();
  await page.getByRole("textbox", { name: "搜尋單字總表" }).fill("予定");
  await page.getByRole("button", { name: "開始單字字卡", exact: true }).click();
  await page.getByRole("button", { name: "翻卡看答案", exact: true }).click();
  await page.getByRole("button", { name: /看看這個詞的句中理解練習/ }).click();
  const choices = page.locator(".word-practice .options button");
  const meanings = await choices.allTextContents();
  expect(new Set(meanings).size).toBe(4);
  await expect(page.locator(".word-practice .option-explanations")).toHaveCount(
    0,
  );
  await choices.first().click();
  await page
    .locator(".word-practice")
    .getByRole("button", { name: "確認答案", exact: true })
    .click();
  await expect(
    page.locator(".word-practice .option-explanations li"),
  ).toHaveCount(4);
  for (let i = 0; i < 4; i++)
    await expect(
      page.locator(".word-practice .option-explanations li").nth(i),
    ).toContainText(meanings[i]);
});
