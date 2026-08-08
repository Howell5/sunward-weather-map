# Sunward - Project Memory (hot cache)
**Last Updated**: 2026-08-08 | **Project Status**: Active

## User-approved deployment preference

- **首选自定义域名区域**：`wellhong.dev`
- **适用范围**：用户要求部署 Cloudflare Worker 或 Pages 的项目。
- **默认行为**：先为项目设计简洁的子域名前缀，再将服务绑定到 `wellhong.dev` 下的自定义域名。
- **当前项目入口**：`sunward.willhong.dev`；实际绑定前仍需检查 DNS 与 Cloudflare zone。
- **回退地址**：`workers.dev` / `pages.dev` 只作为临时预览或自定义域名尚未配置时的回退，并向用户说明。
- **批准人**：用户（2026-08-08）

## Current project

- 产品：Sunward（全国天气地图），公开仓库 `Howell5/sunward-weather-map`。
- 当前正式线上地址：`https://sunward.willhong.dev`；旧地址：`https://qingyu.willhong.dev`；回退地址：`sunward-weather-map.haruhowell.workers.dev`。
- 账号实际存在的 active zone 拼写为 `willhong.dev`；用户原先确认的 `wellhong.dev`（两个 e）
  尚未出现在当前 Cloudflare 账号中，后续如需严格使用需先添加该 zone 或调整 nameserver。

_Detailed decision: `memory/decisions.md` · Open loop: `memory/open-loops.md`_
