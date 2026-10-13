# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file French-language web app for tracking Mahjong (Mah-jong / "Maj-hong") game scores, with a built-in hand-value calculator for a traditional multi-player scoring system. The entire app — markup, styling, and logic — lives in `maj-jong/index.html`. There is no build step, no package manager, and (currently) no git repository initialized.

Dependencies are loaded from CDN directly in `<head>`: Tailwind CSS (`cdn.tailwindcss.com`) for styling and Chart.js for the score-progression chart. There is no bundler, transpiler, or test suite.

## Running / developing

Open `maj-jong/index.html` directly in a browser (or serve the `maj-jong/` directory with any static file server). Changes take effect on reload — no build or compile step. There are no lint or test commands configured in this project.

## Architecture

Everything is driven by two global, in-memory state objects defined at the top of the `<script>` block:

- `gameState` — the persisted game: `playerCount`, `startingPoints`, `players` (each with `id`, `name`, and a `scores` array that is one longer than `rounds` — index 0 is the starting score), and `rounds` (history of completed hands, each storing the winner, the "Est"/dealer, victory method, and per-player point `impacts`).
- `currentCalcState` — transient UI state for the hand calculator: which player's tab is active, who is Est (dealer) and winner, the victory method (`tsumo`/`ron`), the discarder (for `ron`), and `playerHands` — a per-player breakdown of selected scoring-matrix entries.

Scoring rules are declaratively encoded in `MATRIX_SCHEMA` (base combinations, general multipliers/doublons, winner-only fixed bonuses, and winner-only final multipliers). `renderMatrixForm()` generates the input grid directly from this schema, so **adding or changing a scoring rule means editing `MATRIX_SCHEMA`**, not the render function.

`calculateSingleHand(playerId)` is the sole scoring engine: base points × 2^(general doublons), plus winner-only fixed bonuses, × 2^(winner-only special doublons), then rounded up to the nearest 10. Both the live calculator UI and `saveCalculatedRound()` call this (or reimplement its payout logic) — if you change the scoring formula, check both `updateCalculations()` and `saveCalculatedRound()`, since they duplicate the point-transfer logic (winner payout + cross-settlement between non-winning players, both doubled when "Est" is involved) rather than sharing a single function.

The three top-level views (`view-dashboard`, `view-calculator`, `view-parties`) are plain `div`s toggled via `switchTab()` — there's no router. `view-dashboard` shows the leaderboard, Chart.js progression chart, and round history; `view-calculator` is the per-hand scoring form; `view-parties` manages saved games.

### Persistence

Saved games ("parties") live in `localStorage` under the key `majhong_parties_v1` as an array of `{ id, name, updatedAt, gameState }`. `currentPartyId`/`currentPartyName` track which save (if any) is currently loaded; an unsaved game has no label and is purely in-memory until `doSaveParty`/`doCreateParty` is called. There is no server/backend — all state is per-browser.

### Re-render pattern

There's no reactive framework: any state mutation is followed by manually calling the relevant `render*()`/`update*()` functions (commonly bundled via `initGame()`, which re-renders everything). When adding a new state field or control, follow this same pattern — mutate `gameState`/`currentCalcState`, then call the render functions for whatever UI depends on it.
