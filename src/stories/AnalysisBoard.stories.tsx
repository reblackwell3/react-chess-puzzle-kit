import { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { AnalysisBoard } from '../features/analysis/defaults/AnalysisBoard';
import { createSampleAnalysisContext } from './analysisFixtures';
import { STORYBOOK_ANALYSIS_LAYOUT } from './storybookLayout';

const meta: Meta<typeof AnalysisBoard> = {
  title: 'Analysis/AnalysisBoard (defaults)',
  component: AnalysisBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full analysis UI using library defaults: modal shell, grid layout, sidebar, and engine panel. Host apps typically use `AnalysisBoardCore` with custom render props instead.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AnalysisBoard>;

const sampleContext = createSampleAnalysisContext();

export const Default: Story = {
  args: {
    analysisContext: sampleContext,
    theme: 'dark',
    layout: STORYBOOK_ANALYSIS_LAYOUT,
    onClose: () => {},
    engine: { enabled: false },
  },
  play: async () => {
    const body = within(document.body);
    await expect(
      body.getByRole('dialog', { name: 'Puzzle analysis' }),
    ).toBeInTheDocument();
    await expect(
      body.getByRole('heading', { name: 'Analysis' }),
    ).toBeInTheDocument();
    await expect(body.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  },
};

export const LightTheme: Story = {
  args: {
    ...Default.args,
    theme: 'light',
  },
};

/** Requires `npm run copy:stockfish` so WASM is served from `public/stockfish/`. */
export const WithStockfishEngine: Story = {
  args: {
    ...Default.args,
    engine: { enabled: true, depth: 14, multiPv: 2 },
  },
};
