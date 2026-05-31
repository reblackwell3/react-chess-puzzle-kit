import React from 'react';
import { AnalysisSidebarRenderProps } from './renderProps';

export const DefaultAnalysisSidebar = ({
  moves,
  ply,
  maxPly,
  onSelectPly,
  theme: _theme,
}: AnalysisSidebarRenderProps) => (
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
        disabled={ply === maxPly}
      >
        ▶
      </button>
      <button
        type="button"
        onClick={() => onSelectPly(maxPly)}
        disabled={ply === maxPly}
      >
        ▶|
      </button>
    </div>

    <ol style={moveListStyle}>
      <li
        style={ply === 0 ? activeMoveStyle : moveItemStyle}
        onClick={() => onSelectPly(0)}
      >
        Start
      </li>
      {moves.map((move) => (
        <li
          key={move.ply}
          style={ply === move.ply ? activeMoveStyle : moveItemStyle}
          onClick={() => onSelectPly(move.ply)}
        >
          {move.san}
        </li>
      ))}
    </ol>
  </div>
);

const sidebarStyle: React.CSSProperties = {
  minWidth: 180,
  flex: 1,
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
  flexWrap: 'wrap',
  gap: 8,
};

const moveItemStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  backgroundColor: '#f0f0f0',
};

const activeMoveStyle: React.CSSProperties = {
  ...moveItemStyle,
  backgroundColor: '#77b1d4',
  fontWeight: 600,
};
