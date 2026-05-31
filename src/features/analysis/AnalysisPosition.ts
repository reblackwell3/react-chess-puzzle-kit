import { Chess } from 'chess.js';
import { getCheckSquareFromChess } from '../position/Position';
import { PuzzleAnalysisContext } from './analysisContext';

export type SolutionMoveDisplay = {
  ply: number;
  uci: string;
  san: string;
};

export class AnalysisPosition {
  private chess: Chess;
  private readonly initialFen: string;
  private readonly solutionMoves: string[];
  private readonly solutionSans: SolutionMoveDisplay[];
  private ply: number;

  constructor(context: PuzzleAnalysisContext) {
    this.initialFen = context.initialFen;
    this.solutionMoves = context.solutionMoves;
    this.solutionSans = AnalysisPosition.buildSolutionSans(
      context.initialFen,
      context.solutionMoves,
    );
    this.ply = 0;
    this.chess = new Chess(this.initialFen);
  }

  private static buildSolutionSans(
    initialFen: string,
    solutionMoves: string[],
  ): SolutionMoveDisplay[] {
    const chess = new Chess(initialFen);
    return solutionMoves.map((uci, index) => {
      const move = chess.move(uci);
      return {
        ply: index + 1,
        uci,
        san: move?.san ?? uci,
      };
    });
  }

  getPly(): number {
    return this.ply;
  }

  getMaxPly(): number {
    return this.solutionMoves.length;
  }

  getSolutionSans(): SolutionMoveDisplay[] {
    return this.solutionSans;
  }

  getLastMoveSquares(): { from: string; to: string } | null {
    if (this.ply === 0) {
      return null;
    }

    const move = this.solutionMoves[this.ply - 1];
    return {
      from: move.slice(0, 2),
      to: move.slice(2, 4),
    };
  }

  goToPly(ply: number): void {
    const nextPly = Math.max(0, Math.min(ply, this.solutionMoves.length));
    this.ply = nextPly;
    this.chess.load(this.initialFen);

    for (let i = 0; i < this.ply; i++) {
      this.chess.move(this.solutionMoves[i]);
    }
  }

  next(): boolean {
    if (this.ply >= this.solutionMoves.length) {
      return false;
    }

    this.goToPly(this.ply + 1);
    return true;
  }

  prev(): boolean {
    if (this.ply <= 0) {
      return false;
    }

    this.goToPly(this.ply - 1);
    return true;
  }

  fen(): string {
    return this.chess.fen();
  }

  getCheckSquare(): string {
    return getCheckSquareFromChess(this.chess);
  }
}
