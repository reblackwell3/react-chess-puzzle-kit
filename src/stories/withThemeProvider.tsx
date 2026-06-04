import React from 'react';
import { ThemeProvider } from 'react-chess-core';

const withThemeProvider = (Story: React.ComponentType, context: any) => {
  const theme = context.globals.theme || 'light'; // Default to 'light' if no theme is set
  return (
    <ThemeProvider theme={theme}>
      <Story {...context} />
    </ThemeProvider>
  );
};

export default withThemeProvider;
