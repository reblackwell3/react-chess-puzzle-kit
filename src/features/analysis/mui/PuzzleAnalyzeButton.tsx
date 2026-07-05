import { Button, type ButtonProps } from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import type { AnalysisControls } from 'react-chess-core';

type Props = Omit<ButtonProps, 'onClick' | 'disabled' | 'children'> & {
  analysis: AnalysisControls;
};

export const PuzzleAnalyzeButton: React.FC<Props> = ({
  analysis,
  fullWidth = true,
  sx,
  ...buttonProps
}) => (
  <Button
    fullWidth={fullWidth}
    variant="outlined"
    color="secondary"
    startIcon={<AnalyticsIcon />}
    onClick={analysis.openAnalysis}
    disabled={!analysis.visible}
    sx={sx}
    {...buttonProps}
  >
    Analyze
  </Button>
);
