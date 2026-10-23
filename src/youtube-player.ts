export type VideoPlayer = {
  getCurrentTime(): number;
  seekTo(time: number, allow: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
  setPlaybackRate(rate: number): void;
  getAvailablePlaybackRates(): number[];
};
type Options = {
  videoId: string;
  host: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (e: { target: VideoPlayer }) => void;
    onError: (e: { data: number }) => void;
    onStateChange: (e: { data: number }) => void;
  };
};
declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Options) => VideoPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
let pending: Promise<void> | null = null;
export function loadYoutube() {
  if (window.YT?.Player) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    const previous = window.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => {
      pending = null;
      script.remove();
      reject(Error("影片服務載入逾時，仍可手動逐句學習或在 YouTube 開啟。"));
    }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      previous?.();
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      pending = null;
      reject(Error("無法載入 YouTube，請檢查網路或改用外部連結。"));
    };
    document.head.append(script);
  });
  return pending;
}
