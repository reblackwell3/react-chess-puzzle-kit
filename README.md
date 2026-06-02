# react-chessboard-with-controls

This project aims to provide two implementations of the react chessboard, for puzzles and games.

## Analysis engine (Stockfish)

The analysis board runs Stockfish in a Web Worker. Host apps must serve the engine files from `public/stockfish/`:

```bash
npm install stockfish --save-optional   # or regular dependency
npm run copy:stockfish                  # copies lite single-thread build to public/stockfish/
```

Default script URL: `/stockfish/stockfish-18-lite-single.js` (`.wasm` must sit beside it).

Optional `engine` prop on `AnalysisBoard` / `PuzzleBoardWithControls`:

```tsx
<AnalysisBoard engine={{ depth: 18, multiPv: 2 }} ... />
```

### Analysis UI: `analysis/core` vs `analysis/defaults`

| Folder | Responsibility |
|--------|----------------|
| **`src/features/analysis/core/`** | Position, hooks, `AnalysisBoardCore`, render-prop types (`boardWidth` required) |
| **`src/features/analysis/defaults/`** | `AnalysisBoard`, optional `AnalysisBoardLayout` grid helper, `DEFAULT_ANALYSIS_LAYOUT` |

Public API is unchanged (`export * from './features/analysis'`).

- **`useAnalysisBoardModel`** — FEN, ply, engine eval, handlers (no JSX). Pass `boardWidth` from the host.
- **`AnalysisBoardCore`** — composition only; requires `renderMain`, `renderSidebar`, `renderContainer`, `renderEngineEvaluation`.
- **`AnalysisBoard`** — fills omitted render props with library defaults; optional `layout` for the default grid.

Host apps set **`puzzleBoardWidth`** (live puzzle) and **`analysisLayout`** (analysis dialog grid, including analysis `boardWidth`) on `PuzzleBoardWithControls`, or use custom `renderAnalysisMain` / `renderMain`.