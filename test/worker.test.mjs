// Unit tests for how the Worker turns climbing-history.org ascents into site codes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compact } from "../src/index.js";

const base = { successful: true, climb_name: "Test", climb_grade: "9a", climb_type: "Sport", ascent_dt_end: "2026-11-10" };

test("styles become codes", () => {
  const out = compact([
    { ...base, climb_name: "A", ascent_style: "Onsight" },
    { ...base, climb_name: "B", ascent_style: "Flash" },
    { ...base, climb_name: "C", notes: "Sent it in 4 sessions." },
    { ...base, climb_name: "D", notes: "Done on the second go." },
    { ...base, climb_name: "E" },
  ]);
  assert.deepEqual(out.map((a) => a.k), ["o", "f", "s4", "g2", "w"]);
});

test("failed, old and incomplete ascents are skipped", () => {
  const out = compact([
    { ...base, successful: false },
    { ...base, ascent_dt_end: "2020-01-01" },
    { ...base, climb_type: "Ice" },
    { ...base, climb_grade: "" },
  ]);
  assert.equal(out.length, 0);
});
