import { test } from "node:test";
import assert from "node:assert/strict";
import { grammar } from "../src/content";
import {
  annotatedGrammarExample,
  grammarGuide,
  grammarExampleTexts,
  parseMarked,
} from "../src/grammar-guides";
import readings from "../src/readings.json";
test("all grammar annotations preserve the complete original example and valid non-overlapping ranges", () => {
  for (const g of grammar) {
    const a = annotatedGrammarExample(g);
    assert.equal(a.text, g.example, g.id);
    assert.ok(a.annotations.length > 0, g.id);
    let end = 0;
    for (const span of a.annotations) {
      assert.ok(span.start >= end, g.id);
      assert.equal(a.text.slice(span.start, span.end), span.text, g.id);
      end = span.end;
    }
  }
});
test("all N3 guides contain authored usage reasoning and a concrete derivation", () => {
  const guides = grammar.filter(
    (g) =>
      (/^g\d+$/.test(g.id) && Number(g.id.slice(1)) <= 12) ||
      g.id.startsWith("gn3-"),
  );
  assert.equal(guides.length, 108);
  for (const g of guides) {
    const guide = grammarGuide(g);
    assert.ok(guide.usage.join("").length > 35, g.id);
    assert.ok(
      guide.derivation.includes("→") || guide.derivation.includes("＋"),
      g.id,
    );
  }
});
test("wake dewa nai explains all four parts of speech, varied examples and comparison", () => {
  const g = grammar.find((g) => g.id === "g5")!,
    guide = grammarGuide(g);
  assert.equal(guide.formulaRows?.length, 4);
  assert.equal(guide.examples?.length, 8);
  assert.equal(guide.comparison?.length, 4);
  assert.equal(guide.reference?.author, "時雨の町");
  assert.ok(guide.examples?.every((e) => e.translation && e.note));
  assert.ok(guide.advanced?.some((p) => p.includes("という")));
});
test("every teaching example has full-sentence readings without changing its text", () => {
  for (const text of grammarExampleTexts().filter((t) => /[一-龯々]/.test(t))) {
    const tokens = (readings as Record<string, { text: string }[]>)[text];
    assert.ok(tokens, text);
    assert.equal(tokens.map((t) => t.text).join(""), text);
  }
  assert.deepEqual(
    parseMarked("先[w:予定]を[f:変えた][g:わけではない]。").annotations.map(
      (a) => a.role,
    ),
    ["vocabulary", "form", "grammar"],
  );
});
