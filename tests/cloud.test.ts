import { test } from "node:test";
import assert from "node:assert/strict";
import { authRedirectUrl, synchronize } from "../src/cloud";
import type { SupabaseClient } from "@supabase/supabase-js";
test("sync batches writes, scopes queries to the user and paginates past 1000 events", async () => {
  const uploaded: number[] = [];
  const ranges: number[] = [];
  const userId = "11111111-1111-4111-8111-111111111111";
  const fake = {
    from(name: string) {
      assert.equal(name, "study_events");
      return {
        async upsert(batch: any[], options: any) {
          assert.ok(batch.every((e) => e.user_id === userId));
          assert.equal(options.ignoreDuplicates, true);
          uploaded.push(batch.length);
          return { error: null };
        },
        select() {
          return {
            eq(field: string, value: string) {
              assert.equal(field, "user_id");
              assert.equal(value, userId);
              return {
                order() {
                  return {
                    async range(start: number, end: number) {
                      ranges.push(start);
                      assert.equal(end, start + 499);
                      const count = start < 1000 ? 500 : 3;
                      return {
                        data: Array.from({ length: count }, (_, i) => ({
                          id: `00000000-0000-4000-8000-${String(start + i).padStart(12, "0")}`,
                          event_key: "favorite:v001",
                          event_value: true,
                          occurred_at: "2026-10-16T00:00:00Z",
                        })),
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  const events = Array.from({ length: 205 }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    key: "favorite:v001",
    value: true,
    at: "2026-10-16T00:00:00Z",
  }));
  const result = await synchronize(fake, userId, events);
  assert.deepEqual(uploaded, [100, 100, 5]);
  assert.deepEqual(ranges, [0, 500, 1000]);
  assert.equal(result.length, 1003);
});

test("auth callbacks use the active origin and deployment base without credentials or arbitrary hosts", () => {
  assert.equal(
    authRedirectUrl("https://japanese-learning-olive.vercel.app", "/"),
    "https://japanese-learning-olive.vercel.app/",
  );
  assert.equal(
    authRedirectUrl("https://x94jen.github.io", "/japanese_learning/"),
    "https://x94jen.github.io/japanese_learning/",
  );
  assert.equal(
    authRedirectUrl("https://example.test", "/?old=1#token"),
    "https://example.test/",
  );
  assert.throws(() =>
    authRedirectUrl("https://example.test", "https://elsewhere.test/"),
  );
});
