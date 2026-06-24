/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { usePuzzleAutoAdvanceCountdown } from './usePuzzleAutoAdvanceCountdown';

describe('usePuzzleAutoAdvanceCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call onAdvance when disabled mid-countdown', () => {
    const onAdvance = jest.fn();
    const delayMs = 5000;

    const { rerender } = renderHook(
      ({ enabled }) =>
        usePuzzleAutoAdvanceCountdown(enabled, delayMs, onAdvance),
      { initialProps: { enabled: true } },
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    rerender({ enabled: false });

    act(() => {
      jest.advanceTimersByTime(delayMs);
    });

    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('starts a fresh delay when re-enabled after pause', () => {
    const onAdvance = jest.fn();
    const delayMs = 5000;

    const { rerender } = renderHook(
      ({ enabled }) =>
        usePuzzleAutoAdvanceCountdown(enabled, delayMs, onAdvance),
      { initialProps: { enabled: true } },
    );

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    rerender({ enabled: false });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    rerender({ enabled: true });

    act(() => {
      jest.advanceTimersByTime(4999);
    });
    expect(onAdvance).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
