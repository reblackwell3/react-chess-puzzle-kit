import { createContext, useContext, CSSProperties } from 'react';

// Define the shape of the context
interface ThemeContextType {
  customDarkSquareStyle: { backgroundColor: string };
  customLightSquareStyle: { backgroundColor: string };
}

// Create the context with an initial value of null
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

// Custom hook for easy theme access
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Factory method to set styles based on theme
export const getStylesForTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      customDarkSquareStyle: { backgroundColor: '#838387' },
      customLightSquareStyle: { backgroundColor: '#e1e1e3' },
    };
  } else {
    return {
      customDarkSquareStyle: { backgroundColor: '#b58863' },
      customLightSquareStyle: { backgroundColor: '#f0d9b5' },
    };
  }
};

export type AnalysisModalStyles = {
  panel: CSSProperties;
  title: CSSProperties;
  closeButton: CSSProperties;
};

export const getAnalysisModalStyles = (
  theme: 'light' | 'dark',
): AnalysisModalStyles => {
  if (theme === 'dark') {
    return {
      panel: {
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        border: '1px solid #424242',
      },
      title: { color: '#fff' },
      closeButton: {
        color: '#e0e0e0',
        backgroundColor: '#2d2d2d',
        border: '1px solid #555',
      },
    };
  }

  return {
    panel: {
      backgroundColor: '#fff',
      color: '#1a1a1a',
      border: '1px solid #e0e0e0',
    },
    title: { color: '#1a1a1a' },
    closeButton: {
      color: '#1a1a1a',
      backgroundColor: '#f5f5f5',
      border: '1px solid #ccc',
    },
  };
};
