import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Sun, Sunset, Moon, LampDesk, Clock3, Pause, Play } from "lucide-react";

export type Ambience = "morning" | "evening" | "night";
export type RoomMode = "auto" | Ambience;
export const ROOM_KEY = "hiyori-reading-room-v1";
export function ambienceAt(date = new Date()): Ambience {
  const hour = date.getHours();
  return hour >= 6 && hour < 16
    ? "morning"
    : hour >= 16 && hour < 19
      ? "evening"
      : "night";
}
export function roomPreferences(value: string | null): {
  mode: RoomMode;
  quiet: boolean;
} {
  try {
    const p = JSON.parse(value || "{}");
    return {
      mode: ["auto", "morning", "evening", "night"].includes(p?.mode)
        ? p.mode
        : "auto",
      quiet: p?.quiet === true,
    };
  } catch {
    return { mode: "auto", quiet: false };
  }
}
function readPreferences() {
  try {
    return roomPreferences(localStorage.getItem(ROOM_KEY));
  } catch {
    return roomPreferences(null);
  }
}
export const roomScenes = {
  morning: {
    name: "晨光",
    note: "陽光正好，讀一點日文。",
    alt: "晨光穿過木窗，書桌上攤著書本與咖啡，窗外是綠樹和安靜的街道。",
    image: new URL("./assets/cafe-morning.webp", import.meta.url).href,
  },
  evening: {
    name: "夕暮",
    note: "把今天，慢慢讀成一頁。",
    alt: "夕陽染暖窗外的街道，桌邊閱讀燈亮起，照著書本與咖啡。",
    image: new URL("./assets/cafe-evening.webp", import.meta.url).href,
  },
  night: {
    name: "夜讀",
    note: "窗外入夜，留一盞燈給自己。",
    alt: "深藍夜空下的小鎮亮著燈，室內暖燈照著打開的書與一杯咖啡。",
    image: new URL("./assets/cafe-night.webp", import.meta.url).href,
  },
};
type Room = {
  mode: RoomMode;
  ambience: Ambience;
  quiet: boolean;
  setMode: (mode: RoomMode) => void;
  toggleQuiet: () => void;
  toggleLamp: () => void;
};
const RoomContext = createContext<Room | null>(null);
export function ReadingRoomProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [clock, setClock] = useState(() => ambienceAt());
  useEffect(() => {
    const update = () => setClock(ambienceAt());
    const timer = window.setInterval(update, 30000);
    document.addEventListener("visibilitychange", update);
    const storage = (e: StorageEvent) => {
      if (e.key === ROOM_KEY || e.key === null)
        setPreferences(readPreferences());
    };
    window.addEventListener("storage", storage);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("storage", storage);
    };
  }, []);
  const ambience = preferences.mode === "auto" ? clock : preferences.mode;
  useEffect(() => {
    document.documentElement.dataset.ambience = ambience;
    document.documentElement.dataset.roomMotion = preferences.quiet
      ? "quiet"
      : "gentle";
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute(
      "content",
      ambience === "night"
        ? "#1e343c"
        : ambience === "evening"
          ? "#ead5bd"
          : "#f5eee1",
    );
  }, [ambience, preferences.quiet]);
  function save(next: typeof preferences) {
    setPreferences(next);
    try {
      localStorage.setItem(ROOM_KEY, JSON.stringify(next));
    } catch {
      /* Appearance stays usable without storage. */
    }
  }
  return (
    <RoomContext.Provider
      value={{
        ...preferences,
        ambience,
        setMode: (mode) => save({ ...preferences, mode }),
        toggleQuiet: () => save({ ...preferences, quiet: !preferences.quiet }),
        toggleLamp: () =>
          save({
            ...preferences,
            mode: ambience === "night" ? "morning" : "night",
          }),
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}
export function useReadingRoom() {
  const room = useContext(RoomContext);
  if (!room) throw new Error("Reading room provider is required");
  return room;
}
export function RoomControls({ detailed = false }: { detailed?: boolean }) {
  const room = useReadingRoom();
  return (
    <div className={`room-controls ${detailed ? "detailed" : ""}`}>
      <div className="room-mode-options" role="group" aria-label="窗景時段">
        {(
          [
            ["auto", "隨時間", Clock3],
            ["morning", "晨光", Sun],
            ["evening", "夕暮", Sunset],
            ["night", "夜讀", Moon],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => room.setMode(id)}
            aria-pressed={room.mode === id}
            aria-label={`窗景：${label}`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {detailed && (
        <>
          <p>
            「隨時間」依此裝置的當地時間切換：06:00 晨光、16:00 夕暮、19:00
            夜讀。手動選擇會保存在此瀏覽器。
          </p>
          <button
            className="button outline room-quiet"
            onClick={room.toggleQuiet}
            aria-pressed={room.quiet}
          >
            {room.quiet ? <Play size={16} /> : <Pause size={16} />}減少動態
          </button>
          <p className="helper">
            關閉裝飾動態後，翻卡與學習照常使用。也會尊重裝置的「減少動態」設定；不會自動播放背景聲音。
          </p>
        </>
      )}
    </div>
  );
}
export function RoomScene({ compact = false }: { compact?: boolean }) {
  const room = useReadingRoom(),
    scene = roomScenes[room.ambience];
  return (
    <figure
      className={`window-scene ${compact ? "compact" : ""}`}
      data-scene={room.ambience}
    >
      <img
        key={room.ambience}
        className="scene-illustration"
        src={scene.image}
        alt={scene.alt}
        width={1536}
        height={1024}
        fetchPriority="high"
      />
      <figcaption className="scene-caption">
        <span />
        {scene.name}
        <small>窓辺の時間</small>
      </figcaption>
      <svg className="coffee-steam" viewBox="0 0 70 90" aria-hidden="true">
        <path d="M20 85 C0 60 40 52 20 26 S20 6 20 0" />
        <path d="M45 85 C25 62 60 45 43 25 S43 5 43 0" />
      </svg>
      <button
        className="scene-lamp"
        aria-label={
          room.ambience === "night"
            ? "關閉桌燈，切換晨光"
            : "點亮桌燈，切換夜讀"
        }
        aria-pressed={room.ambience === "night"}
        onClick={room.toggleLamp}
      >
        <LampDesk size={20} />
        <span>{room.ambience === "night" ? "換個晨光" : "點一盞燈"}</span>
      </button>
    </figure>
  );
}
