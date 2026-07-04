import { useEffect, useState } from 'react';
import {
  puzzleAnalysisDimensionsForViewport,
  type ResponsivePuzzleAnalysisDimensions,
} from './puzzleAnalysisDimensions';

const readViewportSize = (): { width: number; height: number } => {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 900 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

/** Viewport-based analysis modal layout (stack board above sidebar on narrow widths). */
export const useResponsivePuzzleAnalysis = (): ResponsivePuzzleAnalysisDimensions => {
  const [viewportSize, setViewportSize] = useState(readViewportSize);

  useEffect(() => {
    const onResize = () => setViewportSize(readViewportSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return puzzleAnalysisDimensionsForViewport(
    viewportSize.width,
    viewportSize.height,
  );
};
