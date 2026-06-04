# react-chess-puzzle-kit

```bash
npm install
npm run build
```

Build output: `dist/` (`index.js`, `index.esm.js`, `index.d.ts`). Re-run after source changes when consuming this package via `file:../react-chess-puzzle-kit`.

React components for **interactive chess puzzles** and **post-puzzle analysis**, built on [react-chessboard](https://github.com/Clariity/react-chessboard) and [chess.js](https://github.com/jhlywa/chess.js). Used in production at [endchess.training](https://endchess.training).

The library owns puzzle logic, move history, themes, and optional Stockfish analysis. **Defaults are included** for a full demo (controls + analysis UI); production apps usually replace those with custom render props.

---

## Install

```bash
npm install react-chess-puzzle-kit
```

**Peer dependencies:** `react`, `react-chessboard`, `chess.js`, `react-chess-core` (see `package.json` for versions).

Local development links core via `file:../react-chess-core` — build core first (`npm run build` in that repo), then install puzzle-kit (`npm install --legacy-peer-deps` if npm reports peer conflicts).

For engine analysis in the browser, also install Stockfish and copy WASM into your app’s static folder (see [Stockfish](#stockfish-browser-engine) below).

---

## See it in action (Storybook)

Storybook is the living docs and playground for every export.

```bash
git clone https://github.com/reblackwell3/react-chess-puzzle-kit.git
cd react-chess-puzzle-kit
npm install
npm run storybook          # http://localhost:6006
```

| Story | What it demonstrates |
|-------|----------------------|
| **PuzzleBoardWithControls** | Full puzzle flow with default controls (via decorator) |
| **PuzzleBoardWithControls → All library defaults** | Default controls + default analysis modal, sidebar, engine panel |
| **PuzzleBoard** | Puzzle board only (drag-and-drop, feedback highlights) |
| **Analysis / AnalysisBoard (defaults)** | Default modal, sidebar, grid, and engine panel |
| **HighlightChessboard** | Themed board with check / hint / incorrect square styles |

Optional: `npm run copy:stockfish` then open **Analysis → WithStockfishEngine** to exercise the worker.

Build a static catalog: `npm run build-storybook` → `npm run serve-storybook`.

---

## Quick start

`PuzzleBoardWithControls` is the main integration point: puzzle play, then analysis when the puzzle is finished or failed.

### All library defaults

Omit every render prop to use built-in puzzle controls and analysis UI. This matches **PuzzleBoardWithControls → All library defaults** in Storybook.

```tsx
import { PuzzleBoardWithControls } from 'react-chess-puzzle-kit';

export function PuzzleDemo() {
  return (
    <PuzzleBoardWithControls
      theme="dark"
      apiProxy={{
        onFetch: () => fetchPuzzleFromApi(),
        onFeedback: (data) => sendFeedbackToApi(data),
      }}
      engine={{ enabled: false }}
    />
  );
}
```

Defaults used when props are omitted:

| Prop | Default |
|------|---------|
| `renderControls` | `DefaultPuzzleControls` (hint, next, analysis, result labels) |
| `renderAnalysis*` | `AnalysisBoard` modal, sidebar, and `EngineEvaluationPanel` |
| `puzzleBoardWidth` | `DEFAULT_PUZZLE_BOARD_WIDTH` (480) |
| `analysisLayout` | `DEFAULT_ANALYSIS_LAYOUT` |

Reuse the controls alone:

```tsx
import {
  DefaultPuzzleControls,
  defaultRenderControls,
} from 'react-chess-puzzle-kit';

// Inside your own layout:
<DefaultPuzzleControls
  showHint={showHint}
  nextPuzzle={nextPuzzle}
  resultStatus={resultStatus}
  analysis={analysis}
/>;
```

In Storybook, the `withDefaultPuzzleControls` decorator does the same for stories that leave `renderControls` unset (see `src/stories/withDefaultPuzzleControls.tsx`).

### Custom UI (production)

```tsx
import {
  PuzzleBoardWithControls,
  DEFAULT_ANALYSIS_LAYOUT,
} from 'react-chess-puzzle-kit';

export function PuzzlePage() {
  return (
    <PuzzleBoardWithControls
      theme="dark"
      puzzleBoardWidth={560}
      analysisLayout={DEFAULT_ANALYSIS_LAYOUT}
      apiProxy={{
        onFetch: () => fetchPuzzleFromApi(),
        onFeedback: (data) => sendFeedbackToApi(data),
      }}
      renderControls={(showHint, nextPuzzle, resultStatus, analysis) => (
        <YourControls
          onHint={showHint}
          onNext={nextPuzzle}
          onOpenAnalysis={analysis.openAnalysis}
          canOpenAnalysis={analysis.visible}
        />
      )}
      renderAnalysisContainer={(props) => <YourAnalysisDialog {...props} />}
      renderAnalysisSidebar={(props) => <YourMoveList {...props} />}
      renderEngineEvaluation={(props) => <YourEnginePanel {...props} />}
      engine={{ depth: 16, multiPv: 2 }}
    />
  );
}
```

---

## What’s in the package

### Puzzle play

| Export | Role |
|--------|------|
| **`PuzzleBoardWithControls`** | Orchestrates fetch, puzzle board, controls slot, and analysis mode |
| **`DefaultPuzzleControls`** | Default hint / next / analysis button row |
| **`defaultRenderControls`** | Render-prop function wired to `DefaultPuzzleControls` |
| **`PuzzleBoard`** | Draggable puzzle board with correct/incorrect/hint feedback |
| **`PuzzlePosition`** | FEN + solution line, move index, guess judging |
| **`HighlightChessboard`** | `react-chessboard` + puzzle square highlights |
| **`ThemeProvider`** | Light/dark chessboard square colors (`board/chessboardTheme`) |
| **`boardSquareHighlightColors`** | Check / hint / incorrect overlays |
| **`analysisSidebarColors`** | Analysis move-list striping |

### Analysis

Analysis is split so apps can use **presets** or go **fully headless**:

| Layer | Location | Use when |
|-------|----------|----------|
| **Core** | `src/features/analysis/core/` | You want full control of layout and UI |
| **Defaults** | `src/features/analysis/defaults/` | You want a working modal + sidebar out of the box |

| Export | Role |
|--------|------|
| **`usePuzzleAnalysis`** | When analysis can open; snapshot of puzzle state |
| **`useAnalysisBoardModel`** | FEN, ply navigation, history, engine hook, drop handler (no JSX) |
| **`AnalysisBoardCore`** | Wires model + board; **requires** all `render*` props |
| **`AnalysisBoard`** | Same as core but fills missing render props with library defaults |
| **`AnalysisBoardLayout`** | Optional CSS grid: board column + sidebar column |
| **`AnalysisLayoutConfig`** | `{ boardWidth, sidebarWidth, columnGap }` |

### Engine

| Export | Role |
|--------|------|
| **`useAnalysisEngine`** | React hook: Stockfish eval + PV for a FEN |
| **`EngineEvaluationPanel`** | Default engine UI (used by `AnalysisBoard` unless overridden) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PuzzleBoardWithControls (host app)                         │
│  ├─ puzzle play → PuzzleBoard (puzzleBoardWidth)           │
│  └─ analysis open → AnalysisBoardCore | AnalysisBoard       │
│       ├─ renderContainer  (modal / page shell)              │
│       ├─ renderMain       (board + sidebar placement)       │
│       ├─ renderSidebar    (move list, nav)                  │
│       └─ renderEngineEvaluation (Stockfish lines)           │
└─────────────────────────────────────────────────────────────┘
```

**Separation of concerns**

- **Logic** — position, analysis context, engine hook, ply navigation (`core/` + `engine/`).
- **UI** — host render props, or `defaults/` (`AnalysisBoard`, `DefaultAnalysisSidebar`, `DefaultAnalysisContainer`, `EngineEvaluationPanel`).

Production apps (e.g. endchess-frontend) typically pass custom `renderAnalysis*` implementations and sizes via `puzzleBoardWidth` + `analysisLayout`, while reusing `useAnalysisBoardModel` behavior through `AnalysisBoardCore`.

---

## Board sizing

Puzzle and analysis boards can use **different pixel widths**:

```tsx
<PuzzleBoardWithControls
  puzzleBoardWidth={560}           // live puzzle
  analysisLayout={{
    boardWidth: 480,                 // analysis chessboard
    sidebarWidth: 500,
    columnGap: 16,
  }}
/>
```

Defaults: `DEFAULT_PUZZLE_BOARD_WIDTH` (480) and `DEFAULT_ANALYSIS_LAYOUT`. Override `renderAnalysisMain` for a fully custom layout (flex, MUI grid, etc.).

---

## Stockfish (browser engine)

Analysis runs Stockfish in a **Web Worker**. The host must serve the engine assets:

```bash
npm install stockfish --save-optional   # or a regular dependency
npm run copy:stockfish                  # copies to public/stockfish/ in this repo
```

In your app, copy the same files to `public/stockfish/` (or equivalent). Default script URL:

`/stockfish/stockfish-18-lite-single.js` (`.wasm` must sit beside it).

```tsx
<PuzzleBoardWithControls
  engine={{
    enabled: true,
    depth: 18,
    multiPv: 2,
    scriptUrl: '/stockfish/stockfish-18-lite-single.js',
  }}
/>
```

Disable the worker when you only need move replay: `engine={{ enabled: false }}`.

---

## Headless analysis example

Use `AnalysisBoardCore` when every visual piece comes from the host:

```tsx
import {
  AnalysisBoardCore,
  AnalysisBoardLayout,
  DEFAULT_ANALYSIS_LAYOUT,
} from 'react-chess-puzzle-kit';

<AnalysisBoardCore
  analysisContext={snapshot}
  theme="dark"
  boardWidth={layout.boardWidth}
  onClose={close}
  renderContainer={(p) => <MyDialog {...p} />}
  renderMain={({ board, sidebar, model }) => (
    <AnalysisBoardLayout layout={layout} model={model} board={board} sidebar={sidebar} />
  )}
  renderSidebar={(p) => <MySidebar {...p} />}
  renderEngineEvaluation={(p) => <MyEngine {...p} />}
/>;
```

---

## Development

```bash
npm run build              # Rollup → dist/
npm run storybook          # component docs & examples
npm run build-storybook    # static Storybook export
npm run copy:stockfish     # engine binaries for local Storybook
```

---

## Migration from `react-chessboard-with-controls`

The package was renamed to **`react-chess-puzzle-kit`** (v1.0.0). Update imports:

```diff
- import { PuzzleBoardWithControls } from 'react-chessboard-with-controls';
+ import { PuzzleBoardWithControls } from 'react-chess-puzzle-kit';
```

Component export names are unchanged for now. Rename the local clone folder to `react-chess-puzzle-kit` and point `file:../react-chess-puzzle-kit` in consuming apps.

---

## License

MIT © 2022–2026 Robert Blackwell
