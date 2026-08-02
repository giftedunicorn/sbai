# Bilingual README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make English the default README while preserving a complete Simplified Chinese README with reliable language navigation and links.

**Architecture:** Keep two standalone Markdown documents so each language reads naturally and renders directly on GitHub. Share the same section order, commands, product claims, badges, and relative project links; localize prose and anchors per document.

**Tech Stack:** GitHub-flavored Markdown, Node.js link validation, npm verification, GitHub Actions.

---

### Task 1: Create the bilingual documentation pair

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Modify: `SECURITY.md`

- [ ] **Step 1: Replace the default README with polished English content**

Keep the title and badges, add `English | 简体中文` navigation, and write natural English versions of all existing sections. Preserve every security claim, development command, limitation, architecture link, and contributor link.

- [ ] **Step 2: Create the complete Simplified Chinese README**

Move the current Chinese content into `README.zh-CN.md`, add `[English](README.md) | 简体中文` navigation, and keep its local-first badge linked to `#安全和隐私边界`.

- [ ] **Step 3: Update the security-policy anchor**

Change the trust-boundary link in `SECURITY.md` to:

```markdown
[README](README.md#security-and-privacy-boundaries)
```

- [ ] **Step 4: Commit the documentation pair**

Run `git diff --check`, then commit:

```bash
git add README.md README.zh-CN.md SECURITY.md
git commit -m "docs: add English and Chinese readmes"
```

### Task 2: Validate and publish

**Files:**
- Verify: `README.md`
- Verify: `README.zh-CN.md`
- Verify: `SECURITY.md`

- [ ] **Step 1: Validate language navigation, sections, and relative links**

Use a read-only Node.js script to assert that both language files exist, each contains the nine required section headings, each links to the other language, and every relative Markdown file link resolves to an existing path.

- [ ] **Step 2: Run project verification**

Run:

```bash
npm test
npm run build
npm audit --audit-level=high
git diff --check
git status --short
```

Expected: 72 tests pass, build succeeds, no high-severity vulnerability is found, the diff check is silent, and the worktree is clean.

- [ ] **Step 3: Publish through GitHub**

Push `docs/bilingual-readme`, open a pull request, require `CI / test-and-build`, squash merge it into `main`, and delete the remote branch.

- [ ] **Step 4: Verify and clean up**

Confirm the public default README is English, the Chinese switch resolves, local and remote `main` match, then remove the clean worktree and local feature branch.
