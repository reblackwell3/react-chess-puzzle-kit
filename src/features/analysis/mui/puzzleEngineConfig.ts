import { useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  DEFAULT_STOCKFISH_SCRIPT_URL,
  type AnalysisEngineOptions,
} from 'react-chess-core';

const publicUrl =
  typeof process !== 'undefined' && process.env?.PUBLIC_URL
    ? process.env.PUBLIC_URL
    : '';

/** Resolve Stockfish script URL for host apps (honors CRA `PUBLIC_URL` when set). */
export const resolvePuzzleEngineScriptUrl = (
  basePublicUrl = publicUrl,
): string => `${basePublicUrl}${DEFAULT_STOCKFISH_SCRIPT_URL}`;

export const puzzleEngineOptions = {
  scriptUrl: resolvePuzzleEngineScriptUrl(),
} as const satisfies AnalysisEngineOptions;

export const playTimeEngineOptions = {
  ...puzzleEngineOptions,
  depth: 10,
  multiPv: 6,
  priority: 0,
} as const satisfies AnalysisEngineOptions;

export const playTimeEngineOptionsMobile = {
  ...playTimeEngineOptions,
  depth: 8,
  multiPv: 5,
} as const satisfies AnalysisEngineOptions;

/** @deprecated Use playTimeEngineOptions — eval bar shares play-time engine via PlayTimeEngineProvider. */
export const inlineEvalEngineOptions = playTimeEngineOptions;

export const analysisModalEngineOptions = {
  ...puzzleEngineOptions,
  depth: 16,
  multiPv: 3,
  priority: 1,
} as const satisfies AnalysisEngineOptions;

export const usePlayTimeEngineOptions = (): AnalysisEngineOptions => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return useMemo(
    () => (isMobile ? playTimeEngineOptionsMobile : playTimeEngineOptions),
    [isMobile],
  );
};
