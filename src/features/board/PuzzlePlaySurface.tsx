import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HighlightChessboard,
  uciFromDrop,
  useBoardRevision,
  useCorrectMoveFeedback,
  useIncorrectMoveFeedback,
  useMissBoard,
  DEFAULT_ANSWER_ARROW_COLOR,
  type AnalysisEngineOptions,
  type MissSequencePhase,
} from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export type PuzzleMissFeedback = {
  refutationSan: string | null;
  phase: MissSequencePhase | null;
  /** True while the board shows the correct-move answer arrow. */
  answerArrowVisible: boolean;
};

/** Board state driven by the post-completion solution recap animation. */
export type PuzzleRecapBoardState = {
  fen: string;
  lastMoveUci: string | null;
  customArrows: [string, string, string][];
  animationDuration: number;
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
  /** When set, replaces the live puzzle position with the completion recap board. */
  recapBoard?: PuzzleRecapBoardState | null;
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
  recapBoard = null,
}: PuzzlePlaySurfaceProps) => {
  const [showAnswerArrow, setShowAnswerArrow] = useState(false);
  const [incorrectActive, setIncorrectActive] = useState(false);
  const attemptMissedRef = useRef(false);
  const { revision, bumpRevision } = useBoardRevision();
  const {
    correctMoveSquare,
    showCorrectMove,
    clearCorrectMoveFeedback,
  } = useCorrectMoveFeedback();
  const {
    incorrectMoveSquare: transientIncorrectSquare,
    showIncorrectMove,
    clearIncorrectMoveFeedback,
  } = useIncorrectMoveFeedback();
  const boardOrientationRef = useRef<'white' | 'black'>('white');
  const boardFenRef = useRef(EMPTY_BOARD_FEN);

  const notifyHost = () => {
    incInteractionNum();
  };

  const expectedUci = position?.getExpectedMoveUci() ?? null;
  const positionFen = position?.fen() ?? boardFenRef.current;
  const useRefutation =
    showRefutationOnIncorrect && showAnswerArrowOnIncorrect;

  /**
   * Force a chessboard remount after a rejected drop so pieces snap back.
   * Skip when refutation feedback drives `displayFen` — remounting blinks the
   * whole board without helping snap-back.
   */
  const snapBoardBack = () => {
    if (useRefutation) {
      return;
    }
    bumpRevision();
    incInteractionNum();
  };

  const missBoard = useMissBoard({
    feedback: useRefutation && incorrectActive ? 'incorrect' : null,
    expectedUci: expectedUci || null,
    positionFen,
    answerArrowColor,
    // Refutation + answer-arrow flows must run the full wrong→refutation→answer
    // sequence; the replay "retry without arrow" setting does not apply here.
    autoShowWrongMoves: useRefutation ? true : autoShowWrongMoves,
    engineOptions: refutationEngine,
  });

  const missPhase = missBoard.phase;
  const answerArrowVisible = useRefutation
    ? incorrectActive && missPhase === 'answer'
    : showAnswerArrow;

  const overlayIncorrectSquare =
    useRefutation && incorrectActive
      ? missBoard.incorrectMoveSquare
      : transientIncorrectSquare;
  const refutationMoveSquare =
    useRefutation && incorrectActive ? missBoard.refutationMoveSquare : null;

  useEffect(() => {
    setShowAnswerArrow(false);
    setIncorrectActive(false);
    attemptMissedRef.current = false;
    clearCorrectMoveFeedback();
    clearIncorrectMoveFeedback();
    onMissFeedbackChange?.(null);
  }, [
    clearCorrectMoveFeedback,
    clearIncorrectMoveFeedback,
    onMissFeedbackChange,
    position,
  ]);

  useEffect(() => {
    if (!onMissFeedbackChange) {
      return;
    }
    if (useRefutation && incorrectActive) {
      onMissFeedbackChange({
        refutationSan: missBoard.refutation.refutationSan,
        phase: missBoard.phase,
        answerArrowVisible,
      });
      return;
    }
    if (showAnswerArrow) {
      onMissFeedbackChange({
        refutationSan: null,
        phase: null,
        answerArrowVisible: true,
      });
      return;
    }
    onMissFeedbackChange(null);
  }, [
    answerArrowVisible,
    incorrectActive,
    missBoard.phase,
    missBoard.refutation.refutationSan,
    onMissFeedbackChange,
    showAnswerArrow,
    useRefutation,
  ]);

  const boardOrientation = position
    ? (position.getPlayerColor() as 'white' | 'black')
    : boardOrientationRef.current;

  if (position) {
    boardOrientationRef.current = boardOrientation;
    boardFenRef.current = position.fen();
  }

  const boardFen = boardFenRef.current;
  const hasBoard = boardFen !== EMPTY_BOARD_FEN;

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

  const isRecapping = recapBoard !== null;

  const customArrows = isRecapping
    ? recapBoard.customArrows
    : useRefutation && incorrectActive
      ? missBoard.customArrows
      : simpleArrows;

  const displayFen = isRecapping
    ? recapBoard.fen
    : useRefutation && incorrectActive
      ? missBoard.boardPosition
      : boardFen;

  const lastMoveUci = isRecapping
    ? recapBoard.lastMoveUci
    : useRefutation && incorrectActive
      ? missBoard.lastMoveUci
      : (position?.getLastMoveUci() ?? null);

  const missLocked = useRefutation && incorrectActive && missBoard.inputLocked;

  const arePiecesDraggable =
    !isRecapping &&
    position !== null &&
    !positionLocked &&
    !missLocked &&
    correctMoveSquare === null &&
    overlayIncorrectSquare === null;

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
      showIncorrectMove(sourceSquare);
      position.resetInteractions();
      snapBoardBack();
      return false;
    }

    const guess = position.tryGuess(sourceSquare, targetSquare, piece, {
      recordIfIncorrect: !(answerArrowVisible && !allowRetryOnIncorrect),
    });
    if (!guess.accepted) {
      attemptMissedRef.current = true;
      if (!useRefutation) {
        showIncorrectMove(sourceSquare);
      }
      onFeedback({
        index: position.getIndex(),
        guess: { sourceSquare, targetSquare, piece },
        isCorrect: false,
      });

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
        return true;
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
        snapBoardBack();
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
    onMissFeedbackChange?.(null);
    clearCorrectMoveFeedback();

    const assistedByAnswerArrow =
      answerArrowVisible && attemptMissedRef.current;
    const guessPayload = {
      index: position.getIndex(),
      guess: { sourceSquare, targetSquare, piece },
    };

    if (assistedByAnswerArrow) {
      // Miss feedback for this ply is already saved; dragging along the answer
      // arrow only continues the line — it must not count as a clean solve.
      if (guess.finished) {
        onFeedback({
          ...guessPayload,
          isCorrect: false,
          isFinished: true,
        });
      }
    } else {
      onFeedback({
        ...guessPayload,
        isCorrect: true,
        isFinished: guess.finished,
      });
    }

    position.next();
    boardFenRef.current = position.fen();
    notifyHost();

    const finishCorrectFeedback = () => {
      position.resetInteractions();
      notifyHost();

      if (position.isAlternativeCheckmate()) {
        return;
      }

      if (position.hasResumeConfig()) {
        onResumeCorrect?.(position);
        return;
      }

      if (!position.isFinished()) {
        position.next();
        boardFenRef.current = position.fen();
      }
      notifyHost();
    };

    showCorrectMove(targetSquare, finishCorrectFeedback);

    return true;
  };

  return hasBoard ? (
    <HighlightChessboard
      key={revision}
      boardWidth={boardWidth}
      checkSquare={isRecapping ? '' : (position?.getCheckSquare() ?? '')}
      hintSquare={isRecapping ? null : (position?.getHintSquare() ?? null)}
      incorrectMoveSquare={isRecapping ? null : overlayIncorrectSquare}
      refutationMoveSquare={isRecapping ? null : refutationMoveSquare}
      correctMoveSquare={isRecapping ? null : correctMoveSquare}
      customArrows={customArrows}
      lastMoveUci={lastMoveUci}
      onPieceDrop={onPieceDrop}
      position={displayFen}
      boardOrientation={boardOrientation}
      arePiecesDraggable={arePiecesDraggable}
      areArrowsAllowed={false}
      promotionDialogVariant="modal"
      animationDuration={
        isRecapping
          ? recapBoard.animationDuration
          : useRefutation && incorrectActive
            ? missBoard.animationDuration
            : 0
      }
    />
  ) : null;
};
