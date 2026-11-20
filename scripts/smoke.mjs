import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.env.GAME_URL || 'http://127.0.0.1:5177/';
const tag = process.env.RUN_LABEL || `port-${new URL(url).port || 'web'}`;
const output = fileURLToPath(new URL('../artifacts/', import.meta.url));
await mkdir(output, { recursive: true });
const errors = [];
const screenshots = [];
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const contexts = [];
const key = 'puzzle-memory-v1';
async function context(options = {}, init) {
  const ctx = await browser.newContext(options); contexts.push(ctx);
  // Test-only deterministic source. No product hooks, dev imports, or hidden card APIs.
  await ctx.addInitScript(() => { Math.random = () => 0.999999; });
  if (init) await ctx.addInitScript(init);
  ctx.on('page', page => {
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    page.on('requestfailed', request => errors.push(`request failed: ${request.url()} ${request.failure()?.errorText}`));
  });
  const page = await ctx.newPage(); await page.goto(url); await page.locator('.card').first().waitFor();
  return { page, ctx };
}
const card = (page, id) => page.locator(`[data-card="${id}"]`);
const click = (page, locator, touch) => touch ? locator.tap() : locator.click();
async function screenshot(page, name) {
  const filename = `${tag}-${name}.png`; await page.screenshot({ path: `${output}${filename}`, fullPage: true, animations: 'disabled' }); screenshots.push(filename);
}
async function noOverflow(page, label) {
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no horizontal overflow`);
}
async function choose(page, level) {
  await page.locator(`button[data-level="${level}"]`).click(); check(await page.locator('.card').count() === level * 2, `${level} pairs deck`);
  check(await page.locator(`button[data-level="${level}"]`).getAttribute('aria-pressed') === 'true', `${level} selected correctly`);
}
async function complete(page, level, touch = false) {
  for (let i = 0; i < level; i++) {
    await click(page, card(page, i), touch); await click(page, card(page, i + level), touch);
    await page.waitForFunction(id => document.querySelector(`[data-card="${id}"]`)?.disabled, i);
  }
  await page.locator('#result').waitFor({ state: 'visible' });
  check(await page.locator('#moves').textContent() === String(level), `complete ${level} with minimal moves`);
  check(await page.locator('.is-matched').count() === level * 2, `complete all ${level} pairs`);
}
try {
  const { page } = await context({ viewport: { width: 1440, height: 900 } });
  check(await page.title() === '形状碰碰 · 记忆翻牌', 'Chinese title');
  await noOverflow(page, 'desktop'); await screenshot(page, 'desktop-ready');
  await page.waitForTimeout(1100); check(await page.locator('#timer').textContent() === '00:00', 'timer idle before first flip');
  await page.getByRole('button', { name: '怎么玩' }).click();
  check(await page.locator('#rules').isVisible(), 'rules open'); await page.keyboard.press('Escape');
  check(!await page.locator('#rules').isVisible(), 'Escape closes rules');
  check(await page.locator('#help').evaluate(el => el === document.activeElement), 'dialog restores focus');
  await card(page, 0).focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  check(await page.locator('#moves').textContent() === '0', 'same card cannot self-pair via keyboard');
  check(await card(page, 0).getAttribute('aria-label') === '第 1 张，日光圆环', 'keyboard reveals a meaningful shape name');
  const outline = await card(page, 0).evaluate(el => getComputedStyle(el).outlineWidth); check(outline === '3px', 'visible keyboard focus');
  await card(page, 1).click(); await card(page, 2).click({ force: true }); // Physical input while aria-disabled: do not let Playwright wait for unlock.
  check(await card(page, 2).getAttribute('aria-label') === '第 3 张，未翻开', 'third input blocked');
  await page.waitForTimeout(900); check(await page.locator('.is-flipped').count() === 0, 'mismatch turns back');
  await card(page, 0).click(); await card(page, 1).click(); await page.locator('#restart').click();
  await card(page, 3).click(); await page.waitForTimeout(900);
  check(await card(page, 3).getAttribute('aria-label') === '第 4 张，薄荷方格', 'restart cancels old mismatch callback');
  check(await page.locator('#moves').textContent() === '0', 'restart resets moves');
  await card(page, 4).click(); await choose(page, 8); await page.waitForTimeout(900);
  check(await page.locator('.is-flipped').count() === 0, 'difficulty cancels old callback');
  await complete(page, 8); await page.locator('#result [data-close]').last().click();
  await choose(page, 12); await complete(page, 12); await page.locator('#result [data-close]').last().click();
  await choose(page, 6); await complete(page, 6); await screenshot(page, 'desktop-complete');
  const stopped = await page.locator('#timer').textContent(); await page.waitForTimeout(1200);
  check(await page.locator('#timer').textContent() === stopped, 'timer stops after completion');
  check(await page.locator('#result-message').textContent() === '新的本档最佳，值得为自己鼓掌。', 'record feedback');
  await page.locator('#result [data-close]').last().click();
  check(await card(page, 0).isDisabled(), 'matched cards really disabled');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  check(saved.version === 1 && saved.best[6].moves === 6 && saved.best[8].moves === 8 && saved.best[12].moves === 12, 'all three best scores independently persisted');
  const keys = await page.evaluate(() => Object.keys(localStorage)); check(keys.length === 1 && keys[0] === key, 'only own versioned storage key');
  await page.reload(); check((await page.locator('#best').textContent()).includes('6 步'), 'record survives reload');
  check(await page.locator('#moves').textContent() === '0', 'mid-game not falsely restored');
  await card(page, 0).click(); await card(page, 6).click(); await page.waitForTimeout(450);
  await screenshot(page, 'desktop-playing');
  const mobile = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  for (const level of [6, 8, 12]) {
    await choose(mobile.page, level); await noOverflow(mobile.page, `390/${level}`);
    await screenshot(mobile.page, `mobile-${level}-pairs`);
  }
  await complete(mobile.page, 12, true); await screenshot(mobile.page, 'mobile-complete');
  await mobile.page.locator('#again').tap(); check(await mobile.page.locator('#moves').textContent() === '0', 'touch play again');
  await mobile.page.locator('#help').tap(); await mobile.page.getByRole('button', { name: '明白了，开始翻牌' }).tap();
  check(!await mobile.page.locator('#rules').isVisible(), 'touch rules close');
  await mobile.page.reload(); await choose(mobile.page, 12); check((await mobile.page.locator('#best').textContent()).includes('12 步'), 'mobile record persisted');
  const narrow = await context({ viewport: { width: 360, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  for (const level of [6, 8, 12]) { await choose(narrow.page, level); await noOverflow(narrow.page, `360/${level}`); }
  check(await narrow.page.locator('.card-inner').first().evaluate(el => getComputedStyle(el).transitionDuration) === '0s', 'reduced motion disables flip transition');
  await screenshot(narrow.page, 'narrow-360');
  const blocked = await context({}, () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  check(await blocked.page.locator('#storage-notice').isVisible(), 'blocked storage explains fallback');
  await card(blocked.page, 0).click(); await card(blocked.page, 6).click(); await blocked.page.waitForTimeout(450);
  check(await blocked.page.locator('.is-matched').count() === 2, 'blocked storage does not block game');
  const corrupt = await context({}, () => { try { localStorage.setItem('puzzle-memory-v1', '{"version":2,"best":{"6":{"moves":1,"seconds":-1}}}'); } catch { /* Initial about:blank has no storage origin. */ } });
  check((await corrupt.page.locator('#best').textContent()).includes('没有纪录'), 'unsupported save safely ignored');
  check(errors.length === 0, `no errors: ${errors.join('\n')}`);
  const report = { url, tag, checks, errors, screenshots, browser: 'isolated Google Chrome contexts', completedLevels: [6, 8, 12], mobileTouchCompletion: 12 };
  await writeFile(`${output}${tag}-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  for (const ctx of contexts) await ctx.close(); await browser.close();
}
