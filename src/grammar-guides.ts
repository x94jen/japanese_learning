import teaching from "./grammar-teaching.json" with { type: "json" };
import supplementMarkup from "../scripts/content/supplement-markup.json" with { type: "json" };
import { grammar, type Grammar } from "./content";
export type AnnotationRole = "grammar" | "form" | "vocabulary";
export type Annotation = {
  text: string;
  start: number;
  end: number;
  role: AnnotationRole;
};
export type ExampleGuide = {
  marked: string;
  translation: string;
  note?: string;
};
export type FormulaRow = {
  label: string;
  formula: string;
  example?: string;
  note?: string;
};
export type GrammarGuide = {
  usage: string[];
  derivation: string;
  marked: string;
  formulaRows?: FormulaRow[];
  examples?: ExampleGuide[];
  comparison?: {
    pattern: string;
    meaning: string;
    example: string;
    translation: string;
  }[];
  advanced?: string[];
  reference?: { author: string; url: string; note: string };
};
const guides = teaching as Record<string, GrammarGuide>;
const supplemental = supplementMarkup as Record<string, string>;
export function parseMarked(marked: string) {
  const annotations: Annotation[] = [];
  let text = "",
    last = 0;
  const pattern = /\[(g|f|w):([^\]]+)\]/g;
  for (const match of marked.matchAll(pattern)) {
    text += marked.slice(last, match.index);
    const start = text.length;
    text += match[2];
    annotations.push({
      text: match[2],
      start,
      end: text.length,
      role: ({ g: "grammar", f: "form", w: "vocabulary" } as const)[
        match[1] as "g" | "f" | "w"
      ],
    });
    last = match.index! + match[0].length;
  }
  text += marked.slice(last);
  return { text, annotations };
}
export function annotatedGrammarExample(g: Grammar) {
  const marked = guides[g.id]?.marked || supplemental[g.id] || g.example;
  const parsed = parseMarked(marked),
    offset = g.example.indexOf(parsed.text);
  if (offset < 0) throw new Error(`Annotation does not match ${g.id}`);
  return {
    text: g.example,
    annotations: parsed.annotations.map((a) => ({
      ...a,
      start: a.start + offset,
      end: a.end + offset,
    })),
  };
}
export function grammarGuide(g: Grammar): GrammarGuide {
  return (
    guides[g.id] || {
      usage: [g.meaning],
      derivation: g.connection,
      marked: supplemental[g.id] || g.example,
    }
  );
}
export function grammarExampleTexts() {
  return grammar.flatMap((g) => {
    const guide = grammarGuide(g);
    return [
      g.example,
      ...(guide.examples || []).map((e) => parseMarked(e.marked).text),
      ...(guide.comparison || []).map((c) => c.example),
    ];
  });
}
