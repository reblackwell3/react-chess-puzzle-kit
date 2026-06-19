import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChessboardDnDProvider,
  HighlightChessboard,
  uciFromDrop,
  useBoardRevision,
  useCorrectMoveFeedback,
  useMissBoard,
  type AnalysisEngineOptions,
  type MissSequencePhase,
} from 'react-chess-core';
import { PuzzlePosition } from '../position/Position';

const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
const DEFAULT_ANSWER_ARROW_COLOR = '#42a5f5';

export type PuzzleMissFeedback = {
  refutationSan: string | null;
  phase: MissSequencePhase | null;
  /** True while the board shows the correct-move answer arrow. */
  answerArrowVisible: boolean;
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
  const attemptMissedRef = useRef(false);
  const { revision, bumpRevision } = useBoardRevision();
  const {
    correctMoveSquare,
    showCorrectMove,
    clearCorrectMoveFeedback,
  } = useCorrectMoveFeedback();
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

  const missPhase = missBoard.missSequence.sequence?.phase;
  const answerArrowVisible = useRefutation
    ? incorrectActive && missPhase === 'answer'
    : showAnswerArrow;

  useEffect(() => {
    setShowAnswerArrow(false);
    setIncorrectActive(false);
    attemptMissedRef.current = false;
    clearCorrectMoveFeedback();
    onMissFeedbackChange?.(null);
  }, [clearCorrectMoveFeedback, onMissFeedbackChange, position]);

  useEffect(() => {
    if (!onMissFeedbackChange) {
      return;
    }
    if (useRefutation && incorrectActive) {
      onMissFeedbackChange({
        refutationSan: missBoard.refutation.refutationSan,
        phase: missBoard.missSequence.sequence?.phase ?? null,
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
    missBoard.missSequence.sequence?.phase,
    missBoard.refutation.refutationSan,
    onMissFeedbackChange,
    showAnswerArrow,
    useRefutation,
  ]);

  if (position) {
    boardOrientationRef.current = position.getPlayerColor() as 'white' | 'black';
    boardFenRef.current = position.fen();
  }

  const boardOrientation = boardOrientationRef.current;
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
    position !== null &&
    !positionLocked &&
    !missLocked &&
    correctMoveSquare === null;

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
      snapBoardBack();
      return false;
    }

    const guess = position.tryGuess(sourceSquare, targetSquare, piece, {
      recordIfIncorrect: !(answerArrowVisible && !allowRetryOnIncorrect),
    });
    if (!guess.accepted) {
      attemptMissedRef.current = true;
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
        snapBoardBack();
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

  return (
    <ChessboardDnDProvider>
      {hasBoard ? (
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
          correctMoveSquare={correctMoveSquare}
          customArrows={customArrows}
          onPieceDrop={onPieceDrop}
          position={displayFen}
          boardOrientation={boardOrientation}
          arePiecesDraggable={arePiecesDraggable}
          areArrowsAllowed={false}
          promotionDialogVariant="modal"
          animationDuration={0}
        />
      ) : null}
    </ChessboardDnDProvider>
  );
};
