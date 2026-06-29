const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    // Avoid loading react-chess-core dist (bundles MUI) in node tests.
    '^react-chess-core$': path.join(
      __dirname,
      '../react-chess-core-2/src/features/chessboard/lastMoveArrow.ts',
    ),
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};
