import { Meta, StoryObj } from '@storybook/react';
import {
  PuzzleBoardWithControls,
  PuzzleBoardWithControlsProps,
} from '../features/board/PuzzleBoardWithControls';
import {
  STORYBOOK_ANALYSIS_LAYOUT,
  STORYBOOK_BOARD_WIDTH,
} from './storybookLayout';
import withDefaultPuzzleControls from './withDefaultPuzzleControls';

const storybookSizing = {
  puzzleBoardWidth: STORYBOOK_BOARD_WIDTH,
  analysisLayout: STORYBOOK_ANALYSIS_LAYOUT,
} satisfies Pick<
  PuzzleBoardWithControlsProps,
  'puzzleBoardWidth' | 'analysisLayout'
>;

const meta: Meta<typeof PuzzleBoardWithControls> = {
  title: 'PuzzleBoardWithControls',
  component: PuzzleBoardWithControls,
  decorators: [withDefaultPuzzleControls],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Stories use the `withDefaultPuzzleControls` decorator when `renderControls` is omitted. Omit all `renderAnalysis*` props to use default analysis UI.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PuzzleBoardWithControls>;

const apiProxy = {
  onFetch: () =>
    Promise.resolve({
      fen: 'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
      moves: 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' '),
    }),
  onFeedback: (feedbackData: unknown) => {
    console.log(feedbackData);
  },
};

export const Default: Story = {
  args: {
    theme: 'light',
    apiProxy,
    engine: { enabled: false },
    ...storybookSizing,
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

  return async () => {
    const puzzle = puzzles[currentIndex];
    currentIndex = (currentIndex + 1) % puzzles.length;
    return puzzle;
  };
};

export const MultiplePuzzles: Story = {
  args: {
    theme: 'dark',
    apiProxy: {
      onFetch: fetchPuzzles(),
      onFeedback: (feedbackData: unknown) => console.log(feedbackData),
    },
    engine: { enabled: false },
    ...storybookSizing,
  } as PuzzleBoardWithControlsProps,
};

/** Default controls + default analysis modal, sidebar, and engine panel. */
export const AllLibraryDefaults: Story = {
  name: 'All library defaults',
  args: {
    theme: 'dark',
    apiProxy,
    engine: { enabled: false },
    ...storybookSizing,
  } as PuzzleBoardWithControlsProps,
  parameters: {
    docs: {
      description: {
        story:
          'No custom render props: `DefaultPuzzleControls`, `AnalysisBoard`, and default analysis chrome. Finish or fail the puzzle, then click Analysis.',
      },
    },
  },
};
