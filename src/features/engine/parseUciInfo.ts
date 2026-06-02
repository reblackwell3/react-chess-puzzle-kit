import { EngineLine } from './types';

export const parseUciInfoLine = (line: string): EngineLine | null => {
  if (!line.startsWith('info ')) {
    return null;
  }

  const tokens = line.split(' ');
  let depth = 0;
  let multipv = 1;
  let centipawns: number | null = null;
  let mate: number | null = null;
  let pv: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === 'depth') {
      depth = Number.parseInt(tokens[++i], 10);
    } else if (token === 'multipv') {
      multipv = Number.parseInt(tokens[++i], 10);
    } else if (token === 'score') {
      if (tokens[i + 1] === 'cp') {
        centipawns = Number.parseInt(tokens[i + 2], 10);
      } else if (tokens[i + 1] === 'mate') {
        mate = Number.parseInt(tokens[i + 2], 10);
      }
    } else if (token === 'pv') {
      pv = tokens.slice(i + 1);
      break;
    }
  }

  if (depth === 0 && centipawns === null && mate === null && pv.length === 0) {
    return null;
  }

  return {
    multipv,
    depth,
    centipawns,
    mate,
    pv,
  };
};
