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