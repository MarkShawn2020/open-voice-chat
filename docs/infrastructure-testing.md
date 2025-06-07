# Infrastructure Testing Guide

## 基础设施组件测试

本文档介绍如何测试 Open Voice Chat 项目的基础设施组件。

## 1. 健康检查 API

### 基本健康检查

```bash
curl http://localhost:3001/api/health | python3 -m json.tool
```

### 响应说明

健康检查API返回以下信息：

- **status**: `healthy` | `unhealthy` | `degraded`
- **environment**: 当前运行环境
- **checks**: 各服务状态检查
  - `environment`: 环境变量验证
  - `rtc`: VolcEngine RTC 配置
  - `ai`: Doubao AI 配置
  - `database`: 数据库连接（可选）
  - `redis`: Redis连接（可选）
- **system**: 系统信息
  - `memory`: 内存使用情况
  - `platform`: 操作系统平台
  - `nodeVersion`: Node.js 版本

### 状态级别

- **healthy** (200): 所有关键服务正常
- **degraded** (207): 部分可选服务异常，但核心功能可用
- **unhealthy** (503): 关键服务异常，应用无法正常运行

## 2. 环境变量配置

### 开发环境

在开发环境中，以下环境变量为可选：

```bash
VOLCENGINE_APP_ID=your_app_id
VOLCENGINE_APP_KEY=your_app_key
DOUBAO_API_KEY=your_api_key
```

### 生产环境

在生产环境中，以上变量为必需。缺失将导致应用启动失败。

### 验证环境配置

应用启动时会自动验证环境变量：

```bash
# 查看启动日志
pnpm run dev
```

预期输出：
```
✅ Environment variables validated successfully
⚠️ Environment warnings: [
  "VOLCENGINE_APP_ID is not set (required for production)",
  "VOLCENGINE_APP_KEY is not set (required for production)",
  "DOUBAO_API_KEY is not set (required for production)"
]
```

## 3. 日志系统

### 日志级别

- `debug`: 详细调试信息
- `info`: 一般信息
- `warn`: 警告信息
- `error`: 错误信息

### 开发环境日志

开发环境使用易读的格式：
```
14:20:30 INFO  [API] Health check requested
14:20:30 INFO  [API] Health check completed {"status":"unhealthy","responseTime":"1ms"}
```

### 生产环境日志

生产环境使用JSON格式，便于日志聚合：
```json
{"timestamp":"2025-06-06T21:16:13.581Z","level":"info","message":"Health check requested","context":"API"}
```

## 4. 错误处理

### API错误格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format"
      }
    }
  },
  "timestamp": "2025-06-06T21:16:13.581Z",
  "path": "/api/users",
  "method": "POST"
}
```

### 错误代码

- `VALIDATION_ERROR`: 输入验证失败
- `AUTHENTICATION_ERROR`: 认证失败
- `AUTHORIZATION_ERROR`: 权限不足
- `NOT_FOUND`: 资源不存在
- `RATE_LIMIT_EXCEEDED`: 速率限制
- `INTERNAL_ERROR`: 内部服务器错误
- `SERVICE_UNAVAILABLE`: 服务不可用

## 5. 速率限制

### 默认限制

- **API**: 15分钟内100次请求
- **认证**: 15分钟内5次尝试
- **上传**: 1分钟内10次请求
- **WebSocket**: 1分钟内10次连接

### 测试速率限制

```bash
# 快速发送多个请求测试
for i in {1..10}; do
  curl -s http://localhost:3001/api/health -w "Status: %{http_code}\n" -o /dev/null
done
```

### 速率限制响应头

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 2025-06-06T21:31:13.581Z
```

## 6. 安全头部

API响应包含以下安全头部：

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## 7. 故障排除

### 常见问题

#### 1. 健康检查返回unhealthy
**原因**: 缺少环境变量配置
**解决**: 检查环境变量设置或在开发环境中忽略此警告

#### 2. API请求被拒绝
**原因**: 触发速率限制
**解决**: 等待重置时间或检查请求频率

#### 3. CORS错误
**原因**: 跨域请求被阻止
**解决**: 检查CORS配置或使用正确的Origin头

### 调试命令

```bash
# 测试健康检查API
curl -v http://localhost:3001/api/health

# 查看应用日志
pnpm run dev | grep -E "(INFO|WARN|ERROR)"
```

## 8. 监控建议

### 生产环境监控

1. **健康检查**: 定期调用 `/api/health` 端点
2. **错误率**: 监控4xx和5xx响应
3. **响应时间**: 监控API响应延迟
4. **内存使用**: 监控系统内存消耗
5. **速率限制**: 监控触发频率

### 告警阈值

- 健康检查失败: 立即告警
- 错误率 > 5%: 警告
- 响应时间 > 5秒: 警告
- 内存使用 > 90%: 警告
- 速率限制触发频繁: 信息
