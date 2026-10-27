import GrammarTeaching from "./GrammarTeaching";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Layers3,
  Search,
  Volume2,
} from "lucide-react";
import {
  vocab,
  grammar,
  units,
  questions,
  type Vocab,
  type Grammar,
} from "./content";
import { mastered, type Review } from "./engine";
import type { StudyStore } from "./store";
import {
  compareWords,
  compareGrammar,
  materialLevel,
  wordBand,
  grammarBand,
  wordEvidence,
  prioritySources,
  priorityRoutes,
  type LibrarySort,
} from "./study-priority";
export type LibraryTab = "vocabulary" | "grammar";
export type GrammarSession = {
  id: string;
  ids: string[];
  index: number;
  flipped: boolean;
  finished: boolean;
  ratedIds: string[];
  mode: "grammar";
};
type Japanese = ComponentType<{ text: string; ruby?: boolean }>;
type Audio = ComponentType<{ text: string; translation?: string }>;
type Props = {
  store: StudyStore;
  initialTab: LibraryTab;
  Japanese: Japanese;
  Audio: Audio;
  startCards: (ids: string[], mode?: string) => void;
  startGrammar: (ids: string[]) => void;
  startQuiz: (ids: string[]) => void;
  openLesson: (id: number) => void;
  openDialogue?: (id: string) => void;
  fav: (id: string) => void;
};
export default function StudyLibrary({
  store,
  initialTab,
  Japanese,
  Audio,
  startCards,
  startGrammar,
  startQuiz,
  openLesson,
  openDialogue,
  fav,
}: Props) {
  const [tab, setTab] = useState(initialTab),
    [query, setQuery] = useState(""),
    [level, setLevel] = useState("N3"),
    [status, setStatus] = useState("all"),
    [sort, setSort] = useState<LibrarySort>("exam"),
    [page, setPage] = useState(0),
    [minutes, setMinutes] = useState(3),
    [cardMode, setCardMode] = useState("meaning"),
    [expanded, setExpanded] = useState<string | null>(null);
  const isWord = tab === "vocabulary",
    pageSize = 20;
  useEffect(() => {
    setPage(0);
    setExpanded(null);
  }, [tab, query, level, status, sort]);
  function changeTab(t: LibraryTab) {
    setTab(t);
    if (t === "grammar" && level === "會話") setLevel("N3");
    setQuery("");
  }
  const items = useMemo(() => {
    const normalized = query.trim().normalize("NFKC").toLowerCase();
    return (isWord ? vocab : grammar)
      .filter((item) => {
        const text =
          "word" in item
            ? `${item.word} ${item.reading} ${item.meaning} ${item.pos}`
            : `${item.title} ${item.meaning} ${item.connection}`;
        if (level !== "all" && materialLevel(item.unit) !== level) return false;
        if (!text.normalize("NFKC").toLowerCase().includes(normalized))
          return false;
        const r = store.data[`review:${item.id}`] as Review | undefined;
        return (
          status === "all" ||
          (status === "favorite" && !!store.data[`favorite:${item.id}`]) ||
          (status === "due" && !!r && Date.parse(r.due) <= Date.now()) ||
          (status === "unfamiliar" && !mastered(r))
        );
      })
      .sort((a, b) =>
        isWord
          ? compareWords(a as Vocab, b as Vocab, sort)
          : compareGrammar(a as Grammar, b as Grammar, sort),
      );
  }, [isWord, query, level, status, sort, store.data]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize)),
    currentPage = Math.min(page, pages - 1),
    visible = items.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    batch = items.slice(0, minutes === 3 ? 5 : minutes === 5 ? 10 : 20);
  function favoriteButton(item: Vocab | Grammar) {
    const title = "word" in item ? item.word : item.title;
    return (
      <button
        className="library-icon"
        aria-label={`${store.data[`favorite:${item.id}`] ? "取消收藏" : "收藏"}${title}`}
        aria-pressed={!!store.data[`favorite:${item.id}`]}
        onClick={() => fav(item.id)}
      >
        <Bookmark
          size={17}
          fill={store.data[`favorite:${item.id}`] ? "currentColor" : "none"}
        />
      </button>
    );
  }
  const relatedIds = questions
    .filter((q) => batch.some((item) => q.related.includes(item.id)))
    .map((q) => q.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE REFERENCE SHELF · 隨手翻一頁</div>
          <h1>單字與文法，放在同一張書桌。</h1>
          <p>
            查總表、看範例，或用幾分鐘做一輪回想。收藏、已學與熟悉分開記錄。
          </p>
        </div>
      </div>
      <div className="tabs library-tabs">
        <button
          className={isWord ? "active" : ""}
          onClick={() => changeTab("vocabulary")}
        >
          單字總表 <span>{vocab.length}</span>
        </button>
        <button
          className={!isWord ? "active" : ""}
          onClick={() => changeTab("grammar")}
        >
          文法總表 <span>{grammar.length}</span>
        </button>
      </div>
      <section className="panel library-plan">
        <details className="priority-overview">
          <summary>建議複習路線：N3 衝刺／日常溝通</summary>
          <div className="section-heading">
            <div>
              <h2>先熟悉常用，再補上弱點</h2>
              <p>路線是學習建議，可自由跳讀，不會重排或清除已完成的課程。</p>
            </div>
            <BookOpen size={24} />
          </div>
          <div className="priority-routes">
            {priorityRoutes.map((route) => (
              <details key={route.id}>
                <summary>{route.title}</summary>
                <p>{route.description}</p>
                <div className="priority-route-links">
                  {route.units.map((id) => (
                    <button key={id} onClick={() => openLesson(id)}>
                      {units.find((u) => u.id === id)?.title}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
                <button
                  className="text-button"
                  onClick={() => setSort(route.id)}
                >
                  套用這個優先順序
                </button>
              </details>
            ))}
          </div>
        </details>
      </section>
      <section className="panel library-desk">
        <div className="library-filters">
          <label className="library-search">
            <span>
              <Search size={15} />
              搜尋{isWord ? "單字" : "文法"}總表
            </span>
            <input
              aria-label={`搜尋${isWord ? "單字" : "文法"}總表`}
              placeholder={
                isWord
                  ? "日文、讀音或中文，例如：約束"
                  : "句型或意思，例如：はず、推測"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            教材範圍
            <select
              aria-label="教材範圍"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="N3">N3 備考主線</option>
              <option value="N4">N4 基礎補強</option>
              {isWord && <option value="會話">會話補充選詞</option>}
              <option value="N5">N5 基礎補充</option>
              <option value="all">全部教材</option>
            </select>
          </label>
          <label>
            排序方式
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LibrarySort)}
            >
              <option value="exam">備考優先建議</option>
              <option value="daily">
                {isWord ? "日常語料常見度" : "日常溝通優先建議"}
              </option>
              <option value="course">原課程順序</option>
            </select>
          </label>
          <label>
            複習範圍
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">全部內容</option>
              <option value="due">今日到期</option>
              <option value="unfamiliar">尚未熟悉</option>
              <option value="favorite">我的收藏</option>
            </select>
          </label>
        </div>
        <div className="library-quick">
          <div>
            <strong>給這一輪幾分鐘？</strong>
            <p>
              依目前篩選與排序，優先取前 {batch.length}{" "}
              {isWord ? "個單字" : "個文法"}。時間為估計，可隨時暫停。
            </p>
          </div>
          <label>
            快速複習時間
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              <option value={3}>3 分鐘 · 最多 5 張</option>
              <option value={5}>5 分鐘 · 最多 10 張</option>
              <option value={10}>10 分鐘 · 最多 20 張</option>
            </select>
          </label>
          {isWord && (
            <label>
              字卡模式
              <select
                value={cardMode}
                onChange={(e) => setCardMode(e.target.value)}
              >
                <option value="meaning">日文辨義</option>
                <option value="reading">讀音回想</option>
                <option value="audio">聽音辨詞</option>
              </select>
            </label>
          )}
          <button
            className="button dark"
            disabled={!batch.length}
            onClick={() =>
              isWord
                ? startCards(
                    batch.map((x) => x.id),
                    cardMode,
                  )
                : startGrammar(batch.map((x) => x.id))
            }
          >
            <Layers3 size={17} />
            {isWord ? "開始單字字卡" : "開始文法字卡"}
          </button>
        </div>
        {relatedIds.length > 0 && (
          <button className="text-button" onClick={() => startQuiz(relatedIds)}>
            練習這批內容的相關題目 <ArrowRight size={15} />
          </button>
        )}
        <p className="helper library-count" role="status">
          符合 {items.length} 筆 · 第 {currentPage + 1}／{pages}{" "}
          頁。總表本身不會把看過的內容標成學會。
        </p>
        {!items.length ? (
          <div className="library-empty">
            <BookOpen size={30} />
            <h3>目前沒有符合的內容</h3>
            <p>試試其他關鍵字，或調整教材及複習範圍。</p>
            <button
              className="button outline"
              onClick={() => {
                setQuery("");
                setLevel("all");
                setStatus("all");
              }}
            >
              重設篩選
            </button>
          </div>
        ) : (
          <div className="library-table-wrap">
            <table className="library-table">
              <caption className="sr-only">
                {isWord ? "單字總表" : "文法總表"}
              </caption>
              <thead>
                <tr>
                  <th>{isWord ? "單字・讀音" : "文法句型"}</th>
                  <th>意思與用法</th>
                  <th>學習建議</th>
                  <th>快速操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const word = "word" in item ? item : null,
                    g = "title" in item ? item : null,
                    r = store.data[`review:${item.id}`] as Review | undefined,
                    evidence = word ? wordEvidence[word.id] : undefined;
                  return (
                    <Fragment key={item.id}>
                      <tr className="library-item" data-item-id={item.id}>
                        <td className="library-name">
                          <strong>
                            <Japanese text={word ? word.word : g!.title} />
                          </strong>
                          {word && <small lang="ja">{word.reading}</small>}
                          <span>
                            {materialLevel(item.unit)} ·{" "}
                            {mastered(r)
                              ? "已熟悉"
                              : store.data[`learned:${item.id}`]
                                ? "已學，持續鞏固"
                                : "尚待學習"}
                          </span>
                        </td>
                        <td className="library-meaning">
                          {item.meaning}
                          {word && <small>{word.pos}</small>}
                          {g && <small>接續：{g.connection}</small>}
                        </td>
                        <td className="library-evidence">
                          <span className="tag">
                            {(word ? wordBand(word) : grammarBand(g!, sort)) ===
                            1
                              ? "優先掌握"
                              : "接續補強"}
                          </span>
                          {word ? (
                            <>
                              <small>
                                {evidence?.rank
                                  ? `字幕語料 #${evidence.rank.toLocaleString()}`
                                  : evidence?.lookupStatus ||
                                    "未取得完整詞形排名"}
                              </small>
                              {evidence?.n3Candidate && (
                                <small>民間 N3 詞表收錄</small>
                              )}
                            </>
                          ) : (
                            <small>
                              本站{sort === "daily" ? "日常溝通" : "備考"}編排
                            </small>
                          )}
                        </td>
                        <td className="library-actions">
                          {favoriteButton(item)}
                          <button
                            className="button outline small"
                            onClick={() =>
                              word
                                ? startCards([item.id], cardMode)
                                : startGrammar([item.id])
                            }
                          >
                            字卡
                          </button>
                          <button
                            className="button outline small"
                            aria-expanded={expanded === item.id}
                            onClick={() =>
                              setExpanded(expanded === item.id ? null : item.id)
                            }
                          >
                            {expanded === item.id ? "收起範例" : "範例"}
                          </button>
                        </td>
                      </tr>
                      {expanded === item.id && (
                        <tr className="library-detail">
                          <td colSpan={4}>
                            {word ? (
                              <div className="library-example">
                                <div>
                                  <h3>例句與搭配</h3>
                                  <p className="example">
                                    <Japanese text={word.sentence} />
                                  </p>
                                  <p className="translation full">
                                    {word.translation}
                                  </p>
                                  <p>
                                    常見搭配：
                                    <Japanese text={word.collocation} />
                                  </p>
                                  <p>容易混淆：{word.confusion}</p>
                                </div>
                                <Audio
                                  text={word.sentence}
                                  translation={word.translation}
                                />
                              </div>
                            ) : (
                              <GrammarTeaching
                                g={g!}
                                compact
                                Audio={Audio}
                                onPractice={startQuiz}
                              />
                            )}
                            <button
                              className="text-button"
                              onClick={() =>
                                word?.dialogueIds?.[0] && openDialogue
                                  ? openDialogue(word.dialogueIds[0])
                                  : openLesson(item.unit)
                              }
                            >
                              {word?.dialogueIds?.[0] && openDialogue
                                ? "回到情境對話"
                                : "回到完整單元"}{" "}
                              <ArrowRight size={14} />
                            </button>
                            <p className="source-line">
                              {word
                                ? word.source
                                : g!.source ||
                                  "本站自編解說與例句，非官方教材。"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <nav className="library-pagination" aria-label="總表分頁">
          <button
            className="button outline"
            disabled={currentPage === 0}
            onClick={() => {
              setPage(currentPage - 1);
              setExpanded(null);
            }}
          >
            上一頁
          </button>
          <span>
            {currentPage + 1} / {pages}
          </span>
          <button
            className="button outline"
            disabled={currentPage >= pages - 1}
            onClick={() => {
              setPage(currentPage + 1);
              setExpanded(null);
            }}
          >
            下一頁
          </button>
        </nav>
      </section>
      <details className="panel library-sources">
        <summary>排序依據與網路來源</summary>
        <p>
          「備考優先」為本站編排建議，不是日檢出題率。日檢沒有可據以宣稱完整詞彙／文法範圍與出題頻率的公開官方清單。
        </p>
        <p>
          單字常見度參考 Hermit Dave 的 FrequencyWords／OpenSubtitles2018
          日文字幕語料，僅對完整寫法精確比對。字幕不等同所有日常情境；未匹配可能是斷詞或詞形差異，不表示不常用。文法的日常及備考排序都是本站編排，未宣稱來自頻率統計。
        </p>
        <a
          href={prioritySources.frequency.url}
          target="_blank"
          rel="noreferrer"
        >
          FrequencyWords：日文字幕語料排名
        </a>
        <p>
          引用的排名與計數資料依 CC BY-SA 4.0
          分享，已篩選為本站教材的對應資料；未重製字幕、詞典釋義或例句。
        </p>
        <a
          href={prioritySources.frequency.licenseUrl}
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 4.0
        </a>
        <p>
          民間 N3 收錄標記參考
          elzup/jlpt-word-list，與來源的寫法及讀音匹配，不等同官方分級。
        </p>
        <a
          href={prioritySources.candidates.url}
          target="_blank"
          rel="noreferrer"
        >
          JLPT 候選詞表及來源
        </a>
        <p>
          查閱日期：{prioritySources.retrieved}
          。完整課程仍保留原順序及前置知識，優先路線可作衝刺選讀。
        </p>
      </details>
    </>
  );
}
export function GrammarCards({
  session,
  store,
  rate,
  fav,
  Japanese,
  Audio,
  exit,
}: {
  session: GrammarSession;
  store: StudyStore;
  rate: (id: string, n: number) => void;
  fav: (id: string) => void;
  Japanese: Japanese;
  Audio: Audio;
  exit: () => void;
}) {
  const s =
      (store.data.grammarSession as GrammarSession | undefined) || session,
    g = grammar.find((g) => g.id === s.ids[s.index])!,
    rated = s.ratedIds || [];
  function save(patch: Partial<GrammarSession>) {
    store.put("grammarSession", { ...s, ...patch });
  }
  function move(index: number) {
    if (index >= 0 && index < s.ids.length) save({ index, flipped: false });
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function grade(n: number) {
    rate(g.id, n);
    const next = [...new Set([...rated, g.id])];
    if (next.length === s.ids.length) save({ ratedIds: next, finished: true });
    else {
      const index = s.ids.findIndex(
        (id, i) => i > s.index && !next.includes(id),
      );
      save({
        ratedIds: next,
        index: index >= 0 ? index : s.ids.findIndex((id) => !next.includes(id)),
        flipped: false,
      });
    }
  }
  if (s.finished)
    return (
      <section className="panel grammar-deck-result">
        <BookOpen size={40} />
        <h1>這一輪，慢慢記住了。</h1>
        <p>
          已完成 {rated.length}／{s.ids.length}{" "}
          張文法自評，後續複習依熟悉程度安排。
        </p>
        <button className="button dark" onClick={exit}>
          回到文法總表
        </button>
      </section>
    );
  return (
    <div className="study-session grammar-deck">
      <div className="section-heading">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={16} />
          暫停文法字卡，保留進度
        </button>
        <span>
          {s.index + 1} / {s.ids.length}
        </span>
      </div>
      <div className="card-navigation">
        <button
          className="button outline"
          disabled={s.index === 0}
          onClick={() => move(s.index - 1)}
        >
          上一張
        </button>
        <label>
          跳至文法字卡
          <select
            value={s.index}
            onChange={(e) => move(Number(e.target.value))}
          >
            {s.ids.map((id, i) => (
              <option key={id} value={i}>
                {i + 1} · {grammar.find((g) => g.id === id)?.title}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button outline"
          disabled={s.index === s.ids.length - 1}
          onClick={() => move(s.index + 1)}
        >
          下一張
        </button>
      </div>
      <p className="helper">
        已自評 {rated.length}／{s.ids.length} 張；前後切換不會視為已學會。
      </p>
      <article
        className="flashcard grammar-flashcard"
        data-face={s.flipped ? "back" : "front"}
      >
        <div className="section-heading">
          <span className="tag">文法回想 · {materialLevel(g.unit)}</span>
          <button
            className="library-icon"
            aria-label="收藏這個文法"
            aria-pressed={!!store.data[`favorite:${g.id}`]}
            onClick={() => fav(g.id)}
          >
            <Bookmark
              size={19}
              fill={store.data[`favorite:${g.id}`] ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="grammar-recall-front">
          <h1>
            <Japanese text={g.title} ruby={s.flipped} />
          </h1>
          <p>先回想意思、接續與使用場合，再看答案。</p>
        </div>
        {!s.flipped ? (
          <button
            className="button dark full-width"
            onClick={() => save({ flipped: true })}
          >
            翻卡看文法答案
          </button>
        ) : (
          <div className="flashcard-back">
            <GrammarTeaching g={g} compact Audio={Audio} />
            <div className="rating-buttons">
              {["忘記", "困難", "記得", "容易"].map((text, i) => (
                <button
                  key={text}
                  className={`rating-${i}`}
                  onClick={() => grade(i)}
                >
                  <strong>{text}</strong>
                  <small>
                    {["10 分鐘後", "約 1 天後", "依紀錄安排", "較長間隔"][i]}
                  </small>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
