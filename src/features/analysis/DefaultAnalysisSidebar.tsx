import React from 'react';
import { squareHighlightColors } from '../theme/squareHighlightColors';
import { AnalysisSidebarRenderProps } from './renderProps';

export const DefaultAnalysisSidebar = ({
  historyRows,
  isHistoryRowSelected,
  onSelectHistoryRow,
  ply,
  maxPly,
  onSelectPly,
  theme,
}: AnalysisSidebarRenderProps) => {
  const moveChipStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    backgroundColor: squareHighlightColors.sidebarMove[theme],
  };
  const activeMoveChipStyle: React.CSSProperties = {
    ...moveChipStyle,
    backgroundColor: squareHighlightColors.sidebarActiveMove[theme],
    fontWeight: 600,
  };
  const variationChipStyle: React.CSSProperties = {
    ...moveChipStyle,
    fontStyle: 'italic',
  };
  const activeVariationChipStyle: React.CSSProperties = {
    ...activeMoveChipStyle,
    fontStyle: 'italic',
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

      <ol style={moveListStyle}>
        {historyRows.map((row) => {
          const isSelected = isHistoryRowSelected(row);
          const isVariation = row.kind === 'variation';
          const style = isSelected
            ? isVariation
              ? activeVariationChipStyle
              : activeMoveChipStyle
            : isVariation
              ? variationChipStyle
              : moveChipStyle;

          return (
            <li
              key={row.key}
              style={{
                ...style,
                marginLeft: row.indent * 16,
              }}
              onClick={() => onSelectHistoryRow(row)}
            >
              {row.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const sidebarStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
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
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  maxHeight: 400,
  overflowY: 'auto',
};
