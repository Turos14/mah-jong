# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A French-language static web app for tracking Mahjong ("Maj-hong") game scores. Players fill their hand with tiles (drag/tap from a tile tray) and the app detects the combinations of **Chinese Official Mahjong (MCR, 81 fans)** and computes the round payout. There is no build step, no package manager and no backend. Tailwind CSS (`cdn.tailwindcss.com`) and Chart.js (jsDelivr) are loaded from CDN in `index.html`.

## Layout

```
maj-jong/                  # the deployed site root (GitHub Pages uploads this directory only)
  index.html               # markup only; loads the scripts below in order (plain <script>, no modules)
  css/app.css
  sw.js, manifest.webmanifest, icons/
  assets/tiles/<id>.png    # 42 tile images cropped from the supplied sheet (ids below)
  js/
    data/tiles.js          # tile catalogue + helpers (isSuited, isHonor, ...)
    data/fans.js           # FANS (81 combos: value, FR/ZH name, description, exclusions, example), HAND_TYPES
    engine/hand.js         # hand model (createHand, handFromSpec, countUsed, seatWindOf)
    engine/fans-engine.js  # evaluateHand(): pure, no DOM
    engine/payout.js       # computePayout(): winner/loser point transfers
    state.js, storage.js   # globals (gameState, currentCalcState) and localStorage helpers
    ui/                    # dashboard, tile-editor, calculator, rules, parties (DOM + render functions)
    app.js                 # initGame(), switchTab(), PWA install
tests/engine.test.js       # node tests for the engine (no dependencies)
```

Scripts share globals (top-level `const`/`function`), so **load order in `index.html` matters** and the engine files must stay DOM-free: `tests/engine.test.js` concatenates `data/*` and `engine/*` into a `vm` context.

## Commands

- Run the app: `python3 -m http.server -d maj-jong 8000` then open `http://localhost:8000/` (the service worker only registers over http/localhost). Once installed, the service worker serves cached files — hard-reload or use DevTools "Bypass for network".
- Tests: `node tests/engine.test.js`. They check the official value tiers (1…88, no 5), that all 81 fans exist, that every fan example in `data/fans.js` is a valid complete hand containing its own fan, and a few exclusion/payout cases. It prints only failures (`ÉCHEC …`) then « Tous les tests passent. »; there is no test framework or per-test filter — to debug one hand, add a temporary `check(...)` in the file or load the same `vm` context as the test does and call `evaluateHand(handFromSpec(spec), DEFAULT_CTX, true)` directly. There is no linter.

## Tiles and hands

Tile ids: `p1-p9` circles, `s1-s9` bamboos, `m1-m9` characters, `we ws ww wn` winds (E S W N), `dr dg dw` dragons (red, green, white), `f1-f4` flowers, `a1-a4` seasons. Max 4 copies per tile, 1 per flower/season (`maxCopies`), **shared by all players of the round** (`countUsedAll` in `ui/tile-editor.js`; the engine only checks one hand at a time).

UI vocabulary is Pong / Chow / Kong (internal kinds stay `pung`/`chow`/`kong`). Chow/pong/kong groups are **exposed by default** (`makeGroup` in `engine/hand.js`); the user unticks « Exposé » for concealed groups, which matters for concealed-hand fans. `handFromSpec` keeps its explicit `o` suffix semantics (no suffix = concealed).

`handFromSpec` (used by fan examples `ex` and the tests) takes `{ t?, g: ['<kind>[o]:<tiles>'], pr?, fl? }`: kind letter `c` chow, `p` pung, `k` kong, `n` knit, `x` pair, `f` free; trailing `o` = exposed; `pr` = the pair; `fl` = flowers/seasons; tiles space-separated. Example: `{ g: ['po:dr dr dr', 'c:m1 m2 m3', …], pr: 'p9 p9' }`.

A hand is `{ type, groups: [{ kind, open, tiles[] }], flowers[8] }`. `type` is one of `standard`, `knittedStraight`, `sevenPairs`, `orphans`, `knittedHonors` (see `HAND_TYPES`); `createHand(type)` builds the matching empty groups (chow/pung/kong/knit/pair/free slots). Only the winner can pick a non-standard type; other players are always standard and only score per-group fans (see below).

## Scoring engine

`evaluateHand(hand, ctx, isWinner)` returns `{ status, errors, warnings, fans[], total }`:

- Winner with a complete valid hand → `detectFans()`: structure fans, whole-tile fans (flushes, ranges, all-green…), win-method flags from `ctx`, then the `excl` lists in `FANS` remove combos already included in higher ones. "Chicken hand" (8) is added when nothing else scored. Flowers are added at 1 each.
- Anyone else, or an incomplete hand → `partialFans()`: only dragon/wind/terminal pungs, kongs and flowers.
- To add or fix a combination: edit its entry in `data/fans.js` (value, exclusions, example), add its detection in `detectFans()`, and run the tests — an entry with an `ex` gets tested and shown on the Règles page automatically.
- Known approximations: chow-pair fans (double chow, short straight, …) are counted per disjoint pair, and combinations are excluded only through the explicit `excl` lists, not the full MCR "no repeated scoring of the same tiles" rule.

`computePayout()` is the single source for the payout (used by the live preview and by `saveCalculatedRound()`): winner collects their hand value from each opponent (Tsumo) or the discarder (Ron), doubled if the Est is involved; non-winners settle the difference of their hand values, also doubled with the Est.

## State and rendering

`gameState` (players, `scores`, `rounds`) is persisted; `rounds[].impacts` is the source of truth and `recalculateScores()` rebuilds every `scores` array from it — never mutate `scores` directly. `currentCalcState` is transient calculator state (`playerHands[id] = { hand, flags }`, context, `cursor` = next hole to fill).

No framework: after mutating state call the relevant `render*()`/`update*()` (`initGame()` re-renders everything; tile edits go through `onHandChanged()`; context changes through `onContextChange()`). The four views (`view-dashboard|calculator|rules|parties`) are toggled by `switchTab()`; the tile dock (`#tile-dock`) is only shown on the calculator tab. The Règles page is generated from `data/fans.js` by `renderRules()`.

Saved games live in `localStorage` under `majhong_parties_v1` as `{ id, name, updatedAt, gameState }`; old saves with the legacy fields (`startingPoints`, rounds without `winnerHand`) still load.

## PWA / deployment

`sw.js` is a cache-first service worker with an explicit `ASSETS` list. **When you add, rename or change any cached file (HTML, CSS, JS, tiles, icons, manifest), update `ASSETS` if the file is new and bump `CACHE_NAME`** — otherwise installed clients keep serving the stale version. iOS has no install prompt (manual "Add to Home Screen").

`.github/workflows/deploy.yml` publishes `./maj-jong` to GitHub Pages on every push to `main`.
