import React from 'react';
import { AnalysisLayoutConfig } from '../core/analysisLayoutConfig';
import { ThemeProvider } from '../../board/chessboardTheme';
import { AnalysisBoardModel } from '../core/useAnalysisBoardModel';

export type AnalysisBoardLayoutProps = {
  layout: AnalysisLayoutConfig;
  model: AnalysisBoardModel;
  board: React.ReactNode;
  sidebar: React.ReactNode;
};

/**
 * Optional grid helper: board column + sidebar column.
 * Hosts may use this in `renderMain` or supply their own layout.
 */
export const AnalysisBoardLayout = ({
  layout,
  model,
  board,
  sidebar,
}: AnalysisBoardLayoutProps) => {
  const { boardWidth, sidebarWidth, columnGap } = layout;
  const totalWidth = boardWidth + sidebarWidth + columnGap;

  return (
    <ThemeProvider theme={model.theme}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${boardWidth}px ${sidebarWidth}px`,
          columnGap,
          alignItems: 'start',
          width: totalWidth,
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            minWidth: 0,
            width: boardWidth,
            maxWidth: boardWidth,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: boardWidth, maxWidth: '100%' }}>{board}</div>
        </div>
        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            minWidth: 0,
            width: sidebarWidth,
            maxWidth: sidebarWidth,
          }}
        >
          {sidebar}
        </div>
      </div>
    </ThemeProvider>
  );
};
