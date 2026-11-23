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

// Restart icon collected from iconfont.cn through opencli on 2026-11-23.
// Source ID and URL are listed in ../../icons-source.md.

// Restart icon collected from iconfont.cn through opencli on 2026-11-23.
// Source ID and URL are listed in ../../icons-source.md.

// Restart icon collected from iconfont.cn through opencli on 2026-11-23.
// Source ID and URL are listed in ../../icons-source.md.

// Restart icon collected from iconfont.cn through opencli on 2026-11-23.
// Source ID and URL are listed in ../../icons-source.md.
export const restartIcon = '<svg viewBox="0 0 1024 1024" fill="currentColor" aria-hidden="true"><path d="M524.8 106.666667c-106.666667 0-209.066667 42.666667-285.866667 110.933333l-8.533333-68.266667c0-25.6-21.333333-42.666667-46.933333-38.4-25.6 0-42.666667 21.333333-38.4 46.933334l8.533333 115.2c4.266667 55.466667 51.2 98.133333 106.666667 98.133333h8.533333L384 362.666667c25.6 0 42.666667-21.333333 38.4-46.933334 0-25.6-21.333333-42.666667-46.933333-38.4l-85.333334 4.266667c64-55.466667 145.066667-89.6 230.4-89.6 187.733333 0 341.333333 153.6 341.333334 341.333333s-153.6 341.333333-341.333334 341.333334-341.333333-153.6-341.333333-341.333334c0-25.6-17.066667-42.666667-42.666667-42.666666s-42.666667 17.066667-42.666666 42.666666c0 234.666667 192 426.666667 426.666666 426.666667s426.666667-192 426.666667-426.666667c4.266667-234.666667-187.733333-426.666667-422.4-426.666666z"></path></svg>';
