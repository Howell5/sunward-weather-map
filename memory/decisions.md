---
name: decision-cloudflare-domain-preference
description: 用户确认的 Cloudflare 自定义域名优先级
type: decision
project: qingyu-weather-map
status: active
approved_by: user
date: 2026-08-08
---

# Cloudflare 域名优先级

用户明确确认：以后只要提到部署 Cloudflare（无论 Worker 还是 Pages），首选自定义域名区域都
是 `wellhong.dev`。具体项目先提出合适的子域名前缀，再检查该域名是否已在 Cloudflare zone 中、
DNS 是否可配置以及是否需要额外的 SSL/代理设置。

`workers.dev` 或 `pages.dev` 可以保留作临时预览、验证或自定义域名尚未完成时的回退地址，但不应
在已准备正式入口时继续作为默认对外地址。
