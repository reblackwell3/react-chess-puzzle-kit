import { CSSProperties } from 'react';

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
