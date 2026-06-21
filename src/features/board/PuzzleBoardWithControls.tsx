import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  DEFAULT_ANALYSIS_LAYOUT,
  EngineEvaluationRenderProps,
  ThemeProvider,
  type BoardThemeId,
} from 'react-chess-core';
import {
  usePuzzleAutoAdvanceCountdown,
  type PuzzleAutoAdvanceState,
} from './usePuzzleAutoAdvanceCountdown';
import {
  defaultRenderControls,
  type PuzzleControlState,
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
import { PuzzlePosition } from '../position/Position';
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
} from './defaults/DefaultPuzzleControls';
export type { PuzzleAutoAdvanceState } from './usePuzzleAutoAdvanceCountdown';

export type BoardCaptionRenderProps = {
  /** null while the puzzle position is loading */
  sideToMove: 'white' | 'black' | null;
  /** Side the user is solving for; null while loading */
  playerColor: 'white' | 'black' | null;
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

/** Apply the opponent setup ply immediately so the board does not flash on load. */
const puzzlePositionFromFetch = (
  fen: string,
  moves: string[],
  resume?: PuzzleFetchResult['resume'],
): PuzzlePosition => {
  const newPosition = new PuzzlePosition(fen, moves, resume);
  if (!resume && moves.length > 1) {
    newPosition.next();
  }
  return newPosition;
};

const SOLUTION_STEP_MS = 500;
const RESUME_AUTO_STEP_MS = 500;

export type PuzzleFetchResult = {
  fen: string;
  moves: string[];
  resume?: {
    startIndex: number;
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
      isCorrect?: boolean;
      isFinished?: boolean;
    }) => void;
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
  engine?: AnalysisEngineOptions;
  /** After a clean solve (no wrong move, hint, or solution reveal), load the next card. */
  autoAdvanceOnComplete?: boolean;
  /** With {@link autoAdvanceOnComplete}, also advance after finishing following a miss or hint. */
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
  answerArrowColor?: string;
}

export const PuzzleBoardWithControls = ({
  theme,
  boardTheme,
  apiProxy,
  renderControls = defaultRenderControls,
  renderAnalysisSidebar,
  renderAnalysisContainer,
  renderEngineEvaluation,
  renderBoardCaption,
  renderBoardFeedback,
  puzzleBoardWidth = DEFAULT_PUZZLE_BOARD_WIDTH,
  analysisLayout = DEFAULT_ANALYSIS_LAYOUT,
  analysisBoardWidth,
  renderAnalysisMain,
  engine,
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
  answerArrowColor,
}: PuzzleBoardWithControlsProps) => {
  const refutationOnIncorrect =
    showRefutationOnIncorrect ?? showAnswerArrowOnIncorrect;
  const stackControlsBelow = useStackPuzzleControlsBelow();
  const controlsPlacement: PuzzleControlsPlacement = stackControlsBelow
    ? 'below'
    : 'beside';
  const { onFetch, onFetchError, onFeedback } = apiProxy;

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
  const [, setInteractionNum] = useState(0);
  const solutionAnimationRef = useRef<{
    cancelled: boolean;
    timeoutIds: ReturnType<typeof setTimeout>[];
  }>({ cancelled: false, timeoutIds: [] });
  const resumeAnimationRef = useRef<{
    cancelled: boolean;
    timeoutIds: ReturnType<typeof setTimeout>[];
  }>({ cancelled: false, timeoutIds: [] });

  const incInteractionNum = () => {
    setInteractionNum((prev) => prev + 1);
  };

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
        setPosition(puzzlePositionFromFetch(data.fen, data.moves, data.resume));
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

  const handleFeedback = (feedbackData: {
    index: number;
    guess?: { sourceSquare: string; targetSquare: string; piece: string };
    hintRequested?: boolean;
    solutionShown?: boolean;
    isCorrect?: boolean;
    isFinished?: boolean;
  }) => {
    const incorrectThisFeedback =
      feedbackData.hintRequested ||
      feedbackData.solutionShown ||
      feedbackData.isCorrect === false;

    if (feedbackData.hintRequested) {
      setHintUsed(true);
    }
    if (incorrectThisFeedback) {
      setHasIncorrectAttempt(true);
    }
    if (feedbackData.isFinished) {
      setPuzzleComplete(true);
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

      schedule(() => {
        if (anim.cancelled) {
          return;
        }

        playNextMove();

        if (pos.isFinished()) {
          finish();
          return;
        }

        schedule(advance, SOLUTION_STEP_MS);
      }, SOLUTION_STEP_MS);
    };

    advance();
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

  const handleShowSolution = () => {
    if (!position) {
      return;
    }

    if (position.isSolutionRevealed()) {
      position.replaySolution();
      setPuzzleComplete(false);
      incInteractionNum();
      runSolutionWalkthrough(position, false);
      return;
    }

    if (position.isFinished()) {
      return;
    }

    position.recordSolutionShown();
    position.setSolutionRevealed(true);
    position.wantsHint(false);
    handleFeedback({
      index: position.getIndex(),
      solutionShown: true,
      isCorrect: false,
    });
    incInteractionNum();
    runSolutionWalkthrough(position, true);
  };

  const handleNextPuzzle = useCallback(() => {
    setPuzzleNum((prevPuzzleNum) => prevPuzzleNum + 1);
  }, []);

  const resultStatus = getResultStatus();

  const shouldAutoAdvance =
    autoAdvanceOnComplete &&
    resultStatus === 'complete' &&
    !(hasIncorrectAttempt && !autoAdvanceOnCompleteAfterIncorrect) &&
    !showCompletionRecap;

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
      !(hasIncorrectAttempt && showAnswerArrowOnIncorrect && !allowRetryOnIncorrect),
    canShowSolution:
      position !== null &&
      (position.isSolutionRevealed() || !position.isFinished()),
  };
  const analysis = usePuzzleAnalysis(position, resultStatus, puzzleNum);
  const analysisSnapshot =
    analysis.isOpen && analysis.snapshot ? analysis.snapshot : null;
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
            <div style={puzzleBoardSlotWrapperStyle()}>
              <div style={puzzleBoardSlotStyle()}>
                <PuzzlePlaySurface
                  position={position}
                  boardWidth={puzzleBoardWidth}
                  onFeedback={handleFeedback}
                  incInteractionNum={incInteractionNum}
                  onResumeCorrect={runResumeAutoAdvance}
                  revealAnswerOnIncorrect={revealAnswerOnIncorrect}
                  showAnswerArrowOnIncorrect={showAnswerArrowOnIncorrect}
                  allowRetryOnIncorrect={allowRetryOnIncorrect}
                  showRefutationOnIncorrect={refutationOnIncorrect}
                  autoShowWrongMoves={autoShowWrongMoves}
                  refutationEngine={refutationEngine ?? engine}
                  answerArrowColor={answerArrowColor}
                  positionLocked={loadingNextPuzzle}
                  onMissFeedbackChange={setMissFeedback}
                />
              </div>
            </div>
            {renderBoardCaption && (
              <div style={puzzleBoardCaptionSlotStyle()}>
                {renderBoardCaption({
                  sideToMove: position?.getSideToMove() ?? null,
                  playerColor: position
                    ? (position.getPlayerColor() as 'white' | 'black')
                    : null,
                  incorrectAttempt: resultStatus === 'incorrect',
                  complete: resultStatus === 'complete',
                  cleanSolve: !hasIncorrectAttempt,
                  refutationSan: missFeedback?.refutationSan ?? null,
                  missPhase: missFeedback?.phase ?? null,
                  answerArrowVisible: missFeedback?.answerArrowVisible ?? false,
                  completedAfterMiss,
                  hintUsed,
                })}
              </div>
            )}
          </div>
          <div style={puzzleControlsSlotStyle(controlsPlacement)}>
            {renderControls(
              handleHintRequest,
              handleShowSolution,
              handleNextPuzzle,
              resultStatus,
              {
                visible: analysis.canOpen,
                openAnalysis: analysis.openAnalysis,
              },
              controlState,
              autoAdvance,
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
