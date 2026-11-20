import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, emptySave, load, parseSave, persist, saveScore, isBetter } from './storage';
describe('versioned local best records', () => {
  it('uses only the memory game key', () => { expect(STORAGE_KEY).toBe('puzzle-memory-v1'); });
  it.each([null, '', '{', 'null', '[]', '1', '{}', '{"version":2,"best":{}}', '{"version":1,"best":[]}', '{"version":1,"best":null}'])('rejects malformed/unsupported data %s', raw => expect(parseSave(raw)).toEqual(emptySave()));
  it.each([
    { 6: { moves: 5, seconds: 10 } }, { 6: { moves: 6, seconds: -1 } }, { 6: { moves: 6.2, seconds: 1 } },
    { 6: { moves: '6', seconds: 0 } }, { 6: { moves: 6, seconds: '0' } }, { 6: null },
    { 7: { moves: 7, seconds: 0 } }, { '06': { moves: 6, seconds: 0 } }, { 6: { moves: 6 } },
    { 6: { moves: 6, seconds: 0.5 } }, { 6: { moves: Number.MAX_SAFE_INTEGER + 1, seconds: 0 } },
  ])('rejects invalid fields %#', best => expect(parseSave(JSON.stringify({ version: 1, best }))).toEqual(emptySave()));
  it('round-trips three isolated levels without unrelated fields', () => {
    const best = { 6: { moves: 8, seconds: 10 }, 8: { moves: 12, seconds: 20 }, 12: { moves: 14, seconds: 30 } };
    expect(parseSave(JSON.stringify({ version: 1, best, arbitrary: true }))).toEqual({ version: 1, best });
  });
  it('gracefully handles blocked reads and writes', () => {
    const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
    expect(load(blocked)).toEqual(emptySave()); expect(persist(blocked, emptySave())).toBe(false);
  });
  it('reads and writes the correct key', () => {
    let actualKey = '', raw = '';
    const store = { getItem(key: string) { actualKey = key; return raw; }, setItem(key: string, value: string) { actualKey = key; raw = value; } };
    const save = saveScore(emptySave(), 6, { moves: 6, seconds: 0 });
    expect(persist(store, save)).toBe(true); expect(actualKey).toBe(STORAGE_KEY); expect(load(store)).toEqual(save);
  });
  it('compares moves first and time as a tie breaker, keeps difficulty isolated', () => {
    const score = { moves: 10, seconds: 20 };
    expect(isBetter({ moves: 9, seconds: 100 }, score)).toBe(true);
    expect(isBetter({ moves: 11, seconds: 1 }, score)).toBe(false);
    expect(isBetter({ moves: 10, seconds: 19 }, score)).toBe(true);
    expect(isBetter(score, score)).toBe(false);
    const save = saveScore(saveScore(emptySave(), 6, score), 8, { moves: 8, seconds: 30 });
    expect(save.best[6]).toEqual(score); expect(save.best[8]).toEqual({ moves: 8, seconds: 30 });
    expect(saveScore(save, 6, { moves: 11, seconds: 0 })).toBe(save);
  });
});
