# SubsTracker - 订阅管理与提醒系统

基于 Cloudflare Workers 的轻量级订阅管理系统。跟踪各类订阅服务的到期时间，通过 Telegram、企业微信、Bark、邮件等多渠道发送及时提醒，并提供支出统计仪表盘、iCal 日历订阅与数据备份能力。

## ✨ 功能特色

### 📅 订阅管理
- 添加、编辑、删除各类订阅服务，支持启用/停用与过期状态自动识别
- 自定义提醒周期（按天 / 按小时），自动续订计算，支持批量续订多个周期
- 农历日期支持（1900-2100 年转换），可控制列表与通知中的农历显示

### 💰 财务追踪
- 记录每个订阅的费用，支持多币种
- 仪表盘展示月度/年度支出、环比趋势、最近 7 天支付记录、即将续费列表
- 按类型/分类的支出排行与占比统计
- 支付历史完整管理：编辑/删除记录，删除时自动回退订阅周期
- **多币种汇率可配置**：在系统配置中自定义各币种兑换 CNY 的汇率，统计换算更准确

### 📱 多渠道通知
- Telegram Bot、企业微信机器人、Bark（iOS 推送）
- NotifyX、Resend 邮件、自定义 Webhook（支持自定义请求方法、请求头与消息模板）
- 支持多渠道同时启用，可配置允许推送的小时段

### 🗓️ iCal 日历订阅（新增）
- 生成标准 iCal 日历地址，可添加到 Apple 日历、Google 日历等应用
- 公历订阅使用 `RRULE` 周期规则；农历订阅自动展开未来 24 个周期
- 使用第三方 API 令牌鉴权，无需暴露登录凭证

### 💾 数据备份与恢复（新增）
- 一键导出全部订阅数据为 JSON 备份文件（自动脱敏管理员密码等敏感信息）
- 支持合并（跳过重复）与替换（清空现有）两种导入模式
- **WebDAV 云备份**：配置坚果云、Alist、Nextcloud 等 WebDAV 网盘后，可一键备份到云端、查看远端备份列表并从任意备份文件恢复
- 不再担心 KV 数据意外丢失

### 🔐 安全特性（新增/增强）
- 管理员密码使用 **PBKDF2 哈希**存储，旧明文密码在下次登录时自动升级
- 登录令牌（JWT）带 24 小时过期时间，过期自动失效
- 登录失败限流：15 分钟内连续失败 5 次将临时锁定，防暴力破解
- 移除公开调试页面，避免泄露敏感信息

### ⚡ 存储架构升级
- 每条订阅使用独立 KV 键存储，告别单键 25MB 体积上限
- 订阅 ID 使用 `crypto.randomUUID()` 生成，避免并发创建时的 ID 冲突
- 写入粒度细化到单条订阅，降低并发覆盖风险
- 旧版本数据在首次访问时自动迁移，无需手动处理

## 🚀 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/wangwangit/SubsTracker)

> 适用于新部署；老用户建议先在系统配置页导出备份，再替换代码部署。

## 📋 三步开始使用

### 1️⃣ 部署
Fork 本仓库后点击部署按钮，**注意 KV 名称需绑定为 `SUBSCRIPTIONS_KV`**。

### 2️⃣ 首次登录
- 访问部署后的域名
- 默认用户名：`admin`，默认密码：`password`
- 首次成功登录后密码会自动升级为哈希存储，请尽快在系统配置中修改默认密码

### 3️⃣ 开始使用
1. 修改默认密码（系统配置 → 账号设置）
2. 配置通知渠道并点击测试通知
3. 添加订阅、设置提醒周期
4. 可选：配置汇率、导出备份、配置 WebDAV 云备份、复制 iCal 日历地址

## 🔧 通知渠道配置

| 渠道 | 所需配置 | 获取方式 |
| --- | --- | --- |
| Telegram | Bot Token、Chat ID | [@BotFather](https://t.me/BotFather) / [@userinfobot](https://t.me/userinfobot) |
| NotifyX | API Key | [NotifyX 官网](https://www.notifyx.cn/) |
| 企业微信机器人 | 群机器人 Webhook URL | [官方文档](https://developer.work.weixin.qq.com/document/path/91770) |
| Webhook | 推送 URL（可选自定义方法/请求头/模板） | 自建服务或第三方平台 |
| 邮件（Resend） | API Key、发件/收件邮箱 | [Resend 教程](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/) |
| Bark | 服务器地址、设备 Key | Bark App 内复制 |

**Webhook 模板占位符**：`{{title}}`、`{{content}}`、`{{tags}}`（多行）、`{{tagsLine}}`、`{{timestamp}}`、`{{formattedMessage}}`

## 🔔 通知时间与时区说明

- Cloudflare Workers 的 Cron 使用 **UTC 时区**，例如北京时间早上 8 点提醒应设置 Cron 为 `0 0 * * *`
- 若需要小时级提醒，可将 Cron 设置为 `0 * * * *`（每小时执行），并在系统配置中指定允许的通知小时
- 系统配置中的「系统时区」用于计算订阅剩余时间、格式化展示与统计，所有通知内容中的时间均已统一按该时区输出

## 🔐 第三方 API 与 iCal

- `POST /api/notify/{token}` 可触发系统通知，令牌在后台「第三方 API 访问令牌」中配置，也可通过 `Authorization: Bearer <token>` 或 `?token=<token>` 传入
- `GET /calendar?token=<token>` 返回 iCal 日历，用于日历应用订阅（配置页可一键复制地址）
- 未配置令牌时以上接口均不可用；令牌请定期更换

## 🖥️ 本地开发

```bash
npm install        # 无必需依赖，仅开发工具
npm test           # 运行单元测试（农历转换、提醒策略、密码哈希、iCal 等）
npm run dev        # 本地启动 Workers（需要 wrangler 登录）
npm run deploy     # 部署到 Cloudflare Workers
```

## 📂 项目结构

```
├── index.js            # Worker 入口：路由分发（/api、/admin、/calendar）、定时任务
├── src/
│   ├── api.js          # REST API：登录、配置、订阅 CRUD、导出/导入、WebDAV 备份、仪表盘统计
│   ├── admin.js        # 管理页面路由
│   ├── auth.js         # 密码哈希（PBKDF2）、JWT、配置读写、登录限流
│   ├── store.js        # 订阅存储层（独立 KV 键 + 旧数据自动迁移）
│   ├── notify.js       # 多渠道通知发送与定时检查逻辑
│   ├── reminder.js     # 提醒策略计算
│   ├── dashboard.js    # 仪表盘统计与汇率换算
│   ├── ics.js          # iCal 日历生成
│   ├── lunar.js        # 农历转换（1900-2100）
│   ├── timezone.js     # 时区工具函数
│   └── pages.js        # 内嵌前端页面（登录页/管理页/配置页/仪表盘）
└── tests/              # 单元测试
```

## 📦 从旧版本升级

1. 部署新版代码并绑定原有的 `SUBSCRIPTIONS_KV`
2. 首次访问时旧数据自动迁移为独立键存储，无需手动操作
3. 使用旧明文密码登录一次，密码即自动升级为哈希存储
4. 建议进入配置页导出一份备份

## 📜 许可证

MIT License
