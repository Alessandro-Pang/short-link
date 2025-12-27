# 短链接高级配置功能说明

本文档详细介绍短链接服务的高级配置功能，包括失效时间、启用/禁用、参数透传、Header 转发、访问限制和重定向方式等。

## 目录

- [功能概览](#功能概览)
- [失效时间配置](#失效时间配置)
- [启用/禁用链接](#启用禁用链接)
- [URL 参数透传](#url-参数透传)
- [Header 转发](#header-转发)
- [访问次数限制](#访问次数限制)
- [访问来源限制](#访问来源限制)
- [重定向方式](#重定向方式)
- [API 接口说明](#api-接口说明)
- [数据库迁移](#数据库迁移)

## 功能概览

| 功能 | 描述 | 默认值 |
|------|------|--------|
| 失效时间 | 设置链接的有效期 | 永久有效 |
| 启用/禁用 | 控制链接是否可访问 | 启用 |
| URL 参数透传 | 将访问链接的参数追加到目标 URL | 关闭 |
| Header 转发 | 转发指定的 HTTP 请求头 | 关闭 |
| 访问次数限制 | 限制链接的最大访问次数 | 不限制 |
| 访问来源限制 | 限制 IP、设备、地区、来源等 | 不限制 |
| 重定向方式 | 选择 HTTP 重定向状态码 | 302 |

## 失效时间配置

### 预设选项

系统提供以下预设的失效时间选项：

- 1 小时
- 6 小时
- 12 小时
- 1 天
- 3 天
- 7 天
- 14 天
- 30 天
- 90 天
- 180 天
- 365 天
- 永久

### 自定义时间

除了预设选项，用户还可以选择自定义的过期时间，精确到分钟。

### 使用示例

```javascript
// 创建时指定过期时间选项 ID
const options = {
  expiration_option_id: 6  // 7天
};

// 或者指定自定义过期时间
const options = {
  expiration_date: '2024-12-31T23:59:59Z'
};
```

## 启用/禁用链接

在 Dashboard 中可以随时切换链接的启用状态：

- **启用**：链接可正常访问
- **禁用**：访问链接时返回"链接已被禁用"错误

### API 切换状态

```http
PATCH /api/dashboard/links/:linkId/toggle
Content-Type: application/json

{
  "is_active": false
}
```

## URL 参数透传

启用此功能后，访问短链接时携带的 URL 参数会自动追加到目标链接。

### 示例

假设：
- 短链接：`https://short.link/u/abc123`
- 目标链接：`https://example.com/page`

访问 `https://short.link/u/abc123?utm_source=twitter&ref=123`

重定向到 `https://example.com/page?utm_source=twitter&ref=123`

### 参数合并规则

- 如果目标链接已有参数，新参数会追加
- 如果参数名冲突，目标链接的原有参数优先保留

## Header 转发

启用此功能后，可以将访问者的部分 HTTP 请求头转发到目标链接。

### 支持转发的常见 Header

- `User-Agent` - 用户代理
- `Accept-Language` - 语言偏好
- `Referer` - 来源页面
- `X-Forwarded-For` - 原始 IP
- `Cookie` - Cookies（需谨慎使用）

### 配置示例

```javascript
const options = {
  forward_headers: true,
  forward_header_list: ['User-Agent', 'Accept-Language']
};
```

> **注意**：由于 HTTP 重定向机制的限制，Header 转发需要服务端代理支持才能真正生效。标准的 301/302 重定向无法携带自定义请求头。

## 访问次数限制

设置链接的最大访问次数，达到限制后链接自动失效。

### 使用场景

- 限量活动链接
- 一次性验证链接
- 防止链接滥用

### 配置示例

```javascript
const options = {
  max_clicks: 1000  // 最多访问 1000 次
};
```

## 访问来源限制

### IP 限制

支持 IP 白名单和黑名单，兼容 CIDR 格式：

```javascript
const options = {
  access_restrictions: {
    ip_whitelist: ['192.168.1.0/24', '10.0.0.1'],  // 只允许这些 IP
    ip_blacklist: ['1.2.3.4', '5.6.7.0/24']       // 禁止这些 IP
  }
};
```

### 设备限制

限制允许访问的设备类型：

```javascript
const options = {
  access_restrictions: {
    allowed_devices: ['mobile', 'tablet']  // 只允许移动设备
  }
};
```

可选值：`mobile`、`tablet`、`desktop`

### 地区限制

根据访问者的地理位置限制访问：

```javascript
const options = {
  access_restrictions: {
    allowed_countries: ['CN', 'US', 'JP'],  // 只允许这些国家
    blocked_countries: ['RU']               // 禁止这些国家
  }
};
```

> **注意**：地区限制需要部署在支持地理位置检测的服务商（如 Cloudflare）才能生效。

### 来源限制

根据 HTTP Referer 限制访问来源：

```javascript
const options = {
  access_restrictions: {
    allowed_referrers: ['google.com', 'baidu.com'],  // 只允许从这些来源访问
    blocked_referrers: ['spam.com']                  // 禁止从这些来源访问
  }
};
```

## 重定向方式

### 可选的重定向状态码

| 状态码 | 名称 | 说明 |
|--------|------|------|
| 301 | 永久重定向 | 告诉搜索引擎此页面已永久移动，SEO 权重会传递 |
| 302 | 临时重定向 | 默认选项，临时重定向，SEO 权重不传递 |
| 307 | 临时重定向 | 保持请求方法不变的临时重定向 |
| 308 | 永久重定向 | 保持请求方法不变的永久重定向 |

### 选择建议

- **营销活动链接**：使用 302，方便后续更改目标
- **永久替换旧链接**：使用 301，传递 SEO 权重
- **API 重定向**：使用 307/308，保持 POST 等请求方法

## API 接口说明

### 创建短链接（带配置）

```http
POST /api/addUrl
Content-Type: application/json

{
  "url": "https://example.com/long-url",
  "options": {
    "title": "示例链接",
    "description": "这是一个示例链接",
    "redirect_type": 302,
    "expiration_option_id": 6,
    "max_clicks": 1000,
    "pass_query_params": true,
    "forward_headers": false,
    "access_restrictions": {
      "allowed_devices": ["mobile", "desktop"],
      "ip_whitelist": ["192.168.1.0/24"]
    }
  }
}
```

### 更新链接配置

```http
PUT /api/dashboard/links/:linkId
Content-Type: application/json

{
  "is_active": true,
  "redirect_type": 301,
  "max_clicks": 2000,
  "pass_query_params": true,
  "access_restrictions": {
    "allowed_countries": ["CN"]
  }
}
```

### 获取过期时间选项

```http
GET /api/expiration-options
```

响应示例：

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    { "id": 1, "name": "1小时", "hours": 1, "days": null, "is_permanent": false },
    { "id": 4, "name": "1天", "hours": null, "days": 1, "is_permanent": false },
    { "id": 12, "name": "永久", "hours": null, "days": null, "is_permanent": true }
  ]
}
```

## 数据库迁移

如果是从旧版本升级，需要运行数据库迁移脚本：

```sql
-- 运行迁移脚本
\i config/migration-v2.sql
```

迁移脚本会添加以下字段：

- `redirect_type` - 重定向类型
- `pass_query_params` - URL 参数透传开关
- `forward_headers` - Header 转发开关
- `forward_header_list` - 需要转发的 Header 列表
- `access_restrictions` - 访问限制配置（JSON）
- `hours` - 过期时间选项的小时数字段

## 最佳实践

1. **合理使用访问限制**：过多的限制可能影响正常用户访问
2. **定期检查过期链接**：及时清理或续期重要链接
3. **选择合适的重定向方式**：根据业务场景选择正确的状态码
4. **谨慎使用 Header 转发**：可能涉及隐私问题
5. **监控访问日志**：及时发现异常访问模式

## 常见问题

### Q: 为什么 Header 转发不生效？

A: 标准的 HTTP 重定向（301/302/307/308）无法携带自定义请求头。如需真正的 Header 转发，需要使用服务端代理模式。

### Q: 地区限制不准确怎么办？

A: 地区检测依赖部署服务商的 IP 地理位置数据库。建议使用 Cloudflare 等提供精准地理位置的服务商。

### Q: 如何批量更新链接配置？

A: 目前需要逐个调用 API 更新。批量操作功能计划在后续版本中支持。