import { describe, expect, it } from 'vitest';
import { createGame, flip, resolve, LEVELS, type Game } from './engine';
const rng = () => 0.999999;
function pair(game: Game, a: number, b: number) { return resolve(flip(flip(game, a), b)); }
describe('deck and pure rules', () => {
  it.each(LEVELS)('%i pairs contain exactly two of each shape', level => {
    const game = createGame(level, rng);
    expect(game.cards).toHaveLength(level * 2);
    expect(new Set(game.cards.map(c => c.id)).size).toBe(level * 2);
    for (let symbol = 0; symbol < level; symbol++) expect(game.cards.filter(c => c.symbol === symbol)).toHaveLength(2);
    expect(game.phase).toBe('ready'); expect(game.moves).toBe(0);
  });
  it('uses injected randomness reproducibly and shuffles', () => {
    expect(createGame(6, () => 0)).toEqual(createGame(6, () => 0));
    expect(createGame(6, () => 0).cards).not.toEqual(createGame(6, rng).cards);
  });
  it.each([NaN, -1, 1, Infinity])('rejects invalid random %s', random => expect(() => createGame(6, () => random)).toThrow());
  it('rejects unsupported level', () => expect(() => createGame(5 as 6)).toThrow());
  it('first flip starts, second flip counts exactly one move', () => {
    const initial = createGame(6, rng); const first = flip(initial, 0); const second = flip(first, 1);
    expect(first.phase).toBe('playing'); expect(first.moves).toBe(0);
    expect(second.phase).toBe('resolving'); expect(second.moves).toBe(1);
    expect(initial.open).toEqual([]); expect(initial.phase).toBe('ready');
  });
  it('same card cannot self-match and invalid inputs do nothing', () => {
    const game = flip(createGame(6, rng), 0);
    for (const id of [0, -1, 100, 0.5, NaN]) expect(flip(game, id)).toBe(game);
    expect(resolve(game)).toBe(game);
  });
  it('blocks a third flip until the pair resolves', () => {
    const game = flip(flip(createGame(6, rng), 0), 1);
    expect(flip(game, 2)).toBe(game);
    expect(game.open).toEqual([0, 1]);
  });
  it('mismatch hides both cards without marking and permits more play', () => {
    const game = pair(createGame(6, rng), 0, 1);
    expect(game.phase).toBe('playing'); expect(game.pairs).toBe(0); expect(game.open).toEqual([]);
    expect(game.cards.every(c => !c.matched)).toBe(true);
    expect(flip(game, 0).open).toEqual([0]);
  });
  it('matched cards cannot be operated again and immutable source is retained', () => {
    const initial = createGame(6, rng); const game = pair(initial, 0, 6);
    expect(game.pairs).toBe(1); expect(game.cards[0].matched).toBe(true);
    expect(game.cards[6].matched).toBe(true); expect(initial.cards[0].matched).toBe(false);
    expect(flip(game, 0)).toBe(game); expect(flip(game, 6)).toBe(game);
  });
  it.each(LEVELS)('only completes after all %i pairs, complete state is inert', level => {
    let game = createGame(level, rng);
    for (let i = 0; i < level; i++) { game = pair(game, i, i + level); expect(game.phase).toBe(i === level - 1 ? 'complete' : 'playing'); }
    expect(game.moves).toBe(level); expect(game.pairs).toBe(level);
    expect(flip(game, 0)).toBe(game); expect(resolve(game)).toBe(game);
  });
});
