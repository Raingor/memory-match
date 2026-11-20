import { describe, expect, it } from 'vitest';
import { CHARACTERS, CHARACTER_KEY, DEFAULT_CHARACTER, cardLabel, characterById, faceContent, loadCharacter, parseCharacter, persistCharacter, portrait } from './characters';
import { createGame } from './engine';

describe('independent companion catalog and storage', () => {
  it('has 19 unique character identities and local relative webp portraits', () => {
    expect(CHARACTERS).toHaveLength(19);
    expect(new Set(CHARACTERS.map(character => character.id)).size).toBe(19);
    for (const character of CHARACTERS) expect(portrait(character)).toBe(`./characters-2d/${character.id}.webp`);
    expect(CHARACTER_KEY).toBe('puzzle-memory-character-v1');
  });
  it.each(CHARACTERS)('round-trips $id without writing score storage', character => {
    const entries = new Map<string, string>();
    const store = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
    expect(persistCharacter(store, character)).toBe(true);
    expect(loadCharacter(store)).toEqual(character);
    expect([...entries.keys()]).toEqual([CHARACTER_KEY]);
  });
  it.each([null, '', '{', 'null', '[]', '42', '"classic"', '{}', '{"version":2,"id":"chiikawa"}', '{"version":1,"id":"unknown"}', '{"version":1,"id":1}', '{"version":1,"id":null}', '{"version":1,"id":"__proto__"}'])('safely defaults invalid save %s', raw => expect(parseCharacter(raw)).toEqual(DEFAULT_CHARACTER));
  it('handles missing/blocked reads and writes without affecting gameplay', () => {
    const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
    expect(loadCharacter(null)).toEqual(DEFAULT_CHARACTER); expect(loadCharacter(blocked)).toEqual(DEFAULT_CHARACTER);
    expect(persistCharacter(null, CHARACTERS[1])).toBe(false); expect(persistCharacter(blocked, CHARACTERS[1])).toBe(false);
    expect(characterById(undefined)).toEqual(DEFAULT_CHARACTER);
  });
});
describe('identity-safe character card presentation', () => {
  it('every closed card has identical empty face and no identity in its accessible name', () => {
    for (let symbol = 0; symbol < 12; symbol++) {
      expect(faceContent(symbol, false)).toBe('');
      expect(cardLabel(0, symbol, false, false)).toBe('第 1 张，未翻开');
    }
  });
  it('open faces show the corresponding local portrait and name, then clear completely', () => {
    for (let symbol = 0; symbol < 12; symbol++) {
      const content = faceContent(symbol, true);
      expect(content).toContain(portrait(CHARACTERS[symbol]));
      expect(content).toContain(`alt="${CHARACTERS[symbol].name}"`);
      expect(content).toContain(CHARACTERS[symbol].short);
      expect(cardLabel(0, symbol, true, false)).toBe(`第 1 张，${CHARACTERS[symbol].name}`);
      expect(cardLabel(0, symbol, true, true)).toBe(`第 1 张，已配对，${CHARACTERS[symbol].name}`);
      expect(faceContent(symbol, false)).toBe('');
    }
  });
  it.each([6, 8, 12] as const)('maps %i pairs to that many distinct named portraits', level => {
    const game = createGame(level, () => 0.999999);
    const identities = game.cards.map(card => CHARACTERS[card.symbol].id);
    expect(new Set(identities).size).toBe(level);
    for (const id of new Set(identities)) expect(identities.filter(value => value === id)).toHaveLength(2);
  });
});
