import { useTheme } from '../theme/ThemeContext';
import { Chessboard } from 'react-chessboard';

const getCheckHighlighting = (checkSquare: string) => {
  const styles: Record<string, any> = {};
  styles[checkSquare] = { backgroundColor: 'red' };
  return styles;
};

const getFeedbackHighlighting = (
  hintSquare: string | null,
  incorrectMoveSquare: string | null,
) => {
  const styles: Record<string, any> = {};
  if (hintSquare) {
    styles[hintSquare] = { backgroundColor: '#77b1d4' };
  }
  if (incorrectMoveSquare) {
    styles[incorrectMoveSquare] = { backgroundColor: '#ff7f7f' };
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
