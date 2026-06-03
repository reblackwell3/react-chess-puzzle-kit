import React from 'react';
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
      <div style={navStyle}>
        <button type="button" onClick={() => onSelectPly(0)} disabled={ply === 0}>
          |◀
        </button>
        <button
          type="button"
          onClick={() => onSelectPly(ply - 1)}
          disabled={ply === 0}
        >
          ◀
        </button>
        <span style={plyLabelStyle}>
          {ply} / {maxPly}
        </span>
        <button
          type="button"
          onClick={() => onSelectPly(ply + 1)}
          disabled={ply >= maxPly}
        >
          ▶
        </button>
        <button
          type="button"
          onClick={() => onSelectPly(maxPly)}
          disabled={ply >= maxPly}
        >
          ▶|
        </button>
      </div>

      <div style={contentRowStyle}>
        <ol style={moveListStyle}>
          {historyRows.map((row) => {
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
                  fontWeight: isSelected ? 600 : undefined,
                  fontStyle: isVariation ? 'italic' : undefined,
                  marginLeft: row.indent * 16,
                }}
                onClick={() => onSelectHistoryRow(row)}
              >
                {row.label}
              </li>
            );
          })}
        </ol>

        {engineEvaluationPanel ? (
          <div style={enginePanelStyle}>{engineEvaluationPanel}</div>
        ) : null}
      </div>
    </div>
  );
};

const contentRowStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  gap: 12,
  alignItems: 'stretch',
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
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12,
};

const plyLabelStyle: React.CSSProperties = {
  minWidth: 56,
  textAlign: 'center',
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
