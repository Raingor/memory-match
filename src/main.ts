import './style.css';
import { Controller, type Snapshot } from './controller';
import { type Level } from './engine';
import './characters.css';
import { restartIcon } from './icons';
import { CHARACTERS, cardLabel, faceContent, mountCharacters, portrait } from './characters';
import { emptySave, load, persist, saveScore, isBetter, type Store } from './storage';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="masthead"><a class="wordmark" href="./" aria-label="形状碰碰首页"><span class="brand-shape" aria-hidden="true"></span>形状碰碰<span class="wordmark-en">SHAPE CLUB</span></a><button id="help" class="help-button">怎么玩 <span aria-hidden="true">?</span></button></header>
  <main>
    <section class="intro" aria-labelledby="title"><div class="eyebrow"><span></span> 给大脑一点小惊喜</div><h1 id="title">翻一翻，<span>碰个对。</span><svg class="title-spark" viewBox="0 0 60 60" aria-hidden="true"><path d="M30 0L35 22L55 10L41 29L60 35L39 39L48 59L30 45L14 59L20 38L0 31L22 26L13 7L29 19Z"/></svg></h1><p>记住伙伴的藏身处，让相同的小伙伴碰面。</p></section>
    <section id="companion" class="companion" aria-label="陪伴角色"></section>
    <section class="game-area" aria-label="记忆翻牌游戏">
      <div class="game-toolbar"><div class="difficulty" role="group" aria-label="选择难度"><button data-level="6" aria-pressed="true">轻松 <span>6 对</span></button><button data-level="8" aria-pressed="false">专注 <span>8 对</span></button><button data-level="12" aria-pressed="false">挑战 <span>12 对</span></button></div><button id="restart" class="restart-button">${restartIcon}<span>洗牌重开</span></button></div>
      <div class="playmat"><div class="session-line"><div class="session-stats"><span><b id="moves">0</b> 步</span><span class="stat-divider"></span><span><b id="timer">00:00</b><span class="sr-only"> 用时</span></span></div><span id="pair-count">已找到 <b>0 / 6</b> 对</span></div><div id="board" class="board" aria-label="翻牌棋盘"></div><div class="mat-caption"><span class="small-spark" aria-hidden="true">✳</span><span id="hint">从任意一张开始，慢慢来就好。</span></div></div>
      <div class="below-board"><span class="best-mark" aria-hidden="true">♧</span><span id="best"></span></div>
    </section>
    <p id="storage-notice" class="storage-notice" hidden>本地记录暂不可用，本局仍可正常游玩。</p>
    <p class="footer-note">不赶时间，只考记忆。<span aria-hidden="true">·</span> 每一次翻开，都是线索。</p>
    <p id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
  </main>
  <dialog id="rules" aria-labelledby="rules-title"><button class="close-dialog" data-close aria-label="关闭玩法说明">×</button><div class="dialog-eyebrow">HOW TO PLAY</div><h2 id="rules-title">两张一样，就是一对。</h2><ol class="rules-list"><li><b>翻开看看</b><span>点击任意两张卡片，记住人物头像、名字与位置。</span></li><li><b>找到伙伴</b><span>人物相同就会留下，不同则盖回去。翻牌过程中请稍等片刻。</span></li><li><b>全部碰面</b><span>找齐所有配对即完成。每翻开第二张计 1 步，从首张开始计时。</span></li></ol><p class="rules-foot">Tab 选择卡片，Enter 或空格翻开。最佳成绩优先比较步数，同步数时比较用时；按难度分别保存在当前浏览器。中途进度不保存。</p><button class="primary-button" data-close>明白了，开始翻牌</button></dialog>
  <dialog id="result" aria-labelledby="result-title"><button class="close-dialog" data-close aria-label="关闭完成结算">×</button><div class="result-art" aria-hidden="true">${[CHARACTERS[1], CHARACTERS[7], CHARACTERS[0]].map(character => `<img src="${portrait(character)}" alt="${character.name}">`).join('')}</div><div class="dialog-eyebrow">ALL MATCHED!</div><h2 id="result-title">所有伙伴，都碰面啦！</h2><p id="result-message"></p><p id="result-score" class="result-score"></p><button id="again" class="primary-button">再碰一局 ${restartIcon}</button><button class="text-button" data-close>留在棋盘看看</button></dialog>
`;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const board = $('#board');
const rules = $<HTMLDialogElement>('#rules');
const result = $<HTMLDialogElement>('#result');
let storage: Store | null = null;
try { storage = window.localStorage; } catch { $('#storage-notice').hidden = false; }
mountCharacters($('#companion'), storage);
let save = storage ? load(storage) : emptySave();
let renderedCards: Snapshot['game']['cards'] | undefined;
let buttons: HTMLButtonElement[] = [];
let previousState = '';
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
function render({ game, elapsed }: Snapshot) {
  if (!renderedCards || renderedCards.length !== game.cards.length || game.phase === 'ready') {
    board.innerHTML = game.cards.map(card => `<button class="card" data-card="${card.id}" aria-label="第 ${card.id + 1} 张，未翻开"><span class="card-inner"><span class="card-back" aria-hidden="true"><span class="back-glyph"><i></i><i></i><i></i><i></i></span></span><span class="card-front" aria-hidden="true"></span></span></button>`).join('');
    buttons = Array.from(board.querySelectorAll<HTMLButtonElement>('.card'));
    renderedCards = game.cards;
  }
  board.dataset.level = String(game.level);
  board.setAttribute('aria-busy', String(game.phase === 'resolving'));
  const activeCard = buttons.indexOf(document.activeElement as HTMLButtonElement);
  for (const card of game.cards) {
    const button = buttons[card.id];
    const visible = card.matched || game.open.includes(card.id);
    button.classList.toggle('is-flipped', visible); button.classList.toggle('is-matched', card.matched);
    button.disabled = card.matched;
    button.setAttribute('aria-disabled', String(card.matched || game.phase === 'resolving' || game.phase === 'complete' || game.open.includes(card.id)));
    button.setAttribute('aria-label', cardLabel(card.id, card.symbol, visible, card.matched));
    const front = button.querySelector<HTMLElement>('.card-front')!;
    const content = faceContent(card.symbol, visible);
    if (front.innerHTML !== content) front.innerHTML = content;
    // The button label is the accessible identity. Hidden fronts have no identity-bearing DOM at all.
    front.setAttribute('aria-hidden', String(!visible));
  }
  if (activeCard >= 0 && game.cards[activeCard].matched && game.phase !== 'complete') {
    const next = [...buttons.slice(activeCard + 1), ...buttons.slice(0, activeCard)].find(button => !button.disabled);
    next?.focus({ preventScroll: true });
  }
  $('#moves').textContent = String(game.moves); $('#timer').textContent = formatTime(elapsed);
  $('#pair-count').innerHTML = `已找到 <b>${game.pairs} / ${game.level}</b> 对`;
  const hint = game.phase === 'ready' ? '从任意一张开始，慢慢来就好。' : game.phase === 'resolving' ? '让两位伙伴碰个面……' : game.phase === 'complete' ? '全部配对成功！你的记忆力很棒。' : game.open.length ? '记住它的位置，再翻一张。' : '下一对，会藏在哪里？';
  $('#hint').textContent = hint;
  const state = `${game.phase}:${game.pairs}:${game.open.join(',')}`;
  if (state !== previousState) { $('#announcement').textContent = `${hint} 已找到 ${game.pairs} 对，共 ${game.moves} 步。`; previousState = state; }
  document.querySelectorAll<HTMLButtonElement>('button[data-level]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.level) === game.level)));
  const best = save.best[game.level];
  $('#best').textContent = best ? `本档最佳  ${best.moves} 步 · ${formatTime(best.seconds)}` : '本档还没有纪录，来创造第一个吧。';
}
const controller = new Controller(render, snapshot => {
  const { game, elapsed } = snapshot;
  const score = { moves: game.moves, seconds: elapsed };
  const record = isBetter(score, save.best[game.level]);
  save = saveScore(save, game.level, score);
  if (storage && !persist(storage, save)) $('#storage-notice').hidden = false;
  render(snapshot);
  $('#result-message').textContent = record ? '新的本档最佳，值得为自己鼓掌。' : '每一次专注，都有小小的收获。';
  $('#result-score').textContent = `${game.level} 对伙伴  /  ${game.moves} 步  /  ${formatTime(elapsed)}`;
  result.showModal();
});
board.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-card]');
  if (button) controller.flip(Number(button.dataset.card));
});
$('#restart').addEventListener('click', () => controller.restart());
document.querySelectorAll<HTMLButtonElement>('button[data-level]').forEach(button => button.addEventListener('click', () => {
  if (controller.snapshot.game.level !== Number(button.dataset.level)) controller.restart(Number(button.dataset.level) as Level);
}));
$('#help').addEventListener('click', () => rules.showModal());
$('#again').addEventListener('click', () => { result.close(); controller.restart(); buttons[0].focus(); });
document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog')!.close()));
for (const dialog of [rules, result]) dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
window.addEventListener('pagehide', () => controller.destroy());
controller.restart();
