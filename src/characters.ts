import type { Store } from './storage';

export const CHARACTERS = [
  { id: 'classic', name: 'Joke Bear', short: '自嘲熊' },
  { id: 'chiikawa', name: '吉伊', short: '吉伊' },
  { id: 'hachiware', name: '小八', short: '小八' },
  { id: 'usagi', name: '乌萨奇', short: '乌萨奇' },
  { id: 'mole-croquette', name: '鼹鼠饼', short: '鼹鼠饼' },
  { id: 'old-dog', name: '老头狗', short: '老头狗' },
  { id: 'bear-raincoat', name: '小黄鸭雨衣熊', short: '雨衣熊' },
  { id: 'bear-pajama', name: '睡衣派对熊', short: '睡衣熊' },
  { id: 'bear-ninja', name: '夜行忍者熊', short: '忍者熊' },
  { id: 'kurimanju', name: '栗子馒头', short: '栗子馒头' },
  { id: 'momonga', name: '飞鼠', short: '飞鼠' },
  { id: 'rakko', name: '海獭', short: '海獭' },
  { id: 'shisa', name: '狮萨', short: '狮萨' },
  { id: 'furuhonya', name: '古本屋', short: '古本屋' },
  { id: 'bear-strawberry', name: '草莓熊', short: '草莓熊' },
  { id: 'bear-frog', name: '青蛙熊', short: '青蛙熊' },
  { id: 'bear-astronaut', name: '太空熊', short: '太空熊' },
  { id: 'bear-chef', name: '厨师熊', short: '厨师熊' },
  { id: 'bear-pirate', name: '海盗熊', short: '海盗熊' },
] as const;
export type Character = typeof CHARACTERS[number];
export const CHARACTER_KEY = 'puzzle-memory-character-v1';
export const DEFAULT_CHARACTER = CHARACTERS[0];
export function characterById(id: unknown): Character {
  return CHARACTERS.find(character => character.id === id) ?? DEFAULT_CHARACTER;
}
export function portrait(character: Character): string { return `./characters-2d/${character.id}.webp`; }
export function parseCharacter(raw: string | null): Character {
  try {
    const data: unknown = JSON.parse(raw ?? 'null');
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return DEFAULT_CHARACTER;
    const value = data as Record<string, unknown>;
    return value.version === 1 ? characterById(value.id) : DEFAULT_CHARACTER;
  } catch { return DEFAULT_CHARACTER; }
}
export function loadCharacter(store: Store | null): Character {
  try { return parseCharacter(store?.getItem(CHARACTER_KEY) ?? null); } catch { return DEFAULT_CHARACTER; }
}
export function persistCharacter(store: Store | null, character: Character): boolean {
  try {
    if (!store) return false;
    store.setItem(CHARACTER_KEY, JSON.stringify({ version: 1, id: character.id })); return true;
  } catch { return false; }
}
// Closed cards deliberately contain neither a portrait nor an identity-bearing name or attribute.
export function faceContent(symbol: number, visible: boolean): string {
  if (!visible) return '';
  const character = CHARACTERS[symbol];
  return `<img class="card-portrait" src="${portrait(character)}" alt="${character.name}" draggable="false"><span class="card-name">${character.short}</span><span class="match-tick">✓</span>`;
}
export function cardLabel(id: number, symbol: number, visible: boolean, matched: boolean): string {
  return `第 ${id + 1} 张，${visible ? `${matched ? '已配对，' : ''}${CHARACTERS[symbol].name}` : '未翻开'}`;
}
export function mountCharacters(host: HTMLElement, store: Store | null): void {
  let selected = loadCharacter(store);
  host.innerHTML = `<details class="character-picker"><summary><img class="companion-portrait" alt=""><span class="companion-copy"><span class="companion-eyebrow">今日翻牌搭子</span><strong class="companion-name"></strong></span><span class="companion-action">换个伙伴 <span aria-hidden="true">⌄</span></span></summary><div class="character-panel"><p>19 位伙伴，今天想和谁一起翻牌？<span>选择陪伴角色不会改变当前配对。</span></p><div class="character-grid" role="group" aria-label="选择陪伴角色">${CHARACTERS.map(character => `<button type="button" data-character="${character.id}" aria-label="选择${character.name}" aria-pressed="false"><img src="${portrait(character)}" alt="${character.name}" width="56" height="56" draggable="false"><span>${character.short}</span></button>`).join('')}</div></div></details><p class="character-notice" role="status" hidden>角色偏好暂时无法保存，本次选择仍然有效。</p>`;
  const details = host.querySelector('details')!;
  const summary = host.querySelector('summary')!;
  const image = host.querySelector<HTMLImageElement>('.companion-portrait')!;
  const name = host.querySelector('.companion-name')!;
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('[data-character]'));
  function render() {
    image.src = portrait(selected); image.alt = selected.name; name.textContent = selected.name;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.character === selected.id)));
  }
  function close() { details.open = false; summary.focus(); }
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = characterById(button.dataset.character); render();
    host.querySelector<HTMLElement>('.character-notice')!.hidden = persistCharacter(store, selected);
    close();
  }));
  details.addEventListener('keydown', event => {
    if (event.key === 'Escape' && details.open) { event.preventDefault(); event.stopPropagation(); close(); }
  });
  render();
}
