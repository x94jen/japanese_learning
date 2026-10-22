import test from "node:test";
import assert from "node:assert/strict";
import readings from "../src/readings.json" with { type: "json" };
import {
  correctFurigana,
  pronunciationText,
  type ReadingToken,
} from "../src/pronunciation";
const map = readings as Record<string, ReadingToken[]>;
test("generated material reads doors, windows and opening hours with あく", () => {
  const cases: [string, string, string][] = [
    ["ドアが開きました。", "開き", "あき"],
    ["このボタンを押すと、ドアが開きます。", "開き", "あき"],
    ["ドアが開いた瞬間、猫が飛び出しました。", "開い", "あい"],
    ["風で窓（　）開きました。", "開き", "あき"],
    [
      "今日は休館日なので、図書館が開いているはずがありません。",
      "開い",
      "あい",
    ],
    ["この店は安いです。その上、夜遅くまで開いています。", "開い", "あい"],
  ];
  for (const [sentence, surface, reading] of cases) {
    assert.ok(map[sentence], sentence);
    assert.equal(
      map[sentence].find((t) => t.text === surface)?.reading,
      reading,
      sentence,
    );
    assert.ok(pronunciationText(sentence).includes(reading));
  }
  const library = Object.keys(map).find((s) =>
    s.startsWith("市の図書館では、"),
  )!;
  assert.equal(map[library].find((t) => t.text === "開い")?.reading, "あい");
});
test("correction is scoped by token position, is repeatable and preserves legitimate ひらく", () => {
  const text = "本を開き、ドアが開きました。";
  const tokens: ReadingToken[] = [
    { text: "本", reading: "ほん" },
    { text: "を" },
    { text: "開き", reading: "ひらき" },
    { text: "、" },
    { text: "ドア" },
    { text: "が" },
    { text: "開き", reading: "ひらき" },
    { text: "まし" },
    { text: "た" },
    { text: "。" },
  ];
  const corrected = correctFurigana(text, tokens);
  assert.equal(corrected[2].reading, "ひらき");
  assert.equal(corrected[6].reading, "あき");
  assert.equal(tokens[6].reading, "ひらき");
  assert.deepEqual(correctFurigana(text, corrected), corrected);
  assert.equal(pronunciationText(text), "本を開き、ドアがあきました。");
  for (const sentence of [
    "本を開く。",
    "日本の会社と共同で展示会を開く。",
    "窓を開けてください。",
  ])
    assert.equal(pronunciationText(sentence), sentence);
  const meeting = Object.keys(map).find((s) =>
    s.startsWith("日本の会社と共同で展示会を開く"),
  )!;
  assert.equal(map[meeting].find((t) => t.text === "開く")?.reading, "ひらく");
});
