import test from "node:test";
import assert from "node:assert/strict";
import { ambienceAt, roomPreferences } from "../src/reading-room";
test("reading room uses device-local hour at morning, dusk and night boundaries", () => {
  for (const [hour, expected] of [
    [0, "night"],
    [5, "night"],
    [6, "morning"],
    [15, "morning"],
    [16, "evening"],
    [18, "evening"],
    [19, "night"],
    [23, "night"],
  ] as const)
    assert.equal(ambienceAt(new Date(2026, 9, 22, hour)), expected);
});
test("appearance preferences reject corrupt values without affecting learning records", () => {
  assert.deepEqual(roomPreferences(null), { mode: "auto", quiet: false });
  for (const value of ["broken", "null", '{"mode":"secret","quiet":"true"}'])
    assert.deepEqual(roomPreferences(value), { mode: "auto", quiet: false });
  assert.deepEqual(roomPreferences('{"mode":"night","quiet":true}'), {
    mode: "night",
    quiet: true,
  });
});
