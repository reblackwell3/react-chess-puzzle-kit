import { Traversable } from './Traversable';
import { Chess, Square } from 'chess.js';
import { PuzzleMoveRecord } from './moveHistory';

export abstract class Position implements Traversable {
  protected chess: Chess;
  protected moves: string[];
  protected i: number = 0;

  constructor() {
    this.chess = new Chess();
    this.moves = [];
  }

  getIndex(): number {
    return this.i;
  }

  // Common methods shared by all positions
  next(): boolean {
    if (this.i < this.moves.length) {
      this.chess.move(this.moves[this.i]);
      this.i++;
      return true;
    }
    return false;
  }

  prev(): boolean {
    if (this.i > 0) {
      this.chess.undo();
      this.i--;
      return true;
    }
    return false;
  }

  isFinished(): boolean {
    return this.i >= this.moves.length;
  }

  /** True when a correct guess at the current index completes the puzzle. */
  isCompletedByCorrectGuess(): boolean {
    return this.i >= this.moves.length - 2;
  }

  fen(): string {
    return this.chess.fen();
  }

  getCheckSquare(): string {
    return getCheckSquareFromChess(this.chess);
  }
}

export function getCheckSquareFromChess(chess: Chess): string {
  if (!chess.inCheck()) {
    return '';
  }

  const turn = chess.turn();
  const kingPieceType = 'k';

  const squaresWithPieces = chess.board().flatMap((row, rowIndex) =>
    row.map((piece, colIndex) => ({
      square: String.fromCharCode(97 + colIndex) + (8 - rowIndex),
      piece: piece,
    })),
  );

  const kingSquare = squaresWithPieces
    .filter(
      ({ piece }) =>
        piece && piece.type === kingPieceType && piece.color === turn,
    )
    .map(({ square }) => square)[0];

  return kingSquare ?? '';
}

export class PuzzlePosition extends Position {
  protected isCorrect: boolean = false;
  protected guessedMove: string = '';
  protected isHintWanted: boolean = false;
  protected solutionRevealed: boolean = false;
  protected playerColor: string;
  protected readonly initialFen: string;
  protected moveHistory: PuzzleMoveRecord[] = [];
  private usedAlternativeCheckmate = false;

  constructor(initialFEN: string, moves: string[]) {
    super();
    this.initialFen = initialFEN;
    this.chess.load(initialFEN);
    this.moves = moves;
    this.playerColor = this.chess.turn() === 'b' ? 'white' : 'black';
  }

  next(): boolean {
    if (this.i >= this.moves.length) {
      return false;
    }

    const moveUci = this.moves[this.i];
    const movingColor = this.chess.turn() === 'w' ? 'white' : 'black';
    const result = super.next();

    if (result) {
      const san = this.chess.history().at(-1);
      this.moveHistory.push({
        ply: this.moveHistory.length,
        uci: moveUci,
        san,
        actor: movingColor === this.playerColor ? 'player' : 'opponent',
        isCorrect: true,
      });
    }

    return result;
  }

  getInitialFen(): string {
    return this.initialFen;
  }

  getSolutionMoves(): string[] {
    return [...this.moves];
  }

  getMoveHistory(): PuzzleMoveRecord[] {
    return [...this.moveHistory];
  }

  recordHint(): void {
    this.moveHistory.push({
      ply: this.moveHistory.length,
      uci: this.moves[this.i] ?? '',
      san: 'Hint',
      actor: 'attempt',
      isCorrect: false,
    });
  }

  recordSolutionShown(): void {
    this.moveHistory.push({
      ply: this.moveHistory.length,
      uci: '',
      san: 'Solution',
      actor: 'attempt',
      isCorrect: false,
    });
  }

  setSolutionRevealed(revealed: boolean): void {
    this.solutionRevealed = revealed;
  }

  isSolutionRevealed(): boolean {
    return this.solutionRevealed;
  }

  /** Chess-legal move from the current puzzle position (ignores solution line). */
  isLegalMove(sourceSquare: string, targetSquare: string): boolean {
    if (sourceSquare === targetSquare) {
      return false;
    }

    return this.chess
      .moves({ square: sourceSquare as Square, verbose: true })
      .some((move) => move.to === targetSquare);
  }

  private buildCandidateUcis(
    sourceSquare: string,
    targetSquare: string,
  ): string[] {
    const lanMoves = this.chess
      .moves({ square: sourceSquare as Square, verbose: true })
      .filter((move) => move.to === targetSquare)
      .map((move) => move.lan);

    return [...new Set(lanMoves)];
  }

  private tryMakeUciMove(chess: Chess, uci: string) {
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const promotion = uci.length > 4 ? uci[4] : undefined;

    try {
      return chess.move({ from, to, promotion });
    } catch {
      return null;
    }
  }

  private isCheckmatingMove(uci: string): boolean {
    const chess = new Chess(this.chess.fen());

    return (
      this.tryMakeUciMove(chess, uci) !== null && chess.isCheckmate()
    );
  }

  private applyCheckmateGuess(uci: string): boolean {
    const result = this.tryMakeUciMove(this.chess, uci);
    if (result === null || !this.chess.isCheckmate()) {
      return false;
    }

    this.moveHistory.push({
      ply: this.moveHistory.length,
      uci,
      san: result.san,
      actor: 'player',
      isCorrect: true,
    });
    this.i = this.moves.length;
    this.guessedMove = uci.slice(0, 4);
    this.usedAlternativeCheckmate = true;
    return true;
  }

  tryGuess = (
    sourceSquare: string,
    targetSquare: string,
    piece: string,
  ): { accepted: boolean; finished: boolean } => {
    const candidates = this.buildCandidateUcis(
      sourceSquare,
      targetSquare,
    );

    if (candidates.length === 0) {
      this.isCorrect = false;
      this.guessedMove = `${sourceSquare}${targetSquare}`;
      return { accepted: false, finished: false };
    }

    for (const uci of candidates) {
      if (this.moves[this.i] === uci) {
        this.isCorrect = true;
        this.guessedMove = uci.slice(0, 4);
        return {
          accepted: true,
          finished: this.isCompletedByCorrectGuess(),
        };
      }
    }

    for (const uci of candidates) {
      if (this.isCheckmatingMove(uci) && this.applyCheckmateGuess(uci)) {
        this.isCorrect = true;
        return { accepted: true, finished: true };
      }
    }

    this.isCorrect = false;
    this.guessedMove = `${sourceSquare}${targetSquare}`;
    this.moveHistory.push({
      ply: this.moveHistory.length,
      uci: candidates[candidates.length - 1] ?? this.guessedMove,
      actor: 'attempt',
      isCorrect: false,
    });

    return { accepted: false, finished: false };
  };

  judgeGuess = (sourceSquare: string, targetSquare: string, piece: string) =>
    this.tryGuess(sourceSquare, targetSquare, piece).accepted;

  resetInteractions(): void {
    this.guessedMove = '';
    this.isHintWanted = false;
  }

  /** Play the expected move at the current index and lock further input. */
  revealCorrectMove(): boolean {
    if (this.solutionRevealed || this.i >= this.moves.length) {
      return false;
    }
    const played = this.next();
    if (played) {
      this.solutionRevealed = true;
    }
    return played;
  }

  /** True when the last correct guess applied an alternative checkmate. */
  isAlternativeCheckmate(): boolean {
    return this.usedAlternativeCheckmate;
  }

  wantsHint(wants: boolean): void {
    this.isHintWanted = wants;
  }

  getHintSquare(): string {
    if (!this.isHintWanted) {
      return '';
    }
    return this.hint().slice(0, 2);
  }

  private hint(): string {
    return this.moves[this.i];
  }

  getIncorrectMoveSquare(): string {
    if (this.isCorrect) {
      return '';
    }
    return this.guessedMove.slice(2, 4);
  }

  getPlayerColor(): string {
    return this.playerColor;
  }
}

export class GamePosition extends Position {
  constructor(PGN: string) {
    super();
    console.log(`pgn: ${PGN}`);
    this.chess.loadPgn(PGN);
    this.moves = this.chess.history();
    this.chess.reset();
    // console.log(`pgn: ${PGN}`);
  }
}
