import { Box, ListItemButton, Typography } from '@mui/material';
import { EngineEvaluationRenderProps } from 'react-chess-core';
import {
  formatEvaluation,
  formatPvPreview,
  normalizeEvalForWhite,
} from 'react-chess-core';

export const PuzzleEngineEvaluation = ({
  fen,
  evaluation,
  theme,
  selectedPvMultipv = null,
  onSelectPvLine,
}: EngineEvaluationRenderProps) => {
  const safePv = (
    pv: unknown,
    maxMoves?: number,
  ): { label: string; title: string } => {
    try {
      const label = formatPvPreview(fen, pv, maxMoves);
      const title = formatPvPreview(
        fen,
        pv,
        Array.isArray(pv) ? pv.length : (maxMoves ?? 6),
      );
      return { label, title };
    } catch {
      return { label: '', title: '' };
    }
  };

  if (evaluation.status === 'loading') {
    return (
      <Typography variant="body2" color="text.secondary">
        Starting engine…
      </Typography>
    );
  }

  if (evaluation.status === 'error') {
    return (
      <Typography variant="body2" color="error">
        {evaluation.error ?? 'Engine unavailable'}
      </Typography>
    );
  }

  if (evaluation.lines.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {evaluation.status === 'analyzing' ? 'Analyzing…' : 'No evaluation yet'}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Engine{evaluation.depth > 0 ? ` · depth ${evaluation.depth}` : ''}
      </Typography>
      {evaluation.lines.map((line) => {
        const normalized = normalizeEvalForWhite(
          fen,
          line.centipawns,
          line.mate,
        );
        const evalLabel = formatEvaluation(
          normalized.centipawns,
          normalized.mate,
        );
        const { label: pvLabel, title: pvTitle } = safePv(
          line.pv,
          Array.isArray(line.pv) ? line.pv.length : 6,
        );
        const pvMoves = Array.isArray(line.pv)
          ? line.pv.filter((move): move is string => typeof move === 'string')
          : [];
        const isSelected = selectedPvMultipv === line.multipv;
        const isClickable = Boolean(onSelectPvLine && pvMoves.length > 0);

        const content = (
          <>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontFamily: 'monospace',
                color: theme === 'dark' ? 'secondary.light' : 'secondary.main',
              }}
            >
              {evalLabel}
            </Typography>
            {pvLabel ? (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  wordBreak: 'break-word',
                }}
                title={pvTitle || undefined}
              >
                {pvLabel}
              </Typography>
            ) : null}
          </>
        );

        if (!isClickable) {
          return (
            <Box
              key={line.multipv}
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor:
                  theme === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              {content}
            </Box>
          );
        }

        return (
          <ListItemButton
            key={line.multipv}
            selected={isSelected}
            onClick={() =>
              onSelectPvLine?.(pvMoves, evaluation.depth, line.multipv)
            }
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: isSelected
                ? theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)'
                : theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.04)',
            }}
          >
            {content}
          </ListItemButton>
        );
      })}
    </Box>
  );
};

export default PuzzleEngineEvaluation;
