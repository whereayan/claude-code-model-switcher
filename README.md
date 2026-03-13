# Claude Code Model Switcher

交互式 Claude Code 模型选择器，支持多供应商配置。

## 安装

### 从 npm 安装（推荐）

```bash
npm install -g claude-code-model-switcher
```

### 从 GitHub 安装

```bash
git clone https://github.com/whereayan/claude-code-model-switcher.git
cd claude-code-model-switcher
npm link
```

### 本地开发

```bash
git clone https://github.com/whereayan/claude-code-model-switcher.git
cd claude-code-model-switcher
npm install
npm link
```

## 使用

### 交互模式

```bash
ccms                    # 选择一个模型，所有类型使用相同模型
ccms --multi            # 分别为 Default/Opus/Sonnet/Haiku 选择模型
```

### 命令行模式

```bash
ccms qwen3.5-plus                          # 直接指定模型（所有类型相同）
ccms --opus gpt-4                          # 只设置 Opus 模型
ccms --sonnet gpt-3.5-turbo                # 只设置 Sonnet 模型
ccms --haiku glm-5                         # 只设置 Haiku 模型
ccms --model qwen3-max                     # 只设置默认模型
ccms --opus gpt-4 --sonnet gpt-3.5-turbo   # 组合设置多个模型
```

### 其他命令

```bash
ccms --version         # 查看版本
ccms --help            # 查看帮助
```

## 操作说明

交互模式下：

- ↑/↓ 方向键：选择模型
- Enter：确认选择
- Esc：退出

## 环境变量

`ccms` 会设置以下环境变量：

| 环境变量 | 说明 |
|---------|------|
| `ANTHROPIC_MODEL` | 默认模型 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Opus 模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Sonnet 模型 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Haiku 模型 |
| `ANTHROPIC_BASE_URL` | API 基础地址 |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` | 认证密钥 |

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