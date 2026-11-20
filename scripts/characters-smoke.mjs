import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.env.GAME_URL || 'http://127.0.0.1:5177/';
const label = process.env.RUN_LABEL || 'local';
const output = fileURLToPath(new URL('../artifacts/', import.meta.url));
const storageKey = 'puzzle-memory-character-v1';
await mkdir(output, { recursive: true });
const errors = [], screenshots = [], contexts = [];
let checks = 0;
function check(condition, message) { assert.ok(condition, message); checks++; }
const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function open(options = {}, fixture) {
  const ctx = await browser.newContext(options); contexts.push(ctx);
  await ctx.addInitScript(() => { Math.random = () => 0.999999; });
  if (fixture) await ctx.addInitScript(fixture);
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  page.on('requestfailed', request => errors.push(`request failed: ${request.url()} ${request.failure()?.errorText}`));
  await page.goto(url); await page.locator('.companion-portrait').waitFor();
  return page;
}
async function shot(page, name) {
  const filename = `characters-${label}-${name}.png`;
  await page.screenshot({ path: output + filename, fullPage: true, animations: 'disabled' }); screenshots.push(filename);
}
async function closedCardsSafe(page) {
  check(await page.locator('.card:not(.is-flipped)').evaluateAll(cards => cards.every(card => {
    const front = card.querySelector('.card-front');
    return front?.innerHTML === '' && front.getAttribute('aria-hidden') === 'true'
      && /^第 \d+ 张，未翻开$/.test(card.getAttribute('aria-label'))
      && card.className === 'card' && !card.querySelector('img,[title],[data-character]');
  })), 'closed cards expose no portrait, text, alt, identity class or title');
}
try {
  const page = await open({ viewport: { width: 1440, height: 900 } });
  const summary = page.locator('.character-picker summary');
  check(await page.locator('.companion-name').textContent() === 'Joke Bear', 'safe default companion');
  await closedCardsSafe(page);
  await summary.click();
  const allCharacters = page.locator('.character-grid button');
  check(await allCharacters.count() === 19, 'all nineteen selectable');
  await page.waitForFunction(() => [...document.querySelectorAll('.character-grid img')].every(img => img.complete && img.naturalWidth > 0));
  check(await allCharacters.evaluateAll(buttons => buttons.every(button => button.getAttribute('aria-label')?.startsWith('选择') && button.querySelector('img')?.alt)), 'all buttons named and portraits have alt');
  const ids = await allCharacters.evaluateAll(buttons => buttons.map(button => button.dataset.character));
  for (const id of ids) {
    if (!await page.locator('.character-picker').evaluate(el => el.open)) await summary.click();
    await page.locator(`[data-character="${id}"]`).click();
    check(!await page.locator('.character-picker').evaluate(el => el.open), `${id}: selection closes picker`);
    check(await page.locator(`[data-character="${id}"]`).getAttribute('aria-pressed') === 'true', `${id}: pressed state`);
    check(await summary.evaluate(el => document.activeElement === el), `${id}: restores summary focus`);
    const expected = await page.locator(`[data-character="${id}"] img`).getAttribute('alt');
    check(await page.locator('.companion-name').textContent() === expected, `${id}: visible name`);
  }
  await page.reload();
  check(await page.locator('.companion-name').textContent() === '海盗熊', 'selection survives reload');
  check(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).id, storageKey) === 'bear-pirate', 'independent saved character');
  await summary.focus(); await page.keyboard.press('Enter');
  check(await page.locator('.character-picker').evaluate(el => el.open), 'keyboard opens native details');
  await page.locator('[data-character="chiikawa"]').focus();
  check(await page.locator('[data-character="chiikawa"]').evaluate(el => getComputedStyle(el).outlineWidth) === '3px', 'clear keyboard focus');
  await page.keyboard.press('Space'); check(await page.locator('.companion-name').textContent() === '吉伊', 'space selects companion');
  await summary.focus(); await page.keyboard.press('Enter'); await page.locator('[data-character="hachiware"]').focus(); await page.keyboard.press('Escape');
  check(!await page.locator('.character-picker').evaluate(el => el.open), 'Escape collapses details');
  check(await summary.evaluate(el => document.activeElement === el), 'Escape restores summary focus');
  await page.locator('button[data-level="12"]').click();
  await closedCardsSafe(page);
  const names = new Set();
  for (let i = 0; i < 12; i++) {
    await page.locator(`[data-card="${i}"]`).click();
    const image = page.locator(`[data-card="${i}"] .card-portrait`);
    await image.waitFor();
    await image.evaluate(img => img.decode());
    names.add(await image.getAttribute('alt'));
    check((await page.locator(`[data-card="${i}"]`).getAttribute('aria-label')).includes(await image.getAttribute('alt')), 'open card accessible name matches portrait');
    await page.locator(`[data-card="${i + 12}"]`).click();
    await page.waitForFunction(id => document.querySelector(`[data-card="${id}"]`)?.disabled, i);
  }
  check(names.size === 12, 'twelve genuinely different characters on twelve-pair board');
  await page.locator('#result').waitFor({ state: 'visible' });
  check(await page.locator('#moves').textContent() === '12', 'character cards still complete via real clicks');
  await shot(page, 'completed');
  await page.locator('#result [data-close]').last().click(); await page.locator('#restart').click();
  await page.locator('[data-card="0"]').click(); await page.locator('[data-card="1"]').click();
  await page.waitForTimeout(900); await closedCardsSafe(page);
  await page.locator('[data-card="0"]').click(); await page.locator('[data-card="12"]').click();
  await page.waitForTimeout(450); await shot(page, 'desktop-playing');
  const mobile = await open({ viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await mobile.locator('.character-picker summary').tap();
  check(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '360 selector has no horizontal overflow');
  await mobile.waitForFunction(() => [...document.querySelectorAll('.character-grid img')].every(img => img.complete && img.naturalWidth > 0));
  await shot(mobile, '360-picker');
  await mobile.locator('[data-character="bear-astronaut"]').tap(); await mobile.locator('button[data-level="12"]').tap();
  check(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '360 board has no horizontal overflow');
  await mobile.locator('[data-card="0"]').tap(); await mobile.locator('[data-card="12"]').tap(); await mobile.waitForTimeout(450);
  await shot(mobile, '360-cards');
  const corrupt = await open({}, () => { try { localStorage.setItem('puzzle-memory-character-v1', '{bad-json'); } catch {} });
  check(await corrupt.locator('.companion-name').textContent() === 'Joke Bear', 'corrupt JSON defaults safely');
  const invalid = await open({}, () => { try { localStorage.setItem('puzzle-memory-character-v1', '{"version":1,"id":"missing-character"}'); } catch {} });
  check(await invalid.locator('.companion-name').textContent() === 'Joke Bear', 'unknown ID defaults safely');
  const blocked = await open({}, () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  await blocked.locator('.character-picker summary').click(); await blocked.locator('[data-character="hachiware"]').click();
  check(await blocked.locator('.companion-name').textContent() === '小八', 'blocked storage still permits selection');
  check(await blocked.locator('.character-notice').isVisible(), 'blocked storage explains unsaved selection');
  await blocked.locator('[data-card="0"]').click(); await blocked.locator('[data-card="6"]').click(); await blocked.waitForTimeout(450);
  check(await blocked.locator('.is-matched').count() === 2, 'blocked storage still permits matching');
  check(errors.length === 0, errors.join('\n'));
  const report = { url, checks, errors, screenshots, portraits: 19, cardIdentities: 12 };
  await writeFile(`${output}characters-${label}-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  for (const ctx of contexts) await ctx.close(); await browser.close();
}
