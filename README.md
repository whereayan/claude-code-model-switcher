# Claude Model Launcher

交互式 Claude Code 模型选择器，支持多供应商配置。

## 安装

```bash
npm link
```

或者发布到 npm 后：

```bash
npm install -g claude-code-model-switcher
```

## 使用

```bash
ccms
```

## 操作说明

- ↑/↓ 方向键：选择模型
- Enter：确认选择，启动 Claude Code
- Esc：退出

## 配置

配置文件位置：`~/.claude-model-launcher/config.json`

- Windows: `C:\Users\你的用户名\.claude-model-launcher\config.json`
- macOS/Linux: `~/.claude-model-launcher/config.json`

首次运行会自动创建默认配置文件。

### 配置示例

```json
{
  "defaultSupplierId": "aliyuncs",
  "suppliers": [
    {
      "id": "aliyuncs",
      "label": "aliyuncs",
      "baseUrl": "https://dashscope.aliyuncs.com/apps/anthropic",
      "authType": "ANTHROPIC_API_KEY",
      "apiKey": "your-api-key-here",
      "models": [
        "qwen3.5-plus",
        "glm-5",
        "kimi-k2.5",
        "qwen3-max"
      ]
    },
    {
      "id": "custom-provider",
      "label": "Custom Provider",
      "baseUrl": "https://api.custom-provider.com/v1",
      "authType": "ANTHROPIC_AUTH_TOKEN",
      "apiKey": "your-auth-token-here",
      "models": [
        "model-1",
        "model-2"
      ]
    }
  ]
}
```

### 配置说明

| 字段 | 说明 |
|------|------|
| `defaultSupplierId` | 默认供应商 ID（可选） |
| `suppliers` | 供应商列表 |
| `suppliers[].id` | 供应商唯一标识 |
| `suppliers[].label` | 供应商显示名称 |
| `suppliers[].baseUrl` | API 基础地址 |
| `suppliers[].authType` | 认证类型：`ANTHROPIC_API_KEY` 或 `ANTHROPIC_AUTH_TOKEN`（默认 `ANTHROPIC_API_KEY`） |
| `suppliers[].apiKey` | API 密钥或 Token |
| `suppliers[].models` | 可用模型列表 |

### authType 说明

| 值 | 适用场景 |
|-----|---------|
| `ANTHROPIC_API_KEY` | 直接使用 Anthropic API 或大多数第三方代理（默认） |
| `ANTHROPIC_AUTH_TOKEN` | 使用 OAuth Token 或特定平台认证 |

## License

MIT