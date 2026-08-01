# Contributing

Thanks for helping improve 嘴替.EXE. Small, focused changes are easiest to review.

## Before opening an issue

- Search existing issues first.
- Use the provided bug or feature form.
- Remove transcript text, file paths, commands, credentials, usernames, and other private data from screenshots and logs.
- Report security or privacy vulnerabilities privately through [GitHub Security Advisories](https://github.com/giftedunicorn/sbai/security/advisories/new).

## Development setup

Install [Node.js 24 LTS](https://nodejs.org/) and npm, then run:

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run build
npm audit --audit-level=high
```

## Pull requests

1. Create a branch from `main`.
2. Keep the change focused and explain the user-visible behavior.
3. Add or update tests for behavior changes.
4. Run the test suite and production build.
5. Update documentation when behavior, permissions, or privacy boundaries change.

Draft pull requests are welcome when you want early feedback.

## Non-negotiable safety boundaries

Contributions must preserve the local-first, companion-only model:

- Transcript access remains read-only and limited to a user-approved root.
- The app must not hook, inject into, control, pause, or interrupt an agent.
- The app must not automatically send messages or write to agent sessions.
- Transcript content, paths, commands, credentials, and raw errors must not be persisted or sent over the network.
- Renderer code must not receive source transcript paths or source session IDs.

Changes that expand permissions or data collection need an explicit threat-model update and clear user consent.

## Style

- Match the existing TypeScript style.
- Prefer focused modules with narrow interfaces.
- Avoid unrelated refactors in the same pull request.
- Use clear commit messages such as `fix: ...`, `feat: ...`, or `docs: ...`.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
