import { Meta, StoryObj } from '@storybook/react';
import {
  PuzzleBoardWithControls,
  PuzzleBoardWithControlsProps,
} from '../features/board/PuzzleBoardWithControls';

// Define metadata for the PuzzleBoardWithControls component
const meta: Meta<typeof PuzzleBoardWithControls> = {
  title: 'PuzzleBoardWithControls',
  component: PuzzleBoardWithControls,
};

export default meta;

// Define a type alias for stories
type Story = StoryObj<typeof PuzzleBoardWithControls>;

const apiProxy = {
  onFetch: () =>
    Promise.resolve({
      fen: 'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
      moves: 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' '),
    }),
  onNext: () => Promise.resolve({}),
  onFeedback: (feedbackData: unknown) => {
    console.log(feedbackData);
  },
};

const renderControls = (
  showHint: () => void,
  nextPuzzle: () => void,
  resultStatus: 'none' | 'incorrect' | 'complete',
) => {
  return (
    <div>
      <button onClick={showHint}>Show Hint</button>
      <button onClick={nextPuzzle}>Next Puzzle</button>
      {resultStatus === 'complete' && <button>Finished!</button>}
      {resultStatus === 'incorrect' && <button>Incorrect!</button>}
    </div>
  );
};

// Define the default story with mock data
export const Default: Story = {
  args: {
    theme: 'light',
    apiProxy: apiProxy,
    renderControls: renderControls,
  } as PuzzleBoardWithControlsProps,
};

const fetchPuzzles = () => {
  const puzzles = [
    {
      fen: 'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
      moves: 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' '),
    },
    {
      fen: '8/7R/8/5p2/4bk1P/8/2r2K2/6R1 w - - 7 51',
      moves: 'f2f1 f4f3 f1e1 c2c1 e1d2 c1g1'.split(' '),
    },
    {
      fen: '3r1rk1/1b1n1pp1/3p4/p4PPQ/4P3/3q1BN1/8/2R2RK1 b - - 1 28',
      moves: 'd7e5 f5f6 e5f3 f1f3'.split(' '),
    },
  ];

  let currentIndex = 0;

  const onFetch = async () => {
    // Get the next puzzle in the array
    const puzzle = puzzles[currentIndex];
    currentIndex = (currentIndex + 1) % puzzles.length; // Loop over the puzzles
    return puzzle; // Return the next puzzle
  };

  return onFetch;
};

const multiplePuzzlesApiProxy = {
  onFetch: fetchPuzzles(),
  onFeedback: (feedbackData: unknown) => {
    console.log(feedbackData);
  },
};

export const MultiplePuzzles: Story = {
  args: {
    theme: 'dark',
    apiProxy: multiplePuzzlesApiProxy,
    renderControls: renderControls,
  } as PuzzleBoardWithControlsProps,
};
