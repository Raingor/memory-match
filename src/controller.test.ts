import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Controller, type Clock } from './controller';
const time: Clock = { now: () => Date.now(), interval: (f, ms) => setInterval(f, ms), timeout: (f, ms) => setTimeout(f, ms), clearInterval: id => clearInterval(id), clearTimeout: id => clearTimeout(id) };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0); });
afterEach(() => vi.useRealTimers());
function setup() { const change = vi.fn(), complete = vi.fn(); return { controller: new Controller(change, complete, () => 0.999999, time), change, complete }; }
describe('controller timing and async boundaries', () => {
  it('does not tick before first legal flip and creates one interval', () => {
    const { controller } = setup(); vi.advanceTimersByTime(5000); expect(controller.snapshot.elapsed).toBe(0);
    controller.flip(-1); expect(vi.getTimerCount()).toBe(0);
    controller.flip(0); expect(vi.getTimerCount()).toBe(1);
    controller.flip(0); vi.advanceTimersByTime(2000); expect(controller.snapshot.elapsed).toBe(2); expect(vi.getTimerCount()).toBe(1);
    controller.destroy(); expect(vi.getTimerCount()).toBe(0);
  });
  it('locks third-card input during mismatch and resolves once after 850ms', () => {
    const { controller } = setup(); controller.flip(0); controller.flip(1); controller.flip(2);
    expect(controller.snapshot.game.open).toEqual([0, 1]);
    vi.advanceTimersByTime(849); expect(controller.snapshot.game.phase).toBe('resolving');
    vi.advanceTimersByTime(1); expect(controller.snapshot.game.open).toEqual([]); expect(controller.snapshot.game.moves).toBe(1);
    controller.flip(2); expect(controller.snapshot.game.open).toEqual([2]);
  });
  it.each([6, 8, 12] as const)('restart to %i cancels pending mismatch and old interval', level => {
    const { controller, complete } = setup(); controller.flip(0); controller.flip(1); vi.advanceTimersByTime(400);
    controller.restart(level); expect(vi.getTimerCount()).toBe(0);
    controller.flip(0); vi.advanceTimersByTime(600);
    expect(controller.snapshot.game.level).toBe(level); expect(controller.snapshot.game.open).toEqual([0]);
    expect(controller.snapshot.game.moves).toBe(0); expect(controller.snapshot.game.pairs).toBe(0); expect(controller.snapshot.elapsed).toBe(0);
    expect(complete).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(1);
  });
  it('cancels a pending successful pair on restart', () => {
    const { controller } = setup(); controller.flip(0); controller.flip(6); controller.restart();
    vi.advanceTimersByTime(1000); expect(controller.snapshot.game.phase).toBe('ready'); expect(controller.snapshot.game.pairs).toBe(0); expect(vi.getTimerCount()).toBe(0);
  });
  it('generation guards even a stale callback from an unreliable scheduler', () => {
    const callbacks: Array<() => void> = [];
    const loose: Clock = { ...time, timeout: (fn, ms) => { callbacks.push(fn); return setTimeout(fn, ms); }, clearTimeout: () => {} };
    const complete = vi.fn(); const controller = new Controller(vi.fn(), complete, () => 0.999999, loose);
    controller.flip(0); controller.flip(6); controller.restart(8); controller.flip(0); callbacks[0]();
    expect(controller.snapshot.game.level).toBe(8); expect(controller.snapshot.game.open).toEqual([0]); expect(complete).not.toHaveBeenCalled();
  });
  it('completes once and stops time, then can restart', () => {
    const { controller, complete } = setup();
    for (let i = 0; i < 6; i++) { controller.flip(i); controller.flip(i + 6); vi.advanceTimersByTime(360); }
    expect(complete).toHaveBeenCalledTimes(1); expect(controller.snapshot.game.phase).toBe('complete'); expect(vi.getTimerCount()).toBe(0);
    const elapsed = controller.snapshot.elapsed; controller.flip(0); vi.advanceTimersByTime(10000);
    expect(controller.snapshot.elapsed).toBe(elapsed); expect(complete).toHaveBeenCalledTimes(1);
    controller.restart(); expect(controller.snapshot.elapsed).toBe(0); expect(controller.snapshot.game.phase).toBe('ready');
  });
  it('destroy cancels all outstanding work', () => {
    const { controller, change } = setup(); controller.flip(0); controller.flip(1); controller.destroy(); change.mockClear();
    vi.advanceTimersByTime(10000); expect(change).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
});
