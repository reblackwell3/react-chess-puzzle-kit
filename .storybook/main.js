/** @type { import('@storybook/react-vite').StorybookConfig } */

import { mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default {
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/preset-typescript',
  ],
  core: {
    builder: '@storybook/builder-vite',
  },
  async viteFinal(config) {
    const modifiedConfig = mergeConfig(config, {
      // Add dependencies to pre-optimization
      plugins: [tsconfigPaths({ logLevel: 'debug' })],
      optimizeDeps: {
        include: ['storybook-dark-mode', 'react-chess-core'],
      },
    });
    console.log('Resolved paths:', modifiedConfig.resolve.alias);
    return modifiedConfig;
  },
};
