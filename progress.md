# 实际进度 · 2026-11-20

## 历史几何版完成

1. 读取根计划与已验证中性配置；完成独立 package / TS / Vite 骨架。仅本目录写入。
2. 独立 `npm install` 生成 package-lock，47 packages added，audit 0 vulnerabilities。
3. 完成纯规则、可测试异步控制器、独立存储；完成原创几何卡片完整 UI。
4. `npm test`：3 文件、52 条全部通过。
5. `npm run build`：tsc 严格检查与 Vite8.3.8 生产构建通过。最终JS约12.92 kB，CSS约10.56 kB（未gzip）。
6. `GAME_URL=http://127.0.0.1:5177/ RUN_LABEL=dev npm run test:browser`：63项通过，errors为空。
7. `GAME_URL=http://127.0.0.1:4177/ RUN_LABEL=preview npm run test:browser`：63项通过，errors为空。
8. 真实点击完成6/8/12对，触屏完成12对；覆盖重开、切档、键盘、弹窗、持久化、异常存储与reduced-motion。桌面1440×900、手机390×844与360宽无溢出。
9. 使用视觉工具复核最终生产手机12对与桌面完成截图，未见裁切、计数不一致或图案显示异常。
10. `.gitignore` 补充 .env/.env.*（允许.env.example）、playwright-report、test-results、*.log，保留依赖/构建/验收产物忽略。

## 产物

- `artifacts/dev-report.json`、`artifacts/preview-report.json`：实际浏览器报告。
- `artifacts/dev-*.png`、`artifacts/preview-*.png`：各8张截图，共16张。
- 核心文件：src/engine.ts / controller.ts / storage.ts / main.ts / style.css / icons.ts，配套3个测试文件，scripts/smoke.mjs。

## 交接时服务

已实际核实以下端口监听且首页HTTP200：

- dev：`http://127.0.0.1:5177/`，Node PID 50339。
- production preview：`http://127.0.0.1:4177/`，Node PID 50460。

未停止其他服务；本项目两项服务保留供主 Agent 独立验收。子 Agent 未执行 git/init/commit/push 或部署，未写 memory。主 Agent 加入的 workflow 未修改。

## 历史版本主 Agent 独立验收与发布
- 独立实跑52单测、类型检查与构建、生产preview的63项浏览器检查，全部通过；手机12对截图经视觉核验。
- 仓库：https://github.com/Raingor/memory-match ，代码提交 `b653bd6`。
- 首次部署工作流 https://github.com/Raingor/memory-match/actions/runs/44714089958 成功。
- 站点：https://raingor.github.io/memory-match/ ，HTTP200；`GAME_URL=https://raingor.github.io/memory-match/ RUN_LABEL=pages npm run test:browser` 63项通过，errors=[]。
- 线上实测完成6/8/12对，手机触控完成12对；验证成绩持久化、存储故障、无页面错误与资源错误。报告为忽略目录中的 `artifacts/pages-report.json`。

## 本地人物改造 · 2026-11-20（未发布）

- 新要求：保留现有风格，加入xiaoxiaole的19位人物陪伴选择器，并把翻牌卡面由几何图案改成人物头像/名字。
- 仅复制19张源webp到本项目public/characters-2d，合计682082字节；未复制PNG/full身图/Three，也无兄弟目录运行时引用。
- 新增src/characters.ts、characters.css、characters.test.ts。原生details/summary提供19按钮、aria-pressed/名称/图片alt；Esc与选完均收起并返回summary焦点。
- 角色偏好使用独立版本key puzzle-memory-character-v1，坏JSON/未知版本/非法id/读写异常安全降级。选择陪伴角色不改变当前配对。
- 卡面前6/8/12位角色对应三档；未翻开卡面为空、无人物alt/名字/身份class。配对、锁定、重开/切档和计时控制器保持不变。
- 实跑npm test：4文件91/91通过（原52+新39）；npm run build类型检查与生产构建通过，dist包含19张webp。
- 实跑node --check scripts/characters-smoke.mjs与scripts/smoke.mjs均通过。原玩法smoke仅把固定几何名称断言改为真实人物名称，未删减验收项。
- 新独立脚本scripts/characters-smoke.mjs覆盖19图/选择/刷新/异常存储/360布局/键盘/12种卡面/隐藏身份/真实完成。运行方式：GAME_URL=http://127.0.0.1:5177/ RUN_LABEL=dev node scripts/characters-smoke.mjs。
- 初次交回按错峰安排未启动浏览器；随后主Agent人物专用脚本实跑111项通过、errors=[]，原63项回归首轮在complete(page,8)等待匹配处超时。历史上线报告不能作为人物版已验收证据。
- README/task_plan已区分历史线上版与本地人物工作；本次未git/提交/推送/部署/写memory，未修改其他目录。
- 主Agent授权仅调查上述旧回归失败后，直接原脚本复跑1轮、带真实pointer/focus事件诊断副本复跑5轮，共6轮63/63通过、errors=[]。覆盖CPU6倍限速及CPU12倍+头像请求延迟700ms，均未复现。报告/截图为artifacts/characters-debug-*、characters-cpu6-*、characters-repeat-{1,2,3}-*、characters-cold-images-*。
- 未发现实际产品根因，未改产品代码；不能将未复现说成已修复。原scripts/smoke.mjs只增加catch失败现场，保留配对编号、可见标签、焦点、图片完成状态、布局边界与截图，不重试输入、不延长等待、不弱化63项覆盖；已通过人物脚本未修改。
- 临时事件诊断脚本只位于被忽略的artifacts，不进入提交。最终再次实跑91单测与生产build通过，node --check原smoke通过。子Agent冻结交回主Agent。

## 人物版主Agent上线验收（2026-11-20）
- 主Agent最终独立复跑人物111项、完整玩法63项均通过；首次超时仍按未复现记录，不宣称修复了无证据的产品bug。
- 代码 `98c4f9d` 已推送；Pages工作流 https://github.com/Raingor/memory-match/actions/runs/44734802853 成功。
- https://raingor.github.io/memory-match/ 新版线上111项人物检查+63项玩法检查全过，errors=[]。包括人物卡面12种身份、闭牌保密、19角色选择/保存、键盘/触控、三档真实通关与异常存储。
- 91项单测、严格构建通过；本轮人物版已完成发布与线上验收，上文未发布为此前历史状态。

## 2026-11-23 · iconfont 图标重采

- 通过 opencli 访问 iconfont.cn 搜索采集页面 favicon 与界面图标，图标名称、ID、搜索词和落位见 [ICONS.md](./ICONS.md)。
- 新增 `public/favicon.svg`，`index.html` 改用该文件；界面图标统一以 `currentColor` 渲染，favicon 使用本项目主题色圆角底。
- 洗牌重开按钮改用 iconfont 重置图标，替换原手写 SVG。
- `npm test`、`npm run build` 通过；浏览器冒烟 63 项通过，截图复核图标尺寸、对比度与语义正常。

