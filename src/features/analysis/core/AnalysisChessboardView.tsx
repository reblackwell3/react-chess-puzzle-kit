import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from 'react-chess-core';
import { getLastMoveSquareStyles } from '../analysisBoardHighlightColors';
import { AnalysisBoardModel } from './useAnalysisBoardModel';

/** Draggable analysis board (no surrounding layout chrome). */
export const AnalysisChessboardView = ({ model }: { model: AnalysisBoardModel }) => (
  <ChessboardDnDProvider>
    <HighlightChessboard
      checkSquare={model.checkSquare ?? ''}
      hintSquare={null}
      incorrectMoveSquare={null}
      position={model.fen}
      boardOrientation={model.boardOrientation}
      boardWidth={model.boardWidth}
      arePiecesDraggable={true}
      onPieceDrop={model.onPieceDrop}
      promotionDialogVariant="modal"
      customSquareStyles={
        model.lastMove
          ? getLastMoveSquareStyles(
              model.lastMove.from,
              model.lastMove.to,
              model.theme,
            )
          : {}
      }
    />
  </ChessboardDnDProvider>
);
