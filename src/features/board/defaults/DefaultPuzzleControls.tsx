import React from 'react';
import { PuzzleResultStatus } from '../../analysis';
import { AnalysisControls } from 'react-chess-core';

export type PuzzleControlState = {
  canShowHint: boolean;
  canShowSolution: boolean;
};

export type PuzzleControlsRenderProps = {
  showHint: () => void;
  showSolution: () => void;
  nextPuzzle: () => void;
  resultStatus: PuzzleResultStatus;
  analysis: AnalysisControls;
  controlState: PuzzleControlState;
};

const isAttemptFinished = (resultStatus: PuzzleResultStatus) =>
  resultStatus === 'complete' || resultStatus === 'incorrect';

/** Library default hint / next / analysis / result controls (unstyled buttons). */
export const DefaultPuzzleControls = ({
  showHint,
  showSolution,
  nextPuzzle,
  resultStatus,
  analysis,
  controlState,
}: PuzzleControlsRenderProps) => (
  <div style={rowStyle}>
    <button
      type="button"
      onClick={showHint}
      style={buttonStyle}
      disabled={!controlState.canShowHint}
    >
      Hint
    </button>
    <button
      type="button"
      onClick={showSolution}
      style={buttonStyle}
      disabled={!controlState.canShowSolution}
    >
      Show solution
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
  showSolution: () => void,
  nextPuzzle: () => void,
  resultStatus: PuzzleResultStatus,
  analysis: AnalysisControls,
  controlState: PuzzleControlState,
) => (
  <DefaultPuzzleControls
    showHint={showHint}
    showSolution={showSolution}
    nextPuzzle={nextPuzzle}
    resultStatus={resultStatus}
    analysis={analysis}
    controlState={controlState}
  />
);

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 8,
  width: '100%',
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
