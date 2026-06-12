import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ThemeProvider } from 'react-chess-core';
import { LineBoard } from './LineBoard';
import {
  DEFAULT_PUZZLE_BOARD_WIDTH,
  puzzleBoardSlotStyle,
  puzzleBoardColumnStyle,
  puzzleControlsSlotStyle,
  puzzlePlayRowStyle,
  type PuzzleControlsPlacement,
} from './puzzleBoardLayout';
import { useStackPuzzleControlsBelow } from './useStackPuzzleControlsBelow';
import { defaultRenderLineControls } from './defaults/DefaultLineControls';

export type LineTrainSide = 'w' | 'b';

/** A line to drill: a start position plus the moves to walk, from one side. */
export interface LineSpec {
  startFen: string;
  movesUci: string[];
  /** Optional SAN parallel to {@link movesUci} for nicer feedback labels. */
  movesSan?: string[];
  /** The side the user plays; the other side is auto-played. */
  trainSide: LineTrainSide;
}

export interface LineMoveResult {
  /** Index into {@link LineSpec.movesUci}. */
  index: number;
  isCorrect: boolean;
}

export interface LineMoveFeedback extends LineMoveResult {
  expectedSan: string;
}

/** State handed to the controls renderer on every render. */
export interface LineControlsRenderProps {
  trainSide: LineTrainSide;
  /** 1-based number of the move currently in focus. */
  moveNumber: number;
  total: number;
  finished: boolean;
  isUserTurn: boolean;
  feedback: LineMoveFeedback | null;
}

export interface LineBoardWithControlsProps {
  theme: 'light' | 'dark';
  line: LineSpec;
  /** Called once when the whole line has been walked. */
  onComplete: (perMove: LineMoveResult[]) => void;
  /** Optional per-move callback as each user move is graded. */
  onMove?: (feedback: LineMoveFeedback) => void;
  /** Omit to use {@link defaultRenderLineControls}. */
  renderControls?: (props: LineControlsRenderProps) => React.ReactNode;
  boardWidth?: number;
  /** Delay before auto-playing each opponent move (ms). */
  opponentMoveDelayMs?: number;
}

const DEFAULT_OPPONENT_MOVE_DELAY_MS = 450;

const turnFromFen = (fen: string): LineTrainSide =>
  fen.trim().split(/\s+/)[1] === 'b' ? 'b' : 'w';

const boardOrientationForLine = (side: LineTrainSide): 'white' | 'black' =>
  side === 'b' ? 'black' : 'white';

/**
 * Guided line-drill board: walks a known move sequence, auto-playing the
 * opponent and grading each of the trainer's moves against the line. Mirrors
 * {@link PuzzleBoardWithControls} but for opening/line repetition rather than
 * tactical puzzles. Mount one instance per drill (key it by line) so its
 * internal state resets between lines.
 */
export const LineBoardWithControls = ({
  theme,
  line,
  onComplete,
  onMove,
  renderControls = defaultRenderLineControls,
  boardWidth = DEFAULT_PUZZLE_BOARD_WIDTH,
  opponentMoveDelayMs = DEFAULT_OPPONENT_MOVE_DELAY_MS,
}: LineBoardWithControlsProps) => {
  const chessRef = useRef(new Chess(line.startFen));
  const perMoveRef = useRef<LineMoveResult[]>([]);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const [fen, setFen] = useState(line.startFen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<LineMoveFeedback | null>(null);

  const total = line.movesUci.length;
  const orientation = boardOrientationForLine(line.trainSide);

  const applyMove = useCallback(
    (index: number) => {
      const uci = line.movesUci[index];
      if (!uci) {
        setFinished(true);
        return;
      }
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci.slice(4) : undefined;
      try {
        chessRef.current.move({ from, to, promotion });
      } catch {
        // Stored line should always be legal; bail out gracefully if not.
        setFinished(true);
        return;
      }
      setFen(chessRef.current.fen());
      setCurrentIndex(index + 1);
    },
    [line.movesUci],
  );

  // Auto-play opponent moves and detect the end of the line.
  useEffect(() => {
    if (finished) {
      return;
    }
    if (currentIndex >= total) {
      setFinished(true);
      return;
    }
    if (turnFromFen(chessRef.current.fen()) !== line.trainSide) {
      const timer = setTimeout(
        () => applyMove(currentIndex),
        opponentMoveDelayMs,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    currentIndex,
    finished,
    total,
    line.trainSide,
    applyMove,
    opponentMoveDelayMs,
  ]);

  // Emit the completion event exactly once.
  useEffect(() => {
    if (!finished || completedRef.current) {
      return;
    }
    completedRef.current = true;
    onCompleteRef.current(perMoveRef.current);
  }, [finished]);

  const handleDrop = (source: string, target: string): boolean => {
    if (finished) {
      return false;
    }
    if (turnFromFen(chessRef.current.fen()) !== line.trainSide) {
      return false;
    }
    const index = currentIndex;
    let userUci: string;
    try {
      const probe = new Chess(chessRef.current.fen());
      const move = probe.move({ from: source, to: target, promotion: 'q' });
      if (!move) {
        return false;
      }
      userUci = `${move.from}${move.to}${move.promotion ?? ''}`;
    } catch {
      return false;
    }

    const expected = line.movesUci[index];
    const isCorrect = userUci.toLowerCase() === expected.toLowerCase();
    const expectedSan = line.movesSan?.[index] ?? expected;
    perMoveRef.current.push({ index, isCorrect });
    const moveFeedback: LineMoveFeedback = { index, isCorrect, expectedSan };
    setFeedback(moveFeedback);
    onMoveRef.current?.(moveFeedback);
    applyMove(index);
    return isCorrect;
  };

  const moveNumber = Math.min(currentIndex + 1, total);
  const isUserTurn =
    !finished && turnFromFen(fen) === line.trainSide && currentIndex < total;
  const stackControlsBelow = useStackPuzzleControlsBelow();
  const controlsPlacement: PuzzleControlsPlacement = stackControlsBelow
    ? 'below'
    : 'beside';

  return (
    <ThemeProvider theme={theme}>
      <div style={puzzlePlayRowStyle(controlsPlacement)}>
        <div style={puzzleBoardColumnStyle(boardWidth, controlsPlacement)}>
          <div style={puzzleBoardSlotStyle()}>
            <LineBoard
              fen={fen}
              orientation={orientation}
              trainSide={line.trainSide}
              draggable={isUserTurn}
              onPieceDrop={handleDrop}
              boardWidth={boardWidth}
            />
          </div>
        </div>
        <div style={puzzleControlsSlotStyle(controlsPlacement)}>
          {renderControls({
            trainSide: line.trainSide,
            moveNumber,
            total,
            finished,
            isUserTurn,
            feedback,
          })}
        </div>
      </div>
    </ThemeProvider>
  );
};
