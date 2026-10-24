# 橙花口袋本

给自己用的离线优先 PWA：把《宝可梦睡眠》里的帮手记进盒子，按 Neroli's Lab / SleepAPI 的公开公式估算每天产出，再编最多 5 只的队伍。数据只存在这台设备的 IndexedDB，没有后端，也不会 Google 登录。

适合 iPhone Safari → 分享 → **添加到主屏幕**。

线上地址：<https://syz007110.github.io/pokesleep-box/>

## 能做什么

- **盒子**：Lab 风列表（专长色条、食材/副技能筹码、金色能量），可按树果/食材/技能/常用筛选
- **帮手编辑**：对齐 Lab Pokémon Input（等级/奖章、食材格、性格、副技能稀有度按钮、产出卡）
- **队伍**：5 个竖栏空位 + 总览/队员，叠加帮手奖励（最多 5 层，与速度副技能合计 35%）
- **备份**：导出 / 导入 JSON（Safari 清缓存会丢掉盒子，请定期备份）
- **数据包**：内置版本写在设置页；以后可填远程 JSON 覆盖图鉴，不会改用户存档

本版不含最优队伍求解器。

## 本地运行

需要 Node 22+。

```bash
npm ci
npm test
npm run dev
```

生产构建（GitHub 项目 Pages 需要子路径）：

```bash
npm run build
npm run preview
```

构建默认 `base` 为 `/pokesleep-box/`。本地预览若要挂在根路径，可设 `VITE_BASE=/`。

## 结构

```
src/
  data/          内置数据包 pack.json 与图鉴查询
  calc/          纯 TS 产出计算（和 UI 脱钩）
  db/            IndexedDB：盒子、队伍、设置、数据包覆盖
  stores/        Pinia
  views/         盒子 / 编辑 / 队伍 / 设置
  components/    头像、产出面板、盒子卡片、队伍栏
  ui/            Lab 配色与短标签
```

技术栈：Vue 3 + Vite + TypeScript + Pinia + Vuetify + vite-plugin-pwa。

## GitHub Pages

推到 `main` 后，`.github/workflows/deploy.yml` 会安装、测试、构建并部署 `dist/`。

仓库 **Settings → Pages** 的 Source 选 **GitHub Actions**（不是 Deploy from a branch）。

第一次打开若 404，先看 Actions 是否成功，以及 Pages 环境是否已创建。

## 在 iPhone 上安装

1. 用 **Safari**（不要用微信或 Chrome）打开 <https://syz007110.github.io/pokesleep-box/>
2. 点底部分享按钮
3. 选 **添加到主屏幕**，名字可改成「口袋本」
4. 从主屏幕图标打开，即全屏 PWA

第一次打开需要联网把壳和数据包拉齐。之后 Service Worker 会缓存，断网也能算。

数据只存在这台 iPhone。打开应用 → **设置** → **导出备份 JSON**，存到「文件」或 iCloud。

## 许可

- 本项目自己的代码：MIT（见 `LICENSE`）
- 游戏数据与公式：Neroli's Lab `common/`，Apache-2.0（见 `third_party/nerolis-lab/`）
