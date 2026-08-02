# 嘴替.EXE

[![CI](https://github.com/giftedunicorn/sbai/actions/workflows/ci.yml/badge.svg)](https://github.com/giftedunicorn/sbai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/giftedunicorn/sbai)](LICENSE)
[![Electron 43](https://img.shields.io/badge/Electron-43-47848f?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Local first](https://img.shields.io/badge/data-local--first-2f855a)](#安全和隐私边界)

[English](README.md) | **简体中文**

一个独立、只读、本地优先的 AI coding agent 出气伴侣。

它观察 Claude Code 新追加的 transcript 内容。当主人明确生气，或手动点名某个 Agent 时，像素打手会进入舞台，依据真实失败记录替主人吐槽并表演一套像素连招。它不会打断任务，不会修改会话，也不会自动把任何话发回 Agent。

## V1 能做什么

- 在固定的 420×560 Electron 窗口里显示多个 Claude Code session。
- 把持续增长的 JSONL transcript 当作 Agent 身份，不拿 PID 猜会话归属。
- 只读取应用启动后新增的完整行，不翻旧聊天记录。
- 只对主人新增的明确愤怒自动响应。普通修改意见、引用、翻译请求和骂第三方不会触发。
- 从最近上下文中提取最多 5 条已观察事实，包括测试失败、工具失败和文件编辑。
- 使用离线中文模板生成吐槽和一段可复制回话。
- 支持手动点名、暂停自动触发、静音、Escape 立即收手。
- 提供不需要 Electron 权限的 Web 演示模式。

## 安全和隐私边界

V1 的核心路径没有账号、遥测或网络请求。

- 不安装 Claude Code Hook，也不注入进程。
- transcript 始终只读打开。应用没有写 transcript 或发送消息的代码路径。
- 批准根目录会解析为真实路径，文件打开会拒绝最终软链并核验设备号与 inode，轮转后旧上下文立即清空。
- 进程扫描只产生 `Claude 是否存在` 这一布尔提示，不保留 PID 或原始命令行。
- 每个 session 最多在内存中保留 50 条规范化记录。
- session 结束或应用停止时，相关内存上下文会被清除。
- 唯一持久化的设置是批准目录、暂停状态和静音状态。
- session ID、对话内容、证据、怒气分数和吐槽不会写入设置文件。
- 复制回话只会在主人明确点击后写入系统剪贴板，永远不会自动发送。
- renderer 和 IPC 只看到本次运行生成的 `agent-N` 目标 ID，不接收原始 session ID 或 transcript 路径。
- 可选嘴替 provider 只有一个窄接口，只接收强度和最多 5 条脱敏证据类别，不接收命令、文件路径或错误原文。V1 不包含 provider、凭据发现或联网客户端。

端到端测试会逐字节比较运行前后的 transcript，并检查零网络调用和最小设置文件。

## 开发

需要 Node.js 24 LTS 和 npm。

```bash
npm install
npm run dev
```

`npm run dev` 会先构建 Web 和 Electron 代码，再打开桌面窗口。首次使用时点击 `目录`，通过系统目录选择器批准你希望观察的 Claude Code transcript 根目录。没有批准目录时，后台不会开始观察。

只运行无权限 Web 演示：

```bash
npm run dev:web
```

测试和生产构建：

```bash
npm test
npm run build
```

构建产物分别位于 `dist/` 和 `dist-electron/`，都不会提交到仓库。

## 操作

1. 在顶部会话条选择目标 Agent。
2. 点击 `替我骂它` 手动出击，或等待主人对该 Agent 明确表达愤怒。
3. 点击舞台里的目标可以延长当前连招。
4. 如果生成了回话，点击 `复制回话`。应用只复制，不发送。
5. 按 Escape 可立即结束当前表演。
6. `暂停` 只关闭自动触发，后台仍继续读取新追加内容，手动出击仍可用。

## V1 限制

- 只实现 Claude Code transcript 适配器。Codex、Cursor 和其他 Agent 适配器留到后续版本。
- 自动进程在线提示目前只在 macOS 实现。它只是提示，不影响 transcript 观察。
- session 和上下文故意不持久化，应用重启后会忘记之前观察到的内容。
- 未集成任何联网生成模型。离线模板始终可用。
- Steam 打包、成就、商店资产和其他发行工作尚未实现。当前 Electron 架构可以作为后续 Steam 桌面构建的基础。
- 当前仓库没有真实产品截图，因此 README 不放占位图。

## 架构

- Electron main process: 目录批准、只读发现、增量 tail、设置、进程提示和剪贴板。
- Preload: 冻结的命名能力，不暴露 Node、文件系统或通用 IPC。
- Renderer: DOM 会话列表、固定复古窗口和 Phaser 像素舞台。
- Shared contracts: 快照、证据和出气事件的运行时验证。

详细设计：

- [AI Agent Companion V1 Design](docs/superpowers/specs/2026-08-01-ai-agent-companion-v1-design.md)
- [AI Agent Companion V1 Implementation Plan](docs/superpowers/plans/2026-08-01-ai-agent-companion-v1-implementation.md)

## 参与贡献

欢迎提交聚焦、可验证的小改动。开始前请阅读 [贡献指南](CONTRIBUTING.md) 和 [行为准则](CODE_OF_CONDUCT.md)。安全或隐私问题请按照 [安全策略](SECURITY.md) 私下报告，不要发布真实 transcript、路径、命令或凭据。

## License

[MIT](LICENSE)
