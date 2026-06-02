import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnalysisHistoryRow,
  AnalysisPosition,
  SolutionMoveDisplay,
} from './AnalysisPosition';
import { PuzzleAnalysisContext } from './analysisContext';
import {
  AnalysisEngineOptions,
  DEFAULT_STOCKFISH_SCRIPT_URL,
  EngineEvaluation,
  useAnalysisEngine,
} from '../../engine';

export type UseAnalysisBoardModelArgs = {
  analysisContext: PuzzleAnalysisContext;
  onClose: () => void;
  theme: 'light' | 'dark';
  /** Chessboard pixel width (host-controlled). */
  boardWidth: number;
  engine?: AnalysisEngineOptions;
};

export type AnalysisBoardModel = {
  theme: 'light' | 'dark';
  boardWidth: number;
  analysisContext: PuzzleAnalysisContext;
  fen: string;
  ply: number;
  maxPly: number;
  historyRows: AnalysisHistoryRow[];
  solutionSans: SolutionMoveDisplay[];
  boardOrientation: 'white' | 'black';
  engineEvaluation: EngineEvaluation;
  engineEnabled: boolean;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;
  onSelectPly: (ply: number) => void;
  onSelectHistoryRow: (row: AnalysisHistoryRow) => void;
  isHistoryRowSelected: (row: AnalysisHistoryRow) => boolean;
  onPieceDrop: (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => boolean;
  onBackdropMouseDown: () => void;
  onClose: () => void;
};

export const useAnalysisBoardModel = ({
  analysisContext,
  onClose,
  theme,
  boardWidth,
  engine,
}: UseAnalysisBoardModelArgs): AnalysisBoardModel => {
  const skipBackdropCloseRef = useRef(true);
  const analysisPosition = useMemo(
    () => new AnalysisPosition(analysisContext),
    [analysisContext],
  );
  const [navRevision, setNavRevision] = useState(0);
  const bumpNav = () => setNavRevision((value) => value + 1);

  useEffect(() => {
    analysisPosition.goToNavPly(analysisContext.solutionMoves.length);
    bumpNav();

    skipBackdropCloseRef.current = true;
    const frameId = requestAnimationFrame(() => {
      skipBackdropCloseRef.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [analysisContext, analysisPosition]);

  void navRevision;

  const fen = analysisPosition.fen();
  const engineEnabled = engine?.enabled ?? true;
  const engineEvaluation = useAnalysisEngine(fen, {
    enabled: engineEnabled,
    depth: engine?.depth ?? 16,
    multiPv: engine?.multiPv ?? 2,
    scriptUrl: engine?.scriptUrl ?? DEFAULT_STOCKFISH_SCRIPT_URL,
  });

  return {
    theme,
    boardWidth,
    analysisContext,
    fen,
    ply: analysisPosition.getNavPly(),
    maxPly: analysisPosition.getMaxNavPly(),
    historyRows: analysisPosition.getHistoryRows(),
    solutionSans: analysisPosition.getSolutionSans(),
    boardOrientation: analysisContext.boardOrientation,
    engineEvaluation,
    engineEnabled,
    lastMove: analysisPosition.getLastMoveSquares(),
    checkSquare: analysisPosition.getCheckSquare(),
    onSelectPly: (ply: number) => {
      analysisPosition.goToNavPly(ply);
      bumpNav();
    },
    onSelectHistoryRow: (row: AnalysisHistoryRow) => {
      analysisPosition.selectHistoryRow(row);
      bumpNav();
    },
    isHistoryRowSelected: (row: AnalysisHistoryRow) =>
      analysisPosition.isHistoryRowSelected(row),
    onPieceDrop: (sourceSquare, targetSquare, piece) => {
      if (!analysisPosition.tryPlayMove(sourceSquare, targetSquare, piece)) {
        return false;
      }
      bumpNav();
      return true;
    },
    onBackdropMouseDown: () => {
      if (skipBackdropCloseRef.current) {
        return;
      }
      onClose();
    },
    onClose,
  };
};
