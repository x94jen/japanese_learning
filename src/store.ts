import { useCallback, useEffect, useMemo, useState } from "react";
import { isEvent, mergeEvents, reduceEvents, type StudyEvent } from "./engine";
function parseEvents(raw: string | null) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isEvent))
    throw Error("invalid events");
  return parsed as StudyEvent[];
}
export function useStudyStore(account: string) {
  const storageKey = `hiyori-events-v1:${account}`;
  const initial = useMemo(() => {
    try {
      return {
        events: parseEvents(localStorage.getItem(storageKey)),
        error: "",
      };
    } catch {
      return {
        events: [] as StudyEvent[],
        error:
          "無法讀取既有本機紀錄。請先檢查或備份瀏覽器資料；本頁暫不覆寫原始資料。",
      };
    }
  }, [storageKey]);
  const [error, setError] = useState(initial.error);
  const [events, setEvents] = useState<StudyEvent[]>(initial.events);
  const persist = useCallback(
    (next: StudyEvent[]) => {
      if (initial.error) return next;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setError("");
      } catch {
        setError(
          "瀏覽器儲存空間不足，紀錄目前僅保留在此頁。請匯出備份，勿關閉頁面。",
        );
      }
      return next;
    },
    [storageKey, initial.error],
  );
  const put = useCallback(
    (key: string, value: unknown) => {
      const id = crypto.randomUUID();
      setEvents((old) => {
        const last = old
          .filter((e) => e.key === key)
          .reduce((n, e) => Math.max(n, Date.parse(e.at)), 0);
        const e: StudyEvent = {
          id,
          key,
          value,
          at: new Date(Math.max(Date.now(), last + 1)).toISOString(),
        };
        return persist([...old, e]);
      });
    },
    [persist],
  );
  const merge = useCallback(
    (incoming: StudyEvent[]) =>
      setEvents((old) =>
        persist(
          mergeEvents(old, incoming).sort((a, b) => a.id.localeCompare(b.id)),
        ),
      ),
    [persist],
  );
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        merge(parseEvents(e.newValue));
      } catch {
        setError("另一分頁的資料格式無法讀取，請保留目前紀錄並匯出備份。");
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [storageKey, merge]);
  const data = useMemo(() => reduceEvents(events), [events]);
  return { events, data, put, merge, error };
}
export type StudyStore = ReturnType<typeof useStudyStore>;
