export type EngineStatus = 'idle' | 'loading' | 'analyzing' | 'error';

export type EngineLine = {
  multipv: number;
  depth: number;
  /** Centipawns from side to move (UCI). */
  centipawns: number | null;
  mate: number | null;
  /** Principal variation in UCI notation. */
  pv: string[];
};

export type EngineEvaluation = {
  status: EngineStatus;
  depth: number;
  lines: EngineLine[];
  /** FEN this evaluation was computed for (omit when unknown). */
  fen?: string;
  error?: string;
};

export const emptyEngineEvaluation = (): EngineEvaluation => ({
  status: 'idle',
  depth: 0,
  lines: [],
});

export type AnalysisEngineOptions = {
  enabled?: boolean;
  depth?: number;
  multiPv?: number;
  /** URL to stockfish-18-lite-single.js (host must serve .wasm alongside it). */
  scriptUrl?: string;
};

export const DEFAULT_STOCKFISH_SCRIPT_URL =
  '/stockfish/stockfish-18-lite-single.js';
