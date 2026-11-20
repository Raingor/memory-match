import { createGame, flip, resolve, type Game, type Level } from './engine';
export interface Snapshot { game: Game; elapsed: number }
export interface Clock {
  now(): number;
  interval(callback: () => void, ms: number): ReturnType<typeof setInterval>;
  timeout(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  clearInterval(id: ReturnType<typeof setInterval>): void;
  clearTimeout(id: ReturnType<typeof setTimeout>): void;
}
const clock: Clock = {
  now: () => performance.now(), interval: (fn, ms) => setInterval(fn, ms), timeout: (fn, ms) => setTimeout(fn, ms),
  clearInterval: id => clearInterval(id), clearTimeout: id => clearTimeout(id),
};
export class Controller {
  private game: Game;
  private elapsed = 0;
  private startedAt: number | null = null;
  private ticker?: ReturnType<typeof setInterval>;
  private pending?: ReturnType<typeof setTimeout>;
  private generation = 0;
  constructor(private onChange: (snapshot: Snapshot) => void, private onComplete: (snapshot: Snapshot) => void,
    private random: () => number = Math.random, private time: Clock = clock) { this.game = createGame(6, random); }
  get snapshot(): Snapshot { return { game: this.game, elapsed: this.elapsed }; }
  private emit() { this.onChange(this.snapshot); }
  private updateTime() { if (this.startedAt !== null) this.elapsed = Math.max(0, Math.floor((this.time.now() - this.startedAt) / 1000)); }
  private cancel() {
    this.generation++;
    if (this.ticker !== undefined) this.time.clearInterval(this.ticker);
    if (this.pending !== undefined) this.time.clearTimeout(this.pending);
    this.ticker = undefined; this.pending = undefined;
  }
  restart(level: Level = this.game.level) {
    this.cancel(); this.game = createGame(level, this.random); this.elapsed = 0; this.startedAt = null; this.emit();
  }
  flip(id: number) {
    const next = flip(this.game, id);
    if (next === this.game) return;
    if (this.startedAt === null) {
      this.startedAt = this.time.now();
      this.ticker = this.time.interval(() => { this.updateTime(); this.emit(); }, 200);
    }
    this.game = next; this.emit();
    if (next.phase === 'resolving') {
      const generation = this.generation;
      const matching = next.cards[next.open[0]].symbol === next.cards[next.open[1]].symbol;
      this.pending = this.time.timeout(() => {
        if (generation !== this.generation) return;
        this.pending = undefined; this.game = resolve(this.game); this.updateTime();
        if (this.game.phase === 'complete') { this.cancel(); this.emit(); this.onComplete(this.snapshot); }
        else this.emit();
      }, matching ? 360 : 850);
    }
  }
  destroy() { this.cancel(); }
}
