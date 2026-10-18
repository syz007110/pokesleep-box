# 宝可梦睡眠盒子（pokesleep-box）

给自己用的离线优先 PWA：把游戏里的宝可梦记进盒子，按 Neroli’s Lab 的数据和公式估算每天产出。数据只存在这台设备的 IndexedDB 里，不经过任何云端。以后会在「自己的盒子」上做队伍优选。

适合 iPhone Safari → 分享 → **添加到主屏幕**。静态托管在 GitHub Pages：`https://<user>.github.io/pokesleep-box/`。

## 本地运行

需要 Node 22+（Lab 仓库本身要求 Node 24，本仓库只引用它的纯 TS `common/`，用 22 即可）。

```bash
npm install
npm test
npm run dev
```

生产构建（带 `/pokesleep-box/` 路径）：

```bash
npm run build
npm run preview
```

## 结构

```
src/
  calc/          纯 TS 产出计算（和 UI 脱钩，方便以后接队伍模拟）
  db/            Dexie / IndexedDB，JSON 导出导入
  game/          对 Lab 图鉴、性格、副技能、岛屿的薄封装
  i18n/          中/日/英名称表，key 是 Lab id，后续给 OCR 用
  models/        盒子里「我的宝可梦」和全局设置
  stores/        Pinia
  views/         盒子 / 添加 / 编辑 / 产出 / 设置
vendor/nerolis-lab/
  common/src     从 Lab 拷来的游戏数据与公式
```

计算入口：`src/calc/production.ts` 的 `calculatePokemonProduction`。帮忙间隔与 Lab `help-calculator.ts` 一致；树果能量、食材率、技能率、持有上限用 `common/` 里的 `berryPowerForLevel`、`stat-utils`、`CarrySizeUtils`。

## 从 Lab 更新游戏数据

```bash
bash scripts/update-lab-common.sh          # 默认跟 Lab 默认分支
bash scripts/update-lab-common.sh v2.71.6  # 指定 tag / 分支
npm test
```

脚本会替换 `vendor/nerolis-lab/common/src`（去掉测试和 vitest），并写下 commit 到 `vendor/nerolis-lab/SOURCE.txt`。Lab 是 Apache-2.0，NOTICE / LICENSE 一并保留。

## GitHub Pages

推到 `main` 后，`.github/workflows/deploy.yml` 会跑测试、构建并部署。仓库设置里把 Pages 来源选成 **GitHub Actions**。站点根路径是 `/pokesleep-box/`。

第一次打开若 404，确认 Actions 已成功，并且 Pages 环境已创建。

## 规则里还不确定的点

见用户整理的 `rules.md`。本仓库按 **Lab 源码**实现，并标出和 wiki 的差异：

- 活力 ×0.45 档：Lab 是 **80+**，wiki 写 81+。
- 副技能解锁：Lab 是 10 / 25 / 50 / **70 / 80**；常见说法是 75 / 100。等级上限目前是 70，所以第四格在 70 级解锁。
- 技能保底、夜间最多结算 2 次技能：社区模型，不是官方公式。
- 基础食材率 / 技能率：Lab 注明来自 Mathcord RP 数据，原表已 Deprecated。
- 夜间产出：v1 用「白天按活力下降、夜里用睡前活力、装满后偷吃只拿树果」。完整事件模拟（Lab 的 team-simulator）还没移植。

## 下一步

1. **OCR 导入**：iOS 快捷指令截图 → 本地识别中文 → 用 `src/i18n` 的名称表对上 Lab id。
2. **队伍优选**：把 Lab `backend/src/services/simulation-service` 和 `solve/set-cover` 接到「我的盒子」上，在设备上算最高产队伍。

## 许可

- 本项目自己的代码：MIT（见 `LICENSE`）
- 游戏数据与公式：Neroli’s Lab `common/`，Apache-2.0（`vendor/nerolis-lab/`）
- 中日文名称：个人自用对照表，见 `src/i18n/SOURCE.txt`
