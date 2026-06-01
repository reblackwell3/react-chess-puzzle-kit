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
  protected playerColor: string;
  protected readonly initialFen: string;
  protected moveHistory: PuzzleMoveRecord[] = [];

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

  /** Chess-legal move from the current puzzle position (ignores solution line). */
  isLegalMove(sourceSquare: string, targetSquare: string): boolean {
    if (sourceSquare === targetSquare) {
      return false;
    }

    return this.chess
      .moves({ square: sourceSquare as Square, verbose: true })
      .some((move) => move.to === targetSquare);
  }

  judgeGuess = (sourceSquare: string, targetSquare: string, piece: string) => {
    const move = `${sourceSquare}${targetSquare}`;
    const promotionPiece = piece[1].toLowerCase(); // 'wN' -> 'n'
    const moveWithPromotionPiece = `${move}${promotionPiece}`;
    const isCorrect =
      this.judgeMove(move) || this.judgeMove(moveWithPromotionPiece);
    this.isCorrect = isCorrect;

    if (!isCorrect) {
      this.moveHistory.push({
        ply: this.moveHistory.length,
        uci: moveWithPromotionPiece.length > move.length
          ? moveWithPromotionPiece
          : move,
        actor: 'attempt',
        isCorrect: false,
      });
    }

    return isCorrect;
  };

  resetInteractions(): void {
    this.guessedMove = '';
    this.isHintWanted = false;
  }

  private judgeMove(move: string): boolean {
    this.guessedMove = move;
    return this.moves[this.i] === move;
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
