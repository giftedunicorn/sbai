# 嘴替.EXE (Mouthpiece.EXE)

[![CI](https://github.com/giftedunicorn/sbai/actions/workflows/ci.yml/badge.svg)](https://github.com/giftedunicorn/sbai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/giftedunicorn/sbai)](LICENSE)
[![Electron 43](https://img.shields.io/badge/Electron-43-47848f?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Local first](https://img.shields.io/badge/data-local--first-2f855a)](#security-and-privacy-boundaries)

**English** | [简体中文](README.zh-CN.md)

A standalone, read-only, local-first catharsis companion for AI coding agents.

It watches new lines appended to Claude Code transcripts. When you clearly lose patience or manually call out a session, the pixel enforcer takes the stage, roasts the agent using observed failure evidence, and delivers a pixel combo. It never interrupts the task, modifies the conversation, or sends anything back to the agent.

## What V1 can do

- Show multiple Claude Code sessions in a fixed 420×560 Electron window.
- Treat each growing JSONL transcript as the agent identity instead of guessing from process IDs.
- Read only complete lines appended after the app starts, without replaying chat history.
- React automatically only to new, unambiguous anger from the owner. Ordinary correction requests, quotations, translation requests, and insults aimed at third parties do not trigger it.
- Extract up to five observed facts from recent context, including test failures, tool failures, and file edits.
- Generate Chinese roasts and a copyable reply using offline templates.
- Support manual targeting, automatic-trigger pause, mute, and an immediate stop with Escape.
- Provide a permission-free web demo that does not require Electron capabilities.

## Security and privacy boundaries

The V1 core path has no account system, telemetry, or network requests.

- It installs no Claude Code hooks and injects into no process.
- Transcripts are always opened read-only. There is no code path for writing transcripts or sending messages.
- The approved root resolves to its real path. File opening rejects final symlinks and verifies device and inode identity; rotating a transcript immediately clears its old context.
- Process scanning produces only a `Claude present` boolean hint. It does not retain process IDs or raw command lines.
- Each session keeps at most 50 normalized records in memory.
- Session context is cleared when the session ends or the app stops.
- The only persisted settings are the approved directory, paused state, and muted state.
- Source session IDs, conversation text, evidence, anger scores, and roasts are never written to the settings file.
- A reply reaches the system clipboard only after an explicit click. It is never sent automatically.
- The renderer and IPC receive only runtime-generated `agent-N` target IDs, never source session IDs or transcript paths.
- The optional mouthpiece provider has a narrow interface. It receives only intensity and up to five redacted evidence categories, never commands, file paths, or raw errors. V1 ships with no provider, credential discovery, or network client.

The end-to-end test compares transcript bytes before and after runtime and checks for zero network calls and a minimal settings file.

## Development

Requires Node.js 24 LTS and npm.

```bash
npm install
npm run dev
```

`npm run dev` builds the web and Electron code before opening the desktop window. On first use, click `Directory` and approve the Claude Code transcript root you want to observe through the system directory picker. The watcher stays inactive until a root is approved.

Run the permission-free web demo only:

```bash
npm run dev:web
```

Run tests and build production assets:

```bash
npm test
npm run build
```

Build output is written to `dist/` and `dist-electron/`. Neither directory is committed.

## Usage

1. Select a target agent from the session bar.
2. Click `替我骂它` to strike manually, or wait until you clearly express anger toward that agent.
3. Click the target on stage to extend the current combo.
4. If a reply is generated, click `复制回话`. The app copies it but never sends it.
5. Press Escape to stop the current performance immediately.
6. `暂停` disables automatic triggers only. Transcript tailing continues and manual strikes remain available.

## V1 limitations

- Only the Claude Code transcript adapter is implemented. Codex, Cursor, and other agent adapters are future work.
- Automatic process-presence hints currently work only on macOS. They are informational and do not affect transcript observation.
- Sessions and context are intentionally ephemeral. Restarting the app forgets previously observed state.
- No networked generation model is integrated. Offline templates are always available.
- Steam packaging, achievements, store assets, and other distribution work are not implemented. The Electron architecture can serve as the foundation for a later Steam desktop build.
- The repository does not yet have real product screenshots, so the README does not use placeholders.

## Architecture

- **Electron main process:** directory approval, read-only discovery, incremental tailing, settings, process hints, and clipboard access.
- **Preload:** frozen named capabilities without exposing Node.js, the filesystem, or general-purpose IPC.
- **Renderer:** DOM session list, fixed retro window, and Phaser pixel stage.
- **Shared contracts:** runtime validation for snapshots, evidence, and catharsis events.

Detailed design:

- [AI Agent Companion V1 Design](docs/superpowers/specs/2026-08-01-ai-agent-companion-v1-design.md)
- [AI Agent Companion V1 Implementation Plan](docs/superpowers/plans/2026-08-01-ai-agent-companion-v1-implementation.md)

## Contributing

Focused, verifiable contributions are welcome. Read the [contribution guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before starting. Report security or privacy problems privately under the [security policy](SECURITY.md), and never publish real transcripts, paths, commands, or credentials.

## License

[MIT](LICENSE)
