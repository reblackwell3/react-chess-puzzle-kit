export type PuzzleMoveRecord = {
  ply: number;
  uci: string;
  san?: string;
  actor: 'player' | 'opponent' | 'attempt';
  isCorrect?: boolean;
};
