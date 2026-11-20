export const LEVELS = [6, 8, 12] as const;
export type Level = typeof LEVELS[number];
export interface Card { readonly id: number; readonly symbol: number; readonly matched: boolean }
export interface Game {
  readonly level: Level; readonly cards: readonly Card[]; readonly open: readonly number[];
  readonly moves: number; readonly pairs: number; readonly phase: 'ready' | 'playing' | 'resolving' | 'complete';
}
export function createGame(level: Level, random: () => number = Math.random): Game {
  if (!LEVELS.includes(level)) throw new Error('Unsupported level');
  const symbols = Array.from({ length: level * 2 }, (_, i) => i % level);
  for (let i = symbols.length - 1; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random must be in [0, 1)');
    const j = Math.floor(value * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return { level, cards: symbols.map((symbol, id) => ({ id, symbol, matched: false })), open: [], moves: 0, pairs: 0, phase: 'ready' };
}
export function flip(game: Game, id: number): Game {
  if (game.phase === 'resolving' || game.phase === 'complete') return game;
  const card = game.cards[id];
  if (!Number.isInteger(id) || !card || card.matched || game.open.includes(id)) return game;
  const open = [...game.open, id];
  return { ...game, open, phase: open.length === 2 ? 'resolving' : 'playing', moves: game.moves + (open.length === 2 ? 1 : 0) };
}
export function resolve(game: Game): Game {
  if (game.phase !== 'resolving') return game;
  const [a, b] = game.open;
  const match = game.cards[a].symbol === game.cards[b].symbol;
  const pairs = game.pairs + Number(match);
  return { ...game, cards: match ? game.cards.map(card => card.id === a || card.id === b ? { ...card, matched: true } : card) : game.cards,
    pairs, open: [], phase: pairs === game.level ? 'complete' : 'playing' };
}
