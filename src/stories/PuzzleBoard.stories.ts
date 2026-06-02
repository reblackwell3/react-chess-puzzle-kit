import { Meta, StoryObj } from '@storybook/react';
import { PuzzleBoard } from '../features/board/PuzzleBoard';
import { PuzzlePosition } from '../features/position/Position';
import { STORYBOOK_BOARD_WIDTH } from './storybookLayout';
import withThemeProvider from './withThemeProvider';

const meta: Meta<typeof PuzzleBoard> = {
  title: 'PuzzleBoard',
  component: PuzzleBoard,
  decorators: [withThemeProvider],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof PuzzleBoard>;

const defaultPosition = new PuzzlePosition(
  'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
  'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1'.split(' '),
);

export const Default: Story = {
  args: {
    position: defaultPosition,
    boardWidth: STORYBOOK_BOARD_WIDTH,
    onFeedback: () => {},
    incInteractionNum: () => {},
  },
};
