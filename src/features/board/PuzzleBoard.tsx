import { HighlightChessboard } from './HighlightChessboard';
import { PuzzlePosition } from '../position/Position';

export interface PuzzleBoardProps {
  position: PuzzlePosition;
  onFeedback: (feedbackData: any) => void;
  incInteractionNum: () => void;
  boardWidth: number;
}

export const PuzzleBoard = ({
  position,
  onFeedback,
  incInteractionNum,
  boardWidth,
}: PuzzleBoardProps) => {
  const onPieceDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (!position.isLegalMove(sourceSquare, targetSquare)) {
      return false;
    }

    const isCorrect = position.judgeGuess(sourceSquare, targetSquare, piece);
    onFeedback({
      index: position.getIndex(),
      guess: { sourceSquare, targetSquare, piece },
      isCorrect: isCorrect,
      isFinished: isCorrect && position.isCompletedByCorrectGuess(),
    });
    incInteractionNum();
    setTimeout(() => {
      position.resetInteractions();
      incInteractionNum();
    }, 500);
    // placeholder for apiProxy.onDropFeedback() call
    if (isCorrect) {
      position.next();
      incInteractionNum();
      setTimeout(() => {
        position.next();
        incInteractionNum();
      }, 500);
    }
    return isCorrect;
  };

  return (
    <HighlightChessboard
      boardWidth={boardWidth}
      checkSquare={position.getCheckSquare()}
      hintSquare={position.getHintSquare()}
      incorrectMoveSquare={position.getIncorrectMoveSquare()}
      onPieceDrop={onPieceDrop}
      position={position.fen()}
      boardOrientation={position.getPlayerColor()}
      promotionDialogVariant="modal"
    />
  );
};
