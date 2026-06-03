import { parseUciInfoLine } from './parseUciInfo';
import { isAnalyzableFen } from './isAnalyzableFen';
import {
  resolveStockfishWasmUrl,
  resolveStockfishWorkerUrl,
} from './stockfishUrls';
import { EngineEvaluation, EngineLine, emptyEngineEvaluation } from './types';

const INIT_TIMEOUT_MS = 45000;

export const splitWorkerLines = (data: unknown): string[] =>
  String(data)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export { resolveStockfishWorkerUrl, resolveStockfishWasmUrl, resolveStockfishScriptUrl } from './stockfishUrls';

const firstToken = (line: string) => line.split(/\s+/)[0] ?? '';

export class StockfishBrowserEngine {
  private worker: Worker | null = null;
  private ready = false;
  private disposed = false;
  private lifecycleGeneration = 0;
  private evaluation: EngineEvaluation = emptyEngineEvaluation();
  private lineMap = new Map<number, EngineLine>();
  private listeners = new Set<(evaluation: EngineEvaluation) => void>();
  private analysisFen = '';
  private analysisGeneration = 0;

  constructor(private readonly scriptUrl: string) {}

  subscribe(listener: (evaluation: EngineEvaluation) => void): () => void {
    this.listeners.add(listener);
    listener(this.evaluation);
    return () => this.listeners.delete(listener);
  }

  getEvaluation(): EngineEvaluation {
    return this.evaluation;
  }

  private async assertWasmReachable(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const wasmUrl = resolveStockfishWasmUrl(this.scriptUrl);
    let response: Response;

    try {
      response = await fetch(wasmUrl, { method: 'HEAD' });
      if (response.status === 405 || response.status === 501) {
        response = await fetch(wasmUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      }
    } catch {
      throw new Error(
        `Could not fetch Stockfish WASM at ${wasmUrl}. Run copy:stockfish and restart the dev server.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Stockfish WASM missing at ${wasmUrl} (HTTP ${response.status}). Run: npm run copy:stockfish`,
      );
    }
  }

  async init(): Promise<void> {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers are not available in this environment');
    }

    const generation = ++this.lifecycleGeneration;
    this.disposed = false;
    this.setEvaluation({ ...emptyEngineEvaluation(), status: 'loading' });
    await this.assertWasmReachable();

    if (this.disposed || generation !== this.lifecycleGeneration) {
      return;
    }

    const workerUrl = resolveStockfishWorkerUrl(this.scriptUrl);
    let worker: Worker;
    try {
      worker = new Worker(workerUrl, { type: 'classic' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create Stockfish worker';
      throw new Error(
        `${message}. Browser extensions (e.g. MetaMask) can block Web Workers on some pages.`,
      );
    }

    this.worker = worker;
    this.worker.onerror = () => {
      this.handleWorkerFailure(
        `Stockfish worker failed (${this.scriptUrl}). Ensure public/stockfish/*.wasm is served.`,
      );
    };
    this.worker.onmessageerror = () => {
      this.handleWorkerFailure(
        `Stockfish worker message error (${this.scriptUrl}).`,
      );
    };

    try {
      await this.handshake(workerUrl, generation);
      if (this.disposed || generation !== this.lifecycleGeneration || !this.worker) {
        return;
      }
      this.worker.onmessage = (event) => {
        for (const line of splitWorkerLines(event.data)) {
          this.handleLine(line);
        }
      };
      this.ready = true;
      this.setEvaluation({ ...emptyEngineEvaluation(), status: 'idle' });
    } catch (error) {
      this.worker?.terminate();
      this.worker = null;
      if (!this.disposed && generation === this.lifecycleGeneration) {
        throw error;
      }
    }
  }

  private handleWorkerFailure(message: string): void {
    if (this.disposed) {
      return;
    }
    this.ready = false;
    this.setEvaluation({
      ...emptyEngineEvaluation(),
      status: 'error',
      error: message,
    });
    this.worker?.terminate();
    this.worker = null;
  }

  private async handshake(
    workerUrl: string,
    generation: number,
  ): Promise<void> {
    if (!this.worker) {
      throw new Error('Stockfish worker was not created');
    }

    await this.waitForLine(
      this.worker,
      workerUrl,
      generation,
      (line) => firstToken(line) === 'uciok',
      () => {
        this.worker?.postMessage('uci');
      },
    );

    if (this.disposed || generation !== this.lifecycleGeneration || !this.worker) {
      return;
    }

    this.worker.postMessage('setoption name UCI_AnalyseMode value true');
    await this.waitForLine(
      this.worker,
      workerUrl,
      generation,
      (line) => firstToken(line) === 'readyok',
      () => {
        this.worker?.postMessage('isready');
      },
    );
  }

  private waitForLine(
    worker: Worker,
    workerUrl: string,
    generation: number,
    match: (line: string) => boolean,
    sendCommand: () => void,
    timeoutMs = INIT_TIMEOUT_MS,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeoutId);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        worker.removeEventListener('messageerror', onMessageError);
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Stockfish engine timed out (${workerUrl}). Run copy:stockfish, confirm public/stockfish/*.wasm is served, and check the browser console.`,
          ),
        );
      }, timeoutMs);

      const onError = () => {
        cleanup();
        reject(
          new Error(
            `Stockfish worker failed while loading ${this.scriptUrl}. Check the browser console and WASM MIME type.`,
          ),
        );
      };

      const onMessageError = () => {
        cleanup();
        reject(
          new Error(
            `Stockfish worker message error while loading ${this.scriptUrl}.`,
          ),
        );
      };

      const onMessage = (event: MessageEvent) => {
        if (this.disposed || generation !== this.lifecycleGeneration) {
          cleanup();
          resolve();
          return;
        }

        for (const line of splitWorkerLines(event.data)) {
          if (match(line)) {
            cleanup();
            resolve();
            return;
          }
        }
      };

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.addEventListener('messageerror', onMessageError);
      sendCommand();
    });
  }

  analyze(fen: string, depth: number, multiPv: number): void {
    if (!this.worker || !this.ready || this.disposed) {
      return;
    }

    if (!isAnalyzableFen(fen)) {
      this.analysisFen = fen;
      this.lineMap.clear();
      this.setEvaluation({
        status: 'idle',
        depth: 0,
        lines: [],
        fen,
      });
      this.worker.postMessage('stop');
      return;
    }

    const generation = ++this.analysisGeneration;
    this.analysisFen = fen;
    this.lineMap.clear();
    this.setEvaluation(
      {
        status: 'analyzing',
        depth: 0,
        lines: [],
      },
      generation,
    );

    this.worker.postMessage('stop');
    this.worker.postMessage(`setoption name MultiPV value ${multiPv}`);
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth}`);
  }

  stop(): void {
    if (!this.worker || !this.ready) {
      return;
    }
    this.worker.postMessage('stop');
    this.setEvaluation({
      ...this.evaluation,
      status: 'idle',
    });
  }

  dispose(): void {
    this.disposed = true;
    this.lifecycleGeneration += 1;
    this.ready = false;
    this.stop();
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.onmessageerror = null;
      this.worker.terminate();
      this.worker = null;
    }
    this.listeners.clear();
  }

  private handleLine(line: string): void {
    const generation = this.analysisGeneration;

    if (line.startsWith('info ')) {
      const parsed = parseUciInfoLine(line);
      if (!parsed) {
        return;
      }

      this.lineMap.set(parsed.multipv, parsed);
      const lines = [...this.lineMap.values()].sort(
        (a, b) => a.multipv - b.multipv,
      );
      const maxDepth = lines.reduce(
        (max, entry) => Math.max(max, entry.depth),
        0,
      );

      this.setEvaluation(
        {
          status: 'analyzing',
          depth: maxDepth,
          lines,
        },
        generation,
      );
      return;
    }

    if (line.startsWith('bestmove')) {
      this.setEvaluation(
        {
          ...this.evaluation,
          status: 'idle',
        },
        generation,
      );
    }
  }

  private setEvaluation(
    evaluation: EngineEvaluation,
    generation = this.analysisGeneration,
  ): void {
    if (generation !== this.analysisGeneration) {
      return;
    }

    const withFen =
      this.analysisFen.length > 0
        ? { ...evaluation, fen: this.analysisFen }
        : evaluation;
    this.evaluation = withFen;
    this.listeners.forEach((listener) => listener(withFen));
  }
}
