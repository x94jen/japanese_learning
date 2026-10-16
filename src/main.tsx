import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Headphones,
  Home,
  Layers3,
  ListChecks,
  Menu,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Target,
  Volume2,
  X,
  LogOut,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Flame,
  CalendarDays,
} from "lucide-react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  vocab,
  grammar,
  foundations,
  supplementalLessons,
  questions,
  units,
  sourceLinks,
  type Vocab,
  type Question,
} from "./content";
import readings from "./readings.json";
import {
  DAY,
  courseProgress,
  examDays,
  isEvent,
  mastered,
  schedule,
  shuffled,
  type Review,
  type StudyEvent,
} from "./engine";
import { useStudyStore, type StudyStore } from "./store";
import { authReturnError, connectCloud, readCloud, synchronize } from "./cloud";
import "./styles.css";
import BasicsReference from "./BasicsReference";
const RubyContext = createContext(true);
const readingMap = readings as Record<
  string,
  { text: string; reading?: string }[]
>;
function JP({
  text,
  ruby = true,
  className = "",
}: {
  text: string;
  ruby?: boolean;
  className?: string;
}) {
  const enabled = useContext(RubyContext) && ruby;
  return (
    <span lang="ja" className={`jp ${className}`}>
      {enabled
        ? (readingMap[text] || [{ text }]).map((p, i) =>
            p.reading ? (
              <ruby key={i}>
                {p.text}
                <rt>{p.reading}</rt>
              </ruby>
            ) : (
              <React.Fragment key={i}>{p.text}</React.Fragment>
            ),
          )
        : text}
    </span>
  );
}
function Tag({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function CourseProgress({ id, store }: { id: number; store: StudyStore }) {
  const progress = courseProgress(id, store.data);
  return (
    <div className="course-progress">
      <div>
        <span>課程進度</span>
        <strong>{progress.percent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`課程 ${id} 進度`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <i style={{ width: `${progress.percent}%` }} />
      </div>
      <small>
        {progress.done}/{progress.total} 項學習步驟與作答 · 非熟悉度
      </small>
    </div>
  );
}
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Layers3 size={28} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          "button,a,input,select,textarea",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    ref.current?.querySelector<HTMLElement>("button,input")?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      prev?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="關閉">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function AudioPlayer({
  text,
  translation,
  revealAllowed = true,
}: {
  text: string;
  translation?: string;
  revealAllowed?: boolean;
}) {
  const sentences = useMemo(
    () =>
      text
        .split(/(?<=[。！？])/)
        .map((s) => s.trim())
        .filter(Boolean),
    [text],
  );
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(0.9),
    [loop, setLoop] = useState(false),
    [continuous, setContinuous] = useState(false),
    [subtitles, setSubtitles] = useState(false),
    [mode, setMode] = useState("listen"),
    [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    run = useRef(0);
  function stop() {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }
  useEffect(
    () => () => {
      run.current++;
      if (timer.current) clearTimeout(timer.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [text],
  );
  function speak(i: number) {
    if (!("speechSynthesis" in window)) {
      setError("此瀏覽器沒有語音播放功能。請改用支援日文語音的手機或瀏覽器。");
      return;
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith("ja"));
    if (!voice) {
      setError(
        "目前找不到日文語音。請在裝置的語音設定安裝日文語音後重試；這不是預錄音檔。",
      );
      return;
    }
    stop();
    const generation = run.current;
    setError("");
    setIndex(i);
    const utterance = new SpeechSynthesisUtterance(sentences[i]);
    utterance.lang = "ja-JP";
    utterance.voice = voice;
    utterance.rate = speed;
    setPlaying(true);
    utterance.onerror = (e) => {
      if (generation !== run.current) return;
      setPlaying(false);
      if (e.error !== "interrupted" && e.error !== "canceled")
        setError("語音播放失敗，請確認裝置語音服務後重試。");
    };
    utterance.onend = () => {
      if (generation !== run.current) return;
      setPlaying(false);
      const next = loop
        ? i
        : continuous && i + 1 < sentences.length
          ? i + 1
          : -1;
      if (next >= 0)
        timer.current = setTimeout(
          () => speak(next),
          mode === "repeat" ? Math.max(1800, sentences[i].length * 180) : 250,
        );
    };
    synth.speak(utterance);
  }
  useEffect(() => {
    if ("speechSynthesis" in window) {
      const warm = () => window.speechSynthesis.getVoices();
      warm();
      window.speechSynthesis.addEventListener("voiceschanged", warm);
      return () =>
        window.speechSynthesis.removeEventListener("voiceschanged", warm);
    }
  }, []);
  return (
    <div className="audio-player">
      <div className="audio-top">
        <span>
          <Headphones size={16} /> 裝置合成語音
        </span>
        <span>
          {index + 1} / {sentences.length} 句
        </span>
      </div>
      <div className="audio-controls">
        <button
          className="play-button"
          onClick={() => (playing ? stop() : speak(index))}
          aria-label={playing ? "停止播放" : "播放音訊"}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <div className="audio-bars" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <i
              key={i}
              style={{ height: `${10 + Math.sin(i * 2.3) ** 2 * 26}px` }}
            />
          ))}
        </div>
        <select
          aria-label="播放速度"
          value={speed}
          onChange={(e) => {
            stop();
            setSpeed(Number(e.target.value));
          }}
        >
          {[0.65, 0.8, 0.9, 1, 1.15].map((n) => (
            <option key={n} value={n}>
              {n}×
            </option>
          ))}
        </select>
      </div>
      <div className="audio-options">
        <label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => {
              stop();
              setLoop(e.target.checked);
            }}
          />{" "}
          單句循環
        </label>
        <label>
          <input
            type="checkbox"
            checked={continuous}
            onChange={(e) => {
              stop();
              setContinuous(e.target.checked);
            }}
          />{" "}
          連續播放
        </label>
        {revealAllowed && (
          <label>
            <input
              type="checkbox"
              checked={subtitles}
              onChange={(e) => setSubtitles(e.target.checked)}
            />{" "}
            字幕與翻譯
          </label>
        )}
      </div>
      <select
        className="wide-select"
        aria-label="跟讀方式"
        value={mode}
        onChange={(e) => {
          stop();
          setMode(e.target.value);
        }}
      >
        <option value="listen">專注聆聽</option>
        <option value="repeat">聽後重複：播放間留出練習空檔</option>
        <option value="shadow">影子跟讀：稍落後原音開口</option>
      </select>
      <p className="helper">
        {mode === "shadow"
          ? "開口時稍落後原音；目前不錄音、不評分。"
          : mode === "repeat"
            ? "啟用循環或連續播放後，每句結束會留出重複時間。"
            : "先聽內容，再開啟字幕核對。音色取決於裝置，非真人錄音。"}
      </p>
      <div className="sentence-buttons">
        {sentences.map((s, i) => (
          <button
            key={i}
            className={i === index ? "selected" : ""}
            onClick={() => speak(i)}
            aria-label={`播放第 ${i + 1} 句`}
          >
            {subtitles && revealAllowed ? <JP text={s} /> : <>第 {i + 1} 句</>}
          </button>
        ))}
      </div>
      {subtitles && revealAllowed && translation && (
        <p className="translation">{translation}</p>
      )}
      {error && (
        <p className="notice warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
type Route =
  | "home"
  | "courses"
  | "review"
  | "progress"
  | "lesson"
  | "cards"
  | "quiz"
  | "sources"
  | "basics";
type QuizSession = {
  id: string;
  ids: string[];
  index: number;
  choice: number | null;
  submitted: boolean;
  answers: number;
  correct: number;
  finished: boolean;
  orders: number[][];
  timed: boolean;
  startedAt: number;
  limit: number;
};
type CardSession = {
  id: string;
  ids: string[];
  index: number;
  flipped: boolean;
  mode: string;
  finished: boolean;
  ratedIds?: string[];
};
function App() {
  const [callbackError, setCallbackError] = useState(() =>
    authReturnError(location.hash, location.search),
  );
  const [guest, setGuest] = useState(() => {
    try {
      return sessionStorage.getItem("hiyori-guest") === "true";
    } catch {
      return false;
    }
  });
  const [config, setConfig] = useState(readCloud),
    [client, setClient] = useState<SupabaseClient | null>(() => {
      const c = readCloud();
      return connectCloud(c.url, c.key);
    }),
    [session, setSession] = useState<Session | null>(null),
    [authReady, setAuthReady] = useState(false),
    [authError, setAuthError] = useState("");
  useEffect(() => {
    let active = true;
    setAuthReady(false);
    setSession(null);
    if (!client) {
      setAuthReady(true);
      return;
    }
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setAuthError(error?.message || "");
          setAuthReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setAuthError("無法讀取登入狀態，請重試。");
          setAuthReady(true);
        }
      });
    const { data } = client.auth.onAuthStateChange((event, s) => {
      if (active) {
        setSession(s);
        if (s || event === "SIGNED_OUT") {
          setGuest(false);
          try {
            sessionStorage.removeItem("hiyori-guest");
          } catch {
            /* Storage may be unavailable. */
          }
        }
        if (s) setCallbackError("");
        setAuthReady(true);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);
  if (!authReady)
    return <div className="loading">日和 · 正在準備學習空間…</div>;
  function setConnection(url: string, key: string) {
    localStorage.setItem("hiyori-cloud", JSON.stringify({ url, key }));
    setConfig({ url, key });
    setClient(connectCloud(url, key));
  }
  if (!session && (!guest || callbackError))
    return (
      <div className="auth-page">
        <main className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">日</span>
            <strong>
              日和 <small>HIYORI · JAPANESE</small>
            </strong>
          </div>
          <div className="eyebrow">你的 N3 衝刺學習空間</div>
          <h1>先登入，讓進度跟著你。</h1>
          <p>手機與電腦使用同一帳號，就能接續課程、收藏與複習。</p>
          {(callbackError || authError) && (
            <p className="notice warning" role="alert">
              {callbackError || authError}
            </p>
          )}
          <Account
            client={client}
            session={null}
            config={config}
            setConnection={setConnection}
            syncing={false}
            syncStatus=""
            sync={async () => {}}
          />
          <div className="guest-entry">
            <button
              className="button outline full-width"
              onClick={() => {
                try {
                  sessionStorage.setItem("hiyori-guest", "true");
                } catch {
                  /* Session-only choice still works. */
                }
                setCallbackError("");
                setGuest(true);
              }}
            >
              暫不登入，以訪客使用
            </button>
            <p className="helper">
              訪客進度只存在目前瀏覽器，不會在手機與電腦之間同步。
            </p>
          </div>
        </main>
      </div>
    );
  return (
    <StudyApp
      key={session?.user.id || "guest"}
      client={client}
      session={session}
      config={config}
      authError={callbackError || authError}
      setConnection={setConnection}
    />
  );
}
function StudyApp({
  client,
  session,
  config,
  setConnection,
  authError,
}: {
  client: SupabaseClient | null;
  session: Session | null;
  config: { url: string; key: string };
  setConnection: (url: string, key: string) => void;
  authError: string;
}) {
  const store = useStudyStore(session?.user.id || "guest");
  const { data, put } = store;
  const [route, setRoute] = useState<Route>("home"),
    [lessonId, setLessonId] = useState(Number(data["activeLesson"]) || 1),
    [modal, setModal] = useState(""),
    [toast, setToast] = useState(""),
    [mobileMenu, setMobileMenu] = useState(false),
    [syncStatus, setSyncStatus] = useState(""),
    [syncing, setSyncing] = useState(false);
  const [ruby, setRuby] = useState(data["setting:ruby"] !== false),
    [duration, setDuration] = useState(5),
    [taskMode, setTaskMode] = useState("screen");
  const eventsRef = useRef(store.events);
  eventsRef.current = store.events;
  const alive = useRef(true),
    syncLock = useRef(false);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const reviewEntries = Object.entries(data).filter(
    ([k, v]) => k.startsWith("review:") && v,
  ) as [string, Review][];
  const due = reviewEntries
    .filter(([, r]) => Date.parse(r.due) <= Date.now())
    .sort((a, b) => Date.parse(a[1].due) - Date.parse(b[1].due));
  const completed = units.filter((u) => data[`completed:${u.id}`]);
  const nextUnit = units.find((u) => !data[`completed:${u.id}`]) || units[5];
  const exam = String(data["setting:exam"] || "2026-12-05");
  function notify(s: string) {
    setToast(s);
  }
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(id);
    }
  }, [toast]);
  function go(r: Route) {
    setRoute(r);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function openLesson(id: number) {
    setLessonId(id);
    put("activeLesson", id);
    go("lesson");
  }
  function fav(id: string) {
    put(`favorite:${id}`, !data[`favorite:${id}`]);
  }
  function rate(id: string, n: number) {
    put(
      `review:${id}`,
      schedule(data[`review:${id}`] as Review | undefined, n),
    );
    put(`learned:${id}`, true);
  }
  function startQuiz(ids: string[], timed = false, minutes = 10) {
    const s: QuizSession = {
      id: crypto.randomUUID(),
      ids: shuffled(ids),
      index: 0,
      choice: null,
      submitted: false,
      answers: 0,
      correct: 0,
      finished: false,
      orders: ids.map(() => shuffled([0, 1, 2, 3])),
      timed,
      startedAt: Date.now(),
      limit: minutes * 60000,
    };
    put("quizSession", s);
    go("quiz");
  }
  function startCards(ids: string[], mode = "meaning") {
    if (!ids.length) {
      notify("目前沒有符合條件的字卡。");
      return;
    }
    put("cardSession", {
      id: crypto.randomUUID(),
      ids,
      index: 0,
      flipped: false,
      mode,
      finished: false,
      ratedIds: [],
    } satisfies CardSession);
    go("cards");
  }
  function shortTask() {
    const count = Math.max(3, duration * 2);
    if (taskMode === "audio") {
      const qs = questions
        .filter((q) => q.audio)
        .slice(0, Math.max(1, Math.floor(duration / 2)));
      startQuiz(qs.map((q) => q.id));
      return;
    }
    if (taskMode === "speak") {
      const q = questions.find((q) => q.unit === nextUnit.id && q.audio)!;
      openLesson(q.unit);
      put(`lessonStep:${q.unit}`, 4);
      return;
    }
    const words = due
      .filter(([k]) => k.startsWith("review:v"))
      .map(([k]) => k.slice(7));
    const fresh = vocab
      .filter((v) => v.unit <= 6 && !data[`learned:${v.id}`])
      .map((v) => v.id);
    const ids = [...words, ...(due.length > 20 ? [] : fresh)].slice(0, count);
    if (!ids.length) {
      if (due.length) {
        beginReview();
        return;
      }
      startCards(
        shuffled(vocab.filter((v) => v.unit <= 6).map((v) => v.id)).slice(
          0,
          count,
        ),
      );
      return;
    }
    startCards(ids);
  }
  function beginReview() {
    if (!due.length) {
      go("review");
      return;
    }
    const ids = due.map(([k]) => k.slice(7));
    const cards = ids.filter((id) => id.startsWith("v"));
    if (cards.length) startCards(cards);
    else if (ids.some((id) => id.startsWith("q")))
      startQuiz(ids.filter((id) => id.startsWith("q")));
    else {
      go("review");
      notify("文法與句子待複習已列在下方，請先回想再評分。");
    }
  }
  async function sync() {
    if (!client || !session || syncLock.current) return;
    syncLock.current = true;
    setSyncing(true);
    setSyncStatus("正在同步…");
    try {
      const incoming = await synchronize(
        client,
        session.user.id,
        eventsRef.current,
      );
      if (alive.current) {
        store.merge(incoming);
        setSyncStatus(
          `已同步 · ${new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`,
        );
      }
    } catch (e) {
      if (alive.current)
        setSyncStatus(
          `同步失敗：${e instanceof Error ? e.message : String((e as { message?: string })?.message || e)}。本機紀錄仍保留。`,
        );
    } finally {
      syncLock.current = false;
      if (alive.current) setSyncing(false);
    }
  }
  const fingerprint = store.events
    .map((e) => e.id)
    .sort()
    .join(",");
  useEffect(() => {
    if (!session || !client) return;
    const id = setTimeout(() => void sync(), 1400);
    return () => clearTimeout(id);
  }, [fingerprint, session?.user.id, client]);
  useEffect(() => {
    if (!session) return;
    const refresh = () => void sync();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    const id = setInterval(refresh, 45000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      clearInterval(id);
    };
  }, [session?.user.id, client]);
  const savedQuiz = data["quizSession"] as QuizSession | undefined,
    savedCards = data["cardSession"] as CardSession | undefined;
  const nav = [
    { id: "home", label: "今日學習", icon: Home },
    { id: "courses", label: "考檢定", icon: BookOpen },
    { id: "review", label: "複習中心", icon: Layers3 },
    { id: "progress", label: "學習紀錄", icon: ListChecks },
  ] as const;
  return (
    <RubyContext.Provider value={ruby}>
      <div className="app-shell">
        <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
          >
            <span className="brand-mark">日</span>
            <span>
              日和<span className="brand-sub">HIYORI · JAPANESE</span>
            </span>
          </a>
          <div className="workspace-label">
            我的學習空間 <span>N3</span>
          </div>
          <nav>
            {nav.map((n) => (
              <button
                key={n.id}
                className={
                  route === n.id ||
                  (n.id === "courses" &&
                    ["lesson", "quiz", "cards", "basics"].includes(route))
                    ? "active"
                    : ""
                }
                onClick={() => go(n.id)}
              >
                <n.icon size={19} />
                {n.label}
                {n.id === "review" && due.length > 0 && (
                  <span className="nav-badge">{due.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-rule" />
          <div className="sidebar-label">接下來的旅程</div>
          <div className="future-nav">
            日常日文 <span>後續開放</span>
          </div>
          <div className="future-nav">
            工作日文 <span>後續開放</span>
          </div>
          <div className="exam-card">
            <Target size={21} />
            <div>向 N3 再靠近一點</div>
            <strong>{exam.slice(5).replace("-", " / ")}</strong>
            <p>每天一小步，也算前進。</p>
          </div>
          <div className="sidebar-bottom">
            <button onClick={() => setModal("settings")}>
              <Settings size={18} />
              偏好與資料
            </button>
            <button onClick={() => go("sources")}>
              <BookOpen size={18} />
              教材與來源
            </button>
            <button className="profile" onClick={() => setModal("account")}>
              <span className="avatar">{session ? "私" : "訪"}</span>
              <span>
                {session ? "我的帳號" : "訪客學習"}
                <small>
                  {session ? "管理跨裝置同步" : "尚未登入・僅本機保存"}
                </small>
              </span>
              <ChevronRight size={15} />
            </button>
          </div>
        </aside>
        {mobileMenu && (
          <div
            className="sidebar-overlay"
            onClick={() => setMobileMenu(false)}
          />
        )}
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="mobile-menu icon-button"
                aria-label="開啟選單"
                onClick={() => setMobileMenu(!mobileMenu)}
              >
                <Menu />
              </button>
              <span>我的學習空間</span>
              <ChevronRight size={13} />
              <strong>
                {
                  {
                    home: "今日學習",
                    courses: "考檢定",
                    lesson: lessonId >= 100 ? "基礎補充單元" : "N3 學習單元",
                    review: "複習中心",
                    progress: "學習紀錄",
                    cards: "單字字卡",
                    quiz: "題型練習",
                    sources: "教材與來源",
                    basics: "五十音與動詞變化",
                  }[route]
                }
              </strong>
            </div>
            <div className="top-actions">
              <span className="save-status">
                <span />
                {store.error ? "儲存異常" : "已保存於此裝置"}
              </span>
              <button
                className="icon-button account-entry"
                aria-label="帳號與雲端同步"
                onClick={() => setModal("account")}
              >
                <Cloud size={19} />
                <span>{session ? "帳號與同步" : "登入同步"}</span>
              </button>
              <button
                className={`ruby-toggle ${ruby ? "on" : ""}`}
                onClick={() => {
                  setRuby(!ruby);
                  put("setting:ruby", !ruby);
                }}
                aria-pressed={ruby}
              >
                あ <span>假名</span>
              </button>
            </div>
          </header>
          <main
            id="main-content"
            className={route === "home" ? "dashboard" : ""}
          >
            {store.error && (
              <p className="notice warning" role="alert">
                {store.error}
              </p>
            )}
            {authError && <p className="notice warning">{authError}</p>}
            {route === "home" && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">少しずつ、毎日。</div>
                    <h1>今天，也讓日文進步一點。</h1>
                    <p>不必一次學很多，從適合現在的練習開始。</p>
                  </div>
                  <div className="date-chip">
                    <CalendarDays size={16} />
                    {new Date().toLocaleDateString("zh-TW", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </div>
                </div>
                <div className="dashboard-grid">
                  <section className="hero-card">
                    <div className="hero-copy">
                      <div className="hero-kicker">
                        <span /> JLPT N3 衝刺計畫
                      </div>
                      <h2>
                        把每一段零碎時間，
                        <br />
                        變成前進的力量。
                      </h2>
                      <p>
                        以 N3 為主線，需要時再補充 N4。
                        <br />
                        循序學習、即時練習，記住真正學會的日文。
                      </p>
                      <button
                        className="button light"
                        onClick={() => {
                          if (savedQuiz && !savedQuiz.finished) go("quiz");
                          else if (savedCards && !savedCards.finished)
                            go("cards");
                          else
                            openLesson(
                              Number(data["activeLesson"]) || nextUnit.id,
                            );
                        }}
                      >
                        繼續學習 <ArrowRight size={17} />
                      </button>
                      <div className="hero-bottom">
                        <span>目前進度</span>
                        <span>
                          {completed.length} / 6 單元 ·{" "}
                          {Math.round(
                            units.reduce(
                              (n, u) => n + courseProgress(u.id, data).percent,
                              0,
                            ) / units.length,
                          )}
                          %
                        </span>
                      </div>
                      <div className="progress-track">
                        <i
                          style={{
                            width: `${Math.round(units.reduce((n, u) => n + courseProgress(u.id, data).percent, 0) / units.length)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="hero-art" aria-hidden="true">
                      <span className="vertical-jp">
                        積み重ねる、
                        <br />
                        自分のペースで。
                      </span>
                      <div className="art-sun" />
                      <div className="art-orbit" />
                      <div className="art-card art-card-back">あ</div>
                      <div className="art-card art-card-front">
                        <span>日本語</span>
                        <strong>一歩</strong>
                        <small>いっぽ · 一步</small>
                      </div>
                      <div className="art-lines" />
                      <span className="art-dot" />
                    </div>
                  </section>
                  <section className="review-spot">
                    <div className="section-kicker">
                      <RotateCcw size={17} /> 每一次複習，都是累積
                    </div>
                    <div className="review-number">
                      {due.length}
                      <span>項</span>
                    </div>
                    <h3>今日待複習</h3>
                    <p>
                      {due.length
                        ? "優先鞏固到期與不熟悉的內容。"
                        : "學過的內容，會在適合的時間再相遇。"}
                    </p>
                    <button className="button dark" onClick={beginReview}>
                      開始複習 <ArrowRight size={17} />
                    </button>
                    <span className="tiny-note">依熟悉程度安排間隔複習</span>
                  </section>
                </div>
                <div className="stats-row">
                  <div>
                    <span className="stat-icon sage">
                      <BookOpen size={20} />
                    </span>
                    <span>
                      <small>已學單字</small>
                      <strong>
                        {vocab.filter((v) => data[`learned:${v.id}`]).length}
                        <em> / {vocab.length}</em>
                      </strong>
                    </span>
                  </div>
                  <div>
                    <span className="stat-icon sand">
                      <CircleCheck size={20} />
                    </span>
                    <span>
                      <small>已熟悉單字</small>
                      <strong>
                        {
                          vocab.filter((v) =>
                            mastered(data[`review:${v.id}`] as Review),
                          ).length
                        }
                        <em> 個</em>
                      </strong>
                    </span>
                  </div>
                  <div>
                    <span className="stat-icon rose">
                      <Bookmark size={20} />
                    </span>
                    <span>
                      <small>我的收藏</small>
                      <strong>
                        {
                          Object.entries(data).filter(
                            ([k, v]) => k.startsWith("favorite:") && v,
                          ).length
                        }
                        <em> 項</em>
                      </strong>
                    </span>
                  </div>
                  <div>
                    <span className="stat-icon lavender">
                      <Target size={20} />
                    </span>
                    <span>
                      <small>
                        距離 {exam.slice(5).replace("-", "/")} 目標日
                      </small>
                      <strong>
                        {examDays(exam)}
                        <em> 天</em>
                      </strong>
                    </span>
                  </div>
                </div>
                <section className="quick-section">
                  <div className="section-heading">
                    <div>
                      <h2>現在，有多少時間？</h2>
                      <p>通勤也好，休息也好，選一個剛剛好的任務。</p>
                    </div>
                    <Tag>短時間也能學</Tag>
                  </div>
                  <div className="quick-card">
                    <div className="time-options">
                      {[3, 5, 10].map((n) => (
                        <button
                          key={n}
                          className={duration === n ? "chosen" : ""}
                          onClick={() => setDuration(n)}
                        >
                          <Clock3 size={19} />
                          <strong>{n}</strong> 分鐘
                          {duration === n && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                    <div className="quick-divider" />
                    <div className="task-options">
                      <label htmlFor="task-mode">現在方便怎麼學？</label>
                      <select
                        id="task-mode"
                        value={taskMode}
                        onChange={(e) => setTaskMode(e.target.value)}
                      >
                        <option value="screen">看螢幕 · 字卡回想</option>
                        <option value="audio">先聽音訊 · 聽後選答</option>
                        <option value="speak">方便開口 · 跟讀練習</option>
                      </select>
                    </div>
                    <button className="button dark" onClick={shortTask}>
                      開始 {duration} 分鐘任務 <ArrowRight size={17} />
                    </button>
                  </div>
                  <p className="helper">
                    任務長度為估計，每小段保存進度。聽力仍需看選項作答；跟讀不評分。
                    {due.length > 20 ? " 到期量較多，暫緩新增字卡。" : ""}
                  </p>
                </section>
                <section>
                  <div className="section-heading">
                    <div>
                      <h2>接著，學一點新的</h2>
                      <p>沿著 N3 主線，一步一步建立理解。</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("courses")}
                    >
                      完整課程 <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="course-preview-grid">
                    {units.slice(0, 3).map((u, i) => (
                      <button
                        key={u.id}
                        className="course-preview"
                        onClick={() => openLesson(u.id)}
                      >
                        <div
                          className={`course-illustration illustration-${i}`}
                        >
                          <span>{["予", "知", "選"][i]}</span>
                          <small>LESSON {u.icon}</small>
                          <ArrowUpRight size={18} />
                        </div>
                        <div className="course-preview-body">
                          <div>
                            <Tag>N3</Tag>
                            <span>{u.minutes} 分鐘 · 可分段</span>
                          </div>
                          <h3>{u.title}</h3>
                          <p>{u.subtitle}</p>
                          <CourseProgress id={u.id} store={store} />
                          <div className="course-foot">
                            <span>
                              {data[`completed:${u.id}`]
                                ? "已完成"
                                : u.id === nextUnit.id
                                  ? "建議下一課"
                                  : "自由選讀"}
                            </span>
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
                <div className="bottom-note">
                  <span className="note-icon">日</span>
                  <p>今天記住的一個詞，會成為明天讀懂的一句話。</p>
                  <span>自分のペースで。</span>
                </div>
                <div className="coverage-note">
                  起始教材：6 個 N3 主線單元 · 100 個選詞 · 12 個文法重點 ·{" "}
                  {questions.filter((q) => q.unit <= 6).length}{" "}
                  題主線自編練習；另有 {supplementalLessons.length} 個 N5／N4
                  補充單元，並非完整 N3 題庫。
                  <button onClick={() => go("sources")}>查看範圍與來源</button>
                </div>
              </>
            )}
            {route === "courses" && (
              <Courses
                store={store}
                openLesson={openLesson}
                startQuiz={startQuiz}
                startCards={startCards}
                openBasics={() => go("basics")}
              />
            )}
            {route === "basics" && (
              <BasicsReference
                store={store}
                Audio={AudioPlayer}
                Japanese={JP}
              />
            )}
            {route === "lesson" &&
              (lessonId >= 100 ? (
                <SupplementLesson
                  id={lessonId}
                  store={store}
                  fav={fav}
                  rate={rate}
                  startCards={startCards}
                  startQuiz={startQuiz}
                  openLesson={openLesson}
                />
              ) : (
                <Lesson
                  id={lessonId}
                  store={store}
                  fav={fav}
                  rate={rate}
                  startCards={startCards}
                  startQuiz={startQuiz}
                  openLesson={openLesson}
                  notify={notify}
                />
              ))}
            {route === "cards" &&
              (savedCards ? (
                <Cards
                  key={savedCards.id}
                  session={savedCards}
                  store={store}
                  rate={rate}
                  fav={fav}
                  exit={() => go("review")}
                />
              ) : (
                <Empty title="尚未開始字卡">
                  從課程或複習中心選擇單字開始。
                </Empty>
              ))}
            {route === "quiz" &&
              (savedQuiz ? (
                <Quiz
                  key={savedQuiz.id}
                  session={savedQuiz}
                  store={store}
                  fav={fav}
                  exit={() => go("courses")}
                />
              ) : (
                <Empty title="尚未開始練習">請從課程選擇題型。</Empty>
              ))}
            {route === "review" && (
              <ReviewCenter
                store={store}
                due={due}
                fav={fav}
                rate={rate}
                startCards={startCards}
                startQuiz={startQuiz}
                openLesson={openLesson}
              />
            )}
            {route === "progress" && <Progress store={store} />}
            {route === "sources" && <Sources />}
          </main>
          <footer className="site-footer">
            <span>日和 HIYORI</span>
            <span>每天一點，日文慢慢成為日常。</span>
          </footer>
        </div>
        <nav className="mobile-bottom">
          {nav.map((n) => (
            <button
              key={n.id}
              className={route === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={20} />
              <span>{n.label}</span>
              {n.id === "review" && due.length > 0 && <i />}
            </button>
          ))}
        </nav>
        {toast && (
          <div className="toast" role="status">
            <Check size={17} />
            {toast}
          </div>
        )}
        {modal === "settings" && (
          <Modal title="偏好與資料" close={() => setModal("")}>
            <SettingsPanel store={store} exam={exam} notify={notify} />
          </Modal>
        )}
        {modal === "account" && (
          <Modal title="帳號與跨裝置同步" close={() => setModal("")}>
            <Account
              client={client}
              session={session}
              config={config}
              setConnection={setConnection}
              syncing={syncing}
              syncStatus={syncStatus}
              sync={sync}
            />
          </Modal>
        )}
      </div>
    </RubyContext.Provider>
  );
}
function Courses({
  store,
  openLesson,
  startQuiz,
  startCards,
  openBasics,
}: {
  store: StudyStore;
  openBasics: () => void;
  openLesson: (id: number) => void;
  startQuiz: (ids: string[], timed?: boolean, minutes?: number) => void;
  startCards: (ids: string[], mode?: string) => void;
}) {
  const [level, setLevel] = useState("N3"),
    [type, setType] = useState("全部題型"),
    [minutes, setMinutes] = useState(10),
    [search, setSearch] = useState("");
  const courseQuestions = questions.filter((q) => q.unit <= 6);
  return (
    <>
      <PageHeading
        eyebrow="JLPT · LEARNING PATH"
        title="循著主線，準備 N3。"
        description="N3 優先，遇到不熟的基礎再補上。單元有順序，也能自由選讀。"
      />
      <section className="basics-entry panel">
        <div>
          <Tag>基礎工具</Tag>
          <h2>五十音平假名・片假名／動詞變化</h2>
          <p>完整對照、變化方式、意思、例句與統整表，遇到卡關隨時查。</p>
        </div>
        <button className="button dark" onClick={openBasics}>
          開啟基礎工具 <ArrowRight size={16} />
        </button>
      </section>
      <div className="tabs">
        <button
          className={level === "N3" ? "active" : ""}
          onClick={() => setLevel("N3")}
        >
          N3 主線課程
        </button>
        <button
          className={level === "N4" ? "active" : ""}
          onClick={() => setLevel("N4")}
        >
          N4 基礎補強
        </button>
        <button
          className={level === "N5" ? "active" : ""}
          onClick={() => setLevel("N5")}
        >
          N5 基礎補充
        </button>
      </div>
      {level === "N3" ? (
        <div className="unit-list">
          {units.map((u) => {
            const count = courseQuestions.filter(
              (q) => q.unit === u.id && store.data[`answer:${q.id}`],
            ).length;
            return (
              <button
                key={u.id}
                className="unit-row"
                onClick={() => openLesson(u.id)}
              >
                <span className="unit-no">{u.icon}</span>
                <div className="unit-info">
                  <div>
                    <Tag>N3 主線</Tag>
                    {store.data[`completed:${u.id}`] ? (
                      <Tag tone="green">已完成</Tag>
                    ) : null}
                  </div>
                  <h2>{u.title}</h2>
                  <p>{u.focus}</p>
                  <CourseProgress id={u.id} store={store} />
                  <span className="meta">
                    {u.id > 1
                      ? `前置：單元 ${u.id - 1}（建議，非限制）`
                      : "前置：基本動詞形與助詞"}{" "}
                    · {u.minutes} 分鐘 · {count}/
                    {courseQuestions.filter((q) => q.unit === u.id).length}{" "}
                    題已作答
                  </span>
                </div>
                <ChevronRight size={20} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <SupplementCatalog
            level={level}
            store={store}
            openLesson={openLesson}
          />
          {level === "N4" && (
            <details>
              <summary>原有 N3 按需補強速查</summary>
              <div className="foundations-grid">
                {foundations.map((f) => (
                  <Foundation
                    key={f.id}
                    foundation={f}
                    store={store}
                    openLesson={openLesson}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>按題型練習</h2>
            <p>自編練習，非歷屆試題。計時只評估本次題目，不換算官方分數。</p>
          </div>
          <Target size={23} />
        </div>
        <div className="form-row">
          <label>
            練習範圍
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {["全部題型", ...new Set(courseQuestions.map((q) => q.type))].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </label>
          <label>
            計時長度
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {[5, 10, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m} 分鐘
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="button-row">
          <button
            className="button dark"
            onClick={() =>
              startQuiz(
                courseQuestions
                  .filter((q) => type === "全部題型" || q.type === type)
                  .map((q) => q.id),
              )
            }
          >
            開始練習 <ArrowRight size={16} />
          </button>
          <button
            className="button outline"
            onClick={() =>
              startQuiz(
                courseQuestions
                  .filter((q) => type === "全部題型" || q.type === type)
                  .map((q) => q.id),
                true,
                minutes,
              )
            }
          >
            開始計時練習 <Clock3 size={16} />
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>
          共用單字目錄 <Tag>{vocab.length} 個</Tag>
        </h2>
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="搜尋單字"
            placeholder="搜尋日文、讀音或中文意思"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="word-list">
          {vocab
            .filter((v) => `${v.word}${v.reading}${v.meaning}`.includes(search))
            .map((v) => (
              <button key={v.id} onClick={() => startCards([v.id])}>
                <JP text={v.word} />
                <span>
                  {v.meaning} · {v.unit >= 100 ? "基礎補充" : "N3 主線"}
                </span>
                {store.data[`learned:${v.id}`] ? (
                  <Check size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ))}
        </div>
        {!vocab.some((v) =>
          `${v.word}${v.reading}${v.meaning}`.includes(search),
        ) && <p>沒有符合的單字，試試其他關鍵字。</p>}
      </section>
    </>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function FavoriteButton({
  id,
  store,
  fav,
}: {
  id: string;
  store: StudyStore;
  fav: (id: string) => void;
}) {
  const active = !!store.data[`favorite:${id}`];
  return (
    <button
      className={`favorite-button ${active ? "saved" : ""}`}
      onClick={() => fav(id)}
      aria-label={active ? "取消收藏" : "加入收藏"}
      aria-pressed={active}
    >
      <Bookmark size={18} fill={active ? "currentColor" : "none"} />
      <span>{active ? "已收藏" : "收藏"}</span>
    </button>
  );
}
function Foundation({
  foundation: f,
  store,
  openLesson,
}: {
  foundation: (typeof foundations)[number];
  store: StudyStore;
  openLesson?: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="foundation">
      <button
        className="foundation-title"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          <Tag>N4 補強</Tag>
          <strong>{f.title}</strong>
        </span>
        <ChevronRight className={open ? "rotate" : ""} size={18} />
      </button>
      {open && (
        <div className="foundation-content">
          <p>{f.body}</p>
          <p>
            <JP text={f.example} />
          </p>
          <p className="translation">{f.translation}</p>
          <p className="helper">自編基礎整理，非官方分級。</p>
          {openLesson && (
            <div className="button-row">
              {(
                {
                  f1: [124, 128, 130, 135],
                  f2: [105, 112, 131],
                  f3: [137, 142],
                  f4: [114, 119, 126],
                }[f.id as "f1" | "f2" | "f3" | "f4"] || []
              ).map((id) => (
                <button
                  className="button outline small"
                  key={id}
                  onClick={() => openLesson(id)}
                >
                  補充 {supplementalLessons.find((l) => l.unit === id)?.code}{" "}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          )}
          <button
            className="button outline small"
            onClick={() => store.put(`foundation:${f.id}`, true)}
          >
            {store.data[`foundation:${f.id}`]
              ? "已閱讀，可隨時回顧"
              : "我已閱讀這段補強"}
            <Check size={15} />
          </button>
        </div>
      )}
    </article>
  );
}
function RatingButtons({ onRate }: { onRate: (n: number) => void }) {
  return (
    <div className="rating-buttons">
      {["忘記", "困難", "記得", "容易"].map((s, i) => (
        <button key={s} className={`rating-${i}`} onClick={() => onRate(i)}>
          <strong>{s}</strong>
          <small>
            {["10 分鐘後", "約 1 天後", "依紀錄安排", "較長間隔"][i]}
          </small>
        </button>
      ))}
    </div>
  );
}
function GrammarCard({
  id,
  store,
  fav,
  rate,
}: {
  id: string;
  store: StudyStore;
  fav: (id: string) => void;
  rate: (id: string, n: number) => void;
}) {
  const g = grammar.find((g) => g.id === id)!;
  const [recall, setRecall] = useState(false),
    [show, setShow] = useState(false);
  return (
    <article className="grammar-card">
      <div className="section-heading">
        <div>
          <Tag>文法重點 · 教材整理分級</Tag>
          <h3>
            <JP text={g.title} />
          </h3>
        </div>
        <FavoriteButton id={id} store={store} fav={fav} />
      </div>
      <p>{g.meaning}</p>
      <div className="grammar-connection">
        <strong>接續</strong>
        <span>{g.connection}</span>
      </div>
      <p className="example">
        <JP text={g.example} />
      </p>
      <p className="translation">{g.translation}</p>
      <dl>
        <dt>常見錯誤</dt>
        <dd>{g.note}</dd>
        <dt>相似句型</dt>
        <dd>{g.compare}</dd>
      </dl>
      <div className="button-row">
        <button
          className="text-button"
          onClick={() => {
            setRecall(!recall);
            setShow(false);
          }}
        >
          加入回想複習 <RotateCcw size={14} />
        </button>
        <FavoriteButton id={`s:${id}`} store={store} fav={fav} />
      </div>
      <span className="helper">
        第二個收藏按鈕保存本節例句；可在複習中心選擇「句子」。
      </span>
      {recall && (
        <div className="recall-box">
          <p>先遮住上方內容，回想這個句型的意思、接法與例句。</p>
          {!show ? (
            <button
              className="button outline small"
              onClick={() => setShow(true)}
            >
              我已回想，開始評估
            </button>
          ) : (
            <RatingButtons
              onRate={(n) => {
                rate(id, n);
                setRecall(false);
              }}
            />
          )}
        </div>
      )}
      <p className="source-line">來源：本站自編解說與例句，非官方教材。</p>
    </article>
  );
}
function Lesson({
  id,
  store,
  fav,
  rate,
  startCards,
  startQuiz,
  openLesson,
  notify,
}: {
  id: number;
  store: StudyStore;
  fav: (id: string) => void;
  rate: (id: string, n: number) => void;
  startCards: (ids: string[], mode?: string) => void;
  startQuiz: (ids: string[]) => void;
  openLesson: (id: number) => void;
  notify: (s: string) => void;
}) {
  const unit = units.find((u) => u.id === id)!;
  const step = Number(store.data[`lessonStep:${id}`]) || 0;
  const stages = [
    "開始這一課",
    "單字與漢字",
    "文法重點",
    "閱讀理解",
    "聽力與跟讀",
    "單元練習",
  ];
  const unitWords = vocab.filter((v) => v.unit === id),
    unitQuestions = questions.filter((q) => q.unit === id),
    reading = unitQuestions.find((q) => q.passage)!,
    listening = unitQuestions.find((q) => q.audio)!;
  const [translation, setTranslation] = useState(false);
  useEffect(() => setTranslation(false), [id, step]);
  const done = unitQuestions.filter((q) => store.data[`answer:${q.id}`]).length;
  const sectionSeen = Array.from(
    { length: 5 },
    (_, i) => !!store.data[`seen:${id}:${i}`],
  ).every(Boolean);
  function next() {
    store.put(`seen:${id}:${step}`, true);
    store.put(`lessonStep:${id}`, Math.min(5, step + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <>
      <div className="lesson-heading">
        <Tag>N3 主線 · 單元 {unit.icon}</Tag>
        <h1>{unit.title}</h1>
        <p>{unit.focus}</p>
        <div className="meta">
          {id > 1
            ? `建議先學：單元 ${id - 1}。不鎖課，可自由選讀。`
            : "從這裡開始，不需先完成全部 N4。"}{" "}
          · 每小段自動保存
        </div>
      </div>
      <CourseProgress id={id} store={store} />
      <div className="lesson-steps">
        {stages.map((s, i) => (
          <button
            key={s}
            className={step === i ? "active" : ""}
            onClick={() => store.put(`lessonStep:${id}`, i)}
          >
            <span>
              {store.data[`seen:${id}:${i}`] ? <Check size={13} /> : i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>
      <section className="lesson-body">
        {step === 0 && (
          <>
            <div className="panel">
              <div className="eyebrow">THIS LESSON</div>
              <h2>這一課，你會練習</h2>
              <p>{unit.focus}。</p>
              <div className="lesson-facts">
                <div>
                  <strong>{unitWords.length}</strong>
                  <span>單字</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>文法重點</span>
                </div>
                <div>
                  <strong>{unitQuestions.length}</strong>
                  <span>代表題</span>
                </div>
              </div>
              <p>
                先讀或聽、自己理解，再查看提示與解析。收藏和學會分開記錄，不會因為看過一次就判定熟悉。
              </p>
              <Tag>來源：本站自編練習</Tag>
            </div>
            <h2 className="subheading">需要時，再補一點基礎</h2>
            {foundations
              .filter((f) => unit.foundations.includes(f.id))
              .map((f) => (
                <Foundation
                  key={f.id}
                  foundation={f}
                  store={store}
                  openLesson={openLesson}
                />
              ))}
          </>
        )}
        {step === 1 && (
          <div className="panel">
            <div className="section-heading">
              <h2>先回想，再翻卡</h2>
              <Tag>{unitWords.length} 個選詞</Tag>
            </div>
            <p>選擇回想方式。只有完成自評才會記為已學，熟悉程度另外累積。</p>
            <div className="button-row">
              <button
                className="button dark"
                onClick={() => startCards(unitWords.map((v) => v.id))}
              >
                日文辨義 <Layers3 size={17} />
              </button>
              <button
                className="button outline"
                onClick={() =>
                  startCards(
                    unitWords.map((v) => v.id),
                    "reading",
                  )
                }
              >
                讀音回想
              </button>
              <button
                className="button outline"
                onClick={() =>
                  startCards(
                    unitWords.map((v) => v.id),
                    "audio",
                  )
                }
              >
                聽音辨詞
              </button>
            </div>
            <div className="word-list">
              {unitWords.map((v) => (
                <div className="word-row" key={v.id}>
                  <div>
                    <JP text={v.word} />
                    <small>
                      {v.pos} · {v.meaning}
                    </small>
                  </div>
                  <FavoriteButton id={v.id} store={store} fav={fav} />
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 &&
          grammar
            .filter((g) => g.unit === id)
            .map((g) => (
              <GrammarCard
                key={g.id}
                id={g.id}
                store={store}
                fav={fav}
                rate={rate}
              />
            ))}
        {step === 3 && (
          <div className="panel">
            <div className="section-heading">
              <h2>先讀懂大意</h2>
              <Tag>{reading.type}</Tag>
            </div>
            <p>先不看中文，找出人物、目的、時間與限制條件。</p>
            <div className="passage">
              <JP text={reading.passage!} />
            </div>
            <button
              className="button outline small"
              onClick={() => setTranslation(!translation)}
            >
              {translation ? "隱藏中文" : "查看完整中文"}
            </button>
            {translation && (
              <p className="translation full">{reading.translation}</p>
            )}
            <div className="button-row">
              <button
                className="button dark"
                onClick={() => startQuiz([reading.id])}
              >
                做這篇閱讀題 <ArrowRight size={16} />
              </button>
              <FavoriteButton id={reading.id} store={store} fav={fav} />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="panel">
            <div className="section-heading">
              <h2>先聽，再核對文字</h2>
              <Tag>{listening.type}</Tag>
            </div>
            <AudioPlayer
              key={listening.id}
              text={listening.audio!}
              translation={listening.translation}
            />
            <div className="button-row">
              <button
                className="button dark"
                onClick={() => startQuiz([listening.id])}
              >
                開始聽力作答 <ArrowRight size={16} />
              </button>
              <FavoriteButton id={listening.id} store={store} fav={fav} />
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="panel">
            <div className="section-heading">
              <h2>把理解變成實力</h2>
              <Tag>
                {done} / {unitQuestions.length} 題已作答
              </Tag>
            </div>
            <p>練習後逐題查看解析；答錯的題目會加入錯題本和複習排程。</p>
            <div className="type-chips">
              {unitQuestions.map((q) => (
                <Tag key={q.id}>{q.type}</Tag>
              ))}
            </div>
            <button
              className="button dark"
              onClick={() => startQuiz(unitQuestions.map((q) => q.id))}
            >
              開始單元練習 <ArrowRight size={17} />
            </button>
            <hr />
            <p className="helper">
              單元完成條件：走過前五個學習段落，並作答本單元全部題目。完成不代表已熟悉，熟悉度由後續複習累積。
            </p>
            <button
              className="button outline"
              disabled={!sectionSeen || done < unitQuestions.length}
              onClick={() => {
                store.put(`completed:${id}`, true);
                notify("單元已完成，內容仍可隨時回顧。");
              }}
            >
              {store.data[`completed:${id}`] ? "單元已完成" : "標記單元完成"}
              <CircleCheck size={17} />
            </button>
            {store.data[`completed:${id}`] && id < 6 ? (
              <button
                className="text-button"
                onClick={() => openLesson(id + 1)}
              >
                下一個單元 <ArrowRight size={16} />
              </button>
            ) : null}
            {(!sectionSeen || done < unitQuestions.length) && (
              <p className="helper">
                {!sectionSeen ? "請完成各段落底部的「完成這段」；" : ""}
                {done < unitQuestions.length
                  ? `尚有 ${unitQuestions.length - done} 題未作答。`
                  : ""}
              </p>
            )}
          </div>
        )}
      </section>
      <div className="lesson-bottom">
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => store.put(`lessonStep:${id}`, step - 1)}
        >
          <ArrowLeft size={16} />
          上一段
        </button>
        {step < 5 ? (
          <button className="button dark" onClick={next}>
            完成這段，繼續 <ArrowRight size={16} />
          </button>
        ) : (
          <span className="helper">本段進度已保存</span>
        )}
      </div>
    </>
  );
}
function Cards({
  session: s,
  store,
  rate,
  fav,
  exit,
}: {
  session: CardSession;
  store: StudyStore;
  rate: (id: string, n: number) => void;
  fav: (id: string) => void;
  exit: () => void;
}) {
  const v = vocab.find((v) => v.id === s.ids[s.index]);
  const [practice, setPractice] = useState(false);
  // Legacy sessions advanced only after a rating, so earlier positions were rated.
  const ratedIds = s.ratedIds ?? s.ids.slice(0, s.index);
  const allRated = ratedIds.length === s.ids.length;
  const save = (patch: Partial<CardSession>) =>
    store.put("cardSession", { ...s, ...patch });
  function move(index: number) {
    if (index < 0 || index >= s.ids.length) return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPractice(false);
    save({ index, flipped: false, finished: false, ratedIds });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (s.finished || !v)
    return (
      <div className="session-complete">
        <CircleCheck size={48} />
        <Tag>字卡回想已完成</Tag>
        <h1>又多累積了一點。</h1>
        <p>已完成 {s.ids.length} 張字卡的自評，下一次複習已依表現安排。</p>
        <p className="helper">翻卡不代表熟悉；需多次回想與間隔累積。</p>
        <button className="button dark" onClick={exit}>
          查看複習中心 <ArrowRight size={16} />
        </button>
        <button className="button outline" onClick={() => move(0)}>
          回看這組字卡
        </button>
      </div>
    );
  return (
    <div className="study-session">
      <div className="section-heading">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={16} />
          暫停，保留進度
        </button>
        <span className="meta">
          {s.index + 1} / {s.ids.length}
        </span>
      </div>
      <div className="card-navigation" aria-label="字卡切換">
        <button
          className="button outline"
          disabled={s.index === 0}
          onClick={() => move(s.index - 1)}
        >
          <ArrowLeft size={16} />
          上一張
        </button>
        <label>
          跳至字卡
          <select
            aria-label="跳至字卡"
            value={s.index}
            onChange={(e) => move(Number(e.target.value))}
          >
            {s.ids.map((id, i) => (
              <option key={id} value={i}>
                第 {i + 1} 張{ratedIds.includes(id) ? " · 已自評" : ""}
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
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="helper">
        已自評 {ratedIds.length} / {s.ids.length}{" "}
        張。前後切換、跳卡和翻卡不會標記學會。
      </p>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="字卡自評進度"
        aria-valuemin={0}
        aria-valuemax={s.ids.length}
        aria-valuenow={ratedIds.length}
      >
        <i style={{ width: `${(ratedIds.length / s.ids.length) * 100}%` }} />
      </div>
      <div className="flashcard">
        <div className="section-heading">
          <Tag>
            {s.mode === "reading"
              ? "讀音回想"
              : s.mode === "audio"
                ? "聽音辨詞"
                : "日文辨義"}
          </Tag>
          <FavoriteButton id={v.id} store={store} fav={fav} />
        </div>
        <div className="flashcard-front">
          {s.mode === "audio" && !s.flipped ? (
            <>
              <Headphones size={42} />
              <p>聽聲音，回想是哪個詞。</p>
              <AudioPlayer key={v.id} text={v.word} revealAllowed={false} />
            </>
          ) : (
            <>
              <p className="helper">
                {s.mode === "reading"
                  ? "試著說出這個詞的讀音。"
                  : "先回想意思，不急著看答案。"}
              </p>
              <h1>
                <JP text={v.word} ruby={s.flipped} />
              </h1>
              {s.flipped && (
                <p className="reading" lang="ja">
                  {v.reading}
                </p>
              )}
            </>
          )}
        </div>
        {!s.flipped ? (
          <button
            className="button dark flip-button"
            onClick={() => save({ flipped: true })}
          >
            翻卡看答案 <RotateCcw size={17} />
          </button>
        ) : (
          <div className="flashcard-back">
            <Tag>{v.pos}</Tag>
            <h2>{v.meaning}</h2>
            {s.mode === "audio" && (
              <p>
                <JP text={v.word} />
              </p>
            )}
            <p className="example">
              <JP text={v.sentence} />
            </p>
            <p className="translation">{v.translation}</p>
            <AudioPlayer
              key={v.id + "example"}
              text={v.word + "。" + v.sentence}
              translation={v.translation}
            />
            <details>
              <summary>搭配與易混淆重點</summary>
              <p>
                <JP text={v.collocation} />
              </p>
              <p>{confusion(v)}</p>
            </details>
            <p className="source-line">
              {v.source} · {v.level}
            </p>
            <p className="helper">這次回想的感覺如何？請依翻卡前的表現評估。</p>
            {allRated ? (
              <p className="notice subtle">
                這組字卡已自評完成，目前是回看模式；切換字卡不改變複習排程。
              </p>
            ) : (
              <RatingButtons
                onRate={(n) => {
                  rate(v.id, n);
                  const nextRated = [...new Set([...ratedIds, v.id])];
                  const finished = nextRated.length === s.ids.length;
                  const next =
                    s.index + 1 < s.ids.length
                      ? s.index + 1
                      : s.ids.findIndex((id) => !nextRated.includes(id));
                  save({
                    index: finished ? s.ids.length : next,
                    flipped: false,
                    finished,
                    ratedIds: nextRated,
                  });
                  setPractice(false);
                }}
              />
            )}
            <button
              className="text-button"
              onClick={() => setPractice(!practice)}
            >
              看看這個詞的句中理解練習 <ChevronRight size={14} />
            </button>
            {practice && <WordPractice key={v.id} word={v} store={store} />}
          </div>
        )}
      </div>
    </div>
  );
}
function confusion(v: Vocab) {
  return v.confusion;
}
function WordPractice({ word, store }: { word: Vocab; store: StudyStore }) {
  const [choice, setChoice] = useState<number | null>(null);
  const options = useMemo(
    () =>
      shuffled([
        word,
        ...shuffled(
          vocab.filter((v) => v.id !== word.id && v.unit !== word.unit),
        ).slice(0, 3),
      ]),
    [word.id],
  );
  const key = `wordAnswer:${word.id}`;
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="word-practice">
      <p>
        <JP text={word.sentence} />
      </p>
      <h4>句中的「{word.word}」是什麼意思？</h4>
      <div className="options compact">
        {options.map((v, i) => (
          <button
            key={v.id}
            className={choice === i ? "selected" : ""}
            disabled={submitted}
            onClick={() => setChoice(i)}
          >
            {v.meaning}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button
          className="button outline small"
          disabled={choice === null}
          onClick={() => {
            setSubmitted(true);
            const correct = options[choice!].id === word.id;
            store.put(key, { correct, at: new Date().toISOString() });
            if (!correct) {
              store.put(
                `review:${word.id}`,
                schedule(
                  store.data[`review:${word.id}`] as Review | undefined,
                  0,
                ),
              );
              store.put(`wordMistake:${word.id}`, {
                active: true,
                selectedMeaning: options[choice!].meaning,
                at: new Date().toISOString(),
              });
            } else if (store.data[`wordMistake:${word.id}`])
              store.put(`wordMistake:${word.id}`, {
                ...(store.data[`wordMistake:${word.id}`] as object),
                active: false,
              });
          }}
        >
          確認答案
        </button>
      ) : (
        <p className="answer-explanation">
          {options[choice!].id === word.id ? "答對了。" : "再看一次語境。"}「
          {word.word}」在這句表示「{word.meaning}」。完整翻譯：
          {word.translation} {confusion(word)}
        </p>
      )}
    </div>
  );
}
function Quiz({
  session: s,
  store,
  fav,
  exit,
}: {
  session: QuizSession;
  store: StudyStore;
  fav: (id: string) => void;
  exit: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!s.timed || s.finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [s.timed, s.finished]);
  const remaining = Math.max(0, s.limit - (now - s.startedAt));
  const expired = s.timed && remaining === 0;
  const q = questions.find((q) => q.id === s.ids[s.index]);
  useEffect(() => {
    if (expired && !s.finished)
      store.put("quizSession", { ...s, finished: true });
  }, [expired, s.finished]);
  const save = (patch: Partial<QuizSession>) =>
    store.put("quizSession", { ...s, ...patch });
  if (s.finished || !q)
    return (
      <div className="session-complete">
        <CircleCheck size={48} />
        <Tag>{expired ? "計時結束" : "本次練習完成"}</Tag>
        <h1>理解，比答對更重要。</h1>
        <div className="result-score">
          {s.correct}
          <span> / {s.answers} 題答對</span>
        </div>
        <p>
          本次範圍 {s.ids.length} 題，已作答 {s.answers} 題，未作答{" "}
          {s.ids.length - s.answers} 題。
        </p>
        <p className="helper">
          自編練習結果，不換算 JLPT 分數。錯題與下次複習時間已保存。
        </p>
        <div className="result-list">
          {s.ids.map((id) => {
            const item = questions.find((q) => q.id === id)!;
            const a = store.data[`answer:${id}`] as
              { correct: boolean } | undefined;
            return (
              <div key={id}>
                <span>{item.type}</span>
                <span>
                  {a
                    ? a.correct
                      ? "最近一次答對"
                      : "最近一次答錯"
                    : "尚未作答"}
                </span>
              </div>
            );
          })}
        </div>
        <button className="button dark" onClick={exit}>
          返回課程 <ArrowRight size={16} />
        </button>
      </div>
    );
  const order = s.orders[s.index] || [0, 1, 2, 3];
  function submit() {
    if (s.choice === null || s.submitted || expired) return;
    const selected = order[s.choice];
    const correct = selected === q!.answer;
    const at = new Date().toISOString();
    store.put(`answer:${q!.id}`, {
      selected,
      correct,
      at,
      type: q!.type,
      unit: q!.unit,
    });
    store.put(
      `review:${q!.id}`,
      schedule(
        store.data[`review:${q!.id}`] as Review | undefined,
        correct ? 2 : 0,
      ),
    );
    if (!correct) {
      store.put(`mistake:${q!.id}`, { active: true, selected, at });
      for (const id of q!.related)
        if (id.startsWith("g"))
          store.put(
            `review:${id}`,
            schedule(store.data[`review:${id}`] as Review | undefined, 0),
          );
    } else if (store.data[`mistake:${q!.id}`])
      store.put(`mistake:${q!.id}`, {
        ...(store.data[`mistake:${q!.id}`] as object),
        active: false,
      });
    save({
      submitted: true,
      answers: s.answers + 1,
      correct: s.correct + (correct ? 1 : 0),
    });
  }
  return (
    <div className="study-session">
      <div className="section-heading">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={16} />
          暫停，保留進度
        </button>
        <span className="meta">
          {s.index + 1} / {s.ids.length}
          {s.timed &&
            ` · 剩餘 ${Math.floor(remaining / 60000)}:${String(Math.floor(remaining / 1000) % 60).padStart(2, "0")}`}
        </span>
      </div>
      <div className="progress-track">
        <i style={{ width: `${(s.index / s.ids.length) * 100}%` }} />
      </div>
      <article className="question-card">
        <div className="section-heading">
          <Tag>{q.type}</Tag>
          <FavoriteButton id={q.id} store={store} fav={fav} />
        </div>
        <p className="source-line">
          自編練習題 · 參考 JLPT 題型形式 · 非歷屆試題
        </p>
        {q.passage && (
          <div className="passage">
            <JP text={q.passage} ruby={s.submitted} />
          </div>
        )}
        {q.audio && (
          <AudioPlayer
            key={q.id}
            text={q.audio}
            translation={q.translation}
            revealAllowed={s.submitted}
          />
        )}
        <h2 className="question-prompt">
          <JP text={q.prompt} ruby={s.submitted} />
        </h2>
        <div className="options">
          {order.map((oi, i) => (
            <button
              key={i}
              disabled={s.submitted}
              onClick={() => save({ choice: i })}
              className={`${s.choice === i ? "selected" : ""} ${s.submitted && oi === q.answer ? "correct" : ""} ${s.submitted && s.choice === i && oi !== q.answer ? "incorrect" : ""}`}
            >
              <span className="option-number">{i + 1}</span>
              <JP text={q.options[oi]} ruby={s.submitted} />
              {s.submitted && oi === q.answer && <Check size={18} />}
            </button>
          ))}
        </div>
        {!s.submitted ? (
          <button
            className="button dark full-width"
            disabled={s.choice === null}
            onClick={submit}
          >
            確認答案
          </button>
        ) : (
          <div className="answer-panel" aria-live="polite">
            <div className="answer-heading">
              {order[s.choice!] === q.answer ? (
                <>
                  <Check size={20} />
                  答對了，看看為什麼。
                </>
              ) : (
                <>
                  <RotateCcw size={20} />
                  這題值得再練一次。
                </>
              )}
            </div>
            <p>
              <strong>正確答案：</strong>
              <JP text={q.options[q.answer]} />
            </p>
            <p>{q.explanation}</p>
            <div className="trap-note">
              <strong>容易混淆</strong>
              <p>{q.trap}</p>
            </div>
            {q.translation && (
              <p className="translation full">完整中文：{q.translation}</p>
            )}
            {q.audio && (
              <div className="passage">
                <JP text={q.audio} />
              </div>
            )}
            <div className="related-links">
              {q.related.map((id) => (
                <Tag key={id}>
                  {vocab.find((v) => v.id === id)?.word ||
                    grammar.find((g) => g.id === id)?.title ||
                    id}
                </Tag>
              ))}
            </div>
            <button
              className="button dark full-width"
              onClick={() =>
                save(
                  s.index + 1 >= s.ids.length
                    ? { finished: true }
                    : { index: s.index + 1, choice: null, submitted: false },
                )
              }
            >
              {s.index + 1 >= s.ids.length ? "查看本次結果" : "下一題"}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
function ReviewCenter({
  store,
  due,
  fav,
  rate,
  startCards,
  startQuiz,
  openLesson,
}: {
  store: StudyStore;
  due: [string, Review][];
  fav: (id: string) => void;
  rate: (id: string, n: number) => void;
  startCards: (ids: string[], mode?: string) => void;
  startQuiz: (ids: string[]) => void;
  openLesson: (id: number) => void;
}) {
  const [tab, setTab] = useState("今日待複習"),
    [scope, setScope] = useState("all"),
    [unit, setUnit] = useState("all"),
    [showResolved, setShowResolved] = useState(false);
  const allIds = [
    ...vocab.map((v) => v.id),
    ...grammar.map((g) => g.id),
    ...grammar.map((g) => "s:" + g.id),
    ...questions.map((q) => q.id),
  ];
  const ids = allIds.filter((id) => {
    const category = id.startsWith("v")
      ? "word"
      : id.startsWith("s:")
        ? "sentence"
        : id.startsWith("g")
          ? "grammar"
          : "question";
    const itemUnit =
      vocab.find((v) => v.id === id)?.unit ||
      grammar.find((g) => g.id === id.replace("s:", ""))?.unit ||
      questions.find((q) => q.id === id)?.unit;
    if (scope !== "all" && scope !== category) return false;
    if (unit !== "all" && itemUnit !== Number(unit)) return false;
    if (tab === "今日待複習") return due.some(([k]) => k === `review:${id}`);
    if (tab === "我的收藏") return !!store.data[`favorite:${id}`];
    if (tab === "錯題本") {
      const m = (store.data[`mistake:${id}`] ||
        store.data[`wordMistake:${id}`]) as { active: boolean } | undefined;
      return !!m && (showResolved || m.active);
    }
    return true;
  });
  return (
    <>
      <PageHeading
        eyebrow="REVIEW · MAKE IT STICK"
        title="讓學過的，留在記憶裡。"
        description="系統安排與手動選擇都保留。先回想，再看答案，依真實表現調整間隔。"
      />
      <div className="tabs">
        {["今日待複習", "我的收藏", "錯題本", "課程回顧"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "今日待複習" && <span>{due.length}</span>}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <label>
          內容
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="all">全部內容</option>
            <option value="word">單字</option>
            <option value="grammar">文法</option>
            <option value="sentence">句子</option>
            <option value="question">題目</option>
          </select>
        </label>
        <label>
          單元
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">全部單元</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.icon} {u.title}
              </option>
            ))}
            <optgroup label="N5／N4 講義補充">
              {supplementalLessons.map((l) => (
                <option key={l.unit} value={l.unit}>
                  {l.code} {l.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        {tab === "錯題本" && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            顯示已改正題目
          </label>
        )}
        <span className="meta">{ids.length} 項</span>
      </div>
      {ids.length > 0 && (
        <div className="button-row review-batch">
          {ids.some((id) => id.startsWith("v")) && (
            <button
              className="button dark"
              onClick={() => startCards(ids.filter((id) => id.startsWith("v")))}
            >
              複習這些字卡 <Layers3 size={17} />
            </button>
          )}
          {ids.some((id) => id.startsWith("q")) && (
            <button
              className="button outline"
              onClick={() => startQuiz(ids.filter((id) => id.startsWith("q")))}
            >
              練習這些題目 <Target size={17} />
            </button>
          )}
        </div>
      )}
      {!ids.length ? (
        <Empty
          title={
            tab === "今日待複習" ? "目前沒有到期內容" : "目前沒有符合的內容"
          }
        >
          {tab === "今日待複習"
            ? "完成學習與自評後，這裡會依間隔排程出現內容。也可切到課程回顧自行選擇。"
            : "可從課程收藏內容，或調整篩選條件。"}
        </Empty>
      ) : (
        <div className="review-list">
          {ids.map((id) => {
            const word = vocab.find((v) => v.id === id),
              g = grammar.find((g) => g.id === id.replace("s:", "")),
              q = questions.find((q) => q.id === id),
              r = store.data[`review:${id}`] as Review | undefined;
            const mistake = store.data[`mistake:${id}`] as
              { active: boolean; selected: number; at: string } | undefined;
            return (
              <article key={id} className="review-item">
                <div className="section-heading">
                  <div>
                    <Tag>
                      {word
                        ? "單字"
                        : id.startsWith("s:")
                          ? "句子"
                          : g
                            ? "文法"
                            : q?.type}
                    </Tag>
                    <h3>
                      {word ? (
                        <JP text={word.word} />
                      ) : g ? (
                        <JP text={id.startsWith("s:") ? g.example : g.title} />
                      ) : (
                        <JP text={q!.prompt} ruby={false} />
                      )}
                    </h3>
                  </div>
                  <FavoriteButton id={id} store={store} fav={fav} />
                </div>
                {r && (
                  <p className="meta">
                    {mastered(r) ? "已熟悉" : "持續鞏固中"} · 複習 {r.reviews}{" "}
                    次 · 下次{" "}
                    {new Date(r.due).toLocaleString("zh-TW", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {word ? (
                  <>
                    <p>{word.meaning}</p>
                    {store.data[`wordMistake:${id}`] ? (
                      <details>
                        <summary>查看句中理解的錯誤紀錄</summary>
                        <p>
                          上次選擇：
                          {
                            (
                              store.data[`wordMistake:${id}`] as {
                                selectedMeaning: string;
                              }
                            ).selectedMeaning
                          }
                        </p>
                        <p>
                          本詞正解：{word.meaning}。{word.confusion}
                        </p>
                        <p className="translation">{word.translation}</p>
                      </details>
                    ) : null}
                    <button
                      className="text-button"
                      onClick={() => startCards([id])}
                    >
                      開始回想 <ArrowRight size={15} />
                    </button>
                  </>
                ) : g ? (
                  <RecallItem
                    id={id}
                    grammarId={g.id}
                    sentence={id.startsWith("s:")}
                    rate={rate}
                  />
                ) : (
                  <>
                    <p className="source-line">自編練習，非歷屆試題</p>
                    {mistake && (
                      <details>
                        <summary>
                          {mistake.active
                            ? "查看上次錯誤與解析"
                            : "已改正・查看錯誤紀錄"}
                        </summary>
                        <p>
                          上次答錯選項：
                          <JP text={q!.options[mistake.selected]} />
                        </p>
                        <p>
                          正確答案：
                          <JP text={q!.options[q!.answer]} />
                        </p>
                        <p>{q!.explanation}</p>
                        <p>{q!.trap}</p>
                        <p className="translation">{q!.translation}</p>
                        <p className="helper">
                          錯誤時間：
                          {new Date(mistake.at).toLocaleString("zh-TW")}
                        </p>
                      </details>
                    )}
                    <div className="button-row">
                      <button
                        className="button outline small"
                        onClick={() => startQuiz([id])}
                      >
                        重新作答
                      </button>
                      <button
                        className="text-button"
                        onClick={() => openLesson(q!.unit)}
                      >
                        回到補強單元 <ArrowRight size={15} />
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
      <div className="notice subtle">
        熟悉需至少連續 3 次成功回想，且複習間隔達 21
        天。收藏不影響熟悉程度；答錯題會在約 10 分鐘後再安排。
      </div>
    </>
  );
}
function RecallItem({
  id,
  grammarId,
  sentence,
  rate,
}: {
  id: string;
  grammarId: string;
  sentence: boolean;
  rate: (id: string, n: number) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const g = grammar.find((g) => g.id === grammarId)!;
  return (
    <div>
      <p className="helper">
        {sentence
          ? "回想句意、讀音與適用情境。"
          : "回想意思、接續和相似句型的差別。"}
      </p>
      {!revealed ? (
        <button
          className="button outline small"
          onClick={() => setRevealed(true)}
        >
          查看答案
        </button>
      ) : (
        <>
          <p>{sentence ? g.translation : g.meaning}</p>
          <p>{g.connection}</p>
          <p>{g.note}</p>
          <p>{g.compare}</p>
          <RatingButtons
            onRate={(n) => {
              rate(id, n);
              setRevealed(false);
            }}
          />
        </>
      )}
    </div>
  );
}
function Progress({ store }: { store: StudyStore }) {
  const [track, setTrack] = useState("N3");
  const scopeQuestions = questions.filter((q) =>
    track === "N3" ? q.unit <= 6 : q.unit >= 100,
  );
  const scopeUnits =
    track === "N3"
      ? units
      : supplementalLessons.map((l) => ({
          id: l.unit,
          title: l.title,
          icon: l.code,
        }));
  const answers = scopeQuestions.flatMap((q) => {
    const a = store.data[`answer:${q.id}`] as { correct: boolean } | undefined;
    return a ? [{ ...q, correct: a.correct }] : [];
  });
  const score = (arr: typeof answers) =>
    arr.length
      ? Math.round((arr.filter((a) => a.correct).length / arr.length) * 100)
      : 0;
  const groups = [
    [
      "單字與漢字",
      answers.filter((q) =>
        ["漢字讀音", "漢字寫法", "依文意選詞", "近義替換", "用法"].includes(
          q.type,
        ),
      ),
    ],
    [
      "文法",
      answers.filter((q) =>
        ["文法選擇", "句子排序", "文章文法"].includes(q.type),
      ),
    ],
    ["閱讀", answers.filter((q) => q.type.startsWith("閱讀"))],
    ["聽力", answers.filter((q) => q.type.startsWith("聽力"))],
  ] as [string, typeof answers][];
  const scopeIds = new Set(scopeQuestions.map((q) => `answer:${q.id}`));
  const attempts = store.events.filter((e) => scopeIds.has(e.key));
  const days = new Set(
    attempts.map((e) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(
        new Date(e.at),
      ),
    ),
  );
  return (
    <>
      <PageHeading
        eyebrow="PROGRESS · YOUR OWN PACE"
        title="看見累積，也看見下一步。"
        description="完成量與理解程度分開看。以下依本站練習紀錄整理，不預測 JLPT 成績。"
      />
      <div className="tabs">
        <button
          className={track === "N3" ? "active" : ""}
          onClick={() => setTrack("N3")}
        >
          N3 衝刺
        </button>
        <button
          className={track === "基礎" ? "active" : ""}
          onClick={() => setTrack("基礎")}
        >
          N5／N4 補充
        </button>
      </div>
      <div className="stats-row progress-stats">
        <div>
          <span className="stat-icon sage">
            <ListChecks />
          </span>
          <span>
            <small>最近作答正確率</small>
            <strong>{answers.length ? score(answers) + "%" : "—"}</strong>
          </span>
        </div>
        <div>
          <span className="stat-icon sand">
            <BookOpen />
          </span>
          <span>
            <small>已作答題目</small>
            <strong>
              {answers.length}
              <em> / {scopeQuestions.length}</em>
            </strong>
          </span>
        </div>
        <div>
          <span className="stat-icon rose">
            <Flame />
          </span>
          <span>
            <small>有作答的天數</small>
            <strong>
              {days.size}
              <em> 天</em>
            </strong>
          </span>
        </div>
        <div>
          <span className="stat-icon lavender">
            <Bookmark />
          </span>
          <span>
            <small>目前未改正錯題</small>
            <strong>
              {
                Object.entries(store.data).filter(
                  ([k, v]) =>
                    (k.startsWith("mistake:") ||
                      k.startsWith("wordMistake:")) &&
                    (v as { active: boolean }).active,
                ).length
              }
            </strong>
          </span>
        </div>
      </div>
      <section className="panel">
        <h2>能力面向</h2>
        <div className="ability-grid">
          {groups.map(([name, arr]) => (
            <div className="ability" key={name}>
              <div>
                <strong>{name}</strong>
                <span>{arr.length < 3 ? "樣本不足" : score(arr) + "%"}</span>
              </div>
              <div className="progress-track">
                <i style={{ width: `${score(arr)}%` }} />
              </div>
              <p>
                {arr.filter((q) => q.correct).length} / {arr.length}{" "}
                題最近一次答對
                {arr.length >= 3 && score(arr) < 70 ? " · 建議優先複習" : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>各題型表現</h2>
        <div className="performance-table">
          {[...new Set(scopeQuestions.map((q) => q.type))].map((type) => {
            const a = answers.filter((q) => q.type === type);
            return (
              <div key={type}>
                <span>{type}</span>
                <span>
                  {a.filter((q) => q.correct).length} / {a.length} 題
                </span>
                <Tag>{a.length < 3 ? "樣本不足" : score(a) + "%"}</Tag>
              </div>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <h2>單元回顧</h2>
        {scopeUnits.map((u) => (
          <div className="unit-progress" key={u.id}>
            <strong>
              {u.icon} {u.title}
            </strong>
            <span>
              {store.data[`completed:${u.id}`] ? "已完成" : "學習中／尚未開始"}
            </span>
            <span>
              {
                scopeQuestions.filter(
                  (q) => q.unit === u.id && store.data[`answer:${q.id}`],
                ).length
              }{" "}
              / {scopeQuestions.filter((q) => q.unit === u.id).length} 題
            </span>
          </div>
        ))}
      </section>
    </>
  );
}
function Sources() {
  return (
    <>
      <PageHeading
        eyebrow="CONTENT · TRANSPARENCY"
        title="知道自己正在學什麼。"
        description="教材範圍、來源與限制都公開。起始教材並不等於完整 N3 考試範圍。"
      />
      <section className="panel">
        <h2>目前覆蓋範圍</h2>
        <div className="lesson-facts">
          <div>
            <strong>{vocab.length}</strong>
            <span>共用單字（含基礎）</span>
          </div>
          <div>
            <strong>{grammar.length}</strong>
            <span>文法／基礎重點</span>
          </div>
          <div>
            <strong>{questions.length}</strong>
            <span>自編題目</span>
          </div>
        </div>
        <p>
          6 個循序單元、4 個 N4 按需補強小節、8 篇閱讀及 6
          組合成語音練習。包含漢字讀音、漢字寫法、依文意選詞、近義替換、用法、文法選擇、句子排序、文章文法、閱讀與聽力的代表形式。
        </p>
        <p>
          目前包含短文、較長文章與資訊查找的起始練習，尚未涵蓋完整考試閱讀範圍與模擬考。各題型題數有限，不應用來判定已達
          N3 或預測分數。
        </p>
        <p>
          單字為主線主題選詞，包含必要基礎詞，並非每一詞都屬 N3
          專有。文法分級為教材整理；例如「ておく」「てもらう」是主線所需的基礎複習。JLPT
          未提供可據以宣稱完整覆蓋的官方詞彙與文法清單。
        </p>
      </section>
      <section className="panel">
        <h2>本次講義補充</h2>
        <p>
          已依使用者提供的 49 份講義（780 頁）的課綱，重新編寫 49
          個濃縮補充單元、98 題練習與 96
          個新詞卡。每課包含解說、接續、常見錯誤、兩組例句與翻譯、單字及兩題練習。這不是原講義全部內容的數位重製。
        </p>
        <p>
          GL02 未提供，目錄不宣稱連續完整。N5／N4
          為本站學習導航分級，部分後段主題跨入
          N3；原作者及完整授權資訊以原講義為準。原始
          PDF、原題目與音訊不放入公開網站。自編內容尚未經教師審訂。
        </p>
        <details>
          <summary>查看各課參考檔名與頁數</summary>
          {supplementalLessons.map((l) => (
            <div className="source-entry" key={l.unit}>
              <strong>
                {l.code} {l.title}
              </strong>
              <p>
                {l.source.file} · 原檔 {l.source.pages} 頁 · 課綱參考第 1 頁
              </p>
            </div>
          ))}
        </details>
      </section>
      <section className="panel">
        <h2>來源與使用方式</h2>
        {sourceLinks.map((s) => (
          <div className="source-entry" key={s.title}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
                <ArrowUpRight size={15} />
              </a>
            ) : (
              <strong>{s.title}</strong>
            )}
            <p>{s.note}</p>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>編寫、讀音與音訊說明</h2>
        <p>
          本站釋義、例句、翻譯、文法解說與題目為本次製作的自編內容，尚未經日語教師或母語者審訂。不得宣稱為歷屆試題、官方教材或官方分級。正式備考應搭配官方樣題及更多完整教材。
        </p>
        <p>
          平假名提示由 Kuromoji／IPADIC
          產生初稿，單字詞頭採教材指定讀音；自動斷詞在專名、多音字與句型上仍可能有誤。發現疑義應核對字典與原文。
        </p>
        <p>
          音訊使用瀏覽器／作業系統日文合成語音，需要裝置已安裝日文語音。沒有預錄真人音訊；不提供錄音評分，也不把播放完成當作學會。
        </p>
        <p>
          尚未串接 AI 批改、動畫、歌曲或第三方影音；沒有使用固定回覆模擬 AI。
        </p>
      </section>
    </>
  );
}
function SettingsPanel({
  store,
  exam,
  notify,
}: {
  store: StudyStore;
  exam: string;
  notify: (s: string) => void;
}) {
  const [date, setDate] = useState(exam),
    [message, setMessage] = useState("");
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "hiyori-v1",
            exportedAt: new Date().toISOString(),
            events: store.events,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hiyori-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    notify("已匯出學習紀錄，不含登入憑證。");
  }
  async function importData(file?: File) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage("檔案過大，請使用 20 MB 以下的備份。");
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      if (
        backup.format !== "hiyori-v1" ||
        !Array.isArray(backup.events) ||
        !backup.events.every(isEvent)
      )
        throw Error();
      store.merge(backup.events);
      setMessage(
        `已合併 ${backup.events.length} 筆事件。重複事件不會重複計算。`,
      );
    } catch {
      setMessage("檔案格式不正確，沒有匯入。請選擇本站匯出的 JSON 備份。");
    }
  }
  return (
    <>
      <p className="helper">
        日期是個人備考目標，不代表官方考試日期。預設將你提供的 12/05 記為
        2026/12/05，可在此調整。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!date) return;
          store.put("setting:exam", date);
          notify("備考目標日已保存。");
        }}
      >
        <label>
          備考目標日
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="button dark small" type="submit">
          保存日期
        </button>
      </form>
      <hr />
      <h3>資料備份與還原</h3>
      <p>
        訪客與登入帳號的紀錄分開儲存。需要搬移時，可先匯出，再在目標帳號匯入；匯入會合併，不刪除原有紀錄。
      </p>
      <div className="button-row">
        <button className="button outline small" onClick={exportData}>
          <Download size={16} />
          匯出 JSON
        </button>
        <label className="button outline small file-button">
          <Upload size={16} />
          匯入備份
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => void importData(e.target.files?.[0])}
          />
        </label>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <hr />
      <h3>保存與同步</h3>
      <p>
        每次作答、自評與收藏都先寫入此裝置。登入並完成雲端設定後會自動同步，開啟另一裝置時使用同一帳號。離線學習與安裝功能尚未提供。
      </p>
      <p className="helper">
        本機儲存並非永久備份，清除網站資料會移除本機紀錄。公共裝置使用後請登出；必要時也清除此網站資料。
      </p>
    </>
  );
}
function Account({
  client,
  session,
  config,
  setConnection,
  syncing,
  syncStatus,
  sync,
}: {
  client: SupabaseClient | null;
  session: Session | null;
  config: { url: string; key: string };
  setConnection: (url: string, key: string) => void;
  syncing: boolean;
  syncStatus: string;
  sync: () => Promise<void>;
}) {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [url, setUrl] = useState(config.url),
    [key, setKey] = useState(config.key),
    [token, setToken] = useState(""),
    [sent, setSent] = useState(false);
  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: location.origin + location.pathname },
      });
      if (error) throw error;
      setSent(true);
      setMessage(
        "登入郵件已寄出。請在目前這台裝置開啟最新一封郵件並點擊確認／登入連結；收到郵件還不代表已登入。若郵件含驗證碼，可直接在下方輸入。",
      );
    } catch (e) {
      setMessage("無法寄出登入郵件：" + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return;
    setBusy(true);
    try {
      const { error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });
      if (error) throw error;
      setMessage("登入成功。");
    } catch (e) {
      setMessage("驗證失敗：" + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function configure(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (key.startsWith("sb_secret_")) throw Error("不可使用私密金鑰");
      if (key.split(".").length === 3) {
        const payload = JSON.parse(
          atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (payload.role === "service_role")
          throw Error("不可使用 service_role 金鑰");
      }
      if (!connectCloud(url.trim(), key.trim()))
        throw Error("請確認 HTTPS 專案網址及公開金鑰");
      setConnection(url.trim(), key.trim());
      setMessage("已保存公開連線設定。請登入，再確認同步是否成功。");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <>
      {session ? (
        <>
          <div className="account-summary">
            <span className="avatar">私</span>
            <div>
              <strong>已登入</strong>
              <p>{session.user.email}</p>
            </div>
            <Tag tone="green">個人帳號</Tag>
          </div>
          <p>
            同一帳號可在手機與電腦同步。若顯示失敗，資料仍保存在此裝置，待連線恢復再重試。
          </p>
          <p
            className={
              syncStatus.includes("失敗") ? "notice warning" : "notice"
            }
            role="status"
          >
            {syncStatus || "等待第一次同步；尚未驗證雲端保存。"}
          </p>
          <div className="button-row">
            <button
              className="button dark"
              disabled={syncing}
              onClick={() => void sync()}
            >
              <RefreshCw size={16} className={syncing ? "spin" : ""} />
              {syncing ? "同步中…" : "立即同步"}
            </button>
            <button
              className="button outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await client!.auth.signOut();
                if (error) {
                  setMessage("登出失敗：" + error.message);
                  setBusy(false);
                }
              }}
            >
              <LogOut size={16} />
              登出
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="notice subtle">
            <Cloud size={19} />
            <div>
              <strong>
                {client ? "使用同一帳號，接續每一段學習。" : "雲端服務尚未連接"}
              </strong>
              <p>
                {client
                  ? "登入後自動同步作答、收藏、複習和單元進度。"
                  : "目前可使用本機學習。跨裝置同步需先建立 Supabase 資料庫並套用權限設定，尚未可驗證。"}
              </p>
            </div>
          </div>
          {client && (
            <>
              <form onSubmit={sendLink}>
                <label>
                  電子郵件
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className="button dark full-width"
                  disabled={busy}
                >
                  {busy ? "處理中…" : "寄送登入連結"}
                  <ArrowRight size={16} />
                </button>
              </form>
              {sent && (
                <div className="login-next-step" role="status">
                  <strong>下一步：開啟郵件完成登入</strong>
                  <p>
                    第一次使用時，信件可能寫「Confirm your email
                    address」，點確認連結即可。手機與電腦需各自寄送、開啟最新的登入郵件，不共用已點過的連結。
                  </p>
                </div>
              )}
              <details open={sent || undefined}>
                <summary>使用郵件中的驗證碼登入</summary>
                <p className="helper">
                  只有信中有數字驗證碼才能使用；若信中只有連結，請先用連結登入。驗證碼可以留在目前瀏覽器完成驗證。
                </p>
                <form onSubmit={verify}>
                  <label>
                    驗證碼
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6,10}"
                      maxLength={10}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                  </label>
                  <button
                    className="button outline small"
                    disabled={busy || !email}
                  >
                    驗證並登入
                  </button>
                </form>
              </details>
              <details className="mobile-login-help">
                <summary>手機點完郵件，仍未登入？</summary>
                <p>
                  若郵件開在 App 的內建瀏覽器，登入狀態不會自動出現在另一個
                  Safari／Chrome。請將最新登入連結開啟於平常學習的同一個瀏覽器；回到網站後，應看見帳號電子郵件與「立即同步」。
                </p>
                <p>
                  若連結顯示已過期或已使用，請在手機重新寄送，再點最新一封；不要重複點電腦已使用的連結。
                </p>
              </details>
            </>
          )}
          <p className="helper">
            訪客紀錄不會自動搬進帳號，可透過「偏好與資料」匯出／匯入。
          </p>
        </>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <details className="connection-details" open={!client}>
        <summary>連接自己的雲端專案</summary>
        <p>
          使用 Supabase 專案的公開網址與 publishable／anon
          key。這些是公開連線資訊，請勿填入 service_role 或 secret key。
        </p>
        <form onSubmit={configure}>
          <label>
            Project URL
            <input
              type="url"
              required
              placeholder="https://….supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <label>
            Publishable／anon key
            <input
              required
              autoComplete="off"
              placeholder="sb_publishable_…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <button className="button outline small">保存公開連線設定</button>
        </form>
        <p className="helper">
          管理者須先執行專案中的 supabase/schema.sql，啟用 Email
          登入，並允許網站部署網址的登入重新導向。詳細步驟見 README。
        </p>
      </details>
    </>
  );
}
function SupplementCatalog({
  level,
  store,
  openLesson,
}: {
  level: string;
  store: StudyStore;
  openLesson: (id: number) => void;
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all");
  const filtered = supplementalLessons
    .filter(
      (l) =>
        l.level === level &&
        `${l.code} ${l.title} ${l.connection} ${l.meaning}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()) &&
        (status === "all" ||
          (status === "done"
            ? !!store.data[`completed:${l.unit}`]
            : !store.data[`completed:${l.unit}`])),
    )
    .sort((a, b) =>
      a.code === "K01" ? -1 : b.code === "K01" ? 1 : a.unit - b.unit,
    );
  return (
    <section className="supplement-catalog">
      <div className="notice subtle">
        <BookOpen size={20} />
        <div>
          <strong>依你的講義整理的基礎補充</strong>
          <p>
            49 份講義對應 49 個濃縮單元、98 題自編練習，新增 96 個共用詞卡。原檔
            GL02 未提供；分級為教材整理導航，部分後段主題也會出現在
            N3。可直接補需要的部分，不必全部學完。
          </p>
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-box">
          <Search size={17} />
          <input
            aria-label="搜尋基礎課程"
            placeholder="搜尋課次、句型或主題"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label>
          進度
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全部課程</option>
            <option value="pending">尚未完成</option>
            <option value="done">已完成</option>
          </select>
        </label>
        <span className="meta">{filtered.length} 個單元</span>
      </div>
      <div className="unit-list">
        {filtered.map((l) => (
          <button
            className="unit-row"
            key={l.unit}
            onClick={() => openLesson(l.unit)}
          >
            <span className="unit-no supplement-code">{l.code}</span>
            <div className="unit-info">
              <div>
                <Tag>{l.level} 補充</Tag>
                {store.data[`completed:${l.unit}`] ? (
                  <Tag tone="green">已完成</Tag>
                ) : null}
              </div>
              <h2>{l.title}</h2>
              <p>{l.connection}</p>
              <CourseProgress id={l.unit} store={store} />
              <span className="meta">
                約 {l.minutes} 分鐘 · {l.examples.length} 組例句 ·{" "}
                {
                  l.questionIds.filter((id) => store.data[`answer:${id}`])
                    .length
                }
                /{l.questionIds.length} 題已作答 · 原講義 {l.source.pages} 頁
              </span>
            </div>
            <ChevronRight size={19} />
          </button>
        ))}
      </div>
      {!filtered.length && (
        <Empty title="沒有符合的補充單元">試試其他關鍵字或切換進度篩選。</Empty>
      )}
    </section>
  );
}
function SupplementLesson({
  id,
  store,
  fav,
  rate,
  startCards,
  startQuiz,
  openLesson,
}: {
  id: number;
  store: StudyStore;
  fav: (id: string) => void;
  rate: (id: string, n: number) => void;
  startCards: (ids: string[], mode?: string) => void;
  startQuiz: (ids: string[]) => void;
  openLesson: (id: number) => void;
}) {
  const lesson = supplementalLessons.find((l) => l.unit === id);
  const [showTranslations, setShowTranslations] = useState(false),
    [recall, setRecall] = useState(false);
  useEffect(() => {
    setShowTranslations(false);
    setRecall(false);
  }, [id]);
  if (!lesson)
    return <Empty title="找不到這個補充單元">請回到課程目錄選擇。</Empty>;
  const step = Number(store.data[`lessonStep:${id}`]) || 0;
  const answered = lesson.questionIds.filter(
    (q) => store.data[`answer:${q}`],
  ).length;
  const canComplete =
    !!store.data[`seen:${id}:0`] &&
    !!store.data[`seen:${id}:1`] &&
    answered === lesson.questionIds.length;
  const sequence = [...supplementalLessons].sort((a, b) =>
    a.code === "K01" ? -1 : b.code === "K01" ? 1 : a.unit - b.unit,
  );
  const next = sequence[sequence.findIndex((l) => l.unit === id) + 1];
  const gotoStep = (n: number) => {
    store.put(`lessonStep:${id}`, n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <>
      <div className="lesson-heading">
        <Tag>
          {lesson.level} 基礎補充 · {lesson.code} · 教材整理分級
        </Tag>
        <h1>{lesson.title}</h1>
        <p>約 {lesson.minutes} 分鐘，可分段完成；這是講義課綱的濃縮補充版。</p>
        <div className="meta">
          參考：{lesson.source.file} · 原檔 {lesson.source.pages} 頁，課綱第 1
          頁 · 解說、例句及題目為本站重編
        </div>
      </div>
      <CourseProgress id={id} store={store} />
      <div className="lesson-steps supplement-steps">
        {["理解與例句", "單字與回想", "練習與完成"].map((label, i) => (
          <button
            key={label}
            className={step === i ? "active" : ""}
            onClick={() => gotoStep(i)}
          >
            <span>
              {store.data[`seen:${id}:${i}`] ? <Check size={13} /> : i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>
      <div className="lesson-body">
        {step === 0 && (
          <>
            <div className="panel">
              <div className="section-heading">
                <h2>這一課的重點</h2>
                <FavoriteButton id={lesson.grammarId} store={store} fav={fav} />
              </div>
              <p>{lesson.meaning}</p>
              <div className="grammar-connection">
                <strong>接續與形式</strong>
                <JP text={lesson.connection} />
              </div>
              <div className="trap-note">
                <strong>容易混淆</strong>
                <p>{lesson.note}</p>
              </div>
              <p>{lesson.compare}</p>
              {lesson.prerequisites.length > 0 && (
                <div className="prerequisite-box">
                  <h3>卡住時，先補這些</h3>
                  <div className="button-row">
                    {lesson.prerequisites.map((unit) => {
                      const p = supplementalLessons.find(
                        (l) => l.unit === unit,
                      )!;
                      return (
                        <button
                          className="button outline small"
                          key={unit}
                          onClick={() => openLesson(unit)}
                        >
                          {p.code} {p.title}
                          <ArrowRight size={14} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="helper">建議前置，不鎖課；也可以繼續這一課。</p>
                </div>
              )}
            </div>
            <div className="panel">
              <div className="section-heading">
                <h2>先理解，再看中文</h2>
                <button
                  className="text-button"
                  onClick={() => setShowTranslations(!showTranslations)}
                >
                  {showTranslations ? "隱藏中文" : "顯示完整中文"}
                </button>
              </div>
              {lesson.examples.map((e, i) => (
                <div className="supplement-example" key={e.ja}>
                  <div className="section-heading">
                    <Tag>例句 {i + 1}</Tag>
                    {i === 0 && (
                      <FavoriteButton
                        id={`s:${lesson.grammarId}`}
                        store={store}
                        fav={fav}
                      />
                    )}
                  </div>
                  <p className="example">
                    <JP text={e.ja} />
                  </p>
                  {showTranslations && (
                    <p className="translation full">{e.zh}</p>
                  )}
                </div>
              ))}
              <AudioPlayer
                key={id}
                text={lesson.examples.map((e) => e.ja).join("")}
                translation={lesson.examples.map((e) => e.zh).join("\n")}
              />
              <p className="helper">
                使用裝置日文合成語音，不是原講義附帶音檔；目前沒有錄音評分。
              </p>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <div className="panel">
              <h2>本課共用字卡</h2>
              <p>
                先回想，再翻卡與自評。與 N3
                課程重複的單字共用既有紀錄，不另算學會一次。
              </p>
              <div className="word-list">
                {lesson.vocabIds.map((wordId) => {
                  const v = vocab.find((v) => v.id === wordId)!;
                  return (
                    <div className="word-row" key={wordId}>
                      <div>
                        <JP text={v.word} />
                        <small>
                          {v.pos} · {v.meaning}
                        </small>
                      </div>
                      <FavoriteButton id={wordId} store={store} fav={fav} />
                    </div>
                  );
                })}
              </div>
              <div className="button-row">
                <button
                  className="button dark"
                  onClick={() => startCards(lesson.vocabIds)}
                >
                  開始本課字卡 <Layers3 size={16} />
                </button>
                <button
                  className="button outline"
                  onClick={() => startCards(lesson.vocabIds, "reading")}
                >
                  讀音回想
                </button>
                <button
                  className="button outline"
                  onClick={() => startCards(lesson.vocabIds, "audio")}
                >
                  聽音辨詞
                </button>
              </div>
            </div>
            <div className="panel">
              <h2>不看解說，回想句型</h2>
              <p>說出「{lesson.title}」的用法、接續與一個例句。</p>
              {!recall ? (
                <button
                  className="button outline"
                  onClick={() => setRecall(true)}
                >
                  我已回想，查看重點
                </button>
              ) : (
                <>
                  <p>{lesson.meaning}</p>
                  <p>{lesson.connection}</p>
                  <RatingButtons
                    onRate={(n) => {
                      rate(lesson.grammarId, n);
                      setRecall(false);
                    }}
                  />
                </>
              )}
            </div>
          </>
        )}
        {step === 2 && (
          <div className="panel">
            <div className="section-heading">
              <h2>用兩題確認理解</h2>
              <Tag>
                {answered}/{lesson.questionIds.length} 題已作答
              </Tag>
            </div>
            <p>
              這些是本站依學習重點編寫的練習，不是講義原題或歷屆試題。每題提供正解、容易混淆處與完整中文。
            </p>
            <button
              className="button dark"
              onClick={() => startQuiz(lesson.questionIds)}
            >
              開始本課練習 <ArrowRight size={16} />
            </button>
            <hr />
            <button
              className="button outline"
              disabled={!canComplete}
              onClick={() => store.put(`completed:${id}`, true)}
            >
              {store.data[`completed:${id}`]
                ? "補充單元已完成"
                : "標記補充完成"}
              <CircleCheck size={16} />
            </button>
            {!canComplete && (
              <p className="helper">
                請完成前兩段底部的「完成這段」，並作答本課全部題目。完成不等於已熟悉。
              </p>
            )}
            {store.data[`completed:${id}`] && next ? (
              <div className="button-row">
                <button
                  className="button outline"
                  onClick={() => openLesson(next.unit)}
                >
                  下一個補充單元：{next.code}
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        )}
        <div className="panel">
          <h3>回到 N3，立刻用上</h3>
          <div className="button-row">
            {units
              .filter((u) => lesson.n3Units.includes(u.id))
              .map((u) => (
                <button
                  className="button outline small"
                  key={u.id}
                  onClick={() => openLesson(u.id)}
                >
                  N3 {u.icon} {u.title}
                  <ArrowRight size={14} />
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="lesson-bottom">
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => gotoStep(step - 1)}
        >
          <ArrowLeft size={15} />
          上一段
        </button>
        {step < 2 ? (
          <button
            className="button dark"
            onClick={() => {
              store.put(`seen:${id}:${step}`, true);
              gotoStep(step + 1);
            }}
          >
            完成這段，繼續
            <ArrowRight size={15} />
          </button>
        ) : (
          <span className="helper">已保存本課位置</span>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
