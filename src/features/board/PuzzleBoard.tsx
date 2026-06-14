import { PuzzlePosition } from '../position/Position';
import { PuzzlePlaySurface } from './PuzzlePlaySurface';

export interface PuzzleBoardProps {
  position: PuzzlePosition;
  onFeedback: (feedbackData: any) => void;
  incInteractionNum: () => void;
  boardWidth: number;
  /** After a wrong guess, play the correct move instead of allowing retries. */
  revealAnswerOnIncorrect?: boolean;
  /** After a wrong guess, show an arrow to the correct square. */
  showAnswerArrowOnIncorrect?: boolean;
  /** With {@link showAnswerArrowOnIncorrect}, allow wrong retries after the arrow. When false, only the arrow move is accepted. */
  allowRetryOnIncorrect?: boolean;
  answerArrowColor?: string;
}

export const PuzzleBoard = ({
  position,
  onFeedback,
  incInteractionNum,
  boardWidth,
  revealAnswerOnIncorrect = false,
  showAnswerArrowOnIncorrect = false,
  allowRetryOnIncorrect = true,
  answerArrowColor,
}: PuzzleBoardProps) => (
  <PuzzlePlaySurface
    position={position}
    onFeedback={onFeedback}
    incInteractionNum={incInteractionNum}
    boardWidth={boardWidth}
    revealAnswerOnIncorrect={revealAnswerOnIncorrect}
    showAnswerArrowOnIncorrect={showAnswerArrowOnIncorrect}
    allowRetryOnIncorrect={allowRetryOnIncorrect}
    answerArrowColor={answerArrowColor}
  />
);
