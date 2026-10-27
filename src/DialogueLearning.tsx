import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronRight,
  Headphones,
  MessageCircle,
} from "lucide-react";
import type { StudyStore } from "./store";
import { schedule, shuffled, type Review } from "./engine";
import { grammar, vocab } from "./content";
import {
  dialogues,
  handoutLessons,
  dialogueCompletion,
  type Dialogue,
  type DialogueProgress,
} from "./dialogue-content";
import { RubyContext } from "./JapaneseText";
import { AnnotatedSentence, SyntaxLegend } from "./GrammarTeaching";
import GrammarTeaching from "./GrammarTeaching";
import { parseMarked } from "./grammar-guides";
import "./dialogue-learning.css";
import "./option-explanations.css";
type Audio = ComponentType<{ text: string; translation?: string }>;
export default function DialogueLearning({
  store,
  Audio,
  initialCategory = "全部",
  initialId = "",
}: {
  store: StudyStore;
  Audio: Audio;
  initialCategory?: string;
  initialId?: string;
}) {
  const [category, setCategory] = useState(initialCategory),
    [search, setSearch] = useState(""),
    [scope, setScope] = useState("all"),
    [selected, setSelected] = useState(initialId),
    [handout, setHandout] = useState("all");
  const current = dialogues.find((d) => d.id === selected);
  if (current)
    return (
      <DialogueLesson
        key={current.id}
        dialogue={current}
        store={store}
        Audio={Audio}
        back={() => setSelected("")}
      />
    );
  const visible = dialogues.filter(
    (d) =>
      (category === "全部" || d.category === category) &&
      (handout === "all" ||
        d.references.some((r) => r.lesson === Number(handout))) &&
      `${d.title}${d.goal}${d.turns.map((t) => t.text).join("")}${d.terms.map((t) => t.meaning).join("")}${d.phrases.map((p) => p.text + p.meaning).join("")}${d.references.map((r) => `第${r.lesson}課第${String(r.lesson).padStart(2, "0")}課${r.title}`).join("")}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (scope !== "favorites" || store.data[`dialogueFavorite:${d.id}`]) &&
      (scope !== "due" ||
        (store.data[`dialogueReview:${d.id}`] &&
          Date.parse((store.data[`dialogueReview:${d.id}`] as Review).due) <=
            Date.now())),
  );
  return (
    <div className="dialogue-page">
      <header className="page-heading">
        <span className="eyebrow">CONVERSATION · 把日文用在生活裡</span>
        <h1>情境對話</h1>
        <p>
          生活、旅遊與台日交流工作，從理解對方到選擇自然回應。每段約 5
          分鐘，可隨時接續。
        </p>
      </header>
      <div className="dialogue-category" aria-label="對話主題">
        {["全部", "生活", "旅遊", "台日交流工作"].map((c) => (
          <button
            className={`button ${category === c ? "dark" : "outline"} small`}
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <label>
          搜尋情境
          <input
            type="search"
            placeholder="例如：餐廳、附件、演唱會"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          講義課次
          <select
            aria-label="講義課次"
            value={handout}
            onChange={(e) => setHandout(e.target.value)}
          >
            <option value="all">全部課次</option>
            {handoutLessons.map((r) => (
              <option key={r.lesson} value={r.lesson}>
                第{String(r.lesson).padStart(2, "0")}課・{r.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          對話範圍
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">所有對話</option>
            <option value="favorites">收藏對話</option>
            <option value="due">到期複習</option>
          </select>
        </label>
      </div>
      <p className="helper">
        目前 {dialogues.length} 個自編情境、
        {dialogues.reduce((n, d) => n + d.turns.length, 0)} 句對話。已對照 10
        份《基礎會話》第 1～50
        課；是情境與用法的整合，不是講義逐課全文轉錄。分級為本站編排，服務規則仍依現場確認。
      </p>
      {visible.length === 0 ? (
        <div className="panel">
          沒有符合條件的對話，請調整主題、搜尋或範圍。
        </div>
      ) : (
        <div className="dialogue-grid">
          {visible.map((d) => {
            const progress = store.data[`dialogue:${d.id}`] as
                DialogueProgress | undefined,
              p = dialogueCompletion(d, progress);
            return (
              <article className="panel dialogue-tile" key={d.id}>
                <div className="section-heading">
                  <span className="tag">{d.category}</span>
                  <button
                    className="text-button"
                    aria-label={`${store.data[`dialogueFavorite:${d.id}`] ? "取消收藏" : "收藏"}${d.title}`}
                    aria-pressed={!!store.data[`dialogueFavorite:${d.id}`]}
                    onClick={() =>
                      store.put(
                        `dialogueFavorite:${d.id}`,
                        !store.data[`dialogueFavorite:${d.id}`],
                      )
                    }
                  >
                    <Bookmark size={18} />
                  </button>
                </div>
                <h2>{d.title}</h2>
                <p>{d.goal}</p>
                <small>
                  {d.politeness} · {d.turns.length} 句 · 約 {d.minutes} 分鐘
                </small>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${d.title}完成進度`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={p.percent}
                >
                  <i style={{ width: `${p.percent}%` }} />
                </div>
                <p className="helper">
                  {p.count}/{p.total} 項理解與作答 · 非熟悉度
                </p>
                <button
                  className="button outline small"
                  onClick={() => setSelected(d.id)}
                >
                  {progress ? "接續這段對話" : "開始對話"}
                  <ChevronRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      )}
      <p className="helper">
        音訊使用裝置日文合成語音，非真人錄音或即時 AI
        角色扮演。登入並成功同步後，理解進度、收藏與練習紀錄可跨裝置接續；訪客僅存本機。
      </p>
    </div>
  );
}
function DialogueLesson({
  dialogue: d,
  store,
  Audio,
  back,
}: {
  dialogue: Dialogue;
  store: StudyStore;
  Audio: Audio;
  back: () => void;
}) {
  const initial = useMemo<DialogueProgress>(
    () => ({
      turn: 0,
      seen: [],
      choice: null,
      submitted: false,
      order: shuffled([0, 1, 2, 3]),
    }),
    [d.id],
  );
  const sceneTerms = [
    ...d.terms,
    ...vocab
      .filter(
        (v) =>
          v.dialogueIds?.includes(d.id) &&
          !d.terms.some((t) => t.word === v.word),
      )
      .map((v) => ({ word: v.word, reading: v.reading, meaning: v.meaning })),
  ];
  const p =
      (store.data[`dialogue:${d.id}`] as DialogueProgress | undefined) ||
      initial,
    order = p.order || [0, 1, 2, 3],
    turn = d.turns[p.turn],
    completion = dialogueCompletion(d, p);
  const [reading, setReading] = useState(false),
    [chinese, setChinese] = useState(false);
  const save = (patch: Partial<DialogueProgress>) =>
    store.put(`dialogue:${d.id}`, { ...p, ...patch });
  function chooseTurn(i: number) {
    save({ turn: i });
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function understood() {
    save({
      seen: [...new Set([...p.seen, p.turn])],
      turn: Math.min(p.turn + 1, d.turns.length - 1),
    });
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function submit() {
    if (p.choice === null || p.submitted) return;
    const correct = p.choice === d.question.answer;
    save({ submitted: true });
    const previous = store.data[`dialogueReview:${d.id}`] as Review | undefined;
    if (!correct || !previous || Date.parse(previous.due) <= Date.now())
      store.put(`dialogueReview:${d.id}`, schedule(previous, correct ? 2 : 0));
  }
  return (
    <div className="dialogue-page">
      <button className="text-button" onClick={back}>
        <ArrowLeft size={16} />
        返回情境對話
      </button>
      <header className="page-heading">
        <span className="eyebrow">
          {d.category} · {d.politeness}
        </span>
        <h1>{d.title}</h1>
        <p>{d.goal}</p>
      </header>
      <div className="dialogue-toolbar">
        <label>
          <input
            type="checkbox"
            checked={reading}
            onChange={(e) => setReading(e.target.checked)}
          />
          顯示假名
        </label>
        <label>
          <input
            type="checkbox"
            checked={chinese}
            onChange={(e) => setChinese(e.target.checked)}
          />
          顯示完整中文
        </label>
        <button
          className="text-button"
          aria-pressed={!!store.data[`dialogueFavorite:${d.id}`]}
          onClick={() =>
            store.put(
              `dialogueFavorite:${d.id}`,
              !store.data[`dialogueFavorite:${d.id}`],
            )
          }
        >
          <Bookmark size={16} />
          {store.data[`dialogueFavorite:${d.id}`] ? "取消收藏對話" : "收藏對話"}
        </button>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="目前對話完成進度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion.percent}
      >
        <i style={{ width: `${completion.percent}%` }} />
      </div>
      <p className="helper">
        {completion.count}/{completion.total}{" "}
        項理解與作答已保存。點選或播放不會直接算學會；按「我理解了」才記錄該句已讀。
      </p>
      <div className="dialogue-workspace">
        <section
          className="panel dialogue-transcript"
          aria-label="完整情境對話"
        >
          <div className="section-heading">
            <h2>先聽／讀，再打開提示</h2>
            <MessageCircle size={21} />
          </div>
          <p className="helper">
            點選句子可查看右側或下方的拆句說明；也可用「上一句／下一句」切換。
          </p>
          <RubyContext.Provider value={reading}>
            {d.turns.map((t, i) => (
              <div
                className={`dialogue-bubble ${i % 2 ? "reply" : ""} ${i === p.turn ? "focused" : ""}`}
                key={i}
              >
                <button
                  className="dialogue-line"
                  aria-current={i === p.turn ? "step" : undefined}
                  onClick={() => chooseTurn(i)}
                >
                  <span className="dialogue-speaker">
                    {t.speaker}
                    <small>
                      第 {i + 1} 句{p.seen.includes(i) ? " · 已讀" : ""}
                    </small>
                  </span>
                  <span className="example">
                    <AnnotatedSentence {...parseMarked(t.marked)} />
                  </span>
                  {reading && (
                    <span className="dialogue-reading" lang="ja">
                      {t.reading}
                    </span>
                  )}
                  {chinese && (
                    <span className="translation full">{t.translation}</span>
                  )}
                </button>
              </div>
            ))}
          </RubyContext.Provider>
          <details className="dialogue-audio">
            <summary>
              <Headphones size={16} />
              整段播放與影子跟讀
            </summary>
            <p className="helper">
              按教材讀音以同一裝置聲音播放，不模擬不同角色；可用播放器逐句重複、調速。
            </p>
            <Audio
              text={d.turns.map((t) => t.reading).join("\n")}
              translation={d.turns
                .map((t) => `${t.speaker}：${t.translation}`)
                .join("\n")}
            />
          </details>
        </section>
        <aside className="panel dialogue-focus">
          <h2>第 {p.turn + 1} 句 · 拆句與使用</h2>
          <SyntaxLegend />
          <p className="dialogue-note">{turn.note}</p>
          <div className="button-row">
            <button
              className="button outline small"
              disabled={p.turn === 0}
              onClick={() => chooseTurn(p.turn - 1)}
            >
              上一句
            </button>
            <button
              className="button outline small"
              disabled={p.turn === d.turns.length - 1}
              onClick={() => chooseTurn(p.turn + 1)}
            >
              下一句
            </button>
            <button className="button dark small" onClick={understood}>
              <Check size={15} />
              {p.seen.includes(p.turn) ? "已理解，繼續" : "我理解了，下一句"}
            </button>
          </div>
          <details className="dialogue-audio" key={p.turn}>
            <summary>播放這一句／聽後重複</summary>
            <Audio text={turn.reading} translation={turn.translation} />
          </details>
          <h3>重點單字</h3>
          <dl className="dialogue-terms">
            {sceneTerms.map((t) => (
              <div key={t.word}>
                <dt lang="ja">
                  {t.word}
                  <small>{t.reading}</small>
                </dt>
                <dd>
                  {t.meaning}
                  {vocab.find((v) => v.word === t.word) &&
                    (() => {
                      const word = vocab.find((v) => v.word === t.word)!;
                      return (
                        <button
                          className="text-button dialogue-word-save"
                          onClick={() =>
                            store.put(
                              `favorite:${word.id}`,
                              !store.data[`favorite:${word.id}`],
                            )
                          }
                        >
                          {store.data[`favorite:${word.id}`]
                            ? "取消收藏單字"
                            : "收藏至共用單字複習"}
                        </button>
                      );
                    })()}
                </dd>
              </div>
            ))}
          </dl>
          <h3>換成自己的情境</h3>
          <p>{d.variation}</p>
          <p className="helper">
            先自己用替換詞說一次；此處沒有錄音、語音評分或自動 AI 批改。
          </p>
        </aside>
      </div>
      <section className="panel dialogue-usage">
        <h2>講義延伸：常用表達與語氣</h2>
        <p className="helper">
          依講義情境整理，解說與例句為本站編寫。理解意思後，再確認關係、場合與對方是否真的同意。
        </p>
        <div className="dialogue-phrase-grid">
          {d.phrases.map((p) => (
            <article key={p.text}>
              <span className="tag">{p.register}</span>
              <h3 lang="ja">{p.text}</h3>
              {reading && (
                <p className="dialogue-reading" lang="ja">
                  {p.reading}
                </p>
              )}
              {chinese && <p className="translation">{p.meaning}</p>}
              <p>{p.usage}</p>
            </article>
          ))}
        </div>
        {d.registerNotes.length > 0 && (
          <div className="dialogue-register">
            <h3>口語、玩笑與工作場合</h3>
            {d.registerNotes.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        )}
      </section>
      <section className="panel dialogue-exercise">
        <span className="tag">回應練習 · 自編題</span>
        <h2>換你回應</h2>
        <p>{d.question.prompt}</p>
        <div className="options">
          {order.map((index, i) => (
            <button
              key={index}
              disabled={p.submitted}
              className={`${p.choice === index ? "selected" : ""} ${p.submitted && index === d.question.answer ? "correct" : ""}`}
              onClick={() => save({ choice: index })}
            >
              <span className="option-number">{i + 1}</span>
              <span lang="ja">{d.question.options[index]}</span>
            </button>
          ))}
        </div>
        {!p.submitted ? (
          <button
            className="button dark"
            disabled={p.choice === null}
            onClick={submit}
          >
            確認回應
          </button>
        ) : (
          <>
            <p role="status">
              {p.choice === d.question.answer
                ? "答對了，看看四個選項的差異。"
                : "再看一次情境與回應目的。"}
            </p>
            <section
              className="option-explanations"
              aria-label="四個選項逐項解析"
            >
              <h3>四個選項，逐一看懂</h3>
              <ol>
                {order.map((idx, i) => (
                  <li
                    key={idx}
                    className={
                      idx === d.question.answer
                        ? "answer-correct"
                        : "answer-distractor"
                    }
                  >
                    <div className="option-explanation-heading">
                      <span className="option-explanation-number">{i + 1}</span>
                      <strong lang="ja">{d.question.options[idx]}</strong>
                      <span className="option-explanation-status">
                        {idx === d.question.answer ? "正確答案" : "不適合本題"}
                        {p.choice === idx ? " · 你的選擇" : ""}
                      </span>
                    </div>
                    <p className="option-reason">
                      {d.question.explanations[idx]}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
            <button
              className="button outline small"
              onClick={() =>
                save({
                  choice: null,
                  submitted: false,
                  order: shuffled([0, 1, 2, 3]),
                })
              }
            >
              重新練習這個情境
            </button>
            <p className="helper">
              依作答安排複習。答錯約十分鐘後再練；同一到期前反覆答對不會一直提高間隔。完成本課不等於已熟悉。
            </p>
          </>
        )}
      </section>
      <section className="panel">
        <h2>連回文法主線</h2>
        {d.grammar.map((id) => {
          const g = grammar.find((g) => g.id === id);
          return (
            g && (
              <details className="dialogue-grammar" key={id}>
                <summary>
                  {g.title} · {g.meaning}
                </summary>
                <GrammarTeaching g={g} compact />
                <button
                  className="text-button"
                  onClick={() =>
                    store.put(
                      `favorite:${g.id}`,
                      !store.data[`favorite:${g.id}`],
                    )
                  }
                >
                  {store.data[`favorite:${g.id}`]
                    ? "取消收藏文法"
                    : "收藏文法至複習中心"}
                </button>
              </details>
            )
          );
        })}
        {d.references.length > 0 ? (
          <details className="dialogue-source">
            <summary>講義與課程對照（{d.references.length} 課）</summary>
            <p className="helper">
              原講義頁尾標示音速日語／Sonic-Learning.com；作者與出版資訊以原講義為準。下列為
              PDF 實體頁次，原檔不公開。
            </p>
            {d.references.map((r) => (
              <div key={r.lesson}>
                <strong>
                  第{String(r.lesson).padStart(2, "0")}課・{r.title}
                </strong>
                <p>
                  {r.file} · PDF 第 {r.pages.join("、")} 頁
                </p>
                <p className="helper">{r.coverage}</p>
              </div>
            ))}
          </details>
        ) : (
          <p className="helper">
            本情境保留原有自編內容；本批講義沒有直接對應的課次，不強行歸入來源。
          </p>
        )}
        <p className="source-line">{d.source}</p>
      </section>
    </div>
  );
}
