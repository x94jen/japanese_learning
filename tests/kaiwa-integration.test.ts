import { test } from "node:test";
import assert from "node:assert/strict";
import sources from "../docs/KAIWA_SOURCES.json" with { type: "json" };
import {
  dialogues,
  handoutLessons,
  validDialogueProgress,
} from "../src/dialogue-content";
import { vocab } from "../src/content";
import { materialLevel, wordEvidence } from "../src/study-priority";
import { isEvent } from "../src/engine";
test("all 10 supplied PDFs and 50 lessons have valid page and scenario references", () => {
  assert.equal(sources.files.length, 10);
  assert.equal(
    sources.files.reduce((n, f) => n + f.pages, 0),
    190,
  );
  assert.equal(handoutLessons.length, 50);
  assert.deepEqual(
    handoutLessons.map((l) => l.lesson),
    Array.from({ length: 50 }, (_, i) => i + 1),
  );
  for (const ref of handoutLessons) {
    const source = sources.files.find((f) => f.file === ref.file)!;
    assert.ok(source);
    assert.match(source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(ref.pages.every((p) => p >= 1 && p <= source.pages));
    assert.ok(ref.dialogueIds.length);
    for (const id of ref.dialogueIds)
      assert.ok(
        dialogues.some((d) => d.id === id),
        id,
      );
  }
  for (const d of dialogues) {
    if (d.references.length) assert.ok(d.source.includes("另參考"), d.id);
    else assert.ok(!d.source.includes("另參考"), d.id);
    assert.ok(d.phrases.length, d.id);
    assert.equal(d.turns.length, 6);
  }
});
test("24 conversation cards reuse the shared vocabulary, source and backup contracts without invented frequency ranks", () => {
  const added = vocab.filter((v) => v.id.startsWith("vdlg-kaiwa-"));
  assert.equal(added.length, 24);
  assert.equal(vocab.length, 268);
  assert.equal(
    new Set(vocab.map((v) => v.word)).size,
    new Set(
      vocab.filter((v) => !v.id.startsWith("vdlg-kaiwa-")).map((v) => v.word),
    ).size + 24,
  );
  for (const v of added) {
    assert.equal(materialLevel(v.unit), "會話");
    assert.ok(v.source.includes("基礎會話"));
    assert.ok(v.sentence && v.translation && v.collocation, v.id);
    assert.ok(v.dialogueIds?.every((id) => dialogues.some((d) => d.id === id)));
    assert.equal(wordEvidence[v.id].rank, undefined);
    assert.match(wordEvidence[v.id].lookupStatus!, /未比對/);
    const e = {
      id: crypto.randomUUID(),
      key: `favorite:${v.id}`,
      value: true,
      at: new Date().toISOString(),
    };
    assert.ok(isEvent(e));
  }
  assert.ok(
    validDialogueProgress("materials", {
      turn: 3,
      seen: [0, 1],
      choice: 0,
      submitted: true,
      order: [1, 2, 3, 0],
    }),
  );
});
test("textbook interpretation keeps polite boundaries and corrects the connector mistranslation", () => {
  const flow = dialogues.find((d) => d.id === "event-flow")!;
  assert.ok(
    flow.phrases.some(
      (p) => p.text === "とりあえず" && p.meaning.includes("先"),
    ),
  );
  assert.ok(flow.registerNotes.some((n) => n.includes("つまり")));
  const name = dialogues.find((d) => d.id === "name-check")!;
  assert.ok(name.registerNotes.some((n) => n.includes("不同讀法")));
  assert.ok(name.turns.some((t) => t.text.includes("なかしま")));
  assert.ok(
    dialogues
      .find((d) => d.id === "greetings")!
      .registerNotes.some((n) => n.includes("ご苦労")),
  );
});
