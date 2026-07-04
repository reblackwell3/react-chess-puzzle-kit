import { Box, Stack } from '@mui/material';
import {
  AnalysisBoardLayout,
  AnalysisLayoutConfig,
  AnalysisMainRenderProps,
  ThemeProvider,
} from 'react-chess-core';

export type PuzzleAnalysisMainProps = AnalysisMainRenderProps & {
  layout: AnalysisLayoutConfig;
  stackVertically: boolean;
};

/** Board + sidebar placement for the analysis modal (side-by-side or stacked). */
export const PuzzleAnalysisMain = ({
  layout,
  stackVertically,
  model,
  board,
  sidebar,
}: PuzzleAnalysisMainProps) => {
  if (!stackVertically) {
    return (
      <AnalysisBoardLayout
        layout={layout}
        model={model}
        board={board}
        sidebar={sidebar}
      />
    );
  }

  return (
    <ThemeProvider theme={model.theme}>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {board}
        </Box>
        <Box sx={{ width: '100%', minWidth: 0 }}>{sidebar}</Box>
      </Stack>
    </ThemeProvider>
  );
};

export default PuzzleAnalysisMain;
