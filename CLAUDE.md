# Jeopardy Game — Electron App

## Project Overview

Desktop Jeopardy game built with Electron + React. One host operates the game at the computer; players watch the screen. No network/multiplayer needed.

## Tech Stack

- **Electron 32** — desktop shell, file system access
- **React 18 + Vite (electron-vite 2.3)** — UI renderer
- **TypeScript** — type safety
- **Zustand 5** — state management
- **JSON files in userData** — persisting game boards/levels

## Features

### Game Mode
- Classic Jeopardy board: categories (columns) × point values (rows)
- Click a cell → play sound → show the question full-screen
- Mark as answered (cell goes dark)
- Score tracker for players; host enters names before game starts
- **Daily Double (×2) tile** — one player selected, bet placed before question shown; correct = +bet, wrong = -bet
- **Penalized players** — "-$N" button deducts once then turns red/inactive (prevents double-click)
- "Game Over" screen with final ranking when all cells answered

### Level Editor
- Create/edit boards: configurable categories and point tiers
- Point values editable as comma-separated list (default: 100,200,300,400,500)
- Per cell: question text + answer text (color-coded) + optional **×2 toggle**
- Add/remove categories dynamically
- Save boards as JSON files to Electron's `userData/boards/`

### Import / Export
- Export board → `.jep` text file (via Save dialog)
- Import board ← `.jep` text file (via Open dialog) — saved to userData automatically
- `boards-import/` folder in repo contains ready-to-import `.jep` boards

## File Structure

```
jeopardy/
├── electron/
│   ├── main/
│   │   └── index.ts       # Main process: BrowserWindow + IPC handlers (boards CRUD, import/export)
│   └── preload/
│       └── index.ts       # IPC bridge: exposes window.api to renderer
├── src/
│   ├── App.tsx             # Root router (home / game / editor)
│   ├── main.tsx            # React entry point
│   ├── index.css           # Global styles + CSS vars
│   ├── env.d.ts            # Window.api type declarations
│   ├── types/
│   │   └── index.ts        # Board, Category, Question, Player, View
│   ├── store/
│   │   └── gameStore.ts    # Zustand store (all app state + actions)
│   ├── utils/
│   │   └── sounds.ts       # Web Audio API sound effects (tile, correct, wrong, daily double, game over)
│   └── views/
│       ├── Home.tsx         # Board selection + player setup + import/export
│       ├── GameBoard.tsx    # Game grid + scoreboard
│       ├── QuestionModal.tsx # Full-screen question/answer + scoring + Daily Double flow
│       └── Editor.tsx       # Board editor (create/edit categories & questions)
├── boards-import/           # Ready-to-import .jep board files
│   ├── it-event.jep         # IT-themed board for school event (grades 5–9)
│   └── fun-test.jep         # Light mixed-topic test board
├── index.html               # Renderer HTML (at project root)
├── electron.vite.config.ts  # electron-vite config with explicit entry paths
├── tsconfig.json            # References node + web tsconfigs
├── tsconfig.node.json       # For electron/ (main + preload)
├── tsconfig.web.json        # For src/ (renderer)
└── package.json
```

## Data Model

```typescript
interface Board {
  id: string
  name: string
  categories: Category[]
  pointValues: number[]     // e.g. [100, 200, 300, 400, 500]
}

interface Category {
  title: string
  questions: Question[]     // index matches pointValues index
}

interface Question {
  points: number
  question: string
  answer: string
  isDouble?: boolean        // Daily Double tile — player bets before seeing question
}

interface Player {
  id: string
  name: string
  score: number
}
```

## Daily Double (×2) Flow

1. Host clicks ×2 tile (purple, shows "×2" instead of dollar amount)
2. Modal: select which player is answering
3. Modal: player enters bet (1 – their current score)
4. Question shown → Reveal Answer
5. **Correct** → score += bet | **Wrong** → score -= bet
6. Cell marked as answered, modal closes

## .jep File Format

Plain text, used for import/export:

```
BOARD: Board Name
POINTS: 100,200,300,400,500

CATEGORY: Category Title
Q: Question text
A: Answer text

Q: Another question
A: Another answer
DOUBLE: true

CATEGORY: Next Category
...
```

- `DOUBLE: true` after an `A:` line marks the question as Daily Double
- Old `.jep` files without `DOUBLE:` import fine — `isDouble` defaults to `false`

## Sound Effects

All sounds generated via Web Audio API (`src/utils/sounds.ts`) — no external files:

| Event | Sound |
|-------|-------|
| Tile click | Short two-tone "pop" |
| Daily Double reveal | 4-note ascending fanfare |
| Correct answer | C → E → G ascending tones |
| Wrong answer | Low sawtooth buzz |
| Game Over | 6-note victory melody |

## Key Decisions

- All in one window (no separate host/player screens)
- Boards stored as JSON files in `app.getPath('userData')/boards/` — survives app reinstall
- `pointValues` array lives on Board level; Editor regenerates questions array when it changes
- Zustand `Set<string>` (`answeredCells`) keyed by `"${catIdx}-${qIdx}"` tracks answered state
- Daily Double max bet = player's current score (min $1 if score ≤ 0)
- Penalized state (`Set<string>`) lives in QuestionModal local state, resets on close

## electron-vite Config Notes

`index.html` must be at the project root (not `src/renderer/`). Had to explicitly set renderer root and input:

```ts
renderer: {
  root: resolve('.'),
  build: {
    rollupOptions: { input: { index: resolve('index.html') } }
  },
  plugins: [react()]
}
```

Main and preload entries must also be explicit:
```ts
main:    { build: { rollupOptions: { input: { index: resolve('electron/main/index.ts') } } } }
preload: { build: { rollupOptions: { input: { index: resolve('electron/preload/index.ts') } } } }
```

## CRITICAL: Running the App

**Do NOT run `npm run dev` from inside Claude Code's terminal.**

Claude Code is itself an Electron app and sets `ELECTRON_RUN_AS_NODE=1` in all child processes.
This forces Electron into Node.js mode — `process.type` becomes `undefined`, browser APIs
(`app`, `BrowserWindow`, etc.) don't initialize, and `require('electron')` returns the npm
stub path instead of the API.

**Always run from a regular terminal:**
```bash
cd /Users/stepankobrii/Documents/Projects/jeopardy
npm run dev
```

Or, if you must run from Claude Code:
```bash
ELECTRON_RUN_AS_NODE= npm run dev
```

## Development Commands

```bash
npm install
npm run dev      # Vite dev server + Electron (use regular terminal!)
npm run build    # Production build → out/
npm run package  # Package as .dmg / .exe via electron-builder
```
