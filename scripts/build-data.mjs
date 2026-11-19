// Builds public/ograder/data.js from data/snapshot.txt plus data/additions.txt.
// Run with: npm run build  (also runs automatically before npm run deploy)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(root, "data", "snapshot.txt");
const ADDITIONS = join(root, "data", "additions.txt");
const OUT = join(root, "public", "ograder", "data.js");

const SCALES = {
  S: ["4", "5a", "5b", "5c", "6a", "6a+", "6b", "6b+", "6c", "6c+", "7a", "7a+", "7b", "7b+", "7c", "7c+", "8a", "8a+", "8b", "8b+", "8c", "8c+", "9a", "9a+", "9b", "9b+", "9c", "9c+"],
  B: ["5", "6A", "6A+", "6B", "6B+", "6C", "6C+", "7A", "7A+", "7B", "7B+", "7C", "7C+", "8A", "8A+", "8B", "8B+", "8C", "8C+", "9A", "9A+"],
  T: ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12"],
};
const CODE = /^(o|f|w|co|cf|g\d+|t\d+|s\d+|d\d+)!?$/;

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ---- read the snapshot: #CRAGS, then #S, #B and #T rows of name|crag index|grade|yy|code
const crags = [];
const rows = { S: [], B: [], T: [] };
let section = "";
for (const line of readFileSync(SNAPSHOT, "utf8").split("\n")) {
  if (!line) continue;
  if (line.startsWith("#")) { section = line.slice(1); continue; }
  if (section === "CRAGS") crags.push(line);
  else if (rows[section]) rows[section].push(line);
  else throw new Error(`snapshot.txt: line outside a section: ${line}`);
}
const seen = new Set();
for (const t of Object.keys(rows)) for (const r of rows[t]) seen.add(t + norm(r.split("|")[0]));

// ---- read additions: type | name | crag | grade | year | code   (# starts a comment)
const errors = [];
let added = 0;
readFileSync(ADDITIONS, "utf8").split("\n").forEach((raw, i) => {
  const line = raw.replace(/#.*$/, "").trim();
  if (!line) return;
  const where = `additions.txt line ${i + 1}`;
  const p = line.split("|").map((x) => x.trim());
  if (p.length !== 6) return errors.push(`${where}: expected 6 fields separated by |, found ${p.length}`);
  const [type, name, crag, grade, year, code] = p;
  if (!SCALES[type]) return errors.push(`${where}: type must be S, B or T, not "${type}"`);
  if (!name) return errors.push(`${where}: name is empty`);
  if (!SCALES[type].includes(grade)) return errors.push(`${where}: "${grade}" is not a ${type} grade (examples: ${SCALES[type].slice(-4).join(", ")})`);
  if (!/^\d{4}$/.test(year)) return errors.push(`${where}: year must be four digits, like 2026`);
  if (!CODE.test(code)) return errors.push(`${where}: unknown code "${code}" (see the list at the top of the file)`);
  if (seen.has(type + norm(name))) return errors.push(`${where}: "${name}" is already in the data`);
  seen.add(type + norm(name));
  let c = "";
  if (crag) {
    let idx = crags.indexOf(crag);
    if (idx < 0) { crags.push(crag); idx = crags.length - 1; }
    c = String(idx);
  }
  rows[type].push([name, c, grade, year.slice(2), code].join("|"));
  added++;
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// ---- write data.js
const text = ["#CRAGS", ...crags, "#S", ...rows.S, "#B", ...rows.B, "#T", ...rows.T].join("\n");
writeFileSync(OUT, "window.OG_DATA=" + JSON.stringify(text) + ";\n");
const total = rows.S.length + rows.B.length + rows.T.length;
console.log(`data.js written: ${total} ascents (${added} from additions.txt)`);
