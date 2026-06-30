import { Button } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import type { AnalysisControls } from 'react-chess-core';

type Props = {
  analysis: AnalysisControls;
};

export const PuzzleAnalyzeButton: React.FC<Props> = ({ analysis }) => (
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<AnalyticsIcon />}
    onClick={analysis.openAnalysis}
    disabled={!analysis.visible}
  >
    Analyze
  </Button>
);
