import { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AnalysisContainerRenderProps } from 'react-chess-core';
import { PUZZLE_ANALYSIS_DIALOG_INSET_PX } from './puzzleAnalysisDimensions';
import { puzzleAnalysisDialogMaxWidthForViewport } from './puzzleAnalysisLayout';

export type PuzzleAnalysisDialogProps = AnalysisContainerRenderProps & {
  title?: string;
  /** When set, reserves space below a fixed app bar (EndChess passes `{ xs: 56, sm: 64 }`). */
  topNavOffsetPx?: { xs: number; sm: number };
};

export const PuzzleAnalysisDialog = ({
  onClose,
  children,
  title = 'Puzzle analysis',
  topNavOffsetPx,
}: PuzzleAnalysisDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reserveTopNav = useMediaQuery(theme.breakpoints.down('lg'));
  const belowAppBarHeightSx = topNavOffsetPx
    ? {
        xs: `calc(100% - ${topNavOffsetPx.xs}px)`,
        sm: `calc(100% - ${topNavOffsetPx.sm}px)`,
      }
    : undefined;
  const [paperMaxWidth, setPaperMaxWidth] = useState<number | '100%'>(() =>
    typeof window !== 'undefined'
      ? puzzleAnalysisDialogMaxWidthForViewport(
          window.innerWidth,
          PUZZLE_ANALYSIS_DIALOG_INSET_PX,
        )
      : 1200,
  );

  useEffect(() => {
    const update = () => {
      setPaperMaxWidth(
        puzzleAnalysisDialogMaxWidthForViewport(
          window.innerWidth,
          PUZZLE_ANALYSIS_DIALOG_INSET_PX,
        ),
      );
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const useTopNavReserve = reserveTopNav && topNavOffsetPx != null;

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth={false}
      fullScreen={fullScreen}
      sx={
        useTopNavReserve
          ? {
              zIndex: theme.zIndex.drawer - 1,
              '& .MuiDialog-container': {
                alignItems: 'flex-start',
              },
            }
          : undefined
      }
      slotProps={{
        backdrop: {
          sx: useTopNavReserve
            ? {
                top: topNavOffsetPx,
                height: belowAppBarHeightSx,
              }
            : undefined,
        },
      }}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: fullScreen ? '100%' : paperMaxWidth,
          ...(useTopNavReserve
            ? {
                top: topNavOffsetPx,
                height: belowAppBarHeightSx,
                maxHeight: belowAppBarHeightSx,
                ...(fullScreen
                  ? {
                      margin: 0,
                      width: '100%',
                      maxWidth: '100%',
                    }
                  : undefined),
              }
            : undefined),
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
        {title}
        <IconButton
          aria-label="Close analysis"
          onClick={onClose}
          sx={{ ml: 'auto' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PuzzleAnalysisDialog;
