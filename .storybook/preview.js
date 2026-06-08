/** @type { import('@storybook/react').Preview } */
import withThemeProvider from '../src/stories/withThemeProvider';
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withThemeProvider],
};

export default preview;
