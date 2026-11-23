# 形状碰碰 · 记忆翻牌

一款独立运行的中文记忆翻牌游戏。保留奶油纸面和钴蓝几何牌背，人物头像配对卡面搭配19位可选陪伴角色；没有远程素材请求、账号或后端。头像按本次要求从现有 xiaoxiaole 本地素材复制，不代表对这些角色名称或形象的原创或权利声明。

## 仓库与在线试玩

- GitHub：https://github.com/Raingor/memory-match
- GitHub Pages：https://raingor.github.io/memory-match/ （19角色陪伴与人物卡面版已上线，线上111项人物检查和63项完整玩法回归通过；91项单测及严格构建通过）
- main 推送自动执行规则测试、类型检查、生产构建与 Pages 发布。

## 开始

需要 Node.js 22.12+（本次实测 24.18.0）。在本项目目录执行：

```sh
npm ci
npm run dev
```

默认开发地址 `http://localhost:5177/`，端口冲突时直接报错，不自动漂移。生产构建使用相对资源基址 `./`，适用于静态子目录托管。

```sh
npm test                  # 规则 / 异步控制器 / 存储单测
npm run build             # 严格 TypeScript 检查后生产打包
npm run preview           # 默认也使用 5177，不能与 dev 同时占用
npm run preview -- --port 4177   # 与 dev 并行预览时显式指定空闲端口
GAME_URL=http://127.0.0.1:5177/ RUN_LABEL=dev npm run test:browser
GAME_URL=http://127.0.0.1:4177/ RUN_LABEL=preview npm run test:browser
```

浏览器验收依赖本机 Google Chrome，由 Playwright 启动独立、无登录态的 Chrome 上下文。`GAME_URL` 支持指定其他已启动地址；脚本不负责启动或关闭游戏服务。`RUN_LABEL` 为截图/报告文件名前缀。依赖锁由本项目独立生成，实际版本：Vite 8.3.8 / Vitest 4.1.12 / Playwright 1.65.1 / TypeScript 5.9.3。

## 玩法

- 轻松 6 对、专注 8 对、挑战 12 对，点击两张卡片寻找相同人物头像与名字。
- 翻开第二张计 1 步。相同卡片留下，不同卡片在短暂展示后盖回。
- 配对处理中禁止第三张输入，同一张不能自配；已配对卡片不可再次操作。
- 首次合法翻牌开始计时，完成后停止。洗牌重开或切换难度会取消上一局的延迟回调和计时器。
- Tab 移动焦点，Enter / 空格翻牌。弹窗可用 Escape 关闭。没有接管方向键，不会妨碍页面滚动。
- 完成后显示步数、用时与是否刷新最佳。最佳成绩按难度独立保存，先比较步数，再比较用时。

## 本地记录

最佳成绩使用 `puzzle-memory-v1`，结构为 `{ version: 1, best: { "6": { moves, seconds }, ... } }`。不读取其他游戏的记录，不保存中途棋盘或账号。损坏 JSON、未知版本、非法档位、非整数或负数字段会安全回退为空记录。存储访问异常不影响游玩，写入失败时页面会提示。浏览器清除站点数据后记录也会被删除。

陪伴角色单独使用 `puzzle-memory-character-v1`，结构 `{ version: 1, id: "classic" }`。19个角色全部可选；坏JSON、非法id、未知版本、存储读取失败均默认自嘲熊（Joke Bear）。选择后收起并返回入口焦点，Esc同样收起；保存失败不影响本次选择或配对游戏。切换陪伴角色不改变当前牌局；6/8/12对的卡面分别使用角色目录前6/8/12位，头像与名字共同辨认。

## 结构

- `src/engine.ts`：纯状态与洗牌/翻牌/配对规则；可注入随机数，不依赖 DOM 或计时器。
- `src/controller.ts`：单例计时、配对延迟、重开代际保护与完成回调；可注入时钟。
- `src/storage.ts`：版本化记录校验、异常处理与成绩比较。
- `src/main.ts` / `src/style.css` / `src/icons.ts`：语义按钮、键盘焦点、原生弹窗、响应式棋盘、几何牌背与 reduced-motion。
- `src/characters.ts` / `src/characters.css`：19角色目录、独立角色偏好、原生折叠选择器与人物卡面；隐藏卡不生成身份名称、头像、alt或身份类。
- `public/characters-2d/*.webp`：19张自包含本地头像，无兄弟目录运行时引用。
- `scripts/smoke.mjs`：真实点击/键盘/触控验收；测试侧固定随机数，不暴露产品作弊入口，也不导入开发态 `/src` 模块。

## 历史几何卡片版实际验收（2026-11-20）

- `npm test`：3 个测试文件，**52 / 52 通过**。
- `npm run build`：TypeScript 检查与 Vite 生产打包通过。
- 开发服务与生产 preview 各完成 **63 项浏览器断言**，均无 pageerror、console error、HTTP 错误或资源 404。
- 1440×900 桌面真实点击完成三档配对；390×844 触屏真实点击完成 12 对；360 宽检查三档无横向溢出。
- 验证同卡/第三张锁定、重开/切档取消旧回调、计时停止、玩法弹窗、键盘激活与焦点、结算、刷新保留三档最佳、损坏与禁用存储、reduced-motion。
- `artifacts/dev-report.json` 与 `artifacts/preview-report.json` 保存实际报告；每套各 8 张截图，包括桌面初始/进行/结算、三档手机棋盘、手机结算与 360 宽。产物已忽略，不进入源码仓库。

## 人物改造（2026-11-20，已上线验收）

- `npm test`：4文件、**91 / 91通过**（保留原52条规则/计时/存储测试，新增39条人物/偏好校验/卡面保密测试）。
- `npm run build`：严格TS检查及生产构建通过，生产目录包含19张webp。
- `node --check scripts/characters-smoke.mjs` 与 `node --check scripts/smoke.mjs` 通过。
- 主Agent人物专用脚本实际111项通过、errors=[]；原63项回归首轮在8对完成等待处超时，已如实保留记录。
- 经授权定向调查，子Agent原63项回归及带事件诊断副本共6轮全部通过、errors=[]，包括CPU6倍限速与CPU12倍＋头像延迟700ms，未复现首轮失败，未找到证据支持图片解码或布局漏翻根因，不声称已修复产品bug。
- 原scripts/smoke.mjs仅增加失败现场诊断（当前配对、卡片标签/图片解码状态、焦点、边界、截图），不重试输入、不盲等、不改断言；人物专用脚本未改。主Agent最终独立本地与线上均通过111项人物检查+63项玩法检查；`98c4f9d`已发布，Pages部署44734802853成功。
- 新增独立验收脚本，检查19图加载、逐一选择、刷新、损坏/不可用存储、360布局、键盘Esc/焦点、12个人物卡面、背面不泄露与真实完成；截图写入 `artifacts/characters-*.png`。

```sh
GAME_URL=http://127.0.0.1:5177/ RUN_LABEL=dev node scripts/characters-smoke.mjs
GAME_URL=http://127.0.0.1:4177/ RUN_LABEL=preview node scripts/characters-smoke.mjs
# 同时重新跑原有63项完整玩法回归
GAME_URL=http://127.0.0.1:4177/ RUN_LABEL=characters-regression npm run test:browser
```

首版不支持中途续局或跨设备成绩同步。Git、Pages更新与最终浏览器验收由主Agent统一执行；人物版已提交、发布并完成线上验收，实际发布结果见progress.md。

## 图标来源

页面 favicon 与界面图标于 2026-11-23 通过 opencli 从 [iconfont.cn](https://www.iconfont.cn/) 搜索采集；图标名称、ID、搜索词与落位见根目录 `../icons-source.md`。界面图标统一以 `currentColor` 渲染，favicon 使用本项目主题色。
