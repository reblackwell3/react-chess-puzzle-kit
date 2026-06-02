import { Chess } from 'chess.js';

/** Parse a UCI token (e2e4, e7e8q) into a chess.js move object. */
export const parseUciMove = (
  uci: string,
): { from: string; to: string; promotion?: string } | null => {
  const token = uci.trim().toLowerCase();
  if (token.length < 4) {
    return null;
  }

  const from = token.slice(0, 2);
  const to = token.slice(2, 4);
  const promotion = token.length > 4 ? token[4] : undefined;

  return promotion ? { from, to, promotion } : { from, to };
};

/** Coerce engine PV data to UCI move tokens (handles array or space-separated string). */
export const normalizePvMoves = (pv: unknown): string[] => {
  if (Array.isArray(pv)) {
    return pv.filter(
      (move): move is string => typeof move === 'string' && move.length > 0,
    );
  }
  if (typeof pv === 'string' && pv.trim().length > 0) {
    return pv.trim().split(/\s+/);
  }
  return [];
};

/** Apply UCI moves from a FEN and return SAN for each legal move in order. */
export const uciPvToSan = (fen: string, pv: unknown): string[] => {
  const moves = normalizePvMoves(pv);
  const chess = new Chess(fen);
  const sans: string[] = [];

  for (const uci of moves) {
    const uciMove = parseUciMove(uci);
    if (!uciMove) {
      break;
    }

    try {
      const move = chess.move(uciMove);
      sans.push(move.san);
    } catch {
      break;
    }
  }

  return sans;
};

/** Normalize UCI eval (side to move) to White's perspective. */
export const normalizeEvalForWhite = (
  fen: string,
  centipawns: number | null,
  mate: number | null,
): { centipawns: number | null; mate: number | null } => {
  const turn = fen.split(' ')[1];
  if (turn === 'w') {
    return { centipawns, mate };
  }
  if (centipawns !== null) {
    return { centipawns: -centipawns, mate: null };
  }
  if (mate !== null) {
    return { centipawns: null, mate: -mate };
  }
  return { centipawns: null, mate: null };
};

export const formatEvaluation = (
  centipawns: number | null,
  mate: number | null,
): string => {
  if (mate !== null) {
    return mate > 0 ? `#+${mate}` : `#${mate}`;
  }
  if (centipawns === null) {
    return '—';
  }
  const pawns = centipawns / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(2)}`;
};

/** Principal variation as space-separated SAN (from the given FEN). */
export const formatPvPreview = (
  fen: string,
  pv: unknown,
  maxMoves = 6,
): string => {
  const moves = normalizePvMoves(pv);
  if (moves.length === 0) {
    return '';
  }
  const limit =
    typeof maxMoves === 'number' && Number.isFinite(maxMoves) ? maxMoves : 6;
  return uciPvToSan(fen, moves.slice(0, limit)).join(' ');
};
