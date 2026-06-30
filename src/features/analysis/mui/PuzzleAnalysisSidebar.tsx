import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import { AnalysisSidebarRenderProps } from 'react-chess-core';
import {
  createPuzzleAnalysisRowBands,
  getPuzzleAnalysisRowBackground,
  puzzleAnalysisSidebarColors,
} from './puzzleAnalysisSidebarStyle';

/** Move list column + engine column (see layout below). */
const SIDEBAR_DESIGN_WIDTH = 500;
const ENGINE_COLUMN_WIDTH = 220;
const SIDEBAR_MAX_HEIGHT = 480;
/** Scroll move list on narrow layouts so engine lines stay on screen. */
const STACKED_MOVE_LIST_MAX_HEIGHT = 220;

export type PuzzleAnalysisSidebarProps = AnalysisSidebarRenderProps & {
  /** Stack engine lines under move history (narrow modals). */
  stackEngineBelow?: boolean;
};

export const PuzzleAnalysisSidebar = ({
  historyRows,
  isHistoryRowSelected,
  onSelectHistoryRow,
  ply,
  maxPly,
  onSelectPly,
  theme,
  engineEvaluationPanel,
  stackEngineBelow = false,
}: PuzzleAnalysisSidebarProps) => {
  const rowBands = createPuzzleAnalysisRowBands();

  const enginePanel = engineEvaluationPanel ? (
    <Paper
      variant="outlined"
      sx={{
        flexShrink: 0,
        width: stackEngineBelow ? '100%' : ENGINE_COLUMN_WIDTH,
        minWidth: stackEngineBelow ? 0 : ENGINE_COLUMN_WIDTH,
        alignSelf: 'stretch',
        overflow: 'auto',
        p: 1.5,
        bgcolor: theme === 'dark' ? 'grey.800' : 'action.hover',
        borderColor: theme === 'dark' ? 'grey.600' : 'divider',
      }}
    >
      {engineEvaluationPanel}
    </Paper>
  ) : null;

  const moveHistoryList = (
    <Box
      sx={{
        flex: stackEngineBelow ? '0 1 auto' : 1,
        minWidth: 0,
        maxHeight: stackEngineBelow ? STACKED_MOVE_LIST_MAX_HEIGHT : undefined,
        overflow: 'auto',
      }}
    >
      {historyRows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          No moves played yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {historyRows.map((row) => {
            const isSelected = isHistoryRowSelected(row);
            const isVariation = row.kind === 'variation';

            return (
              <ListItemButton
                key={row.key}
                selected={isSelected}
                onClick={() => onSelectHistoryRow(row)}
                sx={{
                  borderRadius: 1,
                  pl: 1 + row.indent * 2,
                  fontStyle: isVariation ? 'italic' : 'normal',
                  bgcolor: isSelected
                    ? puzzleAnalysisSidebarColors.activeMove[theme]
                    : getPuzzleAnalysisRowBackground(theme, row, rowBands),
                  color:
                    isVariation && !isSelected
                      ? puzzleAnalysisSidebarColors.variationText[theme]
                      : undefined,
                  '&.Mui-selected': {
                    bgcolor: puzzleAnalysisSidebarColors.activeMove[theme],
                    color: 'rgba(255, 255, 255, 1)',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: puzzleAnalysisSidebarColors.activeMove[theme],
                    color: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <ListItemText
                  primary={row.label}
                  primaryTypographyProps={{
                    fontFamily: isVariation ? 'monospace' : 'inherit',
                    variant: isVariation ? 'body2' : 'body1',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Box>
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        width: '100%',
        maxWidth: stackEngineBelow ? '100%' : SIDEBAR_DESIGN_WIDTH,
        maxHeight: stackEngineBelow ? 'none' : SIDEBAR_MAX_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: stackEngineBelow ? 'visible' : 'hidden',
        bgcolor: theme === 'dark' ? 'grey.900' : 'background.paper',
        borderColor: theme === 'dark' ? 'grey.700' : 'divider',
      }}
    >
      <Box sx={{ flexShrink: 0, p: 1.5, pb: 1 }}>
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            aria-label="First move"
            size="small"
            color="inherit"
            onClick={() => onSelectPly(0)}
            disabled={ply <= 0}
          >
            <FirstPageIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Previous move"
            size="small"
            color="inherit"
            onClick={() => onSelectPly(ply - 1)}
            disabled={ply <= 0}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ alignSelf: 'center', minWidth: 48, textAlign: 'center' }}
          >
            {ply} / {maxPly}
          </Typography>
          <IconButton
            aria-label="Next move"
            size="small"
            color="inherit"
            onClick={() => onSelectPly(ply + 1)}
            disabled={ply >= maxPly}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Last move"
            size="small"
            color="inherit"
            onClick={() => onSelectPly(maxPly)}
            disabled={ply >= maxPly}
          >
            <LastPageIcon fontSize="small" />
          </IconButton>
        </Stack>

        {stackEngineBelow && enginePanel ? (
          <Box sx={{ mt: 1.5 }}>{enginePanel}</Box>
        ) : null}

        <Typography variant="subtitle2" sx={{ mt: 1 }}>
          Move history
        </Typography>
      </Box>

      <Box
        sx={{
          flex: stackEngineBelow ? '0 1 auto' : 1,
          minHeight: stackEngineBelow ? undefined : 0,
          display: 'flex',
          flexDirection: stackEngineBelow ? 'column' : 'row',
          gap: 1.5,
          px: 1,
          pb: 1,
        }}
      >
        {moveHistoryList}

        {!stackEngineBelow && enginePanel ? enginePanel : null}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flexShrink: 0, px: 1.5, pb: 1.5 }}
      >
        Drag pieces to explore lines. Select a main-line move to return to the
        solution.
      </Typography>
    </Paper>
  );
};

export default PuzzleAnalysisSidebar;
