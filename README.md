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
cml
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
      "apiKey": "your-api-key-here",
      "models": [
        "qwen3.5-plus",
        "glm-5",
        "kimi-k2.5",
        "qwen3-max"
      ]
    },
    {
      "id": "openai",
      "label": "OpenAI",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "your-openai-api-key",
      "models": [
        "gpt-4",
        "gpt-4-turbo"
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
| `suppliers[].apiKey` | API 密钥 |
| `suppliers[].models` | 可用模型列表 |

## License

MIT