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
  type OnRefutationResolved,
  type ResolveKnownRefutation,
} from 'react-chess-core';
import { PuzzlePosition, sideToMoveFromFen } from '../position/Position';
import { resolvePostCorrectContinue } from './postCorrectContinue';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

export type PuzzleMissFeedback = {
  refutationSan: string | null;
  phase: MissSequencePhase | null;
  /** True while the board shows the correct-move answer arrow. */
  answerArrowVisible: boolean;
  /** Side to move on the board FEN currently shown (miss overlay may differ from puzzle state). */
  displaySideToMove: 'white' | 'black' | null;
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
  /**
   * Resume/review only: after answer-arrow recovery, auto-play the rest of the
   * segment (including later quiz plies) and finish as failed. Ordinary puzzles
   * ignore this and only auto-reply the opponent ply.
   */
  onAssistedRecoveryContinue?: (position: PuzzlePosition) => void;
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
  /** Play-time search depth; instant refutation cache requires the wrong line at this depth. */
  setupCacheTargetDepth?: number;
  /** Fires when the engine (not a cached refutation) resolves a refutation. */
  onRefutationResolved?: OnRefutationResolved;
  /** Async lookup of a stored refutation (e.g. backend cache). */
  resolveKnownRefutation?: ResolveKnownRefutation;
  answerArrowColor?: string;
  /** While the next card is loading, keep the prior board visible but locked. */
  positionLocked?: boolean;
  /** Fired when refutation miss feedback changes (for host UI). */
  onMissFeedbackChange?: (feedback: PuzzleMissFeedback | null) => void;
  /** When set, replaces the live puzzle position with the completion recap board. */
  recapBoard?: PuzzleRecapBoardState | null;
  /** Increment to reveal the current-move answer arrow without auto-playing the line. */
  showCurrentMoveSignal?: number;
  /** When true, dismiss miss/refutation overlays so the solution walkthrough owns the board. */
  solutionWalkthroughActive?: boolean;
  /** Non-zero while the opponent setup lead-in move is sliding onto the board. */
  setupIntroAnimationMs?: number;
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
  onAssistedRecoveryContinue,
  revealAnswerOnIncorrect = false,
  showAnswerArrowOnIncorrect = false,
  allowRetryOnIncorrect = true,
  showRefutationOnIncorrect = false,
  autoShowWrongMoves = true,
  refutationEngine,
  setupCacheTargetDepth,
  onRefutationResolved,
  resolveKnownRefutation,
  answerArrowColor = DEFAULT_ANSWER_ARROW_COLOR,
  positionLocked = false,
  onMissFeedbackChange,
  recapBoard = null,
  showCurrentMoveSignal = 0,
  solutionWalkthroughActive = false,
  setupIntroAnimationMs = 0,
}: PuzzlePlaySurfaceProps) => {
  const [showAnswerArrow, setShowAnswerArrow] = useState(false);
  /** "Show move" hint arrow — purely visual, never wired into click-to-move. */
  const [showHintArrow, setShowHintArrow] = useState(false);
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
    setupCacheTargetDepth,
    onRefutationResolved,
    resolveKnownRefutation,
  });

  const missPhase = missBoard.phase;
  const answerArrowVisible =
    showAnswerArrow ||
    (useRefutation && incorrectActive && missPhase === 'answer');
  /** Any arrow (hint or post-miss answer) currently drawn on the board. */
  const anyArrowVisible = showHintArrow || answerArrowVisible;

  const overlayIncorrectSquare =
    useRefutation && incorrectActive && !anyArrowVisible
      ? missBoard.incorrectMoveSquare
      : transientIncorrectSquare;
  const refutationMoveSquare =
    useRefutation && incorrectActive && !anyArrowVisible
      ? missBoard.refutationMoveSquare
      : null;

  const boardOrientation = position
    ? (position.getPlayerColor() as 'white' | 'black')
    : boardOrientationRef.current;

  if (position) {
    boardOrientationRef.current = boardOrientation;
    boardFenRef.current = position.fen();
  }

  const resolvedBoardOrientation = boardOrientationRef.current;

  const boardFen = boardFenRef.current;
  const hasBoard = boardFen !== EMPTY_BOARD_FEN;
  const isRecapping = recapBoard !== null;

  const displayFen = isRecapping
    ? recapBoard.fen
    : useRefutation && incorrectActive
      ? missBoard.boardPosition
      : boardFen;

  useEffect(() => {
    if (showCurrentMoveSignal <= 0 || !position || position.isFinished()) {
      return;
    }

    // Show move owns the board feedback — clear miss/refutation overlays.
    setIncorrectActive(false);
    missBoard.missSequence.clearSequence();
    clearCorrectMoveFeedback();
    clearIncorrectMoveFeedback();
    position.resetInteractions();
    setShowHintArrow(true);
    incInteractionNum();
    // missSequence is a stable controller from useMissBoard; omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signal-driven reveal only
  }, [
    clearCorrectMoveFeedback,
    clearIncorrectMoveFeedback,
    incInteractionNum,
    position,
    showCurrentMoveSignal,
  ]);

  useEffect(() => {
    if (!solutionWalkthroughActive) {
      return;
    }

    setIncorrectActive(false);
    setShowAnswerArrow(false);
    setShowHintArrow(false);
    missBoard.missSequence.clearSequence();
    clearCorrectMoveFeedback();
    clearIncorrectMoveFeedback();
    onMissFeedbackChange?.(null);
    // missSequence is a stable controller from useMissBoard; omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- walkthrough owns the board
  }, [
    clearCorrectMoveFeedback,
    clearIncorrectMoveFeedback,
    onMissFeedbackChange,
    solutionWalkthroughActive,
  ]);

  const puzzleMoveIndex = position?.getIndex() ?? -1;
  useEffect(() => {
    // Arrow is for the current quiz ply only; drop it if the line advanced.
    setShowAnswerArrow(false);
    setShowHintArrow(false);
  }, [puzzleMoveIndex]);

  useEffect(() => {
    setShowAnswerArrow(false);
    setShowHintArrow(false);
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
        displaySideToMove: sideToMoveFromFen(displayFen),
      });
      return;
    }
    if (anyArrowVisible) {
      onMissFeedbackChange({
        refutationSan: null,
        phase: null,
        answerArrowVisible: true,
        displaySideToMove: position
          ? sideToMoveFromFen(position.fen())
          : null,
      });
      return;
    }
    onMissFeedbackChange(null);
  }, [
    anyArrowVisible,
    answerArrowVisible,
    displayFen,
    incorrectActive,
    missBoard.phase,
    missBoard.refutation.refutationSan,
    onMissFeedbackChange,
    position,
    useRefutation,
  ]);

  const simpleArrows = useMemo<[string, string, string][]>(() => {
    // Show move / answer-arrow must draw even when miss-refutation mode is enabled.
    if (!anyArrowVisible || !position) {
      return [];
    }
    const moveUci = position.getExpectedMoveUci();
    if (moveUci.length < 4) {
      return [];
    }
    return [[moveUci.slice(0, 2), moveUci.slice(2, 4), answerArrowColor]];
  }, [anyArrowVisible, position, answerArrowColor]);

  const customArrows = isRecapping
    ? recapBoard.customArrows
    : anyArrowVisible
      ? simpleArrows
      : useRefutation && incorrectActive
        ? missBoard.customArrows
        : [];

  const lastMoveUci = isRecapping
    ? recapBoard.lastMoveUci
    : anyArrowVisible
      ? // Avoid stacking the opponent's previous ply on top of the shown move.
        null
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

  const playerColorChar = resolvedBoardOrientation === 'white' ? 'w' : 'b';
  const isDraggablePiece = ({ piece }: { piece: string }) =>
    piece[0] === playerColorChar;

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
      clearCorrectMoveFeedback();
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
        if (!attemptedUci) {
          showIncorrectMove(sourceSquare);
          position.resetInteractions();
          bumpRevision();
          return false;
        }
        setIncorrectActive(true);
        missBoard.missSequence.startSequence(setupFen, attemptedUci);
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

      const continueMode = resolvePostCorrectContinue({
        assistedByAnswerArrow,
        hasResumeConfig: position.hasResumeConfig(),
        onAssistedRecoveryContinue,
      });

      // Resume/review assisted miss: play out the segment so auto-next can run.
      // Ordinary /puzzles (and clean corrects): one opponent auto-reply only.
      if (continueMode === 'assisted-recovery') {
        onAssistedRecoveryContinue?.(position);
        return;
      }

      if (continueMode === 'resume-auto-advance') {
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
      boardOrientation={resolvedBoardOrientation}
      arePiecesDraggable={arePiecesDraggable}
      isDraggablePiece={isDraggablePiece}
      areArrowsAllowed={false}
      clickToMoveHighlight={answerArrowVisible && !isRecapping}
      promotionDialogVariant="modal"
      animationDuration={
        isRecapping
          ? recapBoard.animationDuration
          : useRefutation && incorrectActive
            ? missBoard.animationDuration
            : setupIntroAnimationMs
      }
    />
  ) : null;
};
