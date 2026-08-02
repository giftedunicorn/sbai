# Bilingual README Design

## Goal

Make English the default GitHub landing page while preserving a complete, first-class Simplified Chinese README.

## File structure

- `README.md` becomes the default English document.
- `README.zh-CN.md` contains the complete Simplified Chinese document.
- Both files begin with the same project title and badges, followed by a compact language switch: `English | 简体中文`.

GitHub and package metadata continue to point to `README.md`, so visitors and external tooling receive English by default.

## Localization approach

The English README is an internationalized rewrite, not a sentence-by-sentence translation. It keeps every material product claim and limitation while using natural English product and developer language.

Both languages retain the same information architecture:

1. Product summary
2. V1 capabilities
3. Security and privacy boundaries
4. Development
5. Usage
6. V1 limitations
7. Architecture
8. Contributing
9. License

The Chinese README preserves the current terminology and tone, with only the language switch and links changed as needed.

## Links and anchors

- The language switch uses relative repository links so it works on GitHub and local Markdown viewers.
- The local-first badge in each document targets that document's security section anchor.
- `SECURITY.md` links to the English `README.md#security-and-privacy-boundaries` anchor because English is the default documentation language.
- Contribution, security, conduct, license, design, and implementation-plan links remain relative and valid from both README files.

## Content constraints

- Do not add screenshots or placeholder artwork.
- Do not claim support for agents, operating systems, network providers, packaging, Steam, or releases that V1 does not implement.
- Preserve the read-only, local-first, no-hook, no-auto-send safety boundary exactly.
- Keep development commands identical in both languages.

## Verification

1. Check that both README files contain all nine required sections.
2. Parse relative Markdown links and confirm their target files exist.
3. Confirm language-switch links point to `README.md` and `README.zh-CN.md`.
4. Run `npm test`, `npm run build`, and `git diff --check`.
5. Open a pull request, require GitHub CI, and squash merge into `main`.
