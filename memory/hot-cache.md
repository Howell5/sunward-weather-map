# 晴域 - Project Memory (hot cache)
**Last Updated**: 2026-08-08 | **Project Status**: Active

## User-approved deployment preference

- **首选自定义域名区域**：`wellhong.dev`
- **适用范围**：用户要求部署 Cloudflare Worker 或 Pages 的项目。
- **默认行为**：先为项目设计简洁的子域名前缀，再将服务绑定到 `wellhong.dev` 下的自定义域名。
- **候选前缀示例**：本项目可优先考虑 `qingyu.wellhong.dev`；仅作建议，实际绑定前检查 DNS 与 Cloudflare zone。
- **回退地址**：`workers.dev` / `pages.dev` 只作为临时预览或自定义域名尚未配置时的回退，并向用户说明。
- **批准人**：用户（2026-08-08）

## Current project

- 产品：晴域（全国天气地图），公开仓库 `Howell5/qingyu-weather-map`。
- 当前临时线上地址：`qingyu-weather-map.haruhowell.workers.dev`。
- 下一次 Cloudflare 部署时，先讨论并验证 `wellhong.dev` 子域名前缀，再决定是否切换线上入口。

_Detailed decision: `memory/decisions.md` · Open loop: `memory/open-loops.md`_
