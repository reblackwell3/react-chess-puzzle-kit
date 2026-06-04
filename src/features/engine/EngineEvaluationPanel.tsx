import React from 'react';
import {
  formatEvaluation,
  formatPvPreview,
  normalizeEvalForWhite,
  type EngineEvaluation,
} from 'react-chess-core';

export interface EngineEvaluationPanelProps {
  fen: string;
  evaluation: EngineEvaluation;
  theme: 'light' | 'dark';
}

export const EngineEvaluationPanel = ({
  fen,
  evaluation,
  theme,
}: EngineEvaluationPanelProps) => {
  const isDark = theme === 'dark';
  const safePv = (
    pv: unknown,
    maxMoves?: number,
  ): { label: string; title: string } => {
    try {
      const label = formatPvPreview(fen, pv, maxMoves);
      const title = formatPvPreview(
        fen,
        pv,
        Array.isArray(pv) ? pv.length : maxMoves ?? 6,
      );
      return { label, title };
    } catch {
      return { label: '', title: '' };
    }
  };

  if (evaluation.status === 'loading') {
    return (
      <p style={captionStyle(isDark)}>Starting engine…</p>
    );
  }

  if (evaluation.status === 'error') {
    return (
      <p style={{ ...captionStyle(isDark), color: '#e57373' }}>
        {evaluation.error ?? 'Engine unavailable'}
      </p>
    );
  }

  if (evaluation.lines.length === 0) {
    return (
      <p style={captionStyle(isDark)}>
        {evaluation.status === 'analyzing' ? 'Analyzing…' : 'No evaluation yet'}
      </p>
    );
  }

  return (
    <div style={panelStyle}>
      <p style={headerStyle(isDark)}>
        Engine{evaluation.depth > 0 ? ` · depth ${evaluation.depth}` : ''}
      </p>
      <ul style={listStyle}>
        {evaluation.lines.map((line) => {
          const normalized = normalizeEvalForWhite(
            fen,
            line.centipawns,
            line.mate,
          );
          const evalLabel = formatEvaluation(
            normalized.centipawns,
            normalized.mate,
          );
          const { label: pvLabel, title: pvTitle } = safePv(
            line.pv,
            Array.isArray(line.pv) ? line.pv.length : 6,
          );

          return (
            <li key={line.multipv} style={lineStyle(isDark)}>
              <span style={evalStyle(isDark)}>{evalLabel}</span>
              {pvLabel ? (
                <span style={pvStyle(isDark)} title={pvTitle || undefined}>
                  {pvLabel}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const lineStyle = (dark: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '6px 8px',
  borderRadius: 4,
  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  fontSize: 12,
});

const evalStyle = (dark: boolean): React.CSSProperties => ({
  fontWeight: 700,
  fontFamily: 'monospace',
  color: dark ? '#ce93d8' : '#6a1b9a',
});

const pvStyle = (dark: boolean): React.CSSProperties => ({
  fontFamily: 'monospace',
  fontSize: 11,
  color: dark ? '#b0b0b0' : '#555',
  wordBreak: 'break-word',
});

const headerStyle = (dark: boolean): React.CSSProperties => ({
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  color: dark ? '#e0e0e0' : '#333',
});

const captionStyle = (dark: boolean): React.CSSProperties => ({
  margin: 0,
  fontSize: 12,
  color: dark ? '#9e9e9e' : '#666',
});
