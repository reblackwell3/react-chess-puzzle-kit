import { useTheme } from '../theme/ThemeContext';
import { squareHighlightColors } from '../theme/squareHighlightColors';
import { Chessboard } from 'react-chessboard';

const getCheckHighlighting = (checkSquare: string) => {
  const styles: Record<string, { backgroundColor: string }> = {};
  styles[checkSquare] = { backgroundColor: squareHighlightColors.check };
  return styles;
};

const getFeedbackHighlighting = (
  hintSquare: string | null,
  incorrectMoveSquare: string | null,
) => {
  const styles: Record<string, { backgroundColor: string }> = {};
  if (hintSquare) {
    styles[hintSquare] = { backgroundColor: squareHighlightColors.hint };
  }
  if (incorrectMoveSquare) {
    styles[incorrectMoveSquare] = {
      backgroundColor: squareHighlightColors.incorrect,
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
  const { customDarkSquareStyle, customLightSquareStyle } = useTheme();
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
