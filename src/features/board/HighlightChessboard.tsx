import { boardSquareHighlightColors } from './boardSquareHighlightColors';
import { useChessboardTheme } from './chessboardTheme';
import { Chessboard } from 'react-chessboard';

const getCheckHighlighting = (checkSquare: string) => {
  const styles: Record<string, { backgroundColor: string }> = {};
  styles[checkSquare] = { backgroundColor: boardSquareHighlightColors.check };
  return styles;
};

const getFeedbackHighlighting = (
  hintSquare: string | null,
  incorrectMoveSquare: string | null,
) => {
  const styles: Record<string, { backgroundColor: string }> = {};
  if (hintSquare) {
    styles[hintSquare] = { backgroundColor: boardSquareHighlightColors.hint };
  }
  if (incorrectMoveSquare) {
    styles[incorrectMoveSquare] = {
      backgroundColor: boardSquareHighlightColors.incorrect,
    };
  }
  return styles;
};

export interface HighlightChessboardProps {
  checkSquare: string;
  hintSquare: string | null;
  incorrectMoveSquare: string | null;
  [key: string]: any;
}

export const HighlightChessboard = ({
  checkSquare,
  hintSquare,
  incorrectMoveSquare,
  customSquareStyles: extraSquareStyles,
  ...props
}: HighlightChessboardProps) => {
  const { customDarkSquareStyle, customLightSquareStyle } = useChessboardTheme();
  const checkStyles = getCheckHighlighting(checkSquare);
  const feedbackStyles = getFeedbackHighlighting(
    hintSquare,
    incorrectMoveSquare,
  );
  const customSquareStyles = {
    ...checkStyles,
    ...feedbackStyles,
    ...extraSquareStyles,
  };

  return (
    <Chessboard
      customDarkSquareStyle={customDarkSquareStyle}
      customLightSquareStyle={customLightSquareStyle}
      customSquareStyles={customSquareStyles}
      {...props}
    />
  );
};
