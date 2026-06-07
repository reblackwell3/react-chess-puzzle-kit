import React from 'react';
import type { LineControlsRenderProps } from '../LineBoardWithControls';

/** Library default line-drill status controls (unstyled). */
export const DefaultLineControls = ({
  moveNumber,
  total,
  finished,
  isUserTurn,
  feedback,
}: LineControlsRenderProps) => (
  <div style={rowStyle}>
    <span style={statusStyle}>
      {finished ? 'Line complete' : `Move ${moveNumber} of ${total}`}
    </span>
    {feedback && !finished && (
      <span
        style={{
          ...statusStyle,
          color: feedback.isCorrect ? '#2e7d32' : '#c62828',
        }}
      >
        {feedback.isCorrect
          ? `Correct: ${feedback.expectedSan}`
          : `Best was ${feedback.expectedSan}`}
      </span>
    )}
    {isUserTurn && !finished && <span style={hintStyle}>Your move</span>}
  </div>
);

export const defaultRenderLineControls = (props: LineControlsRenderProps) => (
  <DefaultLineControls {...props} />
);

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  minHeight: 96,
  alignContent: 'flex-start',
};

const statusStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
};

const hintStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#9e9e9e',
};
