import { useEffect, useMemo, useRef, useState } from 'react';
import { ChessboardDnDProvider } from 'react-chessboard';
import {
  HighlightChessboard,
  useBoardRevision,
  type AnalysisEngineOptions,
} from 'react-chess-core';
import {
  uciFromDrop,
  useReplayMissBoard,
  type MissSequencePhase,
} from 'react-chess-replay-trainer';
import { PuzzlePosition } from '../position/Position';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
const DEFAULT_ANSWER_ARROW_COLOR = '#42a5f5';

export type PuzzleMissFeedback = {
  refutationSan: string | null;
  phase: MissSequencePhase | null;
};

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
  /** After a wrong guess, show an arrow to the correct square. */
  showAnswerArrowOnIncorrect?: boolean;
  /** With {@link showAnswerArrowOnIncorrect}, allow wrong retries after the arrow. When false, only the arrow move is accepted. */
  allowRetryOnIncorrect?: boolean;
  /** With {@link showAnswerArrowOnIncorrect}, show wrong move + engine refutation before the answer arrow. */
  showRefutationOnIncorrect?: boolean;
  /** When {@link showRefutationOnIncorrect}, show the wrong move on the board before the refutation. */
  autoShowWrongMoves?: boolean;
  /** Stockfish options for refutation analysis. */
  refutationEngine?: AnalysisEngineOptions;
  answerArrowColor?: string;
  /** While the next card is loading, keep the prior board visible but locked. */
  positionLocked?: boolean;
  /** Fired when refutation miss feedback changes (for host UI). */
  onMissFeedbackChange?: (feedback: PuzzleMissFeedback | null) => void;
}

/**
 * Single mounted board for puzzle play. Keeps the prior board (and orientation)
 * visible while the next position loads so layout and perspective do not flicker.
 */
export const PuzzlePlaySurface = ({
  position,
  onFeedback,
  incInteractionNum,
  boardWidth,
  onResumeCorrect,
  revealAnswerOnIncorrect = false,
  showAnswerArrowOnIncorrect = false,
  allowRetryOnIncorrect = true,
  showRefutationOnIncorrect = false,
  autoShowWrongMoves = true,
  refutationEngine,
  answerArrowColor = DEFAULT_ANSWER_ARROW_COLOR,
  positionLocked = false,
  onMissFeedbackChange,
}: PuzzlePlaySurfaceProps) => {
  const [showAnswerArrow, setShowAnswerArrow] = useState(false);
  const [incorrectActive, setIncorrectActive] = useState(false);
  const { revision, bumpRevision } = useBoardRevision();
  const boardOrientationRef = useRef<'white' | 'black'>('white');
  const boardFenRef = useRef(EMPTY_BOARD_FEN);

  const notifyInteraction = () => {
    bumpRevision();
    incInteractionNum();
  };

  const expectedUci = position?.getExpectedMoveUci() ?? null;
  const positionFen = position?.fen() ?? boardFenRef.current;
  const useRefutation =
    showRefutationOnIncorrect && showAnswerArrowOnIncorrect;

  const missBoard = useReplayMissBoard({
    feedback: useRefutation && incorrectActive ? 'incorrect' : null,
    expectedUci: expectedUci || null,
    positionFen,
    answerArrowColor,
    autoShowWrongMoves,
    engineOptions: refutationEngine,
  });

  useEffect(() => {
    setShowAnswerArrow(false);
    setIncorrectActive(false);
  }, [position]);

  useEffect(() => {
    if (!onMissFeedbackChange) {
      return;
    }
    if (!useRefutation || !incorrectActive) {
      onMissFeedbackChange(null);
      return;
    }
    onMissFeedbackChange({
      refutationSan: missBoard.refutation.refutationSan,
      phase: missBoard.missSequence.sequence?.phase ?? null,
    });
  }, [
    incorrectActive,
    missBoard.missSequence.sequence?.phase,
    missBoard.refutation.refutationSan,
    onMissFeedbackChange,
    useRefutation,
  ]);

  if (position) {
    boardOrientationRef.current = position.getPlayerColor() as 'white' | 'black';
    boardFenRef.current = position.fen();
  }

  const boardOrientation = position
    ? (position.getPlayerColor() as 'white' | 'black')
    : boardOrientationRef.current;
  const boardFen = position?.fen() ?? boardFenRef.current;

  const missPhase = missBoard.missSequence.sequence?.phase;
  const answerArrowVisible = useRefutation
    ? incorrectActive && missPhase === 'answer'
    : showAnswerArrow;

  const simpleArrows = useMemo<[string, string, string][]>(() => {
    if (!showAnswerArrow || !position || useRefutation) {
      return [];
    }
    const moveUci = position.getExpectedMoveUci();
    if (moveUci.length < 4) {
      return [];
    }
    return [[moveUci.slice(0, 2), moveUci.slice(2, 4), answerArrowColor]];
  }, [showAnswerArrow, position, answerArrowColor, useRefutation]);

  const customArrows =
    useRefutation && incorrectActive
      ? missBoard.customArrows
      : simpleArrows;

  const displayFen =
    useRefutation && incorrectActive ? missBoard.boardPosition : boardFen;

  const missLocked =
    useRefutation &&
    incorrectActive &&
    (missBoard.boardAnimating ||
      missPhase === 'wrong' ||
      missPhase === 'refutation');

  const arePiecesDraggable =
    position !== null && !positionLocked && !missLocked;

  const onPieceDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (!position || positionLocked || position.isSolutionRevealed()) {
      return false;
    }

    if (position.hasResumeConfig() && !position.isQuizIndex()) {
      return false;
    }

    if (!position.isLegalMove(sourceSquare, targetSquare)) {
      return false;
    }

    if (
      answerArrowVisible &&
      !allowRetryOnIncorrect &&
      !position.isExpectedGuess(sourceSquare, targetSquare)
    ) {
      position.resetInteractions();
      return false;
    }

    const guess = position.tryGuess(sourceSquare, targetSquare, piece, {
      recordIfIncorrect: !(answerArrowVisible && !allowRetryOnIncorrect),
    });
    if (!guess.accepted) {
      onFeedback({
        index: position.getIndex(),
        guess: { sourceSquare, targetSquare, piece },
        isCorrect: false,
      });
      notifyInteraction();

      if (useRefutation) {
        const setupFen = position.fen();
        const attemptedUci = uciFromDrop(
          setupFen,
          sourceSquare,
          targetSquare,
          piece,
        );
        setIncorrectActive(true);
        if (attemptedUci) {
          missBoard.missSequence.startSequence(setupFen, attemptedUci);
        }
        position.resetInteractions();
        notifyInteraction();
        return false;
      }

      const revealIncorrectFeedback = () => {
        if (showAnswerArrowOnIncorrect) {
          position.resetInteractions();
          setShowAnswerArrow(true);
        } else if (revealAnswerOnIncorrect) {
          position.resetInteractions();
          position.revealCorrectMove();
        } else {
          position.resetInteractions();
        }
        notifyInteraction();
      };

      if (showAnswerArrowOnIncorrect && !allowRetryOnIncorrect) {
        revealIncorrectFeedback();
      } else {
        setTimeout(revealIncorrectFeedback, 500);
      }
      return false;
    }

    setShowAnswerArrow(false);
    setIncorrectActive(false);
    missBoard.missSequence.clearSequence();
    onFeedback({
      index: position.getIndex(),
      guess: { sourceSquare, targetSquare, piece },
      isCorrect: true,
      isFinished: guess.finished,
    });
    notifyInteraction();
    setTimeout(() => {
      position.resetInteractions();
      notifyInteraction();
    }, 500);

    if (position.isAlternativeCheckmate()) {
      notifyInteraction();
      return true;
    }

    position.next();
    notifyInteraction();

    if (position.hasResumeConfig()) {
      onResumeCorrect?.(position);
      return true;
    }

    setTimeout(() => {
      if (!position.isFinished()) {
        position.next();
      }
      notifyInteraction();
    }, 500);

    return true;
  };

  return (
    <ChessboardDnDProvider>
      <HighlightChessboard
        key={revision}
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
        position={displayFen}
        boardOrientation={boardOrientation}
        arePiecesDraggable={arePiecesDraggable}
        areArrowsAllowed={false}
        promotionDialogVariant="modal"
      />
    </ChessboardDnDProvider>
  );
};
