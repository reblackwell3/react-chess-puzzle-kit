import { Meta, StoryObj } from '@storybook/react';
import { HighlightChessboard } from 'react-chess-core';
import { STORYBOOK_BOARD_WIDTH } from './storybookLayout';
import withChessboardDnD from './withChessboardDnD';
import withThemeProvider from './withThemeProvider';

const meta: Meta<typeof HighlightChessboard> = {
  title: 'HighlightChessboard',
  component: HighlightChessboard,
  decorators: [withThemeProvider, withChessboardDnD],
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof HighlightChessboard>;

const startingFen =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const Default: Story = {
  args: {
    position: startingFen,
    checkSquare: '',
    hintSquare: null,
    incorrectMoveSquare: null,
    boardWidth: STORYBOOK_BOARD_WIDTH,
  },
};

export const KingInCheck: Story = {
  args: {
    position: '4k2r/4r3/8/8/8/8/3R4/R3K3 w Qk - 0 1',
    checkSquare: 'e1',
    hintSquare: null,
    incorrectMoveSquare: null,
    boardWidth: STORYBOOK_BOARD_WIDTH,
  },
};

export const WithHint: Story = {
  args: {
    position: '4k2r/6r1/8/8/8/8/3R4/R3K3 w - - 0 1',
    checkSquare: '',
    hintSquare: 'a1',
    incorrectMoveSquare: null,
    boardWidth: STORYBOOK_BOARD_WIDTH,
  },
};

export const IncorrectMove: Story = {
  args: {
    position: '4k2r/6r1/8/8/8/8/3R4/R3K3 w - - 0 1',
    checkSquare: '',
    hintSquare: null,
    incorrectMoveSquare: 'e7',
    boardWidth: STORYBOOK_BOARD_WIDTH,
  },
};
