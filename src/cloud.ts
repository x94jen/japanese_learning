import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StudyEvent } from "./engine";
import { isEvent } from "./engine";
const env = (import.meta as unknown as { env: Record<string, string> }).env;
export function readCloud() {
  try {
    return (
      JSON.parse(localStorage.getItem("hiyori-cloud") || "null") || {
        url: env.VITE_SUPABASE_URL || "",
        key: env.VITE_SUPABASE_ANON_KEY || "",
      }
    );
  } catch {
    return { url: "", key: "" };
  }
}
export function connectCloud(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw Error("請使用 HTTPS 的 Supabase 網址");
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { headers: { "X-Client-Info": "hiyori-n3" } },
    });
  } catch {
    return null;
  }
}
export async function synchronize(
  client: SupabaseClient,
  userId: string,
  events: StudyEvent[],
) {
  for (let i = 0; i < events.length; i += 100) {
    const batch = events
      .slice(i, i + 100)
      .map((e) => ({
        id: e.id,
        user_id: userId,
        event_key: e.key,
        event_value: e.value,
        occurred_at: e.at,
      }));
    const { error } = await client
      .from("study_events")
      .upsert(batch, { onConflict: "user_id,id", ignoreDuplicates: true });
    if (error) throw error;
  }
  const incoming: StudyEvent[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await client
      .from("study_events")
      .select("id,event_key,event_value,occurred_at")
      .eq("user_id", userId)
      .order("id")
      .range(page * 500, page * 500 + 499);
    if (error) throw error;
    for (const row of data ?? []) {
      const event = {
        id: row.id,
        key: row.event_key,
        value: row.event_value,
        at: new Date(row.occurred_at).toISOString(),
      };
      if (!isEvent(event)) throw Error("雲端紀錄格式不正確");
      incoming.push(event);
    }
    if (!data || data.length < 500) break;
  }
  return incoming;
}
