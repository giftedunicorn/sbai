# Open Source Repository Readiness Design

## Goal

Make `giftedunicorn/sbai` comfortable to maintain as a small public project without adding heavyweight community or release processes.

## Maintenance model

The repository uses a lean solo-maintainer model:

- GitHub Issues is the public feedback channel.
- Discussions, Projects, and Wiki stay disabled until they have a concrete use.
- Pull requests are welcome, but the maintainer remains the final decision maker.
- Automation should protect quality without producing weekly notification noise.

## Repository files

Add focused community health files:

- `CONTRIBUTING.md` explains setup, tests, pull-request scope, privacy boundaries, and the requirement that transcript access remain read-only.
- `SECURITY.md` provides a private reporting path through GitHub Security Advisories and defines support for the latest commit only while the project is pre-1.0.
- `CODE_OF_CONDUCT.md` uses Contributor Covenant 2.1 and points enforcement reports to GitHub private reporting rather than publishing a personal email address.
- `.github/ISSUE_TEMPLATE/bug_report.yml` gathers reproducible environment and privacy-safe diagnostics.
- `.github/ISSUE_TEMPLATE/feature_request.yml` gathers scoped feature proposals.
- `.github/ISSUE_TEMPLATE/config.yml` disables blank issues and links security reports to the advisory form.
- `.github/PULL_REQUEST_TEMPLATE.md` requires testing and privacy/read-only checks.
- `.github/CODEOWNERS` assigns the repository to `@giftedunicorn`.

## Automation

`.github/workflows/ci.yml` runs on pushes to `main` and pull requests. It uses Node.js 24 LTS, `npm ci`, the 72-test suite, the production build, and a high-severity dependency audit. Workflow permissions are read-only, concurrent superseded runs are cancelled, and dependency caching uses `package-lock.json`.

`.github/dependabot.yml` checks npm dependencies monthly with a limit of five open pull requests. GitHub Dependabot security updates remain enabled separately for urgent vulnerable dependencies.

No release, deployment, Steam, CodeQL, sponsorship, or publishing workflow is added in this phase.

## Project metadata and documentation

Keep `package.json` private to prevent accidental npm publication. Replace the old game description and add MIT license, repository, homepage, bugs, keywords, and a Node.js `>=24` engine declaration.

Add CI, license, platform, and local-first badges to the README. Add concise links to contributing and security instructions. Preserve the existing privacy and architecture documentation.

## GitHub repository settings

Configure the public repository with:

- Description: `A local-first pixel companion that watches AI coding agents read-only and helps you blow off steam.`
- Topics: `ai-agents`, `claude-code`, `developer-tools`, `electron`, `local-first`, `phaser`, `pixel-art`, `privacy`, `typescript`.
- Issues and forking enabled.
- Wiki, Projects, and Discussions disabled.
- Squash merge enabled; merge commits and rebase merge disabled.
- Head branches deleted automatically after merge.
- Vulnerability alerts and Dependabot security updates enabled.
- Secret scanning and push protection retained.

Protect `main` after CI exists. Require the `CI / test-and-build` status check, reject force pushes and deletion, and leave administrator enforcement disabled so the solo maintainer has an emergency bypass.

## Privacy and repository hygiene

Do not add local PDFs, `graphify-out/`, build output, environment files, credentials, transcripts, or editor state. Issue templates explicitly ask reporters to remove transcript text, paths, commands, credentials, and other private data before submission.

## Verification

Before publishing:

1. Parse all YAML files.
2. Run `npm test`, `npm run build`, and `npm audit --audit-level=high`.
3. Confirm no ignored/private local artifacts are staged.
4. Push the branch and merge it into `main`.
5. Verify repository metadata, features, merge settings, security settings, and branch protection through the GitHub API.
6. Confirm the public CI run succeeds.
