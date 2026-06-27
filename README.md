<div align="center">
  <img src="public/Cover.png" alt="Cat Cafe Field Guide vintage cover" width="760" />

  <h1>Cat Cafe Field Guide</h1>
  <p><strong>猫咖打卡地图 · 猫咖档案 · 店内猫咪图鉴</strong></p>

  <p><strong>中文</strong> · <a href="README.en.md">English</a></p>

  <p>
    <img src="https://img.shields.io/badge/version-v0.1.0-8B4513" alt="version v0.1.0" />
    <img src="https://img.shields.io/badge/status-MVP-2F6F68" alt="status MVP" />
    <img src="https://img.shields.io/badge/build-static-C46B3C" alt="static build" />
    <img src="https://img.shields.io/badge/map-GIS%20%2B%20GPT-697A45" alt="GIS and GPT map" />
    <img src="https://img.shields.io/badge/license-MIT-555555" alt="MIT license" />
  </p>
</div>

Cat Cafe Field Guide 是一个把城市猫咖、店内猫咪与个人点评整理成复古纸质图鉴的静态打卡地图。

推荐先通过公开只读页面浏览地图与猫咖档案；需要维护内容时，再在本地开发环境打开 `/?admin=true`，编辑猫咖、猫咪、照片和地图 pin。

```text
地图 -> 猫咖 -> 猫咪
```

## 项目定位

它是一份可以持续维护的个人猫咖观察手册。

- Vite + React + TypeScript + Tailwind
- 静态发布，无数据库与登录
- 本地开发模式下提供管理面板
- 猫咖与猫咪数据保存在 JSON 文件
- 照片保存在 `public/photos/`
- 使用复古纸质城市图鉴的视觉语言

## 快速开始

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:5173/
```

本地编辑模式：

```text
http://localhost:5173/?admin=true
```

编辑结果写入：

```text
src/data/cafes.json
public/photos/*.jpg
```

提交这些内容后，线上静态页面就会展示更新后的图鉴。

## 使用方式

| 地址 | 用途 |
| --- | --- |
| `/` | 公开只读图鉴 |
| `/?demo=true` | 页面与卡片样式预览 |
| `/?backdrop=cream` | 切换背景，可选 `dark`、`desk`、`cream` |
| `/?admin=true` | 本地开发环境中的内容编辑模式 |

## 运行逻辑

```text
维护者（本地管理模式）              访客（线上静态页面）
────────────────────              ──────────────────
npm run dev                       只读浏览
打开 ?admin=true                  无登录、无数据库
编辑猫咖 / 猫咪 / 照片 / pin       展示仓库中已提交的内容
↓
写入 cafes.json 与 public/photos
↓
git commit + push
↓
Vercel 自动重新部署
```

## GIS + GPT 地图流程

地图在发布前离线制作，前端运行时不请求实时地图 API。

```text
地点名称列表
↓
npm run create:cafes
↓
map-creator 解析 POI / GIS 坐标
↓
npm run import:pois
↓
npm run generate:pins
↓
GPT Image 生成统一风格的地图海报
↓
public/map_north.png
public/map_south.png
public/Cover.png
↓
在 Admin 中手动校准 pin
```

当前地图效果：

![Cat Cafe GIS and GPT styled map](public/map_north.png)

核心命令：

```bash
npm run create:cafes -- --city "San Diego" --places "The Cat Cafe" "Whiskers & Wine Bar" "The Cat Lounge"
npm run import:pois -- --poi-json /path/to/map-creator-pois.json
npm run generate:pins -- --dry-run
npm run generate:pins
npm run build
```

地图提示词与检查规则见 [GPT Image 地图海报说明](docs/GPT_IMAGE_POSTER.md)，完整 POI 与 pin 流程见 [地图数据流程](docs/MAP_PIPELINE.md)。

## 项目结构

```text
src/
├── components/
│   ├── Book/            # 翻页图鉴容器
│   ├── CoverPage/       # 封面
│   ├── CardVariants/    # 猫咖卡片布局
│   ├── CatCard/         # 猫咪档案卡
│   ├── AdminPanel/      # 仅本地开发可用的编辑面板
│   └── Demo/            # ?demo=true 预览模式
├── data/
│   ├── cafes.json       # 猫咖与猫咪数据
│   ├── cafes.ts         # 数据加载
│   ├── storage.ts       # localStorage 与本地开发同步
│   ├── config.ts        # 站点配置
│   └── types.ts         # CatCafe / CatProfile 类型
└── styles/
    └── globals.css
```

## 静态发布

将仓库导入 [Vercel](https://vercel.com/new) 即可部署。项目不需要数据库、登录服务或环境变量。

## 项目边界

当前版本不包含：

- 数据库
- 登录
- 真实线上后端
- 多人评论
- 实时地图 API
- 复杂权限
- 线上内容编辑
- Admin 地图图片上传

地图图片固定存放在 `public/map_north.png` 与 `public/map_south.png`。

## 灵感来源

本项目受到 [field-guide-map](https://github.com/mengxuebi-mush/field-guide-map.git) 启发，延续了纸质 field guide 的翻页阅读方式、静态发布思路和克制的编辑体验。

在此基础上，我将内容主题和信息架构扩展为“地图 -> 猫咖 -> 猫咪”，并加入猫咖与猫咪分层点评、照片维护、POI 坐标、地理复查状态、GIS 数据导入、地图 pin 辅助生成与 GPT Image 海报制作流程。

## 文档

- [产品需求文档](docs/PRD.md)
- [分步技术规格](docs/SPEC.md)
- [map-creator POI 导入流程](docs/MAP_PIPELINE.md)
- [GPT Image 地图海报提示词](docs/GPT_IMAGE_POSTER.md)

## 技术栈

Vite · React · TypeScript · Tailwind · Vercel

## License

MIT，详见 [LICENSE](LICENSE)。
