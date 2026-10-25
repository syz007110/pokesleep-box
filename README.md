# 橙花口袋本

离线优先的《宝可梦睡眠》PWA：把 [Neroli's Lab](https://github.com/nerolis-lab/nerolis-lab) 的前端和产出模拟搬到手机上跑。没有长期后端，也不做 Google / Discord / Patreon 登录。队伍、食谱等级和设置写在本机 IndexedDB，可导出 JSON 备份。

线上地址：<https://syz007110.github.io/pokesleep-box/>

适合 iPhone Safari → 分享 → **添加到主屏幕**。

## 现在能用的 Lab 功能

- **首页**：Lab 首页布局与入口
- **计算器**：队伍栏、宝可梦输入、总览 / 队员 / 料理，以及 IV 比较。蒙特卡洛在本机主线程跑（队伍 400 次、IV 200 次；Lab 服务器默认是 5110 / 1400）
- **比较**：多组产出对比
- **食谱**：可改等级，存在本机（默认 60，与 Lab `defaultUserRecipes` 一致）
- **设置 → 游戏**：区域加成、锅容量，不登录也可改
- **设置 → 站点**：缓存清理、本机 JSON 备份导出 / 导入，以及文本导入（把捷径提取的详情文字贴进口袋）
- **关于、鸣谢、菜品信息图、访客资料页**
- Lab 配色、字体、精灵图

界面文案大部分仍是 Lab 英文。离线说明、备份卡片和页面标题是中文。

## 故意没接上的部分

这些依赖 Lab 的云端，这版不跑服务器：

- Google / Discord / Patreon OAuth，以及登录回调页（登录框只说明数据在本机）
- 云端账号、队伍同步、好友、通知收件箱、管理后台
- `/guides`（Lab 用 VitePress，路由会把这段导走）
- 梯队页（当前 Lab 导航里也注释掉了）
- 最优队伍求解器

## 本地运行

需要 Node 22+。

```bash
npm ci
npm test
npm run dev
```

生产构建（GitHub 项目 Pages 的子路径）：

```bash
npm run build
npm run preview
```

`vite.config.ts` 的 `base` 固定为 `/pokesleep-box/`（可用环境变量 `VITE_BASE` 覆盖）。图片和字体在源码里是 `/images`、`/fonts`，构建时会改写成带这个前缀的地址，否则 Service Worker 的作用域盖不到站点根上的资源。精灵图不进预缓存（体积大约 49MB），第一次看到时用运行时 CacheFirst。

## 数据存在哪

Pinia 的持久化插件先写入 `localStorage`。每次 store 变更会镜像到 IndexedDB 数据库 `neroli-pocket`、对象仓库 `kv`、键 `pinia-snapshot`。启动时如果本地还没有 `team`，会从 IndexedDB 填回 `localStorage`，再创建 Pinia。

设置 → 站点里的备份是 schema 2 的 JSON（`app: neroli-pocket`），导入后整页刷新。

文本导入也在这一页，和计算器里的口袋入口都能打开。只粘贴文字，不上传截图，也不做云端识别。固定格式（中英文标签都可以）例如：

```
物种: 皮卡丘
等级: 30
性格: 固执
食材: 苹果/苹果/大豆
副技能: 树果数量S@10, 帮忙速度M@25
技能等级: 2
```

快捷指令「提取文本」或实况文本打乱顺序时，能对上的字段会先填上，确认页再改。图标副技能、异色、性别、缎带经常是空的。食材如果不是这只宝可梦该等级栏里的，会标出来并改回该栏第一份；份量用图鉴里的固定数量。存进去的宝可梦在本机口袋里，不登录也能看到。

iPhone：打开睡眠详情 → 截图 → 快捷指令提取文本 / 实况文本 → 复制 → 设置 → 站点 → 文本导入。

## 结构

```
src/                         Lab frontend（已改本地模式）
src/local/                   本机计算器、食谱等级、IndexedDB 备份
src/router/server-axios.ts   拦截 /api，计算器走本机模拟
third_party/nerolis-lab/
  common/                    sleepapi-common
  engine/                    Lab 模拟引擎（不含数据库、路由、控制器）
public/                      Lab 精灵、字体、PWA 图标
```

技术栈：Vue 3 + Vite + TypeScript + Pinia + Vuetify + vite-plugin-pwa。

## GitHub Pages

推到 `main` 后，`.github/workflows/deploy.yml` 会 `npm ci`、`npm test`、以 `VITE_BASE=/pokesleep-box/` 构建，并把 `dist/` 部署到 GitHub Pages。

仓库 **Settings → Pages** 的 Source 保持 **GitHub Actions**。

## 在 iPhone 上安装

1. 用 **Safari** 打开 <https://syz007110.github.io/pokesleep-box/>
2. 点底部分享按钮
3. 选 **添加到主屏幕**
4. 从主屏幕图标打开

第一次打开需要联网拉壳和图片。之后 Service Worker 会缓存已访问的页面和看过的精灵。Safari 清网站数据会丢掉存档，请用 **设置 → 站点 → 本机备份** 导出 JSON。

## 许可

- 本仓库自己的胶水代码：MIT（见 `LICENSE`）
- Neroli's Lab 前端、`common/` 与模拟引擎：Apache-2.0（见 `third_party/nerolis-lab/`）
- Chakra Petch：SIL Open Font License 1.1（字体文件在 `public/fonts/`，随 Lab 前端 public 目录一起带来）
