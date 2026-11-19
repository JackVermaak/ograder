// Unit tests for the grade conversion and O-grade logic in public/ograder/app.js.
// app.js is a browser script, so it runs here in a small fake window.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../public/ograder/", import.meta.url);
const ctx = {
  document: { getElementById: () => null },
  location: { protocol: "file:", hash: "" },
  history: { replaceState() {} },
  addEventListener() {},
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL("data.js", root), "utf8"), ctx);
vm.runInContext(readFileSync(new URL("app.js", root), "utf8"), ctx);
const { grade, mix, norm, gradeLabel, tierName, climbs, SCALES } = ctx.OGRADER;

const sport = (g, k, extra = {}) => ({ key: "", type: "S", g, gi: SCALES.S.indexOf(g), yy: "", k, ...extra });
const og = (r) => "O" + r.n + (r.mod || "");

test("grade labels convert French to YDS and Font to V-grades", () => {
  assert.equal(gradeLabel("S", "9a"), "9a (5.14d)");
  assert.equal(gradeLabel("S", "9c"), "9c (5.15d)");
  assert.equal(gradeLabel("B", "8C"), "8C (V15)");
  assert.equal(gradeLabel("T", "E9"), "E9");
});

test("names are normalised for lookups", () => {
  assert.equal(norm("La Dura Dura"), "laduradura");
  assert.equal(norm("Céüse"), "ceuse");
});

test("O-grades Ondra stated himself win over everything else", () => {
  const silence = climbs.find((c) => c.key === "silence");
  assert.ok(silence, "Silence is in the data");
  const r = grade(silence);
  assert.equal(og(r), "O60");
  assert.equal(r.conf, "stated");
  assert.equal(og(grade(climbs.find((c) => c.key === "laduradura"))), "O42+");
});

test("recorded styles map to the right O-grade", () => {
  assert.equal(og(grade(sport("9a", "o"))), "O0+"); // first-try 9a is a fight
  assert.equal(og(grade(sport("6a", "o"))), "O-3"); // onsight 6a is the approach
  assert.equal(og(grade(sport("7a", "o"))), "O-2-"); // matches his own DNA example
  assert.equal(og(grade(sport("9a", "s5"))), "O5"); // five sessions
  assert.equal(og(grade(sport("9a", "g1"))), "O0+"); // first go after inspection
  assert.equal(og(grade(sport("9a", "g2"))), "O1-"); // second go
  assert.equal(og(grade(sport("9a", "g3"))), "O1");
  assert.equal(og(grade(sport("9a", "t4"))), "O1+"); // up to 5 tries = one session
});

test("try counts above five assume about four tries a session", () => {
  const r = grade(sport("9a+", "t12"));
  assert.equal(r.n, 3);
  assert.equal(r.conf, "estimated");
});

test("estimator uses first-try odds from the scorecard", () => {
  // 8a: he climbs 80% first try, so the estimate is the first-try grade.
  const easy = grade(sport("8a", ""));
  assert.equal(easy.split.p, 0.8);
  assert.equal(og(easy), "O-1");
  // 9b: never done first try, so the estimate is his typical redpoint.
  const hard = grade(sport("9b", ""));
  assert.equal(hard.split.p, 0);
  assert.equal(og(hard), "O7");
});

test("first-try share never rises with grade and stays a probability", () => {
  for (const t of ["S", "B", "T"]) {
    for (let i = 0; i < SCALES[t].length; i++) {
      const m = mix(t, i);
      if (m.none) continue;
      assert.ok(m.p >= 0 && m.p <= 1, `${t} ${SCALES[t][i]} p=${m.p}`);
      const [typ, lo, hi] = m.rp;
      assert.ok(lo <= typ && typ <= hi, `${t} ${SCALES[t][i]} redpoint range`);
    }
  }
  const sp = SCALES.S.map((_, i) => mix("S", i)).filter((m) => !m.none).map((m) => m.p);
  for (let i = 1; i < sp.length; i++) assert.ok(sp[i] <= sp[i - 1], "sport p is non-increasing");
});

test("grades past anything climbed have no model", () => {
  assert.equal(mix("S", SCALES.S.indexOf("9c+")).none, true);
  assert.equal(grade(sport("9c+", "")).head, "O?");
});

test("tier names follow the scale", () => {
  assert.equal(tierName(0, "+"), "First try, a muerte");
  assert.equal(tierName(1, ""), "One session");
  assert.equal(tierName(60, ""), "A multi-year project");
});

test("every logged climb gets a grade", () => {
  assert.ok(climbs.length > 2000);
  for (const c of climbs) {
    const r = grade(c);
    assert.equal(typeof r.n, "number", c.n);
    assert.ok(r.why, c.n);
  }
});
