import { createContext, useContext, ReactNode } from 'react';

interface ChessboardThemeContextType {
  customDarkSquareStyle: { backgroundColor: string };
  customLightSquareStyle: { backgroundColor: string };
}

export const ChessboardThemeContext = createContext<
  ChessboardThemeContextType | undefined
>(undefined);

export const useChessboardTheme = () => {
  const context = useContext(ChessboardThemeContext);
  if (!context) {
    throw new Error('useChessboardTheme must be used within a ThemeProvider');
  }
  return context;
};

/** @deprecated Use {@link useChessboardTheme}. */
export const useTheme = useChessboardTheme;

export const getStylesForTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      customDarkSquareStyle: { backgroundColor: '#838387' },
      customLightSquareStyle: { backgroundColor: '#e1e1e3' },
    };
  }

  return {
    customDarkSquareStyle: { backgroundColor: '#b58863' },
    customLightSquareStyle: { backgroundColor: '#f0d9b5' },
  };
};

export type ThemeProviderProps = {
  children?: ReactNode;
  theme: 'light' | 'dark';
};

export const ThemeProvider = ({ children, theme }: ThemeProviderProps) => {
  const { customDarkSquareStyle, customLightSquareStyle } =
    getStylesForTheme(theme);

  return (
    <ChessboardThemeContext.Provider
      value={{ customDarkSquareStyle, customLightSquareStyle }}
    >
      {children}
    </ChessboardThemeContext.Provider>
  );
};
