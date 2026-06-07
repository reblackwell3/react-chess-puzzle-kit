import { PuzzlePlaySurface } from './PuzzlePlaySurface';

export interface BlankPuzzleBoardProps {
  boardWidth: number;
}

/** Placeholder board that preserves puzzle layout while the next position loads. */
export const BlankPuzzleBoard = ({ boardWidth }: BlankPuzzleBoardProps) => (
  <PuzzlePlaySurface
    position={null}
    onFeedback={() => {}}
    incInteractionNum={() => {}}
    boardWidth={boardWidth}
  />
);
