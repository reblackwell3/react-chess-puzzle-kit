import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from '../board/HighlightChessboard';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getAnalysisModalStyles } from '../theme/ThemeContext';
import { getLastMoveSquareStyles } from '../theme/squareHighlightColors';
import { EngineEvaluationPanel } from '../engine/EngineEvaluationPanel';
import { DefaultAnalysisSidebar } from './DefaultAnalysisSidebar';
import { AnalysisPosition } from './AnalysisPosition';
import { PuzzleAnalysisContext } from './analysisContext';
import {
  AnalysisEngineOptions,
  DEFAULT_STOCKFISH_SCRIPT_URL,
  useAnalysisEngine,
} from '../engine';
import {
  AnalysisContainerRenderProps,
  AnalysisSidebarRenderProps,
  EngineEvaluationRenderProps,
} from './renderProps';

export interface AnalysisBoardProps {
  analysisContext: PuzzleAnalysisContext;
  onClose: () => void;
  theme: 'light' | 'dark';
  engine?: AnalysisEngineOptions;
  renderSidebar?: (props: AnalysisSidebarRenderProps) => React.ReactNode;
  renderContainer?: (props: AnalysisContainerRenderProps) => React.ReactNode;
  renderEngineEvaluation?: (
    props: EngineEvaluationRenderProps,
  ) => React.ReactNode;
}

/** Match sidebar width in endchess-frontend `PuzzleAnalysisSidebar` (moves + engine columns). */
const ANALYSIS_BOARD_WIDTH = 480;
const ANALYSIS_SIDEBAR_WIDTH = 500;
const ANALYSIS_BODY_GAP = 16;

export const AnalysisBoard = ({
  analysisContext,
  onClose,
  theme,
  engine,
  renderSidebar,
  renderContainer,
  renderEngineEvaluation,
}: AnalysisBoardProps) => {
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

  const syncPly = (nextPly: number) => {
    analysisPosition.goToNavPly(nextPly);
    bumpNav();
  };

  const handleAnalysisDrop = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) => {
    if (
      !analysisPosition.tryPlayMove(sourceSquare, targetSquare, piece)
    ) {
      return false;
    }

    bumpNav();
    return true;
  };

  void navRevision;
  const ply = analysisPosition.getNavPly();
  const maxPly = analysisPosition.getMaxNavPly();
  const historyRows = analysisPosition.getHistoryRows();
  const fen = analysisPosition.fen();
  const engineEvaluation = useAnalysisEngine(fen, {
    enabled: engine?.enabled ?? true,
    depth: engine?.depth ?? 16,
    multiPv: engine?.multiPv ?? 2,
    scriptUrl: engine?.scriptUrl ?? DEFAULT_STOCKFISH_SCRIPT_URL,
  });

  const lastMove = analysisPosition.getLastMoveSquares();
  const Sidebar = renderSidebar ?? DefaultAnalysisSidebar;
  const modalTheme = getAnalysisModalStyles(theme);
  const engineEnabled = engine?.enabled ?? true;
  const engineEvaluationPanel =
    engineEnabled && renderEngineEvaluation
      ? renderEngineEvaluation({ fen, evaluation: engineEvaluation, theme })
      : engineEnabled && !renderEngineEvaluation
        ? (
            <EngineEvaluationPanel
              fen={fen}
              evaluation={engineEvaluation}
              theme={theme}
            />
          )
        : null;

  const handleBackdropClick = () => {
    if (skipBackdropCloseRef.current) {
      return;
    }

    onClose();
  };

  const boardAndSidebar = (
    <div style={analysisBodyStyle}>
      <div style={boardCellStyle}>
        <div style={boardSizerStyle}>
          <ChessboardDnDProvider>
            <HighlightChessboard
              checkSquare={analysisPosition.getCheckSquare()}
              hintSquare={null}
              incorrectMoveSquare={null}
              position={analysisPosition.fen()}
              boardOrientation={analysisContext.boardOrientation}
              boardWidth={ANALYSIS_BOARD_WIDTH}
              arePiecesDraggable={true}
              onPieceDrop={handleAnalysisDrop}
              promotionDialogVariant="modal"
              customSquareStyles={
                lastMove
                  ? getLastMoveSquareStyles(
                      lastMove.from,
                      lastMove.to,
                      theme,
                    )
                  : {}
              }
            />
          </ChessboardDnDProvider>
        </div>
      </div>

      <div style={sidebarCellStyle}>
        <Sidebar
          moves={analysisPosition.getSolutionSans()}
          historyRows={historyRows}
          isHistoryRowSelected={(row) =>
            analysisPosition.isHistoryRowSelected(row)
          }
          onSelectHistoryRow={(row) => {
            analysisPosition.selectHistoryRow(row);
            bumpNav();
          }}
          ply={ply}
          maxPly={maxPly}
          onSelectPly={syncPly}
          theme={theme}
          engineEvaluationPanel={engineEvaluationPanel}
        />
      </div>
    </div>
  );

  if (renderContainer) {
    return renderContainer({
      theme,
      onClose,
      children: boardAndSidebar,
    });
  }

  const modal = (
    <ThemeProvider theme={theme}>
      <div style={overlayStyle} onMouseDown={handleBackdropClick}>
        <div
          style={{ ...panelStyle, ...modalTheme.panel }}
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Puzzle analysis"
          data-rcwc-theme={theme}
        >
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, ...modalTheme.title }}>Analysis</h2>
            <button
              type="button"
              onClick={onClose}
              style={{ ...closeButtonStyle, ...modalTheme.closeButton }}
            >
              Close
            </button>
          </div>

          {boardAndSidebar}
        </div>
      </div>
    </ThemeProvider>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const panelStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: 16,
  width: 'max-content',
  maxWidth: '95vw',
  maxHeight: '95vh',
  overflow: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const closeButtonStyle: React.CSSProperties = {
  cursor: 'pointer',
  borderRadius: 4,
  padding: '4px 12px',
  fontSize: 14,
};

/** Single row: board (col 1) + sidebar (col 2). */
const analysisBodyStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `${ANALYSIS_BOARD_WIDTH}px ${ANALYSIS_SIDEBAR_WIDTH}px`,
  columnGap: ANALYSIS_BODY_GAP,
  alignItems: 'start',
  width:
    ANALYSIS_BOARD_WIDTH + ANALYSIS_SIDEBAR_WIDTH + ANALYSIS_BODY_GAP,
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const boardCellStyle: React.CSSProperties = {
  gridColumn: 1,
  gridRow: 1,
  minWidth: 0,
  width: ANALYSIS_BOARD_WIDTH,
  maxWidth: ANALYSIS_BOARD_WIDTH,
  overflow: 'hidden',
};

/** react-chessboard root uses width:100%; cap it to the grid column. */
const boardSizerStyle: React.CSSProperties = {
  width: ANALYSIS_BOARD_WIDTH,
  maxWidth: '100%',
};

const sidebarCellStyle: React.CSSProperties = {
  gridColumn: 2,
  gridRow: 1,
  minWidth: 0,
  width: ANALYSIS_SIDEBAR_WIDTH,
  maxWidth: ANALYSIS_SIDEBAR_WIDTH,
};
