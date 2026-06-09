import { useEffect, useMemo, useState } from 'react';
import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
const DEFAULT_ANSWER_ARROW_COLOR = '#42a5f5';

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
  /** After a correct move in resume review, auto-show intervening plies. */
  onResumeCorrect?: (position: PuzzlePosition) => void;
  /** After a wrong guess, play the correct move instead of allowing retries. */
  revealAnswerOnIncorrect?: boolean;
  /** After a wrong guess, show an arrow to the correct square and allow retries. */
  showAnswerArrowOnIncorrect?: boolean;
  answerArrowColor?: string;
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
  onResumeCorrect,
  revealAnswerOnIncorrect = false,
  showAnswerArrowOnIncorrect = false,
  answerArrowColor = DEFAULT_ANSWER_ARROW_COLOR,
}: PuzzlePlaySurfaceProps) => {
  const [showAnswerArrow, setShowAnswerArrow] = useState(false);

  useEffect(() => {
    setShowAnswerArrow(false);
  }, [position]);

  const customArrows = useMemo<[string, string, string][]>(() => {
    if (!showAnswerArrow || !position) {
      return [];
    }
    const expectedUci = position.getExpectedMoveUci();
    if (expectedUci.length < 4) {
      return [];
    }
    return [
      [
        expectedUci.slice(0, 2),
        expectedUci.slice(2, 4),
        answerArrowColor,
      ],
    ];
  }, [showAnswerArrow, position, answerArrowColor]);

  const onPieceDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (!position || position.isSolutionRevealed()) {
      return false;
    }

    if (position.hasResumeConfig() && !position.isQuizIndex()) {
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
        if (showAnswerArrowOnIncorrect) {
          position.resetInteractions();
          setShowAnswerArrow(true);
        } else if (revealAnswerOnIncorrect) {
          position.resetInteractions();
          position.revealCorrectMove();
        } else {
          position.resetInteractions();
        }
        incInteractionNum();
      }, 500);
      return false;
    }

    setShowAnswerArrow(false);
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

    if (position.hasResumeConfig()) {
      onResumeCorrect?.(position);
      return true;
    }

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
        incorrectMoveSquare={
          showAnswerArrowOnIncorrect
            ? null
            : (position?.getIncorrectMoveSquare() ?? null)
        }
        customArrows={customArrows}
        onPieceDrop={onPieceDrop}
        position={position?.fen() ?? EMPTY_BOARD_FEN}
        boardOrientation={position?.getPlayerColor() ?? 'white'}
        arePiecesDraggable={position !== null}
        areArrowsAllowed={false}
        promotionDialogVariant="modal"
      />
    </ChessboardDnDProvider>
  );
};
