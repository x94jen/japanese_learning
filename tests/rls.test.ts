import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("actual PostgreSQL RLS separates users and rejects unauthorized writes", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema auth to authenticated;
 grant execute on function auth.uid() to authenticated;
 insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
    await db.exec(readFileSync("supabase/schema.sql", "utf8"));
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`,
    );
    await db.exec(
      `insert into public.study_events(user_id,id,event_key,event_value,occurred_at) values ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','favorite:v001','true',now());`,
    );
    assert.equal(
      (await db.query("select * from public.study_events")).rows.length,
      1,
    );
    await assert.rejects(
      () =>
        db.exec(
          `insert into public.study_events(user_id,id,event_key,event_value,occurred_at) values ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','favorite:v001','true',now());`,
        ),
      /row-level security/,
    );
    await assert.rejects(
      () => db.exec(`update public.study_events set event_value='false'`),
      /permission denied/,
    );
    await assert.rejects(
      () => db.exec(`delete from public.study_events`),
      /permission denied/,
    );
    await db.exec(
      `select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);`,
    );
    assert.equal(
      (await db.query("select * from public.study_events")).rows.length,
      0,
    );
    await db.exec("reset role; set role anon;");
    await assert.rejects(
      () => db.query("select * from public.study_events"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
