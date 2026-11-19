# O-Grader

Every climb Adam Ondra has logged, graded by how much trouble it gave him.
O0 means he did it first try. O60 means Silence.

**Live at [jackingtothemax.com/ograder](https://jackingtothemax.com/ograder/)**

- **Logbook:** search 2,400+ of his sport routes, boulders and trad climbs and get each one's O-grade.
- **Estimator:** pick a grade and terrain to estimate the O-grade of a climb he hasn't done.
- **About:** what O-grades are, how each one is worked out, and where the data comes from.

## What an O-grade is

The Wide Boyz (Tom Randall and Pete Whittaker) proposed the scale: a flash is O0,
one session is O1, two sessions is O2. Ondra extended it with minus grades for
warm-ups and a plus or minus suffix for a hard fight or a casual send. The site
uses his own examples as fixed points.

## How it works

The site is a set of static pages served by a Cloudflare Worker.

- `public/ograder/` holds the pages, styles, script and fonts. `app.js` contains
  the grading logic and the estimator model.
- `public/ograder/data.js` holds every ascent. It is built from the files in `data/`.
- `src/index.js` adds one dynamic address, `/ograder/latest.json`. It fetches
  Ondra's newest ascents from climbing-history.org about once a day, and the
  pages merge them in, so new hard sends appear without a redeploy.

```
.
├── data/
│   ├── snapshot.txt      every ascent as of November 2026
│   └── additions.txt     ascents you add by hand
├── docs/DATA.md          data format and sources
├── public/
│   ├── index.html        sends the bare Worker address to /ograder/
│   ├── robots.txt
│   └── ograder/          the site
├── scripts/
│   └── build-data.mjs    builds data.js from data/
├── src/
│   └── index.js          the Worker
└── wrangler.jsonc        Worker name, routes and settings
```

## Running it locally

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
npm install
npm run dev
```

Then open <http://localhost:8787/ograder/>.

## Deploying

From your own machine:

```sh
npx wrangler login   # once
npm run deploy
```

This builds `data.js` and deploys the Worker with the routes in `wrangler.jsonc`.
Deploy only this way: an upload through the Cloudflare dashboard would replace
the Worker script.

### Automatic deploys from GitHub

`.github/workflows/deploy.yml` checks every push and pull request. Pushes to
`main` also deploy, once you add two repository secrets under
**Settings → Secrets and variables → Actions**:

| Secret | Where to find it |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard, Workers & Pages overview, right-hand side |
| `CLOUDFLARE_API_TOKEN` | My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template, limited to your account and the jackingtothemax.com zone |

Without the secrets the workflow still runs the checks and skips the deploy.

## Adding an ascent by hand

Add a line to `data/additions.txt`, for example:

```
S | Example Route | Flatanger, Norway | 9b | 2026 | s8!
```

The format and codes are explained at the top of that file and in
[docs/DATA.md](docs/DATA.md). Then run `npm run deploy`, or push to `main` if
automatic deploys are set up. The build stops with a clear message if a line
is malformed or the climb is already in the data.

## Checks

```sh
npm run check
```

Builds the data, checks both scripts parse and validates the Worker config
without deploying.

## Credits

- O-grade scale: the Wide Boyz, extended by Adam Ondra.
- Data: Adam Ondra's logbook on [8a.nu](https://www.8a.nu/user/adam-ondra/sportclimbing),
  his [list of routes](https://www.adamondra.com/list-of-routes), and
  [climbing-history.org](https://climbing-history.org/climber/467/adam-ondra).
- Fonts: Big Shoulders Display and Instrument Sans, under the SIL Open Font License.

This is an unofficial fan project, not affiliated with Adam Ondra, the Wide Boyz,
8a.nu or climbing-history.org.

## Licence

The code is MIT licensed, see [LICENSE](LICENSE). The data and fonts are not
covered by that licence.
