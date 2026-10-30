import { AnnotatedSentence, SyntaxLegend } from "./GrammarTeaching";
import { parseMarked } from "./grammar-guides";
import { useEffect, useRef, useState } from "react";
import {
  Music,
  Plus,
  ArrowLeft,
  Bookmark,
  Play,
  Pause,
  Repeat,
  Save,
} from "lucide-react";
import type { StudyStore } from "./store";
import { vocab, grammar } from "./content";
import { JP } from "./JapaneseText";
import GrammarTeaching from "./GrammarTeaching";
import {
  cueAt,
  formatTime,
  parseSubtitles,
  songCollections,
  validSong,
  youtubeId,
  type Song,
  type SongCue,
  parseLrc,
} from "./song-content";
import { loadYoutube, type VideoPlayer } from "./youtube-player";
import "./song-learning.css";
import { songRomaji } from "./song-reading";
export default function SongLearning({ store }: { store: StudyStore }) {
  const songs = Object.entries(store.data)
    .filter(([key, value]) => key.startsWith("song:") && validSong(value))
    .map(([key, value]) => ({ id: key.slice(5), song: value as Song }));
  const [selected, setSelected] = useState(""),
    [adding, setAdding] = useState(false),
    [title, setTitle] = useState(""),
    [artist, setArtist] = useState("Vaundy"),
    [url, setUrl] = useState(""),
    [raw, setRaw] = useState(""),
    [error, setError] = useState(""),
    [searching, setSearching] = useState(false),
    [matches, setMatches] = useState<
      {
        id: number;
        trackName: string;
        artistName: string;
        albumName: string;
        duration: number;
        syncedLyrics: string;
      }[]
    >([]);
  async function searchLyrics() {
    setSearching(true);
    setError("");
    setMatches([]);
    try {
      const query = new URLSearchParams({
        track_name: title.trim(),
        artist_name: artist.trim(),
      });
      const response = await fetch(`https://lrclib.net/api/search?${query}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok)
        throw Error("歌詞服務暫時無法使用，請稍後重試或匯入字幕。");
      const data = await response.json();
      if (!Array.isArray(data)) throw Error("歌詞服務回傳格式不正確");
      const results = data
        .filter(
          (r) =>
            typeof r.syncedLyrics === "string" &&
            r.syncedLyrics.length <= 250000 &&
            typeof r.trackName === "string" &&
            typeof r.artistName === "string",
        )
        .slice(0, 12);
      setMatches(results);
      if (!results.length)
        setError("找不到逐句時間軸，可換歌名搜尋或自行匯入字幕。");
    } catch (e) {
      setError(
        e instanceof Error && e.name === "TimeoutError"
          ? "搜尋逾時，請重試或匯入字幕。"
          : "無法取得歌詞，請檢查網路或自行匯入字幕。",
      );
    } finally {
      setSearching(false);
    }
  }
  const song = songs.find((s) => s.id === selected)?.song;
  async function readFile(file?: File) {
    if (!file) return;
    if (file.size > 250000) {
      setError("字幕檔請限制在 250 KB 內");
      return;
    }
    try {
      setRaw(await file.text());
      setError("");
    } catch {
      setError("無法讀取字幕檔");
    }
  }
  function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      const videoId = youtubeId(url);
      if (!videoId) throw Error("請填入有效的 HTTPS YouTube 影片網址");
      const cues = /^\s*\[\d+:\d+/m.test(raw)
        ? parseLrc(raw)
        : parseSubtitles(raw);
      const value: Song = {
        title: title.trim(),
        artist: artist.trim(),
        videoId,
        source: url.trim(),
        cues,
        provenance: matches.length
          ? "逐句歌詞來源：LRCLIB；使用者選取版本，翻譯與解析需另行補充。"
          : undefined,
      };
      if (!validSong(value)) throw Error("請確認歌名及字幕內容");
      const id = crypto.randomUUID();
      store.put(`song:${id}`, value);
      setSelected(id);
      setAdding(false);
      setRaw("");
      setUrl("");
      setTitle("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function importStudy(file?: File) {
    if (!file) return;
    if (file.size > 2000000) {
      setError("教材檔請限制在 2 MB 內");
      return;
    }
    try {
      const imported = JSON.parse(await file.text());
      if (!validSong(imported))
        throw Error("教材格式不正確，請使用本站支援的歌曲教材 JSON");
      const id = crypto.randomUUID();
      store.put(`song:${id}`, imported);
      setSelected(id);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (song)
    return (
      <SongLesson
        key={selected}
        id={selected}
        song={song}
        store={store}
        exit={() => setSelected("")}
      />
    );
  return (
    <div className="songs-page">
      <header className="page-heading">
        <span className="eyebrow">MUSIC · 聽懂喜歡的日文</span>
        <h1>日文歌學習</h1>
        <p>演唱會前，從喜歡的歌開始。影片、逐句字幕與學習筆記放在一起。</p>
      </header>
      <div className="button-row">
        <button
          className="button dark"
          onClick={() => {
            setAdding(!adding);
            setError("");
          }}
        >
          <Plus size={18} />
          新增歌曲與字幕
        </button>
      </div>
      <div className="panel">
        <label>
          匯入含翻譯與解析的歌曲教材（JSON）
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              void importStudy(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <p className="helper">
          支援沒有時間軸、尚未附影片的逐句教材。未校時的句子可先學習，之後再校時。教材保存至自己的帳號，不會公開列入全站課程。
        </p>
      </div>
      {songs.length > 0 && (
        <div className="song-grid">
          {songs.map(({ id, song }) => (
            <button
              className="panel song-tile"
              key={id}
              onClick={() => setSelected(id)}
            >
              <Music />
              <strong>{song.title}</strong>
              <span>
                {song.artist} · {song.cues.length} 句
              </span>
              <small>
                {store.data[`songProgress:${id}`]
                  ? "接續上次字幕位置"
                  : "開始學習"}
              </small>
            </button>
          ))}
        </div>
      )}
      {adding && (
        <form className="panel song-import" onSubmit={add}>
          <h2>建立私人歌曲教材</h2>
          <label>
            歌名
            <input
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            歌手
            <input
              maxLength={100}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </label>
          <div className="song-lookup">
            <button
              type="button"
              className="button outline"
              disabled={searching || !title.trim()}
              onClick={() => void searchLyrics()}
            >
              {searching ? "搜尋中…" : "搜尋逐句歌詞"}
            </button>
            <p className="helper">
              以歌名與歌手搜尋
              LRCLIB，選擇與影片相同的版本。找到後會填入時間軸，無需逐句輸入。
            </p>
            <div aria-live="polite">
              {matches.map((match) => (
                <button
                  type="button"
                  className="song-match"
                  key={match.id}
                  onClick={() => {
                    setRaw(match.syncedLyrics);
                    setError("");
                  }}
                >
                  <strong>
                    {match.trackName} · {match.artistName}
                  </strong>
                  <span>
                    {match.albumName} · {formatTime(match.duration || 0)} ·{" "}
                    {raw === match.syncedLyrics ? "已選取" : "使用此版本"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <label>
            YouTube 影片網址
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </label>
          <p className="helper">
            優先選歌手或唱片公司的官方影片。部分影片不允許嵌入，可改在 YouTube
            開啟。
          </p>
          <label>
            匯入 LRC／SRT／VTT 字幕檔
            <input
              type="file"
              accept=".lrc,.srt,.vtt,text/plain,text/vtt"
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </label>
          <label>
            或貼上有時間軸的字幕
            <textarea
              required
              rows={8}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={
                "1\n00:00:10,000 --> 00:00:14,000\n這裡放你提供的日文字幕"
              }
            />
          </label>
          <p className="helper">
            請使用有權使用的字幕，並選擇與字幕相同版本的影片。可搜尋 LRCLIB
            逐句歌詞或匯入字幕；翻譯與解析可匯入教材或自行補充。登入後教材與筆記沿用帳號同步；訪客僅存本機。
          </p>
          <button className="button dark" type="submit">
            建立歌曲教材
          </button>
        </form>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <section className="panel">
        <h2>Vaundy 演唱會前選曲</h2>
        <p>
          先選你最想聽懂的歌，再加入官方影片與你提供的字幕。以下為搜尋入口，尚未核對影片或收錄歌詞，也不是演唱會歌單。
        </p>
        {songCollections.map((group) => (
          <section key={group.name}>
            <h3>{group.name}</h3>
            <div className="song-suggestions">
              {group.titles.map((t) => (
                <div key={t}>
                  <strong>{t}</strong>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent("Vaundy " + t + " official")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    尋找官方影片 ↗
                  </a>
                  <button
                    className="text-button"
                    onClick={() => {
                      setTitle(t);
                      setAdding(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    用這首歌建立教材
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
        <p className="helper">
          分類與曲目依使用者提供的參考清單整理，尚未逐場核對；不是下週場次的確認歌單，清單也不代表已完成逐句教材。
        </p>
        <a
          href="https://music.apple.com/us/playlist/%E6%BC%94%E5%87%BA%E6%9B%B2%E7%9B%AE-vaundy-vaundy-dome-tour-2026-silence-%E5%B7%A1%E8%BF%B4/pl.d76cfee5483e43e78353c1cd3821e6a7?l=zh-Hant-TW"
          target="_blank"
          rel="noreferrer"
        >
          使用者提供的 Apple Music 巡演曲目參考 ↗
        </a>
      </section>
      <section className="panel">
        <h2>演唱會歌單來源</h2>
        <p>
          請先確認城市與日期，再以同巡演的近期場次作參考。歌迷回報可能有缺漏，未來場次不保證曲目相同。
        </p>
        <div className="button-row">
          <a href="https://vaundy.jp/" target="_blank" rel="noreferrer">
            Vaundy 官方演出資訊 ↗
          </a>
          <a
            href="https://www.setlist.fm/search?query=Vaundy"
            target="_blank"
            rel="noreferrer"
          >
            查詢歷年歌單（歌迷回報）↗
          </a>
        </div>
      </section>
      <section className="panel">
        <h2>怎麼學一首歌？</h2>
        <p>
          先聽 → 點字幕重聽 → 看中文與語氣筆記 → 連結單字、文法 →
          收藏再複習。字幕在影片下方逐句顯示，播放時跟隨目前時間；可切換中文字幕與單句循環。
        </p>
        <p>
          歌曲常省略主詞、改變語序或使用比喻。解析時需要分開說明字面意思、語境理解與一般會話說法，不把歌詞直接當作商務日文。
        </p>
      </section>
    </div>
  );
}
function SongLesson({
  id,
  song,
  store,
  exit,
}: {
  id: string;
  song: Song;
  store: StudyStore;
  exit: () => void;
}) {
  const initial = store.data[`songProgress:${id}`] as
    { cue: number; time: number } | undefined;
  const [index, setIndex] = useState(
      Math.min(initial?.cue || 0, song.cues.length - 1),
    ),
    [time, setTime] = useState(initial?.time || 0),
    [loaded, setLoaded] = useState(false),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [loop, setLoop] = useState(false),
    [practice, setPractice] = useState(false),
    [follow, setFollow] = useState(true),
    [furigana, setFurigana] = useState(true),
    [romaji, setRomaji] = useState(false),
    [offset, setOffset] = useState(song.offset || 0),
    [chinese, setChinese] = useState(false),
    [subtitles, setSubtitles] = useState(true),
    [favoritesOnly, setFavoritesOnly] = useState(false),
    [editing, setEditing] = useState(false),
    [translation, setTranslation] = useState(""),
    [note, setNote] = useState(""),
    [cueStart, setCueStart] = useState(0),
    [cueEnd, setCueEnd] = useState(0),
    [wordQuery, setWordQuery] = useState(""),
    [grammarQuery, setGrammarQuery] = useState(""),
    [rates, setRates] = useState<number[]>([1]),
    [videoUrl, setVideoUrl] = useState("");
  const container = useRef<HTMLDivElement>(null),
    player = useRef<VideoPlayer | null>(null),
    latest = useRef({ index, loop, song, time, offset }),
    put = useRef(store.put),
    active = useRef<HTMLButtonElement>(null);
  latest.current = { index, loop, song, time, offset };
  put.current = store.put;
  const cue = song.cues[index];
  const favorite = !!store.data[`songFavorite:${id}:${index}`];
  function savePosition(i: number, t: number) {
    put.current(`songProgress:${id}`, {
      cue: i,
      time: Math.max(0, Math.min(86400, t)),
    });
  }
  useEffect(() => {
    if (!loaded || !song.videoId) return;
    let cancelled = false,
      poll: ReturnType<typeof setInterval> | undefined,
      instance: VideoPlayer | undefined;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    loadYoutube()
      .then(() => {
        if (cancelled || !container.current) return;
        const target = document.createElement("div");
        container.current.replaceChildren(target);
        readyTimer = setTimeout(() => {
          if (!cancelled)
            setMessage("影片尚未就緒，可手動選句學習，或在 YouTube 開啟。");
        }, 15000);
        instance = new window.YT!.Player(target, {
          videoId: song.videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: { playsinline: 1, origin: location.origin, rel: 0 },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              clearTimeout(readyTimer);
              player.current = target;
              setReady(true);
              setRates(target.getAvailablePlaybackRates());
              target.seekTo(latest.current.time, true);
              poll = setInterval(() => {
                try {
                  const p = player.current;
                  if (!p) return;
                  const t = p.getCurrentTime();
                  setTime(t);
                  const now = latest.current,
                    current = now.song.cues[now.index];
                  if (
                    now.loop &&
                    current.timed !== false &&
                    (t >= current.end + now.offset ||
                      t < current.start + now.offset - 0.5)
                  ) {
                    p.seekTo(Math.max(0, current.start + now.offset), true);
                    return;
                  }
                  const found = cueAt(now.song.cues, t - now.offset);
                  if (found >= 0 && found !== now.index) {
                    setIndex(found);
                    savePosition(found, t);
                    setEditing(false);
                  }
                } catch {
                  setMessage(
                    "影片時間暫時無法讀取，請手動選句或重新載入影片。",
                  );
                }
              }, 300);
            },
            onStateChange: ({ data }) => {
              if (!cancelled && (data === 2 || data === 0)) {
                const now = latest.current;
                savePosition(
                  now.index,
                  player.current?.getCurrentTime() || now.time,
                );
              }
            },
            onError: ({ data }) => {
              if (cancelled) return;
              clearTimeout(readyTimer);
              setReady(false);
              setMessage(
                `影片無法播放（${data}），可能不允許嵌入或有地區限制。可手動選句，或在 YouTube 開啟。`,
              );
            },
          },
        });
      })
      .catch((e) => {
        if (!cancelled) setMessage((e as Error).message);
      });
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(readyTimer);
      instance?.destroy();
      player.current = null;
    };
  }, [loaded, id, song.videoId]);
  useEffect(() => {
    if (follow && active.current) {
      const parent = active.current.parentElement!;
      parent.scrollTop =
        active.current.offsetTop -
        parent.clientHeight / 2 +
        active.current.clientHeight / 2;
    }
  }, [index, follow, favoritesOnly, practice]);
  function select(i: number) {
    setIndex(i);
    setTime(
      song.cues[i].timed === false
        ? time
        : Math.max(0, song.cues[i].start + offset),
    );
    setEditing(false);
    if (song.cues[i].timed === false) {
      player.current?.pauseVideo();
      setLoop(false);
    }
    if (song.cues[i].timed !== false)
      player.current?.seekTo(Math.max(0, song.cues[i].start + offset), true);
    savePosition(
      i,
      song.cues[i].timed === false
        ? time
        : Math.max(0, song.cues[i].start + offset),
    );
  }
  function update(patch: Partial<SongCue>) {
    const cues = song.cues.map((c, i) =>
      i === index ? { ...c, ...patch } : c,
    );
    const next = { ...song, cues };
    if (!validSong(next)) {
      setMessage(
        "字幕時間不可重疊，且結束時間必須晚於開始時間；請檢查內容與時間。",
      );
      return false;
    }
    store.put(`song:${id}`, next);
    return true;
  }
  function edit() {
    player.current?.pauseVideo();
    setCueStart(cue.start);
    setCueEnd(cue.end);
    setTranslation(cue.translation);
    setNote(cue.note);
    setEditing(!editing);
  }
  return (
    <div className={`songs-page song-lesson ${practice ? "sing-mode" : ""}`}>
      <button
        className="text-button"
        onClick={() => {
          savePosition(index, player.current?.getCurrentTime() || time);
          exit();
        }}
      >
        <ArrowLeft size={16} />
        返回歌曲總表
      </button>
      <header className="page-heading">
        <span className="eyebrow">MUSIC · 逐句學習</span>
        <h1>{song.title}</h1>
        <div className="song-mode" aria-label="學習模式">
          <button
            className={`button ${practice ? "dark" : "outline"}`}
            aria-pressed={practice}
            onClick={() => setPractice(true)}
          >
            跟唱模式
          </button>
          <button
            className={`button ${!practice ? "dark" : "outline"}`}
            aria-pressed={!practice}
            onClick={() => setPractice(false)}
          >
            拆句學習
          </button>
        </div>
        <p>{song.artist} · 使用者教材，非官方翻譯。</p>
        {song.provenance && <p className="helper">{song.provenance}</p>}
        {song.cues.some((c) => c.timed === false) && (
          <p className="notice">
            部分句子尚未校時：可逐句學習，完成時間校正後才支援影片跳轉與循環。時間不是估算值。
          </p>
        )}
      </header>
      <div className="song-workspace">
        <section className="panel song-player-column">
          <div className="song-video-dock">
            <div className="song-video">
              {!song.videoId ? (
                <div className="song-video-consent">
                  <Music size={32} />
                  <p>尚未指定影片，先閱讀逐句教材。</p>
                </div>
              ) : !loaded ? (
                <div className="song-video-consent">
                  <Music size={32} />
                  <p>載入 YouTube 影片後，會連線至第三方影片服務。</p>
                  <button
                    className="button dark"
                    onClick={() => setLoaded(true)}
                  >
                    載入影片
                  </button>
                </div>
              ) : (
                <div ref={container} className="youtube-mount" />
              )}
            </div>
          </div>
          {song.videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${song.videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              在 YouTube 開啟原影片 ↗
            </a>
          )}
          {!song.videoId && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const videoId = youtubeId(videoUrl);
                if (!videoId) {
                  setMessage("請填入有效的 HTTPS YouTube 影片網址");
                  return;
                }
                store.put(`song:${id}`, {
                  ...song,
                  videoId,
                  source: videoUrl.trim(),
                });
                setMessage("");
              }}
            >
              <label>
                加入本曲 YouTube 影片
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </label>
              <button className="button outline small" type="submit">
                連接影片
              </button>
            </form>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <div className="song-controls">
            <button
              className="button outline small"
              disabled={!ready}
              onClick={() => {
                setLoop(false);
                player.current?.seekTo(Math.max(0, time - 5), true);
              }}
            >
              倒轉 5 秒
            </button>
            <button
              className="button outline small"
              disabled={!ready}
              onClick={() => {
                setLoop(false);
                player.current?.seekTo(Math.max(0, time + 5), true);
              }}
            >
              快轉 5 秒
            </button>
            <button
              className="button outline small"
              disabled={!ready}
              onClick={() => player.current?.playVideo()}
            >
              <Play size={15} />
              播放
            </button>
            <button
              className="button outline small"
              disabled={!ready}
              onClick={() => player.current?.pauseVideo()}
            >
              <Pause size={15} />
              暫停
            </button>
            <button
              className={`button outline small ${loop ? "selected" : ""}`}
              aria-pressed={loop}
              disabled={cue.timed === false}
              onClick={() => {
                setLoop(!loop);
                if (!loop)
                  player.current?.seekTo(Math.max(0, cue.start + offset), true);
              }}
            >
              <Repeat size={15} />
              單句循環
            </button>
            <label>
              速度
              <select
                aria-label="影片速度"
                disabled={!ready}
                defaultValue="1"
                onChange={(e) =>
                  player.current?.setPlaybackRate(Number(e.target.value))
                }
              >
                {rates.map((r) => (
                  <option key={r} value={r}>
                    {r}×
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="song-switches">
            <label>
              <input
                type="checkbox"
                checked={romaji}
                onChange={(e) => setRomaji(e.target.checked)}
              />
              顯示羅馬拼音
            </label>
            <label>
              <input
                type="checkbox"
                checked={follow}
                onChange={(e) => setFollow(e.target.checked)}
              />
              自動跟隨
            </label>
            <label>
              <input
                type="checkbox"
                checked={furigana}
                onChange={(e) => setFurigana(e.target.checked)}
              />
              顯示假名
            </label>
            <label>
              <input
                type="checkbox"
                checked={subtitles}
                onChange={(e) => setSubtitles(e.target.checked)}
              />
              顯示日文字幕
            </label>
            <label>
              <input
                type="checkbox"
                checked={chinese}
                onChange={(e) => setChinese(e.target.checked)}
              />
              顯示中文
            </label>
            <label>
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
              />
              只看收藏
            </label>
          </div>
          <details className="song-alignment">
            <summary>
              歌詞時間校正（{offset > 0 ? "+" : ""}
              {offset.toFixed(1)} 秒）
            </summary>
            <p className="helper">
              影片前奏與音源不同時，先選一句，播放至這句開頭，再按「將本句對齊現在」。正數代表歌詞較晚出現。
            </p>
            <div className="button-row">
              <button
                className="button outline small"
                disabled={!ready || cue.timed === false}
                onClick={() => {
                  const value =
                    Math.round(
                      ((player.current?.getCurrentTime() || 0) - cue.start) *
                        10,
                    ) / 10;
                  if (Math.abs(value) <= 600) {
                    setOffset(value);
                    store.put(`song:${id}`, { ...song, offset: value });
                  }
                }}
              >
                將本句對齊現在
              </button>
              <button
                className="button outline small"
                onClick={() => {
                  setOffset(0);
                  store.put(`song:${id}`, { ...song, offset: 0 });
                }}
              >
                重設校正
              </button>
            </div>
          </details>
          <p className="helper">
            目前 {formatTime(time)} · 第 {index + 1}/{song.cues.length}{" "}
            句。點字幕可跳轉；影片不可用時仍可手動學習。
          </p>
          <div className="song-caption-list" aria-label="逐句字幕">
            {song.cues.map(
              (c, i) =>
                (!favoritesOnly || !!store.data[`songFavorite:${id}:${i}`]) && (
                  <button
                    key={i}
                    ref={i === index ? active : undefined}
                    aria-current={i === index ? "true" : undefined}
                    className={i === index ? "current" : ""}
                    onClick={() => select(i)}
                  >
                    <time>
                      {c.timed === false ? "未校時" : formatTime(c.start)}
                    </time>
                    <span>
                      {subtitles ? (
                        <JP text={c.text} ruby={furigana} />
                      ) : (
                        `第 ${i + 1} 句（日文已隱藏）`
                      )}
                      {subtitles && furigana && c.reading && (
                        <small lang="ja">{c.reading}</small>
                      )}
                      {romaji && (
                        <small className="song-romaji">
                          {songRomaji(c.text, c.reading) ||
                            "此句尚無讀音，匯入含假名的教材後可顯示拼音"}
                        </small>
                      )}
                      {chinese && (
                        <small>{c.translation || "尚未加入中文翻譯"}</small>
                      )}
                    </span>
                    {!!store.data[`songFavorite:${id}:${i}`] && (
                      <Bookmark size={14} />
                    )}
                  </button>
                ),
            )}
          </div>
          {favoritesOnly &&
            !song.cues.some(
              (_, i) => store.data[`songFavorite:${id}:${i}`],
            ) && <p>尚未收藏句子。關閉「只看收藏」可繼續選句。</p>}
          <div className="button-row">
            <button
              className="button outline small"
              disabled={index === 0}
              onClick={() => select(index - 1)}
            >
              上一句
            </button>
            <button
              className="button dark small"
              disabled={index === song.cues.length - 1}
              onClick={() => select(index + 1)}
            >
              下一句
            </button>
          </div>
        </section>
        <section className="panel song-notes">
          <div className="section-heading">
            <h2>第 {index + 1} 句 · 拆句筆記</h2>
            <button
              className="text-button"
              aria-pressed={favorite}
              onClick={() =>
                store.put(`songFavorite:${id}:${index}`, !favorite)
              }
            >
              <Bookmark size={17} />
              {favorite ? "取消收藏句子" : "收藏句子"}
            </button>
          </div>
          {subtitles && (
            <div>
              {cue.marked && <SyntaxLegend />}
              <p className="example">
                {cue.marked ? (
                  <AnnotatedSentence {...parseMarked(cue.marked)} />
                ) : (
                  <JP text={cue.text} />
                )}
              </p>
              {cue.reading && (
                <p className="song-reading" lang="ja">
                  讀音：{cue.reading}
                </p>
              )}
            </div>
          )}
          {chinese && (
            <p className="translation full">
              {cue.translation || "尚未加入中文翻譯"}
            </p>
          )}
          <h3>意思、語氣與詩意表達</h3>
          <p className="song-note-text">
            {cue.note ||
              "尚未加入解析。請提供要學的歌詞片段後，再逐句整理字面意思、比喻、省略與自然會話的差異；本站沒有自動 AI 解析。"}
          </p>
          <button className="text-button" onClick={edit}>
            編輯中文與拆句筆記
          </button>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const timing =
                  cueEnd > cueStart
                    ? { start: cueStart, end: cueEnd, timed: true }
                    : cue.timed === false && cueStart === 0 && cueEnd === 0
                      ? { start: 0, end: 0, timed: false }
                      : { start: cueStart, end: cueEnd, timed: true };
                if (update({ translation, note, ...timing })) setEditing(false);
              }}
            >
              {cue.timed === false && (
                <p className="helper">
                  開始與結束都保持 0
                  時會維持「未校時」。填入實際起迄秒數後，這一句才啟用影片跳轉。
                </p>
              )}
              <label>
                字幕開始時間（秒）
                <input
                  type="number"
                  min={index > 0 ? song.cues[index - 1].end : 0}
                  max={86400}
                  step="0.001"
                  required
                  value={cueStart}
                  onChange={(e) => setCueStart(Number(e.target.value))}
                />
              </label>
              <label>
                字幕結束時間（秒）
                <input
                  type="number"
                  min={cueStart}
                  max={song.cues[index + 1]?.start || 86400}
                  step="0.001"
                  required
                  value={cueEnd}
                  onChange={(e) => setCueEnd(Number(e.target.value))}
                />
              </label>
              <label>
                完整中文翻譯
                <textarea
                  rows={3}
                  maxLength={1500}
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                />
              </label>
              <label>
                意思、語氣與文法筆記
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button className="button dark small" type="submit">
                <Save size={15} />
                儲存本句筆記
              </button>
            </form>
          )}
          <h3>本句單字解說</h3>
          {cue.terms?.map((t) => (
            <div className="song-word" key={t.word}>
              <strong lang="ja">{t.word}</strong>
              <span lang="ja">{t.reading}</span>
              <p>{t.meaning}</p>
            </div>
          ))}
          <h3>本句文法與變化</h3>
          {cue.patterns?.map((p) => (
            <div className="song-word" key={p.pattern}>
              <strong lang="ja">{p.pattern}</strong>
              <p className="formula-text">{p.formation}</p>
              <p>{p.meaning}</p>
              {p.warning && <p className="helper">注意：{p.warning}</p>}
            </div>
          ))}
          <h3>相關單字</h3>
          {cue.words.map((w) => {
            const v = vocab.find((v) => v.id === w);
            return (
              v && (
                <div className="song-word" key={w}>
                  <strong>
                    <JP text={v.word} />
                  </strong>
                  <span>
                    {v.reading} · {v.meaning}
                  </span>
                  <p>
                    <JP text={v.sentence} />
                  </p>
                  <p className="translation">{v.translation}</p>
                  <button
                    className="text-button"
                    onClick={() =>
                      store.put(`favorite:${w}`, !store.data[`favorite:${w}`])
                    }
                  >
                    {store.data[`favorite:${w}`]
                      ? "取消收藏單字"
                      : "收藏單字至複習中心"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      update({ words: cue.words.filter((id) => id !== w) })
                    }
                  >
                    移除連結
                  </button>
                </div>
              )
            );
          })}
          <details>
            <summary>從共用單字庫連結本句單字</summary>
            <label>
              搜尋相關單字
              <input
                value={wordQuery}
                onChange={(e) => setWordQuery(e.target.value)}
              />
            </label>
            <div className="song-link-options">
              {vocab
                .filter(
                  (v) =>
                    !cue.words.includes(v.id) &&
                    (!wordQuery
                      ? cue.text.includes(v.word)
                      : `${v.word}${v.reading}${v.meaning}`.includes(
                          wordQuery,
                        )),
                )
                .slice(0, 12)
                .map((v) => (
                  <button
                    className="button outline small"
                    key={v.id}
                    disabled={cue.words.length >= 30}
                    onClick={() => update({ words: [...cue.words, v.id] })}
                  >
                    {v.word} · {v.meaning}
                  </button>
                ))}
            </div>
            <p className="helper">
              未搜尋時僅列出寫法相符的候選，不代表已完成詞形或語境分析。
            </p>
          </details>
          <h3>相關文法</h3>
          {cue.grammar.map((gid) => {
            const g = grammar.find((g) => g.id === gid);
            return (
              g && (
                <div key={gid}>
                  <h4>{g.title}</h4>
                  <GrammarTeaching g={g} compact />
                  <button
                    className="text-button"
                    onClick={() =>
                      store.put(
                        `favorite:${gid}`,
                        !store.data[`favorite:${gid}`],
                      )
                    }
                  >
                    {store.data[`favorite:${gid}`]
                      ? "取消收藏文法"
                      : "收藏文法至複習中心"}
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      update({
                        grammar: cue.grammar.filter((id) => id !== gid),
                      })
                    }
                  >
                    移除連結
                  </button>
                </div>
              )
            );
          })}
          <details>
            <summary>從共用文法庫連結本句文法</summary>
            <label>
              搜尋相關文法
              <input
                value={grammarQuery}
                onChange={(e) => setGrammarQuery(e.target.value)}
              />
            </label>
            <div className="song-link-options">
              {grammarQuery &&
                grammar
                  .filter(
                    (g) =>
                      !cue.grammar.includes(g.id) &&
                      `${g.title}${g.meaning}`.includes(grammarQuery),
                  )
                  .slice(0, 12)
                  .map((g) => (
                    <button
                      className="button outline small"
                      disabled={cue.grammar.length >= 30}
                      key={g.id}
                      onClick={() =>
                        update({ grammar: [...cue.grammar, g.id] })
                      }
                    >
                      {g.title} · {g.meaning}
                    </button>
                  ))}
            </div>
          </details>
          <p className="helper">
            來源：
            {song.source ? (
              <a href={song.source} target="_blank" rel="noreferrer">
                使用者提供的影片
              </a>
            ) : (
              "使用者提供的文字教材，尚未指定影片"
            )}
            。請核對聽到的字句、字幕版本與歌唱中的省略；外部影片可能有廣告、地區或嵌入限制。
          </p>
        </section>
      </div>
    </div>
  );
}
