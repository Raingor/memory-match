import { LEVELS, type Level } from './engine';
export const STORAGE_KEY = 'puzzle-memory-v1';
export interface Score { moves: number; seconds: number }
export interface Save { version: 1; best: Partial<Record<Level, Score>> }
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const emptySave = (): Save => ({ version: 1, best: {} });
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function parseSave(raw: string | null): Save {
  try {
    if (raw === null) return emptySave();
    const data: unknown = JSON.parse(raw);
    if (!record(data) || data.version !== 1 || !record(data.best)) return emptySave();
    const best: Save['best'] = {};
    for (const key of Object.keys(data.best)) {
      const level = Number(key) as Level;
      const score = data.best[key];
      if (!LEVELS.includes(level) || String(level) !== key || !record(score)
        || !Number.isSafeInteger(score.moves) || (score.moves as number) < level
        || !Number.isSafeInteger(score.seconds) || (score.seconds as number) < 0) return emptySave();
      best[level] = { moves: score.moves as number, seconds: score.seconds as number };
    }
    return { version: 1, best };
  } catch { return emptySave(); }
}
export function load(store: Store): Save { try { return parseSave(store.getItem(STORAGE_KEY)); } catch { return emptySave(); } }
export function persist(store: Store, data: Save): boolean { try { store.setItem(STORAGE_KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function isBetter(score: Score, best?: Score): boolean { return !best || score.moves < best.moves || (score.moves === best.moves && score.seconds < best.seconds); }
export function saveScore(save: Save, level: Level, score: Score): Save {
  return isBetter(score, save.best[level]) ? { version: 1, best: { ...save.best, [level]: score } } : save;
}
