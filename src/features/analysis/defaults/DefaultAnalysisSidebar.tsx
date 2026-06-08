import React from 'react';
import { PlyNavigation } from 'react-chess-core';
import { AnalysisSidebarRenderProps } from '../core/renderProps';
import { analysisSidebarColors } from './analysisSidebarColors';
import {
  createSidebarRowBandCounters,
  getSidebarRowBackground,
} from './analysisSidebarRowStyle';

export const DefaultAnalysisSidebar = ({
  historyRows,
  isHistoryRowSelected,
  onSelectHistoryRow,
  ply,
  maxPly,
  onSelectPly,
  theme,
  engineEvaluationPanel,
}: AnalysisSidebarRenderProps) => {
  const rowBands = createSidebarRowBandCounters();

  const baseChipStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
  };

  return (
    <div style={sidebarStyle}>
      <div style={navBlockStyle}>
        <PlyNavigation
          plyIndex={ply}
          totalPly={maxPly}
          canPrev={ply > 0}
          canNext={ply < maxPly}
          onGoFirst={() => onSelectPly(0)}
          onGoPrev={() => onSelectPly(ply - 1)}
          onGoNext={() => onSelectPly(ply + 1)}
          onGoLast={() => onSelectPly(maxPly)}
          onGoTo={onSelectPly}
          theme={theme}
          showScrubber={false}
        />

        <p style={sectionTitleStyle}>Move history</p>
      </div>

      <div style={contentRowStyle}>
        <ol style={moveListStyle}>
          {historyRows.length === 0 ? (
            <li style={emptyRowStyle}>No moves played yet.</li>
          ) : (
            historyRows.map((row) => {
              const isSelected = isHistoryRowSelected(row);
              const isVariation = row.kind === 'variation';
              const backgroundColor = isSelected
                ? analysisSidebarColors.activeMove[theme]
                : getSidebarRowBackground(theme, row, rowBands);

              return (
                <li
                  key={row.key}
                  style={{
                    ...baseChipStyle,
                    backgroundColor,
                    marginLeft: row.indent * 16,
                  }}
                  onClick={() => onSelectHistoryRow(row)}
                >
                  <span
                    style={{
                      fontWeight: isSelected ? 600 : undefined,
                      fontStyle: isVariation ? 'italic' : 'normal',
                      fontFamily: isVariation
                        ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                        : 'inherit',
                      fontSize: isVariation ? 13 : 14,
                      color: isSelected
                        ? '#fff'
                        : isVariation
                          ? analysisSidebarColors.variationText[theme]
                          : undefined,
                    }}
                  >
                    {row.label}
                  </span>
                </li>
              );
            })
          )}
        </ol>

        {engineEvaluationPanel ? (
          <div style={enginePanelStyle}>{engineEvaluationPanel}</div>
        ) : null}
      </div>

      <p style={footerStyle}>
        Drag pieces to explore lines. Select a main-line move to return to the
        game.
      </p>
    </div>
  );
};

const contentRowStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  gap: 12,
  alignItems: 'stretch',
  padding: '0 8px 8px',
};

const enginePanelStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 220,
  minWidth: 220,
  paddingLeft: 12,
  borderLeft: '1px solid rgba(128, 128, 128, 0.35)',
  overflowY: 'auto',
  maxHeight: 400,
};

const sidebarStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  maxHeight: 480,
  overflow: 'hidden',
  border: '1px solid rgba(128, 128, 128, 0.35)',
  borderRadius: 4,
  boxSizing: 'border-box',
};

const navBlockStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: '12px 12px 8px',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
  fontWeight: 600,
};

const emptyRowStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: '4px 8px',
  fontSize: 14,
  color: '#666',
};

const footerStyle: React.CSSProperties = {
  flexShrink: 0,
  margin: 0,
  padding: '0 12px 12px',
  fontSize: 12,
  color: '#888',
};

const moveListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  overflowY: 'auto',
  maxHeight: 400,
};
