import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChessboardDnDProvider } from 'react-chessboard';
import { HighlightChessboard } from '../board/HighlightChessboard';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getAnalysisModalStyles } from '../theme/ThemeContext';
import { DefaultAnalysisSidebar } from './DefaultAnalysisSidebar';
import { AnalysisPosition } from './AnalysisPosition';
import { PuzzleAnalysisContext } from './analysisContext';
import {
  AnalysisContainerRenderProps,
  AnalysisSidebarRenderProps,
} from './renderProps';

export interface AnalysisBoardProps {
  analysisContext: PuzzleAnalysisContext;
  onClose: () => void;
  theme: 'light' | 'dark';
  renderSidebar?: (props: AnalysisSidebarRenderProps) => React.ReactNode;
  renderContainer?: (props: AnalysisContainerRenderProps) => React.ReactNode;
}

/** Match MUI sidebar width in endchess-frontend `PuzzleAnalysisSidebar`. */
const ANALYSIS_BOARD_WIDTH = 480;
const ANALYSIS_SIDEBAR_WIDTH = 260;
const ANALYSIS_BODY_GAP = 16;

const getLastMoveHighlight = (from: string, to: string) => ({
  [from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
  [to]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
});

export const AnalysisBoard = ({
  analysisContext,
  onClose,
  theme,
  renderSidebar,
  renderContainer,
}: AnalysisBoardProps) => {
  const skipBackdropCloseRef = useRef(true);
  const analysisPosition = useMemo(
    () => new AnalysisPosition(analysisContext),
    [analysisContext],
  );
  const [ply, setPly] = useState(analysisContext.solutionMoves.length);

  useEffect(() => {
    analysisPosition.goToPly(analysisContext.solutionMoves.length);
    setPly(analysisContext.solutionMoves.length);

    skipBackdropCloseRef.current = true;
    const frameId = requestAnimationFrame(() => {
      skipBackdropCloseRef.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  }, [analysisContext, analysisPosition]);

  const syncPly = (nextPly: number) => {
    analysisPosition.goToPly(nextPly);
    setPly(nextPly);
  };

  const lastMove = analysisPosition.getLastMoveSquares();
  const Sidebar = renderSidebar ?? DefaultAnalysisSidebar;
  const modalTheme = getAnalysisModalStyles(theme);

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
              arePiecesDraggable={false}
              customSquareStyles={
                lastMove ? getLastMoveHighlight(lastMove.from, lastMove.to) : {}
              }
            />
          </ChessboardDnDProvider>
        </div>
      </div>

      <div style={sidebarCellStyle}>
        <Sidebar
          moves={analysisPosition.getSolutionSans()}
          ply={ply}
          maxPly={analysisPosition.getMaxPly()}
          onSelectPly={syncPly}
          theme={theme}
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
