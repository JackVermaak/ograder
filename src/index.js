// Serves /ograder/latest.json: Adam Ondra's ascents newer than the site's
// data snapshot, read from climbing-history.org at most about once a day.
// Every other request falls through to the static files in ./public.

const SOURCE = "https://climbing-history.org/api/v1/climber/467/ascents";
const SINCE = "2026-11-01"; // a little before the snapshot; the page skips climbs it already has
const TTL = 86400; // seconds to keep a good answer
const RETRY = 600; // seconds to keep an empty answer after a failed fetch

let memo = null; // { at, body } kept in memory as a second layer behind the edge cache

const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
const HINT = /session|\bgo\b|\btry\b/i;

function stripHtml(s) {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Turns climbing-history's notes into the site's codes: s4 = 4 sessions, g2 = second go.
function sessionCode(a) {
  const body = (a.notes || "").split("### References")[0];
  const text = (stripHtml(a.subtitle) + " " + body).split(/(?<=[.!?])\s+|\n+/).filter((s) => HINT.test(s)).join(" ");
  let m;
  if ((m = text.match(/(\d+)\s+sessions?/i))) return "s" + m[1];
  if ((m = text.match(/\b(first|second|third|fourth|fifth|sixth)\s+(go|try)/i))) return "g" + ORDINALS[m[1].toLowerCase()];
  if ((m = text.match(/(\d+)(st|nd|rd|th)\s+(go|try)/i))) return "g" + m[1];
  return "";
}

export function compact(ascents, since = SINCE) {
  const out = [];
  for (const a of ascents || []) {
    if (!a || !a.successful || a.project || a.deleted_on) continue;
    const date = a.ascent_dt_end || a.ascent_dt_start || "";
    if (date < since) continue;
    const kind = a.climb_type || "";
    const t = kind.startsWith("Sport") ? "S" : kind.startsWith("Boulder") ? "B" : kind.startsWith("Trad") ? "T" : "";
    if (!t || !a.climb_name || !a.climb_grade) continue;
    const k = a.ascent_style === "Onsight" ? "o" : a.ascent_style === "Flash" ? "f" : sessionCode(a) || "w";
    out.push({ n: a.climb_name, g: a.climb_grade, t, k, y: date.slice(2, 4), fa: !!a.fa });
  }
  return out;
}

async function load() {
  const res = await fetch(SOURCE, {
    headers: { accept: "application/json", "user-agent": "O-Grader (https://jackingtothemax.com/ograder)" },
  });
  if (!res.ok) throw new Error("climbing-history answered " + res.status);
  const data = await res.json();
  return { updated: new Date().toISOString(), source: "climbing-history.org", ascents: compact(data.ascents) };
}

function json(body, maxAge) {
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=" + maxAge,
      // Public data: lets the copy of the site on jackvermaak.com/ograder read it too.
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/ograder/latest.json") return env.ASSETS.fetch(request);
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });

    const cache = caches.default;
    const key = new Request(url.origin + "/ograder/latest.json");
    const hit = await cache.match(key);
    if (hit) {
      // Answers cached before the CORS header was added lack it, so set it on every hit.
      const res = new Response(hit.body, hit);
      res.headers.set("access-control-allow-origin", "*");
      return res;
    }

    let body;
    let maxAge = TTL;
    if (memo && Date.now() - memo.at < TTL * 1000) {
      body = memo.body;
    } else {
      try {
        body = JSON.stringify(await load());
        memo = { at: Date.now(), body };
      } catch (err) {
        // climbing-history is down or said no: answer with what we have and try again later.
        body = memo ? memo.body : JSON.stringify({ updated: null, source: "climbing-history.org", ascents: [] });
        maxAge = RETRY;
      }
    }
    const res = json(body, maxAge);
    ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  },
};
