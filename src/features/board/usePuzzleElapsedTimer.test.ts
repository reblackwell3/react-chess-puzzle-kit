/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { usePuzzleElapsedTimer } from './usePuzzleElapsedTimer';

describe('usePuzzleElapsedTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts only when running and counts whole seconds', () => {
    const { result, rerender } = renderHook(
      ({ running }) => usePuzzleElapsedTimer(running, 0),
      { initialProps: { running: false } },
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(0);

    rerender({ running: true });
    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(result.current).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(3);
  });

  it('freezes when stopped', () => {
    const { result, rerender } = renderHook(
      ({ running }) => usePuzzleElapsedTimer(running, 0),
      { initialProps: { running: true } },
    );

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    rerender({ running: false });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(4);
  });

  it('resets when the puzzle key changes', () => {
    const { result, rerender } = renderHook(
      ({ resetKey }) => usePuzzleElapsedTimer(true, resetKey),
      { initialProps: { resetKey: 0 } },
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(5);

    rerender({ resetKey: 1 });
    expect(result.current).toBe(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(2);
  });
});
