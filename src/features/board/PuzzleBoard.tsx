import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

export interface PuzzleBoardProps {
  position: PuzzlePosition;
  onFeedback: (feedbackData: any) => void;
  incInteractionNum: () => void;
  boardWidth: number;
  /** After a wrong guess, play the correct move instead of allowing retries. */
  revealAnswerOnIncorrect?: boolean;
}

export const PuzzleBoard = ({
  position,
  onFeedback,
  incInteractionNum,
  boardWidth,
  revealAnswerOnIncorrect = false,
}: PuzzleBoardProps) => {
  const onPieceDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (position.isSolutionRevealed()) {
      return false;
    }

    if (!position.isLegalMove(sourceSquare, targetSquare)) {
      return false;
    }

    const guess = position.tryGuess(sourceSquare, targetSquare, piece);
    if (!guess.accepted) {
      onFeedback({
        index: position.getIndex(),
        guess: { sourceSquare, targetSquare, piece },
        isCorrect: false,
      });
      incInteractionNum();
      setTimeout(() => {
        if (revealAnswerOnIncorrect) {
          position.resetInteractions();
          position.revealCorrectMove();
        } else {
          position.resetInteractions();
        }
        incInteractionNum();
      }, 500);
      return false;
    }

    onFeedback({
      index: position.getIndex(),
      guess: { sourceSquare, targetSquare, piece },
      isCorrect: true,
      isFinished: guess.finished,
    });
    incInteractionNum();
    setTimeout(() => {
      position.resetInteractions();
      incInteractionNum();
    }, 500);

    if (position.isAlternativeCheckmate()) {
      incInteractionNum();
      return true;
    }

    position.next();
    incInteractionNum();
    setTimeout(() => {
      if (!position.isFinished()) {
        position.next();
      }
      incInteractionNum();
    }, 500);

    return true;
  };

  return (
    <ChessboardDnDProvider>
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
    </ChessboardDnDProvider>
  );
};
