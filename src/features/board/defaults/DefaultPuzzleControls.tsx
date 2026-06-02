import React from 'react';
import {
  AnalysisControls,
  PuzzleResultStatus,
} from '../../analysis';

export type PuzzleControlsRenderProps = {
  showHint: () => void;
  nextPuzzle: () => void;
  resultStatus: PuzzleResultStatus;
  analysis: AnalysisControls;
};

const isAttemptFinished = (resultStatus: PuzzleResultStatus) =>
  resultStatus === 'complete' || resultStatus === 'incorrect';

/** Library default hint / next / analysis / result controls (unstyled buttons). */
export const DefaultPuzzleControls = ({
  showHint,
  nextPuzzle,
  resultStatus,
  analysis,
}: PuzzleControlsRenderProps) => (
  <div style={rowStyle}>
    <button type="button" onClick={showHint} style={buttonStyle}>
      Hint
    </button>
    <button type="button" onClick={nextPuzzle} style={buttonStyle}>
      Next puzzle
    </button>
    {analysis.visible && isAttemptFinished(resultStatus) && (
      <button type="button" onClick={analysis.openAnalysis} style={buttonStyle}>
        Analysis
      </button>
    )}
    {resultStatus === 'complete' && (
      <span style={statusStyle}>Complete</span>
    )}
    {resultStatus === 'incorrect' && (
      <span style={{ ...statusStyle, color: '#c62828' }}>Incorrect</span>
    )}
  </div>
);

export const defaultRenderControls = (
  showHint: () => void,
  nextPuzzle: () => void,
  resultStatus: PuzzleResultStatus,
  analysis: AnalysisControls,
) => (
  <DefaultPuzzleControls
    showHint={showHint}
    nextPuzzle={nextPuzzle}
    resultStatus={resultStatus}
    analysis={analysis}
  />
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

const buttonStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '6px 12px',
  fontSize: 14,
  borderRadius: 4,
  border: '1px solid #ccc',
  background: '#f5f5f5',
};

const statusStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#2e7d32',
};
