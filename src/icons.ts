export const names = ['日光圆环', '珊瑚花朵', '蓝色山峰', '薄荷方格', '柠檬闪电', '粉色蝴蝶', '橙色拱门', '靛蓝星芒', '青色波浪', '红色爱心', '紫色风车', '绿叶双生'];
const paths = [
  '<circle cx="40" cy="40" r="23" fill="none" stroke="currentColor" stroke-width="13"/><circle cx="40" cy="40" r="5"/>',
  '<path d="M40 11C51 0 63 16 56 27C74 24 79 47 63 51C72 68 51 78 40 64C29 78 8 68 17 51C1 47 6 24 24 27C17 16 29 0 40 11Z"/><circle cx="40" cy="40" r="8" fill="var(--face)"/>',
  '<path d="M8 65L32 15L45 42L53 27L74 65Z"/><path d="M27 27L32 17L39 32Z" fill="var(--face)"/>',
  '<rect x="13" y="13" width="23" height="23" rx="4"/><rect x="44" y="13" width="23" height="23" rx="4"/><rect x="13" y="44" width="23" height="23" rx="4"/><rect x="44" y="44" width="23" height="23" rx="4"/>',
  '<path d="M43 6L14 44H36L31 74L66 32H44L51 6Z"/>',
  '<path d="M38 39C7-7 0 48 28 44C3 57 24 82 39 48C57 82 78 56 52 44C81 48 73-7 42 39Z"/><path d="M40 32V56" fill="none" stroke="var(--face)" stroke-width="4"/>',
  '<path d="M12 68V35a28 28 0 0 1 56 0V68H51V35a11 11 0 0 0-22 0V68Z"/>',
  '<path d="M40 3L47 26L69 11L55 33L78 40L55 47L69 69L47 55L40 78L33 55L11 69L26 47L3 40L26 33L11 11L33 26Z"/>',
  '<path d="M9 24Q24 8 40 24T71 24M9 42Q24 26 40 42T71 42M9 60Q24 44 40 60T71 60" fill="none" stroke="currentColor" stroke-width="10"/>',
  '<path d="M40 69L12 42C-8 18 22-2 40 21C58-2 88 18 68 42Z"/>',
  '<path d="M40 40V6C70 5 76 28 40 40ZM40 40H74C75 70 52 76 40 40ZM40 40V74C10 75 4 52 40 40ZM40 40H6C5 10 28 4 40 40Z"/>',
  '<path d="M38 66C3 66 0 20 12 10C39 12 44 35 38 66ZM43 66C39 32 50 17 71 13C82 40 66 64 43 66Z"/>',
];
export function shape(symbol: number): string { return `<svg viewBox="0 0 80 80" aria-hidden="true" focusable="false">${paths[symbol]}</svg>`; }
export const restartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>';
