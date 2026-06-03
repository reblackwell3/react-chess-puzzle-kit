import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StockfishBrowserEngine } from './StockfishBrowserEngine';
import {
  AnalysisEngineOptions,
  DEFAULT_STOCKFISH_SCRIPT_URL,
  EngineEvaluation,
  emptyEngineEvaluation,
} from './types';

export const useAnalysisEngine = (
  fen: string,
  options: AnalysisEngineOptions = {},
): EngineEvaluation => {
  const {
    enabled = true,
    depth = 16,
    multiPv = 2,
    scriptUrl = DEFAULT_STOCKFISH_SCRIPT_URL,
  } = options;

  const [evaluation, setEvaluation] = useState<EngineEvaluation>(
    emptyEngineEvaluation(),
  );
  const [engineReady, setEngineReady] = useState(false);
  const engineRef = useRef<StockfishBrowserEngine | null>(null);
  const mountGenerationRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof Worker === 'undefined') {
      setEvaluation(emptyEngineEvaluation());
      setEngineReady(false);
      return;
    }

    const mountGeneration = ++mountGenerationRef.current;
    const engine = new StockfishBrowserEngine(scriptUrl);
    engineRef.current = engine;
    let cancelled = false;

    const unsubscribe = engine.subscribe((next) => {
      if (!cancelled && mountGeneration === mountGenerationRef.current) {
        setEvaluation(next);
      }
    });

    engine
      .init()
      .then(() => {
        if (
          !cancelled &&
          mountGeneration === mountGenerationRef.current
        ) {
          setEngineReady(true);
        }
      })
      .catch((error: unknown) => {
        if (cancelled || mountGeneration !== mountGenerationRef.current) {
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Failed to start engine';
        setEvaluation({
          ...emptyEngineEvaluation(),
          status: 'error',
          error: message,
        });
      });

    return () => {
      cancelled = true;
      setEngineReady(false);
      unsubscribe();
      engine.dispose();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
    };
  }, [enabled, scriptUrl]);

  useLayoutEffect(() => {
    if (!enabled || !engineReady || !engineRef.current) {
      return;
    }

    engineRef.current.analyze(fen, depth, multiPv);
  }, [enabled, engineReady, fen, depth, multiPv]);

  return useMemo(() => {
    if (evaluation.fen !== fen) {
      return {
        ...emptyEngineEvaluation(),
        status:
          evaluation.status === 'error'
            ? 'error'
            : evaluation.status === 'loading'
              ? 'loading'
              : 'analyzing',
        error: evaluation.error,
        fen,
      };
    }
    return evaluation;
  }, [evaluation, fen]);
};
