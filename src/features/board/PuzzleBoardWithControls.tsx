import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PuzzleResultStatus, usePuzzleAnalysis } from '../analysis';
import {
  AnalysisBoard,
  AnalysisBoardCore,
  AnalysisBoardLayout,
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisEngineOptions,
  AnalysisErrorBoundary,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  AUTO_ADVANCE_ON_COMPLETE_DELAY_MS,
  BoardCompleteCheckOverlay,
  CORRECT_MOVE_FEEDBACK_MS,
  DEFAULT_ANALYSIS_LAYOUT,
  EngineEvaluationRenderProps,
  isAnalyzableFen,
  MISS_MOVE_ANIMATION_MS,
  PlayTimeEngineProvider,
  ThemeProvider,
  usePlayTimeSeed,
  type BoardThemeId,
  type EngineEvaluation,
  type GetPlayTimeSeed,
  type OnRefutationResolved,
  type ResolveKnownRefutation,
} from 'react-chess-core';
import {
  usePuzzleAutoAdvanceCountdown,
  type PuzzleAutoAdvanceState,
} from './usePuzzleAutoAdvanceCountdown';
import { usePuzzleElapsedTimer } from './usePuzzleElapsedTimer';
import {
  PUZZLE_COMPLETION_RECAP_SETUP_MS,
  usePuzzleCompletionRecap,
  type PuzzleCompletionRecapSource,
} from './usePuzzleCompletionRecap';
import {
  defaultRenderControls,
  type PuzzleControlState,
  type PuzzleNavigationControls,
} from './defaults/DefaultPuzzleControls';
import {
  PuzzlePlaySurface,
  type PuzzleMissFeedback,
} from './PuzzlePlaySurface';
import {
  DEFAULT_PUZZLE_BOARD_WIDTH,
  puzzleBoardCaptionSlotStyle,
  puzzleBoardColumnStyle,
  puzzleControlsFeedbackStyle,
  puzzleBoardSlotStyle,
  puzzleBoardSlotWrapperStyle,
  puzzleControlsSlotStyle,
  puzzlePlayRowStyle,
  type PuzzleControlsPlacement,
} from './puzzleBoardLayout';
import { useStackPuzzleControlsBelow } from './useStackPuzzleControlsBelow';
import {
  playerMoveIndicesInRange,
  puzzlePositionFromFetch,
  PuzzlePosition,
} from '../position/Position';
export { puzzlePositionFromFetch } from '../position/Position';
export type { PuzzleMoveRecord } from '../position/moveHistory';
export type {
  AnalysisContainerRenderProps,
  AnalysisControls,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  AnalysisSidebarRenderProps,
  EngineEvaluationRenderProps,
} from 'react-chess-core';
export type { PuzzleAnalysisContext, PuzzleResultStatus } from '../analysis';
export { DEFAULT_ANALYSIS_LAYOUT } from 'react-chess-core';
export { DEFAULT_PUZZLE_BOARD_WIDTH } from './puzzleBoardLayout';
export {
  DefaultPuzzleControls,
  defaultRenderControls,
} from './defaults/DefaultPuzzleControls';
export type {
  PuzzleControlState,
  PuzzleControlsRenderProps,
  PuzzleNavigationControls,
} from './defaults/DefaultPuzzleControls';
export type { PuzzleAutoAdvanceState } from './usePuzzleAutoAdvanceCountdown';

export type BoardCaptionRenderProps = {
  /** null while the puzzle position is loading */
  sideToMove: 'white' | 'black' | null;
  /** Side the user is solving for; null while loading */
  playerColor: 'white' | 'black' | null;
  /** Whole seconds elapsed since the current puzzle became playable. */
  elapsedSeconds: number;
  /** True after a wrong guess, hint, or solution reveal on the current card. */
  incorrectAttempt?: boolean;
  /** True when the current card is finished. */
  complete?: boolean;
  /** False when the card was finished after a miss, hint, or solution reveal. */
  cleanSolve?: boolean;
  /** Engine refutation SAN while a miss sequence is active. */
  refutationSan?: string | null;
  /** Current miss-sequence phase (wrong → refutation → answer). */
  missPhase?: PuzzleMissFeedback['phase'];
  /** True while the board shows the correct-move answer arrow. */
  answerArrowVisible?: boolean;
  /** True when the card finished after a wrong move, hint, or solution reveal. */
  completedAfterMiss?: boolean;
  /** True when the user opened analysis before finishing (failed attempt, still in progress). */
  analysisFailed?: boolean;
  /** True when the user requested a hint on the current card. */
  hintUsed?: boolean;
};

export type BoardFeedbackRenderProps = {
  resultStatus: Extract<PuzzleResultStatus, 'complete' | 'incorrect'>;
  /** False when the puzzle was finished after a miss, hint, or solution reveal. */
  cleanSolve: boolean;
  /** Engine refutation SAN while a miss sequence is active. */
  refutationSan?: string | null;
  /** Current miss-sequence phase (wrong → refutation → answer). */
  missPhase?: PuzzleMissFeedback['phase'];
  /** True while the board shows the correct-move answer arrow. */
  answerArrowVisible?: boolean;
  /** True when the card finished after a wrong move, hint, or solution reveal. */
  completedAfterMiss?: boolean;
  /** True when the user requested a hint on the current card. */
  hintUsed?: boolean;
};

/** Delay before playing each opponent setup ply (matches course mistake repetition). */
const SETUP_INTRO_DELAY_MS = 450;
const SOLUTION_STEP_MS = 500;
const RESUME_AUTO_STEP_MS = 500;
const COMPLETION_OVERLAY_BUFFER_MS = 250;
const CLEAN_SOLVE_OVERLAY_DELAY_MS =
  CORRECT_MOVE_FEEDBACK_MS + COMPLETION_OVERLAY_BUFFER_MS;
const MISS_COMPLETION_OVERLAY_DELAY_MS =
  Math.max(CORRECT_MOVE_FEEDBACK_MS, PUZZLE_COMPLETION_RECAP_SETUP_MS) +
  COMPLETION_OVERLAY_BUFFER_MS;

const uniqueIndices = (indices: number[]): number[] => [...new Set(indices)];

const buildCompletionRecapSource = (
  position: PuzzlePosition,
  missedIndices: number[],
): PuzzleCompletionRecapSource => {
  const movesUci = position.getSolutionMoves();
  const initialFen = position.getInitialFen();
  const startIndex =
    playerMoveIndicesInRange(initialFen, movesUci, 0, movesUci.length)[0] ?? 0;

  return {
    startFen: initialFen,
    movesUci,
    startIndex,
    endIndex: movesUci.length,
    missedIndices,
    setupUci: startIndex > 0 ? movesUci[startIndex - 1] ?? null : null,
  };
};

export type PuzzleFetchResult = {
  fen: string;
  moves: string[];
  resume?: {
    startIndex: number;
    endIndex?: number;
    quizAtIndices: number[];
  };
};

export interface PuzzleBoardWithControlsProps {
  theme: 'light' | 'dark';
  boardTheme?: BoardThemeId;
  apiProxy: {
    onFetch: () => Promise<PuzzleFetchResult>;
    /** Called when {@link onFetch} rejects (e.g. network / server down). */
    onFetchError?: (error: unknown) => void;
    onFeedback: (feedbackData: {
      index: number;
      guess?: { sourceSquare: string; targetSquare: string; piece: string };
      hintRequested?: boolean;
      solutionShown?: boolean;
      analysisOpened?: boolean;
      isCorrect?: boolean;
      isFinished?: boolean;
    }) => void;
    /** Fired when the current puzzle reaches a finished state (for prefetch). */
    onPuzzleComplete?: () => void;
  };
  /** Omit to use {@link defaultRenderControls} / {@link DefaultPuzzleControls}. */
  renderControls?: (
    showHint: () => void,
    showSolution: () => void,
    nextPuzzle: () => void,
    resultStatus: PuzzleResultStatus,
    analysis: AnalysisControls,
    controlState: PuzzleControlState,
    autoAdvance?: PuzzleAutoAdvanceState,
    navigation?: PuzzleNavigationControls,
  ) => React.ReactNode;
  renderAnalysisSidebar?: (
    props: AnalysisSidebarRenderProps,
  ) => React.ReactNode;
  renderAnalysisContainer?: (
    props: AnalysisContainerRenderProps,
  ) => React.ReactNode;
  renderEngineEvaluation?: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
  /** Optional content above the board (e.g. eval bar), inside play-time engine context. */
  renderAboveBoard?: (props: { fen: string }) => React.ReactNode;
  /** Optional label below the board (e.g. side to move). */
  renderBoardCaption?: (props: BoardCaptionRenderProps) => React.ReactNode;
  /** Optional result feedback shown at the bottom of the controls column. */
  renderBoardFeedback?: (props: BoardFeedbackRenderProps) => React.ReactNode;
  /** Pixel width of the live puzzle board (separate from analysis). */
  puzzleBoardWidth?: number;
  /** Board + sidebar grid sizes when analysis is open. */
  analysisLayout?: AnalysisLayoutConfig;
  /** Chessboard pixel width in analysis (defaults to {@link analysisLayout}.boardWidth). */
  analysisBoardWidth?: number;
  /** Custom board/sidebar placement (overrides {@link analysisLayout} grid). */
  renderAnalysisMain?: (props: AnalysisMainRenderProps) => React.ReactNode;
  /** After auto-advance or Next Puzzle, run instead of fetching the next card. */
  onNextPuzzle?: () => void;
  /** When set, Previous puzzle runs this then reloads the prior card. */
  onPreviousPuzzle?: () => void;
  /** Whether the previous-puzzle control should be enabled. */
  canGoPrevious?: boolean;
  engine?: AnalysisEngineOptions;
  /** Background multipv on the setup position for instant refutation (silent on puzzles). */
  playTimeEngine?: AnalysisEngineOptions;
  /** After a clean solve (no wrong move, hint, or solution reveal), load the next card. */
  autoAdvanceOnComplete?: boolean;
  /**
   * With {@link autoAdvanceOnComplete}, also advance after finishing following a
   * miss or hint. Answer-arrow recovery still requires dragging the correct move;
   * this only controls whether that finished attempt auto-advances.
   */
  autoAdvanceOnCompleteAfterIncorrect?: boolean;
  /** Delay before auto-loading the next card (defaults to {@link AUTO_ADVANCE_ON_COMPLETE_DELAY_MS}). */
  autoAdvanceOnCompleteDelayMs?: number;
  /** Replay missed solution plies on the board before auto-advancing. */
  showCompletionRecap?: boolean;
  /** After a wrong guess, play the correct move and wait for the user to advance. */
  revealAnswerOnIncorrect?: boolean;
  /** After a wrong guess, show an arrow to the correct square. */
  showAnswerArrowOnIncorrect?: boolean;
  /** With {@link showAnswerArrowOnIncorrect}, allow wrong retries after the arrow. When false, only the arrow move is accepted. */
  allowRetryOnIncorrect?: boolean;
  /** With {@link showAnswerArrowOnIncorrect}, show wrong move + engine refutation before the answer arrow. */
  showRefutationOnIncorrect?: boolean;
  /** When {@link showRefutationOnIncorrect}, show the wrong move on the board before the refutation. */
  autoShowWrongMoves?: boolean;
  /** Stockfish options for refutation analysis (requires scriptUrl when not using AnalysisEngineProvider). */
  refutationEngine?: AnalysisEngineOptions;
  /** Backend engine cache hooks (fetch seeds, persist completed analysis). */
  engineCache?: PuzzleEngineCache;
  answerArrowColor?: string;
}

/** Host-provided backend cache adapter; the kit stays HTTP-free. */
export type PuzzleEngineCache = {
  /** Cached play-time evaluation lookup for a setup FEN. */
  getSeed?: GetPlayTimeSeed;
  /** Persist a locally computed play-time evaluation. */
  onEvaluationComplete?: (evaluation: EngineEvaluation, fen: string) => void;
  /** Cached refutation lookup for (setup FEN, wrong move). */
  resolveKnownRefutation?: ResolveKnownRefutation;
  /** Persist an engine-resolved refutation. */
  onRefutationResolved?: OnRefutationResolved;
};

export const PuzzleBoardWithControls = ({
  theme,
  boardTheme,
  apiProxy,
  renderControls = defaultRenderControls,
  renderAnalysisSidebar,
  renderAnalysisContainer,
  renderEngineEvaluation,
  renderAboveBoard,
  renderBoardCaption,
  renderBoardFeedback,
  puzzleBoardWidth = DEFAULT_PUZZLE_BOARD_WIDTH,
  analysisLayout = DEFAULT_ANALYSIS_LAYOUT,
  analysisBoardWidth,
  renderAnalysisMain,
  engine,
  playTimeEngine,
  autoAdvanceOnComplete = false,
  autoAdvanceOnCompleteAfterIncorrect = false,
  autoAdvanceOnCompleteDelayMs = AUTO_ADVANCE_ON_COMPLETE_DELAY_MS,
  showCompletionRecap = false,
  revealAnswerOnIncorrect = false,
  showAnswerArrowOnIncorrect = false,
  allowRetryOnIncorrect = true,
  showRefutationOnIncorrect,
  autoShowWrongMoves = true,
  refutationEngine,
  engineCache,
  answerArrowColor,
  onNextPuzzle,
  onPreviousPuzzle,
  canGoPrevious = false,
}: PuzzleBoardWithControlsProps) => {
  const refutationOnIncorrect =
    showRefutationOnIncorrect ?? showAnswerArrowOnIncorrect;
  const stackControlsBelow = useStackPuzzleControlsBelow();
  const controlsPlacement: PuzzleControlsPlacement = stackControlsBelow
    ? 'below'
    : 'beside';
  const { onFetch, onFetchError, onFeedback, onPuzzleComplete } = apiProxy;

  const [position, setPosition] = useState<PuzzlePosition | null>(null);
  const [loadingNextPuzzle, setLoadingNextPuzzle] = useState(true);
  const [puzzleNum, setPuzzleNum] = useState(0);
  const [hasIncorrectAttempt, setHasIncorrectAttempt] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [completedAfterMiss, setCompletedAfterMiss] = useState(false);
  const [missFeedback, setMissFeedback] = useState<PuzzleMissFeedback | null>(
    null,
  );
  const [missedMoveIndices, setMissedMoveIndices] = useState<number[]>([]);
  const [completionCheckVisible, setCompletionCheckVisible] = useState(false);
  const [completionRecapActive, setCompletionRecapActive] = useState(false);
  const [completionRecapDone, setCompletionRecapDone] = useState(false);
  const [analysisFailedAttempt, setAnalysisFailedAttempt] = useState(false);
  const [showCurrentMoveSignal, setShowCurrentMoveSignal] = useState(0);
  /** Hint→Show-move progression for the *current* ply only — resets each move. */
  const [progressiveMoveUsed, setProgressiveMoveUsed] = useState(false);
  /** True while waiting to animate opponent setup plies onto a fresh puzzle. */
  const [setupIntroPending, setSetupIntroPending] = useState(false);
  const [setupIntroAnimationMs, setSetupIntroAnimationMs] = useState(0);
  /** True while auto-playing the remaining solution (Show solution walkthrough). */
  const [solutionWalkthroughActive, setSolutionWalkthroughActive] =
    useState(false);
  const completionFlowStartedRef = useRef(false);
  const puzzleCompleteNotifiedRef = useRef(false);
  const analysisFailureSentRef = useRef(false);
  /** Ensures we only emit one terminal fail for Next abandon / walkthrough finish. */
  const failedAttemptFinishedRef = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;
  const puzzleCompleteRef = useRef(puzzleComplete);
  puzzleCompleteRef.current = puzzleComplete;
  const hasIncorrectAttemptRef = useRef(hasIncorrectAttempt);
  hasIncorrectAttemptRef.current = hasIncorrectAttempt;
  const [, setInteractionNum] = useState(0);
  const solutionAnimationRef = useRef<{
    cancelled: boolean;
    timeoutIds: ReturnType<typeof setTimeout>[];
  }>({ cancelled: false, timeoutIds: [] });
  const resumeAnimationRef = useRef<{
    cancelled: boolean;
    timeoutIds: ReturnType<typeof setTimeout>[];
  }>({ cancelled: false, timeoutIds: [] });

  // Stable identity: consumed as an effect dependency in PuzzlePlaySurface —
  // an inline function here would re-fire that effect on every render.
  const incInteractionNum = useCallback(() => {
    setInteractionNum((prev) => prev + 1);
  }, []);

  const clearSolutionAnimation = () => {
    const anim = solutionAnimationRef.current;
    anim.cancelled = true;
    anim.timeoutIds.forEach(clearTimeout);
    solutionAnimationRef.current = { cancelled: false, timeoutIds: [] };
  };

  const clearResumeAnimation = () => {
    const anim = resumeAnimationRef.current;
    anim.cancelled = true;
    anim.timeoutIds.forEach(clearTimeout);
    resumeAnimationRef.current = { cancelled: false, timeoutIds: [] };
  };

  useEffect(() => {
    let cancelled = false;

    setLoadingNextPuzzle(true);
    setHasIncorrectAttempt(false);
    setHintUsed(false);
    setPuzzleComplete(false);
    setCompletedAfterMiss(false);
    setMissFeedback(null);
    setMissedMoveIndices([]);
    setCompletionCheckVisible(false);
    setCompletionRecapActive(false);
    setCompletionRecapDone(false);
    setAnalysisFailedAttempt(false);
    setShowCurrentMoveSignal(0);
    setProgressiveMoveUsed(false);
    setSetupIntroPending(false);
    setSetupIntroAnimationMs(0);
    setSolutionWalkthroughActive(false);
    analysisFailureSentRef.current = false;
    completionFlowStartedRef.current = false;
    puzzleCompleteNotifiedRef.current = false;
    failedAttemptFinishedRef.current = false;
    onFetch()
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data?.fen || !Array.isArray(data.moves) || data.moves.length === 0) {
          console.error('Invalid data fetched:', data);
          setLoadingNextPuzzle(false);
          return;
        }
        const nextPosition = puzzlePositionFromFetch(
          data.fen,
          data.moves,
          data.resume,
        );
        setPosition(nextPosition);
        setSetupIntroPending(
          nextPosition.getSideToMove() !== nextPosition.getPlayerColor(),
        );
        requestAnimationFrame(() => {
          if (!cancelled) {
            setLoadingNextPuzzle(false);
          }
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadingNextPuzzle(false);
          onFetchError?.(error);
        }
      });

    return () => {
      cancelled = true;
      clearSolutionAnimation();
      clearResumeAnimation();
    };
  }, [puzzleNum]);

  /** Give each new ply a fresh Hint → Show-move progression. */
  const currentPlyIndex = position?.getIndex() ?? -1;
  useEffect(() => {
    setProgressiveMoveUsed(false);
  }, [currentPlyIndex]);

  // Animate opponent setup plies (usually the first move) onto fresh puzzles
  // and resume/review cards, matching course mistake-repetition lead-in timing.
  useEffect(() => {
    if (!setupIntroPending || !position || loadingNextPuzzle) {
      return;
    }
    if (position.getSideToMove() === position.getPlayerColor()) {
      setSetupIntroPending(false);
      return;
    }

    const id = window.setTimeout(() => {
      if (!position.next()) {
        setSetupIntroPending(false);
        setSetupIntroAnimationMs(0);
        return;
      }
      setSetupIntroAnimationMs(MISS_MOVE_ANIMATION_MS);
      incInteractionNum();
      if (
        position.isFinished() ||
        position.getSideToMove() === position.getPlayerColor()
      ) {
        setSetupIntroPending(false);
      }
    }, SETUP_INTRO_DELAY_MS);

    return () => window.clearTimeout(id);
  }, [
    currentPlyIndex,
    incInteractionNum,
    loadingNextPuzzle,
    position,
    setupIntroPending,
  ]);

  useEffect(() => {
    if (setupIntroPending || setupIntroAnimationMs === 0) {
      return;
    }
    const id = window.setTimeout(() => {
      setSetupIntroAnimationMs(0);
    }, setupIntroAnimationMs);
    return () => window.clearTimeout(id);
  }, [setupIntroAnimationMs, setupIntroPending]);

  const handleFeedback = (feedbackData: {
    index: number;
    guess?: { sourceSquare: string; targetSquare: string; piece: string };
    hintRequested?: boolean;
    solutionShown?: boolean;
    analysisOpened?: boolean;
    isCorrect?: boolean;
    isFinished?: boolean;
  }) => {
    const incorrectThisFeedback =
      feedbackData.hintRequested ||
      feedbackData.solutionShown ||
      feedbackData.analysisOpened ||
      feedbackData.isCorrect === false;

    if (feedbackData.hintRequested) {
      setHintUsed(true);
      setMissedMoveIndices((prev) =>
        uniqueIndices([...prev, feedbackData.index]),
      );
    }
    if (feedbackData.analysisOpened) {
      setAnalysisFailedAttempt(true);
      setMissedMoveIndices((prev) =>
        uniqueIndices([...prev, feedbackData.index]),
      );
    }
    if (incorrectThisFeedback) {
      setHasIncorrectAttempt(true);
    }
    if (
      feedbackData.isCorrect === false &&
      !feedbackData.isFinished &&
      !feedbackData.solutionShown
    ) {
      setMissedMoveIndices((prev) =>
        uniqueIndices([...prev, feedbackData.index]),
      );
    }
    if (feedbackData.isFinished) {
      setPuzzleComplete(true);
      failedAttemptFinishedRef.current = true;
      setCompletedAfterMiss(
        (prev) =>
          prev ||
          hasIncorrectAttempt ||
          incorrectThisFeedback ||
          feedbackData.hintRequested === true,
      );
    }
    onFeedback(feedbackData);
  };

  const getResultStatus = (): PuzzleResultStatus => {
    const finished =
      puzzleComplete || (position !== null && position.isFinished());

    if (finished) {
      return 'complete';
    }

    if (!position) {
      return 'none';
    }

    if (hasIncorrectAttempt) {
      return 'incorrect';
    }

    return 'none';
  };

  const handleHintRequest = () => {
    if (!position) {
      return;
    }
    position.recordHint();
    handleFeedback({ index: position.getIndex(), hintRequested: true });
    position.wantsHint(true);
    setProgressiveMoveUsed(true);
    incInteractionNum();
    setTimeout(() => {
      position.resetInteractions();
      incInteractionNum();
    }, 500);
  };

  const runSolutionWalkthrough = (
    pos: PuzzlePosition,
    emitFinishFeedback: boolean,
  ) => {
    clearSolutionAnimation();
    setSolutionWalkthroughActive(true);
    const anim = {
      cancelled: false,
      timeoutIds: [] as ReturnType<typeof setTimeout>[],
    };
    solutionAnimationRef.current = anim;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (anim.cancelled) {
          return;
        }
        fn();
      }, ms);
      anim.timeoutIds.push(id);
    };

    const finish = () => {
      setSolutionWalkthroughActive(false);
      setPuzzleComplete(true);
      if (emitFinishFeedback) {
        handleFeedback({
          index: pos.getIndex(),
          isFinished: true,
          isCorrect: false,
        });
      }
      incInteractionNum();
    };

    const playNextMove = (): boolean => {
      if (pos.isFinished()) {
        return false;
      }
      const played = pos.next();
      if (played) {
        incInteractionNum();
      }
      return played;
    };

    const advance = () => {
      if (anim.cancelled || pos.isFinished()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      if (!playNextMove()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      schedule(advance, SOLUTION_STEP_MS);
    };

    schedule(advance, SOLUTION_STEP_MS);
  };

  /** Reveal + auto-play remaining plies from the current index (miss or Show solution). */
  const startSolutionReplayFromCurrent = (pos: PuzzlePosition) => {
    if (pos.isFinished() || pos.isSolutionRevealed()) {
      return;
    }

    setMissFeedback(null);
    pos.recordSolutionShown();
    pos.setSolutionRevealed(true);
    pos.wantsHint(false);
    setMissedMoveIndices((prev) =>
      uniqueIndices([
        ...prev,
        ...playerMoveIndicesInRange(
          pos.getInitialFen(),
          pos.getSolutionMoves(),
          pos.getIndex(),
          pos.getSolutionMoves().length,
        ),
      ]),
    );
    handleFeedback({
      index: pos.getIndex(),
      solutionShown: true,
      isCorrect: false,
    });
    incInteractionNum();
    runSolutionWalkthrough(pos, true);
  };

  const runResumeAutoAdvance = (pos: PuzzlePosition) => {
    clearResumeAnimation();
    const anim = {
      cancelled: false,
      timeoutIds: [] as ReturnType<typeof setTimeout>[],
    };
    resumeAnimationRef.current = anim;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (anim.cancelled) {
          return;
        }
        fn();
      }, ms);
      anim.timeoutIds.push(id);
    };

    const finish = () => {
      setPuzzleComplete(true);
      handleFeedback({
        index: pos.getIndex(),
        isCorrect: true,
        isFinished: true,
      });
      incInteractionNum();
    };

    const step = () => {
      if (anim.cancelled) {
        return;
      }

      if (pos.isFinished()) {
        finish();
        return;
      }

      if (pos.isQuizIndex()) {
        return;
      }

      if (!pos.next()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      incInteractionNum();

      schedule(step, RESUME_AUTO_STEP_MS);
    };

    schedule(step, RESUME_AUTO_STEP_MS);
  };

  /**
   * After answer-arrow recovery on a miss: auto-play every remaining ply
   * (including later quiz indices) and finish as failed so auto-next can run.
   * Stopping at the next enrolled miss left multi-quiz resume cards stranded.
   */
  const runAssistedRecoveryContinue = (pos: PuzzlePosition) => {
    clearResumeAnimation();
    clearSolutionAnimation();
    setSolutionWalkthroughActive(true);
    const anim = {
      cancelled: false,
      timeoutIds: [] as ReturnType<typeof setTimeout>[],
    };
    resumeAnimationRef.current = anim;

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (anim.cancelled) {
          return;
        }
        fn();
      }, ms);
      anim.timeoutIds.push(id);
    };

    const finish = () => {
      setSolutionWalkthroughActive(false);
      setPuzzleComplete(true);
      if (!failedAttemptFinishedRef.current) {
        failedAttemptFinishedRef.current = true;
        handleFeedback({
          index: pos.getIndex(),
          isCorrect: false,
          isFinished: true,
        });
      }
      incInteractionNum();
    };

    const step = () => {
      if (anim.cancelled) {
        return;
      }

      if (pos.isFinished()) {
        finish();
        return;
      }

      if (!pos.next()) {
        if (pos.isFinished()) {
          finish();
        }
        return;
      }

      incInteractionNum();
      schedule(step, RESUME_AUTO_STEP_MS);
    };

    if (pos.isFinished()) {
      finish();
      return;
    }

    schedule(step, RESUME_AUTO_STEP_MS);
  };

  const handleShowCurrentMove = () => {
    if (!position || position.isFinished() || position.isSolutionRevealed()) {
      return;
    }

    setMissedMoveIndices((prev) =>
      uniqueIndices([...prev, position.getIndex()]),
    );
    setShowCurrentMoveSignal((value) => value + 1);
    incInteractionNum();
  };

  // Retained for possible full-solution walkthrough re-enable; progressive UI uses Show move only.
  const handleShowSolution = () => {
    if (!position) {
      return;
    }

    if (position.isSolutionRevealed()) {
      position.replaySolution();
      setPuzzleComplete(false);
      failedAttemptFinishedRef.current = false;
      incInteractionNum();
      runSolutionWalkthrough(position, false);
      return;
    }

    if (position.isFinished()) {
      return;
    }

    startSolutionReplayFromCurrent(position);
  };
  void handleShowSolution;

  const handleNextPuzzle = useCallback(() => {
    const pos = positionRef.current;
    if (
      pos &&
      !puzzleCompleteRef.current &&
      !pos.isFinished() &&
      hasIncorrectAttemptRef.current &&
      !failedAttemptFinishedRef.current
    ) {
      // Leaving mid-miss (manual Next): mark failed so the host can grade.
      failedAttemptFinishedRef.current = true;
      setPuzzleComplete(true);
      setCompletedAfterMiss(true);
      onFeedback({
        index: pos.getIndex(),
        isCorrect: false,
        isFinished: true,
      });
    }
    if (onNextPuzzle) {
      onNextPuzzle();
      return;
    }
    setPuzzleNum((prevPuzzleNum) => prevPuzzleNum + 1);
  }, [onFeedback, onNextPuzzle]);

  const handlePreviousPuzzle = useCallback(() => {
    if (!canGoPrevious || !onPreviousPuzzle) {
      return;
    }
    onPreviousPuzzle();
    setPuzzleNum((prevPuzzleNum) => prevPuzzleNum + 1);
  }, [canGoPrevious, onPreviousPuzzle]);

  const puzzleNavigation = useMemo<PuzzleNavigationControls | undefined>(
    () =>
      onPreviousPuzzle
        ? {
            previousPuzzle: handlePreviousPuzzle,
            canGoPrevious,
          }
        : undefined,
    [canGoPrevious, handlePreviousPuzzle, onPreviousPuzzle],
  );

  const handleRevealAction = () => {
    // Progressive control is hint → show current move only (never full solution).
    handleShowCurrentMove();
  };

  const resultStatus = getResultStatus();
  const elapsedSeconds = usePuzzleElapsedTimer(
    Boolean(position) &&
      !loadingNextPuzzle &&
      !setupIntroPending &&
      resultStatus !== 'complete',
    puzzleNum,
  );

  /** Wrong-move / refutation animation only — Show-move arrow must not lock the button. */
  const missAnimationBlocking =
    missFeedback?.phase === 'answer' ||
    missFeedback?.phase === 'wrong' ||
    missFeedback?.phase === 'refutation';
  const missFeedbackActive =
    Boolean(missFeedback?.answerArrowVisible) || missAnimationBlocking;

  useEffect(() => {
    if (resultStatus !== 'complete' || puzzleCompleteNotifiedRef.current) {
      return;
    }

    puzzleCompleteNotifiedRef.current = true;
    onPuzzleComplete?.();
  }, [onPuzzleComplete, resultStatus]);

  const completionRecapSource = useMemo(
    () =>
      position && showCompletionRecap
        ? buildCompletionRecapSource(position, missedMoveIndices)
        : null,
    [position, showCompletionRecap, missedMoveIndices],
  );

  const handleCompletionRecapDone = useCallback(() => {
    setCompletionRecapActive(false);
    setCompletionRecapDone(true);
  }, []);

  const completionRecap = usePuzzleCompletionRecap({
    source: completionRecapSource,
    active: completionRecapActive,
    onComplete: handleCompletionRecapDone,
  });

  const isCompletionRecapping =
    showCompletionRecap && (completionRecapActive || completionRecap.active);

  useEffect(() => {
    if (
      !showCompletionRecap ||
      resultStatus !== 'complete' ||
      loadingNextPuzzle ||
      completionFlowStartedRef.current
    ) {
      return;
    }

    // Latch only when the timer commits — Strict Mode remount clears the timer
    // in cleanup; latching earlier would permanently skip the check/recap.
    const missedCount = missedMoveIndices.length;
    const overlayDelay =
      missedCount === 0
        ? CLEAN_SOLVE_OVERLAY_DELAY_MS
        : MISS_COMPLETION_OVERLAY_DELAY_MS;

    const timer = window.setTimeout(() => {
      completionFlowStartedRef.current = true;
      setCompletionCheckVisible(true);
      if (missedCount === 0) {
        setCompletionRecapDone(true);
      }
    }, overlayDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadingNextPuzzle, missedMoveIndices, resultStatus, showCompletionRecap]);

  useEffect(() => {
    if (!completionCheckVisible || missedMoveIndices.length > 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCompletionCheckVisible(false);
    }, PUZZLE_COMPLETION_RECAP_SETUP_MS + COMPLETION_OVERLAY_BUFFER_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [completionCheckVisible, missedMoveIndices.length]);

  useEffect(() => {
    if (!completionCheckVisible || missedMoveIndices.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCompletionCheckVisible(false);
      setCompletionRecapActive(true);
    }, PUZZLE_COMPLETION_RECAP_SETUP_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [completionCheckVisible, missedMoveIndices.length]);

  const analysis = usePuzzleAnalysis(position, resultStatus, puzzleNum);

  const handleOpenAnalysis = () => {
    if (!analysis.canOpen || !position) {
      return;
    }

    const finished =
      puzzleComplete || position.isFinished() || analysis.isOpen;
    if (!finished && !analysisFailureSentRef.current) {
      analysisFailureSentRef.current = true;
      handleFeedback({
        index: position.getIndex(),
        analysisOpened: true,
        isCorrect: false,
      });
    }

    analysis.openAnalysis();
  };

  const shouldAutoAdvance =
    autoAdvanceOnComplete &&
    resultStatus === 'complete' &&
    !(hasIncorrectAttempt && !autoAdvanceOnCompleteAfterIncorrect) &&
    (!showCompletionRecap || completionRecapDone) &&
    !analysis.isOpen;

  const autoAdvance = usePuzzleAutoAdvanceCountdown(
    shouldAutoAdvance,
    autoAdvanceOnCompleteDelayMs,
    handleNextPuzzle,
  );
  const controlState: PuzzleControlState = {
    canShowHint:
      position !== null &&
      !position.isFinished() &&
      !position.isSolutionRevealed() &&
      !missFeedbackActive &&
      !setupIntroPending &&
      !progressiveMoveUsed,
    canShowSolution:
      position !== null &&
      !position.isFinished() &&
      !position.isSolutionRevealed() &&
      !missAnimationBlocking &&
      !setupIntroPending &&
      progressiveMoveUsed,
    revealLabel: 'Show move',
    hintUsed,
  };
  const analysisSnapshot =
    analysis.isOpen && analysis.snapshot ? analysis.snapshot : null;
  const setupFen = position?.fen() ?? '';
  const playTimeEnabled =
    Boolean(position) &&
    !position?.isFinished() &&
    !analysisSnapshot &&
    isAnalyzableFen(setupFen);
  const resolvedPlayTimeEngine = useMemo(
    () => ({
      scriptUrl: engine?.scriptUrl,
      ...playTimeEngine,
    }),
    [engine?.scriptUrl, playTimeEngine],
  );
  const { seedEvaluation, seedPending } = usePlayTimeSeed(
    setupFen,
    playTimeEnabled,
    engineCache?.getSeed,
  );
  const resolvedAnalysisBoardWidth =
    analysisBoardWidth ?? analysisLayout.boardWidth;

  const useHostAnalysisUi = Boolean(
    renderAnalysisSidebar &&
    renderAnalysisContainer &&
    (renderEngineEvaluation || engine?.enabled === false),
  );

  return (
    <ThemeProvider theme={theme} boardTheme={boardTheme}>
      {analysisSnapshot ? (
        <AnalysisErrorBoundary onClose={analysis.closeAnalysis}>
          {useHostAnalysisUi ? (
            <AnalysisBoardCore
              analysisContext={analysisSnapshot}
              onClose={analysis.closeAnalysis}
              theme={theme}
              boardWidth={resolvedAnalysisBoardWidth}
              engine={engine}
              renderMain={
                renderAnalysisMain ??
                (({ board, sidebar, model }) => (
                  <AnalysisBoardLayout
                    layout={analysisLayout}
                    model={model}
                    board={board}
                    sidebar={sidebar}
                  />
                ))
              }
              renderSidebar={renderAnalysisSidebar!}
              renderContainer={renderAnalysisContainer!}
              renderEngineEvaluation={renderEngineEvaluation ?? (() => null)}
            />
          ) : (
            <AnalysisBoard
              analysisContext={analysisSnapshot}
              onClose={analysis.closeAnalysis}
              theme={theme}
              layout={analysisLayout}
              engine={engine}
              renderMain={renderAnalysisMain}
              renderSidebar={renderAnalysisSidebar}
              renderContainer={renderAnalysisContainer}
              renderEngineEvaluation={renderEngineEvaluation}
            />
          )}
        </AnalysisErrorBoundary>
      ) : (
        <div style={puzzlePlayRowStyle(controlsPlacement)}>
          <div
            style={puzzleBoardColumnStyle(puzzleBoardWidth, controlsPlacement)}
          >
            <PlayTimeEngineProvider
              fen={setupFen}
              enabled={playTimeEnabled}
              options={resolvedPlayTimeEngine}
              seedEvaluation={seedEvaluation}
              seedPending={seedPending}
              onEvaluationComplete={engineCache?.onEvaluationComplete}
            >
              {renderAboveBoard?.({ fen: setupFen })}
              <div style={puzzleBoardSlotWrapperStyle()}>
                <div style={puzzleBoardSlotStyle()}>
                  <PuzzlePlaySurface
                    position={position}
                    boardWidth={puzzleBoardWidth}
                    onFeedback={handleFeedback}
                    incInteractionNum={incInteractionNum}
                    onResumeCorrect={runResumeAutoAdvance}
                    onAssistedRecoveryContinue={runAssistedRecoveryContinue}
                    revealAnswerOnIncorrect={revealAnswerOnIncorrect}
                    showAnswerArrowOnIncorrect={showAnswerArrowOnIncorrect}
                    allowRetryOnIncorrect={allowRetryOnIncorrect}
                    showRefutationOnIncorrect={refutationOnIncorrect}
                    autoShowWrongMoves={autoShowWrongMoves}
                    refutationEngine={refutationEngine ?? engine}
                    setupCacheTargetDepth={resolvedPlayTimeEngine.depth}
                    onRefutationResolved={engineCache?.onRefutationResolved}
                    resolveKnownRefutation={engineCache?.resolveKnownRefutation}
                    answerArrowColor={answerArrowColor}
                    showCurrentMoveSignal={showCurrentMoveSignal}
                    solutionWalkthroughActive={solutionWalkthroughActive}
                    setupIntroAnimationMs={setupIntroAnimationMs}
                    positionLocked={
                      loadingNextPuzzle ||
                      setupIntroPending ||
                      completionCheckVisible ||
                      isCompletionRecapping ||
                      solutionWalkthroughActive
                    }
                    onMissFeedbackChange={setMissFeedback}
                    recapBoard={
                      isCompletionRecapping
                        ? {
                            fen: completionRecap.fen,
                            lastMoveUci: completionRecap.lastMoveUci,
                            customArrows: completionRecap.customArrows,
                            animationDuration: completionRecap.animationDuration,
                          }
                        : null
                    }
                  />
                </div>
                {completionCheckVisible && (
                  <BoardCompleteCheckOverlay
                    variant={
                      hasIncorrectAttempt || completedAfterMiss || hintUsed
                        ? 'partial'
                        : 'success'
                    }
                  />
                )}
              </div>
            </PlayTimeEngineProvider>
            {renderBoardCaption && (
              <div style={puzzleBoardCaptionSlotStyle()}>
                {renderBoardCaption({
                  sideToMove: position?.getSideToMove() ?? null,
                  playerColor: position
                    ? (position.getPlayerColor() as 'white' | 'black')
                    : null,
                  elapsedSeconds,
                  incorrectAttempt: resultStatus === 'incorrect',
                  complete: resultStatus === 'complete',
                  cleanSolve: !hasIncorrectAttempt,
                  refutationSan: missFeedback?.refutationSan ?? null,
                  missPhase: missFeedback?.phase ?? null,
                  answerArrowVisible: missFeedback?.answerArrowVisible ?? false,
                  completedAfterMiss,
                  hintUsed,
                  analysisFailed: analysisFailedAttempt,
                })}
              </div>
            )}
          </div>
          <div style={puzzleControlsSlotStyle(controlsPlacement)}>
            {renderControls(
              handleHintRequest,
              handleRevealAction,
              handleNextPuzzle,
              resultStatus,
              {
                visible: analysis.canOpen,
                openAnalysis: handleOpenAnalysis,
              },
              controlState,
              autoAdvance,
              puzzleNavigation,
            )}
            {renderBoardFeedback && resultStatus === 'complete' && (
              <div style={puzzleControlsFeedbackStyle(controlsPlacement)}>
                {renderBoardFeedback({
                  resultStatus,
                  cleanSolve: !hasIncorrectAttempt,
                  refutationSan: missFeedback?.refutationSan,
                  missPhase: missFeedback?.phase,
                  hintUsed,
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};
