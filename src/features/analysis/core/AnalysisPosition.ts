import { Chess, Square } from 'chess.js';
import { uciPvToSan } from '../../engine/formatEvaluation';
import { getCheckSquareFromChess } from '../../position/Position';
import { PuzzleAnalysisContext } from './analysisContext';

export type SolutionMoveDisplay = {
  ply: number;
  uci: string;
  san: string;
};

export type AnalysisHistoryRow = {
  key: string;
  label: string;
  indent: number;
  kind: 'start' | 'main' | 'variation';
  mainPly: number;
  variationIndex: number;
};

type VariationLine = {
  branchPly: number;
  moves: string[];
  sans: string[];
};

export class AnalysisPosition {
  private chess: Chess;
  private readonly initialFen: string;
  private readonly solutionMoves: string[];
  private readonly solutionSans: SolutionMoveDisplay[];
  private mainPly: number;
  private variation: VariationLine | null = null;
  private variationCursor = 0;

  constructor(context: PuzzleAnalysisContext) {
    this.initialFen = context.initialFen;
    this.solutionMoves = context.solutionMoves;
    this.solutionSans = AnalysisPosition.buildSolutionSans(
      context.initialFen,
      context.solutionMoves,
    );
    this.mainPly = context.solutionMoves.length;
    this.chess = new Chess(this.initialFen);
    this.rebuildChess();
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

  private fenAtMainPly(ply: number): string {
    const chess = new Chess(this.initialFen);
    for (let i = 0; i < ply; i++) {
      chess.move(this.solutionMoves[i]);
    }
    return chess.fen();
  }

  private rebuildChess(): void {
    this.chess.load(this.initialFen);
    for (let i = 0; i < this.mainPly; i++) {
      this.chess.move(this.solutionMoves[i]);
    }
    if (this.variation && this.variationCursor > 0) {
      for (let i = 0; i < this.variationCursor; i++) {
        this.chess.move(this.variation.moves[i]);
      }
    }
  }

  private findLegalMove(
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ) {
    const pieceType = piece[1]?.toLowerCase();
    return this.chess
      .moves({ square: sourceSquare as Square, verbose: true })
      .find(
        (move) =>
          move.to === targetSquare &&
          (!move.promotion || move.promotion === pieceType),
      );
  }

  private uciFromVerboseMove(move: {
    from: string;
    to: string;
    promotion?: string;
  }): string {
    return `${move.from}${move.to}${move.promotion ?? ''}`;
  }

  private matchesMainMove(mainIndex: number, uci: string): boolean {
    const expected = this.solutionMoves[mainIndex];
    if (expected === uci) {
      return true;
    }
    if (expected.length === 5 && uci.length === 4) {
      return expected.slice(0, 4) === uci;
    }
    return false;
  }

  getNavPly(): number {
    if (this.variation && this.variationCursor > 0) {
      return this.variation.branchPly + this.variationCursor;
    }
    return this.mainPly;
  }

  getMaxNavPly(): number {
    if (this.variation && this.variation.moves.length > 0) {
      return this.variation.branchPly + this.variation.moves.length;
    }
    return this.solutionMoves.length;
  }

  /** @deprecated Use getNavPly */
  getPly(): number {
    return this.getNavPly();
  }

  /** @deprecated Use getMaxNavPly */
  getMaxPly(): number {
    return this.getMaxNavPly();
  }

  getSolutionSans(): SolutionMoveDisplay[] {
    return this.solutionSans;
  }

  getHistoryRows(): AnalysisHistoryRow[] {
    const rows: AnalysisHistoryRow[] = [
      {
        key: 'start',
        label: 'Start',
        indent: 0,
        kind: 'start',
        mainPly: 0,
        variationIndex: 0,
      },
    ];

    for (const move of this.solutionSans) {
      rows.push({
        key: `main-${move.ply}`,
        label: `${move.ply}. ${move.san}`,
        indent: 0,
        kind: 'main',
        mainPly: move.ply,
        variationIndex: 0,
      });

      if (this.variation?.branchPly === move.ply) {
        this.variation.sans.forEach((san, index) => {
          rows.push({
            key: `var-${move.ply}-${index + 1}`,
            label: san,
            indent: 1,
            kind: 'variation',
            mainPly: move.ply,
            variationIndex: index + 1,
          });
        });
      }
    }

    return rows;
  }

  isHistoryRowSelected(row: AnalysisHistoryRow): boolean {
    if (row.kind === 'start') {
      return this.getNavPly() === 0;
    }
    if (row.kind === 'main') {
      return (
        (!this.variation || this.variationCursor === 0) &&
        this.mainPly === row.mainPly
      );
    }
    return (
      this.variation?.branchPly === row.mainPly &&
      this.variationCursor === row.variationIndex
    );
  }

  selectHistoryRow(row: AnalysisHistoryRow): void {
    if (row.kind === 'start' || row.kind === 'main') {
      this.selectMainLine(row.mainPly);
      return;
    }

    if (!this.variation || this.variation.branchPly !== row.mainPly) {
      return;
    }

    this.mainPly = row.mainPly;
    this.variationCursor = row.variationIndex;
    this.rebuildChess();
  }

  selectMainLine(ply: number): void {
    this.mainPly = Math.max(0, Math.min(ply, this.solutionMoves.length));
    this.variation = null;
    this.variationCursor = 0;
    this.rebuildChess();
  }

  /** @deprecated Use selectMainLine or goToNavPly */
  goToPly(ply: number): void {
    this.goToNavPly(ply);
  }

  goToNavPly(navPly: number): void {
    const clamped = Math.max(0, Math.min(navPly, this.getMaxNavPly()));

    if (clamped === 0) {
      this.selectMainLine(0);
      return;
    }

    if (
      this.variation &&
      clamped > this.variation.branchPly &&
      clamped <= this.variation.branchPly + this.variation.moves.length
    ) {
      this.mainPly = this.variation.branchPly;
      this.variationCursor = clamped - this.variation.branchPly;
      this.rebuildChess();
      return;
    }

    this.selectMainLine(clamped);
  }

  tryPlayMove(
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ): boolean {
    const legal = this.findLegalMove(sourceSquare, targetSquare, piece);
    if (!legal) {
      return false;
    }

    const uci = this.uciFromVerboseMove(legal);

    if (!this.variation && this.mainPly < this.solutionMoves.length) {
      if (this.matchesMainMove(this.mainPly, uci)) {
        this.mainPly++;
        this.rebuildChess();
        return true;
      }
    }

    const branchPly = this.variation?.branchPly ?? this.mainPly;
    const fenAtBranch = this.fenAtMainPly(branchPly);
    let nextMoves: string[];

    if (this.variation && this.variation.branchPly === branchPly) {
      nextMoves = [
        ...this.variation.moves.slice(0, this.variationCursor),
        uci,
      ];
    } else {
      nextMoves = [uci];
    }

    this.variation = {
      branchPly,
      moves: nextMoves,
      sans: uciPvToSan(fenAtBranch, nextMoves),
    };
    this.mainPly = branchPly;
    this.variationCursor = nextMoves.length;
    this.rebuildChess();
    return true;
  }

  next(): boolean {
    if (this.getNavPly() >= this.getMaxNavPly()) {
      return false;
    }

    this.goToNavPly(this.getNavPly() + 1);
    return true;
  }

  prev(): boolean {
    if (this.getNavPly() <= 0) {
      return false;
    }

    this.goToNavPly(this.getNavPly() - 1);
    return true;
  }

  getLastMoveSquares(): { from: string; to: string } | null {
    const navPly = this.getNavPly();
    if (navPly === 0) {
      return null;
    }

    let uci: string;
    if (this.variation && this.variationCursor > 0) {
      uci = this.variation.moves[this.variationCursor - 1];
    } else {
      uci = this.solutionMoves[this.mainPly - 1];
    }

    return {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
    };
  }

  fen(): string {
    return this.chess.fen();
  }

  getCheckSquare(): string {
    return getCheckSquareFromChess(this.chess);
  }
}
