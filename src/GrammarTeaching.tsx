import { Fragment, useContext, useState, type ComponentType } from "react";
import { ArrowRight, Palette, BookOpen } from "lucide-react";
import { vocab, questions, type Grammar } from "./content";
import { JP, RubyContext, readingMap } from "./JapaneseText";
import {
  annotatedGrammarExample,
  grammarGuide,
  parseMarked,
  type Annotation,
  type AnnotationRole,
  type ExampleGuide,
} from "./grammar-guides";
import { verbForms } from "./basics-content";
const roleNames: Record<AnnotationRole, string> = {
  grammar: "文法重點",
  form: "接續／活用",
  vocabulary: "重要單字",
};
export function SyntaxLegend() {
  return (
    <div className="syntax-legend" aria-label="例句標色圖例">
      {(Object.keys(roleNames) as AnnotationRole[]).map((role) => (
        <span key={role} className={`syntax-label syntax-${role}`}>
          {roleNames[role]}
        </span>
      ))}
    </div>
  );
}
export function AnnotatedSentence({
  text,
  annotations,
  highlight = true,
}: {
  text: string;
  annotations: Annotation[];
  highlight?: boolean;
}) {
  const ruby = useContext(RubyContext);
  if (!highlight) return <JP text={text} />;
  const tokens = readingMap[text] || [{ text }];
  let offset = 0;
  return (
    <span className="jp annotated-japanese" lang="ja">
      {tokens.map((token, i) => {
        const start = offset,
          end = start + token.text.length;
        offset = end;
        const cuts = [
          ...new Set([
            start,
            end,
            ...annotations
              .flatMap((a) => [a.start, a.end])
              .filter((c) => c > start && c < end),
          ]),
        ].sort((a, b) => a - b);
        const pieces = cuts.slice(0, -1).map((a, j) => {
          const b = cuts[j + 1],
            part = text.slice(a, b),
            annotation = annotations.find((x) => x.start <= a && x.end >= b);
          if (!annotation) return <Fragment key={j}>{part}</Fragment>;
          const meaning =
            annotation.role === "vocabulary"
              ? vocab.find((v) => v.word === annotation.text)?.meaning
              : undefined;
          return (
            <mark
              key={j}
              className={`syntax-token syntax-${annotation.role}`}
              title={`${roleNames[annotation.role]}：${annotation.text}${meaning ? "・" + meaning : ""}`}
              data-syntax-role={annotation.role}
            >
              {part}
            </mark>
          );
        });
        return ruby && token.reading ? (
          <ruby key={i}>
            {pieces}
            <rt>{token.reading}</rt>
          </ruby>
        ) : (
          <Fragment key={i}>{pieces}</Fragment>
        );
      })}
    </span>
  );
}
function Formula({ text, g }: { text: string; g: Grammar }) {
  const candidates = [
    ...new Set([
      g.title.replace(/〜/g, "").split(/[（：]/)[0],
      ...annotatedGrammarExample(g)
        .annotations.filter((a) => a.role === "grammar")
        .map((a) => a.text),
    ]),
  ]
    .filter((s) => s.length > 1)
    .sort((a, b) => b.length - a.length);
  const pattern =
    /Na|\b[NAV]\b|な形容詞|い形容詞|動詞|名詞|普通形|辭書形|辞書形|ます語幹|ます形|ない形|た形|て形|ば形|可能形|意志形|受身|使役/g;
  const boundaries: { start: number; end: number; role: string }[] = [];
  for (const c of candidates) {
    let i = 0;
    while ((i = text.indexOf(c, i)) >= 0) {
      if (!boundaries.some((b) => i < b.end && i + c.length > b.start))
        boundaries.push({ start: i, end: i + c.length, role: "grammar" });
      i += c.length;
    }
  }
  for (const m of text.matchAll(pattern)) {
    if (
      !boundaries.some(
        (b) => m.index! < b.end && m.index! + m[0].length > b.start,
      )
    )
      boundaries.push({
        start: m.index!,
        end: m.index! + m[0].length,
        role: /^(N|Na|A|V|名詞|動詞|な形容詞|い形容詞)$/.test(m[0])
          ? "pos"
          : "form",
      });
  }
  boundaries.sort((a, b) => a.start - b.start);
  let from = 0;
  const parts = [];
  for (const b of boundaries) {
    parts.push(
      <Fragment key={`plain-${b.start}`}>{text.slice(from, b.start)}</Fragment>,
    );
    parts.push(
      <span key={b.start} className={`formula-${b.role}`}>
        {text.slice(b.start, b.end)}
      </span>,
    );
    from = b.end;
  }
  parts.push(<Fragment key="last">{text.slice(from)}</Fragment>);
  return <span className="formula-text">{parts}</span>;
}
function UsageAndFormula({ g }: { g: Grammar }) {
  const guide = grammarGuide(g);
  const rows =
    guide.formulaRows ||
    g.connection
      .split(/[；;]/)
      .filter(Boolean)
      .map((formula, i) => ({
        label: i === 0 ? "接續方式" : "另一種接法",
        formula,
        example: undefined,
        note: undefined,
      }));
  const neededForms = verbForms.filter(
    (f) =>
      (f.id === "te" && g.connection.includes("て形")) ||
      (f.id === "ta" && g.connection.includes("た形")) ||
      (f.id === "negative" && g.connection.includes("ない形")) ||
      (f.id === "stem" && /ます語幹|ます形去ます/.test(g.connection)),
  );
  return (
    <>
      <section className="grammar-use">
        <h4>意思與使用場合</h4>
        <p>{g.meaning}</p>
        {guide.usage
          .filter((p) => p !== g.meaning)
          .map((p) => (
            <p key={p}>{p}</p>
          ))}
      </section>
      <section className="grammar-formulas">
        <h4>接續公式</h4>
        <p className="grammar-symbols">
          <span>N＝名詞</span>
          <span>Na＝な形容詞</span>
          <span>A＝い形容詞</span>
          <span>V＝動詞</span>
        </p>
        <dl className="formula-rows">
          {rows.map((row, i) => (
            <div key={i}>
              <dt>{row.label}</dt>
              <dd>
                <Formula text={row.formula} g={g} />
                {row.example && (
                  <p className="formula-example">
                    例：
                    <Formula text={row.example} g={g} />
                  </p>
                )}
                {row.note && <p>{row.note}</p>}
              </dd>
            </div>
          ))}
        </dl>
        <div className="grammar-derivation">
          <strong>原形 → 接續 → 句型</strong>
          <p>
            <Formula text={guide.derivation} g={g} />
          </p>
        </div>
      </section>
      {neededForms.length > 0 && (
        <details className="grammar-form-help">
          <summary>不熟這個動詞變化？先看變化方式</summary>
          {neededForms.map((f) => (
            <div key={f.id}>
              <h5>{f.title}</h5>
              <ul>
                {f.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <p>注意：{f.note}</p>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
type Audio = ComponentType<{ text: string; translation?: string }>;
function ExtraExample({
  example,
  index,
  g,
  highlight,
  Audio,
}: {
  example: ExampleGuide;
  index: number;
  g: Grammar;
  highlight: boolean;
  Audio?: Audio;
}) {
  const parsed = parseMarked(example.marked);
  return (
    <section className="grammar-scenario">
      <span className="grammar-example-number">情境例句 {index}</span>
      <p className="example">
        <AnnotatedSentence {...parsed} highlight={highlight} />
      </p>
      <p className="translation full">{example.translation}</p>
      {example.note && (
        <p className="grammar-sentence-note">
          <strong>這句怎麼看</strong>
          {example.note}
        </p>
      )}
      {Audio && (
        <details className="grammar-example-audio">
          <summary>聽這一句／跟讀</summary>
          <Audio text={parsed.text} translation={example.translation} />
        </details>
      )}
    </section>
  );
}
function Extras({
  g,
  highlight,
  Audio,
}: {
  g: Grammar;
  highlight: boolean;
  Audio?: Audio;
}) {
  const guide = grammarGuide(g),
    examples = guide.examples || [];
  return (
    <>
      {examples.slice(0, 2).map((e, i) => (
        <ExtraExample
          key={e.marked}
          example={e}
          index={i + 1}
          g={g}
          highlight={highlight}
          Audio={Audio}
        />
      ))}
      {examples.length > 2 && (
        <details className="grammar-more-examples">
          <summary>更多情境例句（{examples.length - 2}）</summary>
          {examples.slice(2).map((e, i) => (
            <ExtraExample
              key={e.marked}
              example={e}
              index={i + 3}
              g={g}
              highlight={highlight}
              Audio={Audio}
            />
          ))}
        </details>
      )}
      {guide.comparison && (
        <section className="grammar-comparison">
          <h4>相似句型，意思差在哪？</h4>
          {guide.comparison.map((c) => (
            <div key={c.pattern}>
              <strong lang="ja">{c.pattern}</strong>
              <p>{c.meaning}</p>
              <p className="example">
                <JP text={c.example} />
              </p>
              <p className="translation">{c.translation}</p>
            </div>
          ))}
        </section>
      )}
      {guide.advanced && (
        <details className="grammar-advanced">
          <summary>進階：接續原理、口語與否定範圍</summary>
          {guide.advanced.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </details>
      )}
    </>
  );
}
export default function GrammarTeaching({
  g,
  compact = false,
  showExamples = true,
  Audio,
  onPractice,
}: {
  g: Grammar;
  compact?: boolean;
  showExamples?: boolean;
  Audio?: Audio;
  onPractice?: (ids: string[]) => void;
}) {
  const [highlight, setHighlight] = useState(true),
    guide = grammarGuide(g),
    example = annotatedGrammarExample(g),
    practice = questions.filter((q) => q.related.includes(g.id));
  return (
    <div
      className={`grammar-teaching ${compact ? "compact" : ""}`}
      data-grammar-id={g.id}
    >
      {!compact && <UsageAndFormula g={g} />}
      {compact && <p>{g.meaning}</p>}
      {showExamples && (
        <section className="grammar-primary-example">
          <div className="grammar-example-heading">
            <h4>例句拆解</h4>
            <button
              className="text-button syntax-toggle"
              aria-pressed={highlight}
              onClick={() => setHighlight(!highlight)}
            >
              <Palette size={15} />
              {highlight ? "關閉重點標色" : "開啟重點標色"}
            </button>
          </div>
          <SyntaxLegend />
          <p className="example">
            <AnnotatedSentence {...example} highlight={highlight} />
          </p>
          <p className="translation full">{g.translation}</p>
          <p className="grammar-sentence-note">
            <strong>拆句重點</strong>
            {guide.derivation}
          </p>
          {Audio && (
            <details className="grammar-example-audio">
              <summary>聽例句／逐句跟讀</summary>
              <Audio text={g.example} translation={g.translation} />
            </details>
          )}
        </section>
      )}
      <dl className="grammar-pitfalls">
        <dt>常見錯誤</dt>
        <dd>{g.note}</dd>
        <dt>相似句型</dt>
        <dd>{g.compare}</dd>
      </dl>
      {compact ? (
        <details className="grammar-full-guide">
          <summary>
            <BookOpen size={16} />
            完整用法、接續公式與更多例句
          </summary>
          <UsageAndFormula g={g} />
          {showExamples && <Extras g={g} highlight={highlight} Audio={Audio} />}
        </details>
      ) : (
        showExamples && <Extras g={g} highlight={highlight} Audio={Audio} />
      )}
      {guide.reference && (
        <div className="grammar-reference">
          <a href={guide.reference.url} target="_blank" rel="noreferrer">
            延伸參考：{guide.reference.author}・わけではない
          </a>
          <p>{guide.reference.note}</p>
        </div>
      )}
      {onPractice && practice.length > 0 && (
        <button
          className="button outline small grammar-practice"
          onClick={() => onPractice(practice.map((q) => q.id))}
        >
          練習這個文法的相關題目 <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
