# Open Source Repository Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure `giftedunicorn/sbai` as a clean, low-maintenance public repository with contribution guidance, CI, dependency updates, accurate metadata, and guarded GitHub defaults.

**Architecture:** Keep policy and contributor-facing guidance in focused Markdown and GitHub community-health files. Use one least-privilege GitHub Actions workflow for verification, one monthly Dependabot configuration, and GitHub-native repository settings for merge, security, and branch protection.

**Tech Stack:** Markdown, GitHub issue forms, GitHub Actions YAML, Dependabot, npm, Node.js 24 LTS, GitHub CLI/API.

---

### Task 1: Community health files

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `.github/CODEOWNERS`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Add contribution and security policies**

Write `CONTRIBUTING.md` with setup commands, focused-change expectations, the required `npm test` and `npm run build` checks, privacy-safe issue guidance, and the read-only transcript boundary. Write `SECURITY.md` with latest-commit support and the private advisory URL:

```text
https://github.com/giftedunicorn/sbai/security/advisories/new
```

- [ ] **Step 2: Add conduct and ownership policies**

Use Contributor Covenant 2.1 in `CODE_OF_CONDUCT.md`. Route private enforcement reports through a security advisory whose title begins with `[Conduct]`. Add:

```text
* @giftedunicorn
```

to `.github/CODEOWNERS`.

- [ ] **Step 3: Add structured contribution templates**

Create privacy-aware bug and feature issue forms. Both forms must include the checkbox:

```text
I removed transcript text, file paths, commands, credentials, and other private data.
```

Disable blank issues and link security reports to the private advisory page. Add a pull request checklist for tests, build, focused scope, read-only behavior, privacy, and documentation.

- [ ] **Step 4: Validate and commit community files**

Run:

```bash
ruby -e 'require "yaml"; ARGV.each { |path| YAML.load_file(path); puts path }' .github/ISSUE_TEMPLATE/*.yml
git diff --check
```

Expected: all three YAML paths print and `git diff --check` is silent.

Commit:

```bash
git add CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github
git commit -m "docs: add open source community guidelines"
```

### Task 2: CI and dependency maintenance

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Add least-privilege CI**

Create a workflow named `CI` for pushes to `main` and pull requests. It must use:

```yaml
permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

The single Ubuntu job has display name `CI / test-and-build`, uses `actions/checkout@v4`, `actions/setup-node@v4` with Node 24 and npm cache, then runs `npm ci`, `npm test`, `npm run build`, and `npm audit --audit-level=high`.

- [ ] **Step 2: Add monthly Dependabot checks**

Configure npm updates for `/` on the first Monday of each month at 09:00 Asia/Shanghai time. Set `open-pull-requests-limit: 5`, group production and development dependencies separately, and label pull requests `dependencies`.

- [ ] **Step 3: Validate and commit automation**

Run:

```bash
ruby -e 'require "yaml"; ARGV.each { |path| YAML.load_file(path); puts path }' .github/workflows/ci.yml .github/dependabot.yml
git diff --check
```

Expected: both YAML paths print and the diff check is silent.

Commit:

```bash
git add .github/workflows/ci.yml .github/dependabot.yml
git commit -m "ci: add verification and dependency updates"
```

### Task 3: Public metadata and README

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`

- [ ] **Step 1: Correct package metadata**

Keep `"private": true`. Set the description to `A local-first pixel companion for blowing off steam at AI coding agents without interrupting their work.` Add:

```json
"license": "MIT",
"homepage": "https://github.com/giftedunicorn/sbai#readme",
"repository": {
  "type": "git",
  "url": "git+https://github.com/giftedunicorn/sbai.git"
},
"bugs": {
  "url": "https://github.com/giftedunicorn/sbai/issues"
},
"keywords": [
  "ai-agents",
  "claude-code",
  "electron",
  "local-first",
  "phaser",
  "pixel-art",
  "privacy"
],
"engines": {
  "node": ">=24"
}
```

Run `npm install --package-lock-only` so root package metadata in `package-lock.json` matches.

- [ ] **Step 2: Add public project signals to README**

Add CI, MIT, Electron 43, and local-first badges below the title. Add a short `参与贡献` section linking `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md` without changing the existing privacy and architecture sections.

- [ ] **Step 3: Validate and commit metadata**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
git diff --check
```

Expected: 72 tests pass, build succeeds, audit finds no high-severity vulnerability, and the diff check is silent.

Commit:

```bash
git add package.json package-lock.json README.md
git commit -m "docs: publish project metadata"
```

### Task 4: Publish and configure GitHub

**Files:**
- Verify: all tracked repository files
- Remote: `giftedunicorn/sbai`

- [ ] **Step 1: Run final local verification**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
git diff --check
git status --short
```

Expected: all checks pass and the worktree is clean.

- [ ] **Step 2: Push the feature branch and open a pull request**

Push `chore/open-source-readiness`, open a PR titled `chore: prepare repository for open source contributions`, and include the verification commands in its body.

- [ ] **Step 3: Verify CI and squash merge**

Watch the PR checks to completion, require success, then squash merge with head-branch deletion. Sync local `main` to `origin/main`.

- [ ] **Step 4: Apply lean repository settings**

Use `gh repo edit giftedunicorn/sbai` to set the approved description and topics, keep Issues enabled, disable Projects/Wiki/Discussions, enable only squash merging, and delete head branches automatically.

Enable vulnerability alerts and automated security fixes through:

```text
PUT /repos/giftedunicorn/sbai/vulnerability-alerts
PUT /repos/giftedunicorn/sbai/automated-security-fixes
```

- [ ] **Step 5: Protect main using the observed check name**

Read the successful merge commit check runs and confirm the CI check name. Configure classic branch protection with strict required status checks, administrator bypass, no force pushes, no deletion, and no user/team push restrictions.

- [ ] **Step 6: Verify remote state**

Read repository metadata, topics, feature toggles, merge settings, security settings, branch protection, and latest workflow status through `gh repo view`, `gh api`, and `gh run list`. Confirm the public README links and CI badge targets resolve.

- [ ] **Step 7: Clean up local branch and worktree**

Remove the clean `.worktrees/open-source-readiness` worktree and delete the local `chore/open-source-readiness` branch. Confirm the original untracked PDFs in the main worktree remain untouched.
