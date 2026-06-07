import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export interface PuzzlePlaySurfaceProps {
  position: PuzzlePosition | null;
  onFeedback: (feedbackData: {
    index: number;
    guess?: { sourceSquare: string; targetSquare: string; piece: string };
    hintRequested?: boolean;
    solutionShown?: boolean;
    isCorrect?: boolean;
    isFinished?: boolean;
  }) => void;
  incInteractionNum: () => void;
  boardWidth: number;
  /** After a wrong guess, play the correct move instead of allowing retries. */
  revealAnswerOnIncorrect?: boolean;
}

/**
 * Single mounted board for puzzle play. Shows an empty board while the next
 * position loads so the layout and controls do not flicker between cards.
 */
export const PuzzlePlaySurface = ({
  position,
  onFeedback,
  incInteractionNum,
  boardWidth,
  revealAnswerOnIncorrect = false,
}: PuzzlePlaySurfaceProps) => {
  const onPieceDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (!position || position.isSolutionRevealed()) {
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
        checkSquare={position?.getCheckSquare() ?? ''}
        hintSquare={position?.getHintSquare() ?? null}
        incorrectMoveSquare={position?.getIncorrectMoveSquare() ?? null}
        onPieceDrop={onPieceDrop}
        position={position?.fen() ?? EMPTY_BOARD_FEN}
        boardOrientation={position?.getPlayerColor() ?? 'white'}
        arePiecesDraggable={position !== null}
        promotionDialogVariant="modal"
      />
    </ChessboardDnDProvider>
  );
};
