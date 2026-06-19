import { ChessboardDnDProvider, HighlightChessboard } from 'react-chess-core';
import type { LineTrainSide } from './LineBoardWithControls';

export interface LineBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  trainSide: LineTrainSide;
  draggable: boolean;
  correctMoveSquare?: string | null;
  lastMoveUci?: string | null;
  onPieceDrop: (source: string, target: string, piece: string) => boolean;
  boardWidth: number;
}

/**
 * Board view for line drilling: a plain themed board that only lets the trainer
 * side's pieces be dragged. Move validation and sequencing live in
 * {@link LineBoardWithControls}.
 */
export const LineBoard = ({
  fen,
  orientation,
  trainSide,
  draggable,
  correctMoveSquare = null,
  lastMoveUci = null,
  onPieceDrop,
  boardWidth,
}: LineBoardProps) => (
  <ChessboardDnDProvider>
    <HighlightChessboard
      boardWidth={boardWidth}
      checkSquare=""
      hintSquare={null}
      incorrectMoveSquare={null}
      correctMoveSquare={correctMoveSquare}
      position={fen}
      boardOrientation={orientation}
      arePiecesDraggable={draggable}
      isDraggablePiece={({ piece }: { piece: string }) => piece[0] === trainSide}
      onPieceDrop={(source: string, target: string, piece: string) =>
        onPieceDrop(source, target, piece)
      }
      lastMoveUci={lastMoveUci}
      autoPromoteToQueen
      areArrowsAllowed={false}
      customBoardStyle={{ borderRadius: 4 }}
    />
  </ChessboardDnDProvider>
);
