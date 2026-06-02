import { Decorator } from '@storybook/react';
import { defaultRenderControls } from '../features/board/defaults/DefaultPuzzleControls';

/**
 * Supplies {@link defaultRenderControls} when a story omits `renderControls`.
 * Use on `PuzzleBoardWithControls` stories for the library default button row.
 */
export const withDefaultPuzzleControls: Decorator = (StoryFn, context) => (
  <StoryFn
    {...context.args}
    renderControls={context.args.renderControls ?? defaultRenderControls}
  />
);

export default withDefaultPuzzleControls;
