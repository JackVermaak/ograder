# Data

## Files

| File | What it is | Edit it? |
| --- | --- | --- |
| `data/snapshot.txt` | Every ascent as of 12–13 November 2026 | Only when doing a full refresh |
| `data/additions.txt` | Ascents added by hand since the snapshot | Yes |
| `public/ograder/data.js` | What the site loads; built from the two files above | No, run `npm run build` |

New ascents listed on climbing-history.org don't need to go anywhere: the Worker
(`src/index.js`) fetches them about once a day and the pages merge them in.

## snapshot.txt format

The file has four sections, each starting with a line that begins with `#`:

- `#CRAGS`: one crag per line, as `Crag, Country`. Rows refer to crags by line
  number, counting from 0.
- `#S` (sport), `#B` (boulders), `#T` (trad): one ascent per line as

  ```
  name|crag index|grade|two-digit year|code
  ```

  A missing crag or year is left empty.

The codes are the same as in `additions.txt`:

| Code | Meaning | O-grade |
| --- | --- | --- |
| `o` | Onsight | O0 or lower, depending on grade |
| `f` | Flash | O0 or lower, depending on grade |
| `co`, `cf` | Onsight or flash, read from his logbook comment | as above, marked "Logbook comment" |
| `g2`, `g3` … | Sent on the 2nd, 3rd … go | O1 (`g1` means a first go after inspection: O0+) |
| `t7` | 7 tries in total | O1 up to 5 tries, otherwise about 4 tries per session |
| `s5` | 5 sessions | O5 |
| `d5` | 5 days, read from a comment | O5, marked "Logbook comment" |
| `w` | Redpoint, sessions unknown | His typical session count at that grade |
| `!` at the end | His first ascent | |

## Where the snapshot came from

- **Routes and boulders with their style** (onsight, flash, second go, redpoint):
  his 8a.nu logbook, cross-checked against the list of routes he publishes at
  adamondra.com.
- **Session counts and trad ascents:** climbing-history.org, plus counts parsed
  from his own logbook comments.
- **First-try rates by grade** (used by the estimator): his 8a.nu scorecard
  statistics. These are typed into `public/ograder/app.js` as `STATS` and `MODEL`.
- **O-grades he stated himself:** `STATED` in `public/ograder/app.js`.
