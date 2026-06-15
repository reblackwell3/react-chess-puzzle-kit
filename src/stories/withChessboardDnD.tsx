import React from 'react';
import { ChessboardDnDProvider } from 'react-chess-core';

/** Required by react-chessboard when rendering squares outside PuzzleBoard / AnalysisChessboardView. */
const withChessboardDnD = (Story: React.ComponentType) => (
  <ChessboardDnDProvider>
    <Story />
  </ChessboardDnDProvider>
);

export default withChessboardDnD;
