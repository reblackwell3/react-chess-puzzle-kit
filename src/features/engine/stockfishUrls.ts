/** Resolve a public asset path against the current page (honors CRA `PUBLIC_URL`). */
export const resolveStockfishScriptUrl = (
  scriptUrl: string,
  baseHref: string = typeof window !== 'undefined' ? window.location.href : '',
): string => new URL(scriptUrl, baseHref).href;

export const resolveStockfishWasmUrl = (scriptUrl: string, baseHref?: string): string =>
  resolveStockfishScriptUrl(scriptUrl, baseHref).replace(/\.js(\?.*)?$/i, '.wasm$1');

/**
 * Worker URL for stockfish.js (see examples/loadEngine.js in the stockfish package).
 * Hash is the WASM path on the same origin, e.g. `/stockfish/foo.js#/stockfish/foo.wasm`.
 */
export const resolveStockfishWorkerUrl = (
  scriptUrl: string,
  baseHref?: string,
): string => {
  const base = baseHref ?? (typeof window !== 'undefined' ? window.location.href : '');
  const scriptPath = new URL(scriptUrl, base).pathname;
  const wasmPath = scriptPath.replace(/\.js(\?.*)?$/i, '.wasm$1');
  return `${scriptPath}#${wasmPath}`;
};
