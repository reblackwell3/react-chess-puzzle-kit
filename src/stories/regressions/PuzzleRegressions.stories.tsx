import { Meta, StoryObj } from '@storybook/react';
import {
  PuzzleBoardWithControls,
  PuzzleBoardWithControlsProps,
} from '../../features/board/PuzzleBoardWithControls';
import {
  STORYBOOK_ANALYSIS_LAYOUT,
  STORYBOOK_BOARD_WIDTH,
} from '../storybookLayout';
import withDefaultPuzzleControls from '../withDefaultPuzzleControls';
import { PUZZLE_REGRESSIONS, PuzzleRegression } from './fixtures';

const storybookSizing = {
  puzzleBoardWidth: STORYBOOK_BOARD_WIDTH,
  analysisLayout: STORYBOOK_ANALYSIS_LAYOUT,
} satisfies Pick<
  PuzzleBoardWithControlsProps,
  'puzzleBoardWidth' | 'analysisLayout'
>;

const meta: Meta<typeof PuzzleBoardWithControls> = {
  title: 'Regressions/Puzzles',
  component: PuzzleBoardWithControls,
  decorators: [withDefaultPuzzleControls],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Real puzzles that previously triggered bugs. Each story reproduces ' +
          'one scenario from `fixtures.ts` so regressions stay visible.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PuzzleBoardWithControls>;

const makeStory = (regression: PuzzleRegression): Story => ({
  name: regression.name,
  args: {
    theme: 'light',
    apiProxy: {
      onFetch: () =>
        Promise.resolve({
          fen: regression.fen,
          moves: regression.moves.split(' ').filter(Boolean),
        }),
      onFeedback: (feedbackData: unknown) => console.log(feedbackData),
    },
    engine: { enabled: false },
    ...storybookSizing,
  } as PuzzleBoardWithControlsProps,
  parameters: {
    docs: {
      description: {
        story: `Source puzzle ${regression.sourceId}. ${regression.description}`,
      },
    },
  },
});

export const WrongLegalCaptureShouldFail = makeStory(
  PUZZLE_REGRESSIONS.wrongLegalCaptureShouldFail,
);

export const DualCheckmateAccepted = makeStory(
  PUZZLE_REGRESSIONS.dualCheckmateAccepted,
);

export const WrongCaptureWhileInCheckShouldFail = makeStory(
  PUZZLE_REGRESSIONS.wrongCaptureWhileInCheckShouldFail,
);
