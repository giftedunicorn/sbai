# Security Policy

## Supported versions

嘴替.EXE is pre-1.0. Security fixes target the latest commit on `main`; older commits and unofficial builds are not supported.

## Reporting a vulnerability

Do not open a public issue for a security or privacy vulnerability. Use [GitHub's private vulnerability reporting form](https://github.com/giftedunicorn/sbai/security/advisories/new).

Include:

- the affected commit or version;
- the security or privacy impact;
- minimal reproduction steps;
- whether transcript data, local paths, clipboard contents, or network access are involved;
- a suggested mitigation, if you have one.

Remove credentials, real transcripts, personal paths, and unrelated private data. A maintainer will acknowledge a complete report within seven days and coordinate disclosure after a fix is available.

## Security model

The intended trust boundary is documented in the [README](README.md#安全和隐私边界). In particular, transcript access must remain read-only, local-first, user-approved, and isolated from the renderer.
