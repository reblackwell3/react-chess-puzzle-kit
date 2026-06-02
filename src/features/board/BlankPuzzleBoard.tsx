import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from './HighlightChessboard';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export interface BlankPuzzleBoardProps {
  boardWidth: number;
}

/** Placeholder board that preserves puzzle layout while the next position loads. */
export const BlankPuzzleBoard = ({ boardWidth }: BlankPuzzleBoardProps) => (
  <ChessboardDnDProvider>
    <HighlightChessboard
      boardWidth={boardWidth}
      checkSquare=""
      hintSquare={null}
      incorrectMoveSquare={null}
      position={EMPTY_BOARD_FEN}
      arePiecesDraggable={false}
      boardOrientation="white"
      promotionDialogVariant="modal"
    />
  </ChessboardDnDProvider>
);
