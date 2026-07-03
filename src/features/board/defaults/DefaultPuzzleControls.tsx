import React from 'react';
import { PuzzleResultStatus } from '../../analysis';
import { AnalysisControls, getProgressiveHintControl } from 'react-chess-core';

export type PuzzleControlState = {
  canShowHint: boolean;
  canShowSolution: boolean;
  hintUsed: boolean;
};

export type PuzzleControlsRenderProps = {
  showHint: () => void;
  showSolution: () => void;
  nextPuzzle: () => void;
  resultStatus: PuzzleResultStatus;
  analysis: AnalysisControls;
  controlState: PuzzleControlState;
};

/** Library default hint / next / analysis / result controls (unstyled buttons). */
export const DefaultPuzzleControls = ({
  showHint,
  showSolution,
  nextPuzzle,
  resultStatus: _resultStatus,
  analysis,
  controlState,
}: PuzzleControlsRenderProps) => {
  const control = getProgressiveHintControl({
    canShowHint: controlState.canShowHint,
    canShowReveal: controlState.canShowSolution,
    revealLabel: 'Show solution',
  });

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={control.phase === 'hint' ? showHint : showSolution}
        style={buttonStyle}
        disabled={control.disabled}
      >
        {control.label}
      </button>
      <button type="button" onClick={nextPuzzle} style={buttonStyle}>
        Next puzzle
      </button>
      <button
        type="button"
        onClick={analysis.openAnalysis}
        style={buttonStyle}
        disabled={!analysis.visible}
      >
        Analysis
      </button>
    </div>
  );
};

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
