import { useEffect, useState } from 'react';
import { PUZZLE_CONTROLS_STACK_BREAKPOINT_PX } from './puzzleBoardLayout';

const stackControlsQuery = `(max-width: ${PUZZLE_CONTROLS_STACK_BREAKPOINT_PX}px)`;

const readStackControlsBelow = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(stackControlsQuery).matches;
};

/** True when hint / next controls should sit below the board instead of beside it. */
export const useStackPuzzleControlsBelow = (): boolean => {
  const [stackBelow, setStackBelow] = useState(readStackControlsBelow);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(stackControlsQuery);
    const onChange = (event: MediaQueryListEvent) => {
      setStackBelow(event.matches);
    };

    mediaQueryList.addEventListener('change', onChange);
    setStackBelow(mediaQueryList.matches);

    return () => mediaQueryList.removeEventListener('change', onChange);
  }, []);

  return stackBelow;
};
