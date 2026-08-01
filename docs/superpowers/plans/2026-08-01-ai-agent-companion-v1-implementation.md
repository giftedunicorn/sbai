# AI Agent Companion V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Phaser stress sandbox into a local-first Electron companion that observes active Claude Code transcripts, reacts only to explicit owner anger, and performs context-aware pixel-art roasting without modifying Agent sessions.

**Architecture:** Keep Phaser in a sandboxed renderer and move privileged work into focused Electron main-process services. Treat an actively growing Claude Code transcript as the canonical Agent identity; normalize appended JSONL records, detect owner anger, extract bounded factual evidence, compose an offline roast, and send a minimal catharsis event across a narrow preload bridge.

**Tech Stack:** Electron, TypeScript, Vite, Phaser 3, Node.js filesystem/process APIs, Vitest, jsdom, npm.

---

## File Structure

- `electron/main.ts`: app lifecycle, window creation, runtime startup, IPC handlers.
- `electron/preload.ts`: narrow renderer bridge.
- `electron/services/transcriptParser.ts`: defensive Claude JSONL normalization.
- `electron/services/sessionDiscovery.ts`: transcript discovery beneath an approved root.
- `electron/services/transcriptTailer.ts`: byte-offset incremental reads.
- `electron/services/sessionRegistry.ts`: active sessions and bounded recent records.
- `electron/services/rageDetector.ts`: deterministic owner-directed anger classification.
- `electron/services/contextExtractor.ts`: observed facts from recent tool records.
- `electron/services/roastEngine.ts`: offline evidence-aware roast selection.
- `electron/services/pluginHost.ts`: optional minimized provider interface and fallback.
- `electron/services/processWatcher.ts`: best-effort Claude process-presence hint.
- `electron/services/settingsStore.ts`: approved root and local UI preferences.
- `electron/services/companionRuntime.ts`: polling and event orchestration.
- `src/shared/companion.ts`: cross-process contracts and IPC channel names.
- `src/types/electron.d.ts`: preload bridge typing.
- `src/ui/sessionList.ts`: safe Agent-card DOM rendering.
- `src/scenes/CompanionScene.ts`: catharsis animation scene.
- `src/scenes/renderCompanion.ts`: original pixel companion drawing helper.
- `src/main.ts`: renderer bootstrap and subscriptions.
- `src/style.css`: fixed retro pixel-window shell.
- `tests/electron/*.test.ts`: service unit/integration tests.
- `tests/ui/sessionList.test.ts`: renderer card behavior.
- `tests/fixtures/claude/*.jsonl`: synthetic transcript fixtures.

## Task 1: Electron Shell and Build Wiring

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tsconfig.electron.json`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `LICENSE`

- [ ] **Step 1: Prove the Electron build does not exist**

Run:

```bash
npm run build:electron
```

Expected: FAIL with `Missing script: "build:electron"`.

- [ ] **Step 2: Add Electron scripts and dependencies**

Add these fields to `package.json`, retaining existing Phaser/Vitest versions:

```json
{
  "main": "dist-electron/electron/main.js",
  "scripts": {
    "dev": "npm run build && electron .",
    "dev:web": "vite",
    "build:web": "vite build",
    "build:electron": "tsc -p tsconfig.electron.json",
    "build": "tsc -p tsconfig.json && npm run build:web && npm run build:electron",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "electron": "^43.2.0"
  }
}
```

Run `npm install`. Expected: PASS and lockfile updated.

- [ ] **Step 3: Add Node/Electron compilation**

Create `tsconfig.electron.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node", "electron"],
    "rootDir": ".",
    "outDir": "dist-electron",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["electron", "src/shared"]
}
```

Add `"exclude": ["dist", "dist-electron", "electron"]` to browser `tsconfig.json`.

- [ ] **Step 4: Create the minimal secure shell**

Create `electron/main.ts`:

```ts
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 420,
    height: 560,
    minWidth: 420,
    minHeight: 560,
    maxWidth: 420,
    maxHeight: 560,
    frame: false,
    resizable: false,
    backgroundColor: '#f4e7bd',
    webPreferences: {
      preload: path.join(moduleDir, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  void window.loadFile(path.join(moduleDir, '../../dist/index.html'));
  return window;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
```

Create `electron/preload.ts`:

```ts
import { contextBridge } from 'electron';
contextBridge.exposeInMainWorld('companion', { platform: process.platform });
```

- [ ] **Step 5: Add MIT license and verify**

Create `LICENSE` with the standard MIT text and `Copyright (c) 2026 GAN Agent contributors`.

Run:

```bash
npm test
npm run build
```

Expected: all existing tests PASS; both output directories exist.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.electron.json electron/main.ts electron/preload.ts LICENSE
git commit -m "chore: add secure electron shell"
```

## Task 2: Shared Contracts and Narrow Preload Bridge

**Files:**
- Create: `src/shared/companion.ts`
- Create: `src/types/electron.d.ts`
- Modify: `electron/preload.ts`
- Test: `tests/electron/contracts.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from 'vitest';
import { isCatharsisEvent } from '../../src/shared/companion';

describe('companion contracts', () => {
  it('rejects events without a target session', () => {
    expect(isCatharsisEvent({ intensity: 'angry', roast: 'x' })).toBe(false);
  });

  it('accepts a complete event', () => {
    expect(isCatharsisEvent({
      sessionId: 's1', trigger: 'owner-anger', intensity: 'angry',
      evidence: [], roast: '测试都炸了，你宣布什么完成？', animation: 'slap-combo',
    })).toBe(true);
  });
});
```

Run `npm test -- tests/electron/contracts.test.ts`.
Expected: FAIL because the module is missing.

- [ ] **Step 2: Define shared data and validation**

Create `src/shared/companion.ts`:

```ts
export type SessionStatus = 'active' | 'idle' | 'ended' | 'content-unavailable';
export type AngerIntensity = 'annoyed' | 'angry' | 'furious';
export type TriggerKind = 'owner-anger' | 'manual';
export type AttackAnimation = 'poke' | 'slap-combo' | 'token-explosion';

export interface Evidence {
  kind: 'tool-failure' | 'test-failure' | 'file-edit';
  value: string;
  confidence: 'observed';
}
export interface SessionSummary {
  id: string; label: string; projectLabel: string;
  status: SessionStatus; lastActivityAt: number;
}
export interface CompanionSnapshot {
  paused: boolean; claudeProcessPresent: boolean; sessions: SessionSummary[];
}
export interface CatharsisEvent {
  sessionId: string; trigger: TriggerKind; intensity: AngerIntensity;
  evidence: Evidence[]; roast: string; copyText?: string; animation: AttackAnimation;
}
export const IPC = {
  snapshot: 'companion:snapshot', catharsis: 'companion:catharsis',
  manualRoast: 'companion:manual-roast', copyText: 'companion:copy-text',
  setPaused: 'companion:set-paused', setMuted: 'companion:set-muted',
  stopAnimation: 'companion:stop-animation',
  approveRoot: 'companion:approve-root',
} as const;

export function isCatharsisEvent(value: unknown): value is CatharsisEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<CatharsisEvent>;
  return typeof event.sessionId === 'string'
    && (event.trigger === 'owner-anger' || event.trigger === 'manual')
    && ['annoyed', 'angry', 'furious'].includes(event.intensity ?? '')
    && Array.isArray(event.evidence)
    && typeof event.roast === 'string'
    && ['poke', 'slap-combo', 'token-explosion'].includes(event.animation ?? '');
}
```

- [ ] **Step 3: Expose only named capabilities**

Replace `electron/preload.ts` with a bridge exposing exactly:

```ts
{
  platform,
  onSnapshot(listener), onCatharsis(listener), manualRoast(sessionId),
  copyText(text), setPaused(paused), setMuted(muted), stopAnimation(), approveRoot()
}
```

Subscriptions return unsubscribe functions. Validate catharsis payloads. Never
expose `ipcRenderer`, a filesystem path, or generic invoke.

Create matching `window.companion` declarations in `src/types/electron.d.ts`.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/electron/contracts.test.ts
npm run build
git add src/shared/companion.ts src/types/electron.d.ts electron/preload.ts tests/electron/contracts.test.ts
git commit -m "feat: define companion ipc contracts"
```

Expected: focused test and build PASS.

## Task 3: Defensive Claude Transcript Parser

**Files:**
- Create: `electron/services/transcriptParser.ts`
- Create: `tests/fixtures/claude/basic-session.jsonl`
- Test: `tests/electron/transcriptParser.test.ts`

- [ ] **Step 1: Add a synthetic fixture**

```jsonl
{"type":"user","sessionId":"s1","cwd":"/tmp/demo","timestamp":"2026-08-01T10:00:00Z","message":{"role":"user","content":"为什么又没跑测试？"}}
{"type":"assistant","sessionId":"s1","cwd":"/tmp/demo","timestamp":"2026-08-01T10:00:01Z","message":{"role":"assistant","content":[{"type":"tool_use","id":"t1","name":"Bash","input":{"command":"npm test"}}]}}
{"type":"user","sessionId":"s1","cwd":"/tmp/demo","timestamp":"2026-08-01T10:00:02Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t1","is_error":true,"content":"2 tests failed"}]}}
```

- [ ] **Step 2: Write failing parser tests**

Assert `owner-message`, `tool-use`, and `tool-result` normalization; malformed
and unknown records return `null`; a role-user `tool_result` is never owner text.

Expected owner record:

```ts
{
  kind: 'owner-message', sessionId: 's1', cwd: '/tmp/demo',
  timestamp: Date.parse('2026-08-01T10:00:00Z'), text: '为什么又没跑测试？',
}
```

Run `npm test -- tests/electron/transcriptParser.test.ts`.
Expected: FAIL.

- [ ] **Step 3: Implement defensive normalization**

Export:

```ts
export type NormalizedTranscriptRecord =
  | { kind: 'owner-message'; sessionId: string; cwd: string; timestamp: number; text: string }
  | { kind: 'assistant-message'; sessionId: string; cwd: string; timestamp: number; text: string }
  | { kind: 'tool-use'; sessionId: string; cwd: string; timestamp: number; toolUseId: string; toolName: string; input: Record<string, unknown> }
  | { kind: 'tool-result'; sessionId: string; cwd: string; timestamp: number; toolUseId: string; isError: boolean; text: string };

export function parseTranscriptLine(line: string): NormalizedTranscriptRecord | null;
```

Use `JSON.parse` inside `try/catch`; require session, cwd, and timestamp; inspect
content arrays for tool results before role classification; accept string and
text-block content; return `null` rather than throwing on unsupported schemas.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/electron/transcriptParser.test.ts
git add electron/services/transcriptParser.ts tests/electron/transcriptParser.test.ts tests/fixtures/claude/basic-session.jsonl
git commit -m "feat: parse claude transcript records"
```

## Task 4: Transcript Discovery and Incremental Tailing

**Files:**
- Create: `electron/services/sessionDiscovery.ts`
- Create: `electron/services/transcriptTailer.ts`
- Test: `tests/electron/sessionDiscovery.test.ts`
- Test: `tests/electron/transcriptTailer.test.ts`

- [ ] **Step 1: Write failing discovery and tailer tests**

Use temporary nested directories. Test that discovery returns only sorted
`.jsonl` files, stays under the approved root, and handles a missing root.

Tailer tests:

```ts
it('primes existing files at EOF without ingesting history');
it('reads only lines appended after priming');
it('buffers a partial line until a newline arrives');
it('resets safely after truncation');
it('never emits the same bytes twice');
```

Run both focused tests. Expected: FAIL.

- [ ] **Step 2: Implement recursive discovery**

`discoverTranscriptFiles(root)` uses `readdir({ withFileTypes: true })`, skips
symlink directories, catches `ENOENT`/`EACCES`, sorts absolute paths, and never
walks outside `root`.

- [ ] **Step 3: Implement byte-offset tailing**

```ts
export interface AppendedLine { path: string; line: string }
export class TranscriptTailer {
  async prime(paths: string[]): Promise<void>;
  async poll(paths: string[]): Promise<AppendedLine[]>;
  forget(path: string): void;
  clear(): void;
}
```

Store `{ offset, pending }` only in memory. Split on `\n`, retain incomplete
fragments, start initially primed files at EOF, and start later-discovered files
at byte zero.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/electron/sessionDiscovery.test.ts tests/electron/transcriptTailer.test.ts
git add electron/services/sessionDiscovery.ts electron/services/transcriptTailer.ts tests/electron/sessionDiscovery.test.ts tests/electron/transcriptTailer.test.ts
git commit -m "feat: discover and tail claude transcripts"
```

## Task 5: Session Registry and Bounded Context

**Files:**
- Create: `electron/services/sessionRegistry.ts`
- Test: `tests/electron/sessionRegistry.test.ts`

- [ ] **Step 1: Write failing registry tests**

Verify separate same-project sessions, label fallback, a maximum of 50 recent
records, idle status after 60 seconds, explicit ended status, and context removal
on end.

- [ ] **Step 2: Implement the registry**

```ts
export class SessionRegistry {
  constructor(private readonly now: () => number = Date.now) {}
  ingest(path: string, record: NormalizedTranscriptRecord): void;
  getRecent(sessionId: string): readonly NormalizedTranscriptRecord[];
  getSession(sessionId: string): SessionSummary | undefined;
  snapshot(paused: boolean, processPresent: boolean): CompanionSnapshot;
  markEndedByPath(path: string): void;
  clear(): void;
}
```

Treat session ID/transcript path as identity, derive `projectLabel` from cwd,
sort snapshots by activity, and never persist records.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/electron/sessionRegistry.test.ts
git add electron/services/sessionRegistry.ts tests/electron/sessionRegistry.test.ts
git commit -m "feat: track active agent sessions"
```

## Task 6: Owner-Only Rage Detection

**Files:**
- Create: `electron/services/rageDetector.ts`
- Test: `tests/electron/rageDetector.test.ts`

- [ ] **Step 1: Write failing table-driven tests**

```ts
const cases = [
  ['这里类型不对，请修改', null],
  ['代码示例里包含“傻逼”这个词', null],
  ['请翻译：why is this agent so stupid?', null],
  ['我同事怎么又把分支搞坏了', null],
  ['你怎么又没跑测试？', 'annoyed'],
  ['谁让你乱改二十个文件的？', 'angry'],
  ['你他妈又删我代码，真是个傻逼', 'furious'],
] as const;
```

Also verify only owner records enter automatic detection and manual triggers
bypass text classification. Run the focused test; expected: FAIL.

- [ ] **Step 2: Implement deterministic detection**

```ts
export interface RageDetection {
  intensity: AngerIntensity;
  score: number;
}
export function detectOwnerAnger(text: string): RageDetection | null;
```

Implementation order:

1. Remove fenced code and quoted lines.
2. Reject translation/quotation-analysis prompts.
3. Reject third-party markers unless the text directly addresses `你`,
   `Claude`, or `Agent`.
4. Score direct-address, frustration, profanity, repetition, and emphasis.
5. Return `null` below an explicit threshold and map bounded scores to the three
   intensities.

Keep the small lexicons exported and auditable.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/electron/rageDetector.test.ts
git add electron/services/rageDetector.ts tests/electron/rageDetector.test.ts
git commit -m "feat: detect owner-directed anger locally"
```

## Task 7: Evidence, Offline Roasts, and Provider Fallback

**Files:**
- Create: `electron/services/contextExtractor.ts`
- Create: `electron/services/roastEngine.ts`
- Create: `electron/services/pluginHost.ts`
- Test: `tests/electron/contextExtractor.test.ts`
- Test: `tests/electron/roastEngine.test.ts`
- Test: `tests/electron/pluginHost.test.ts`

- [ ] **Step 1: Write failing evidence tests**

Verify that a failed test command becomes observed `test-failure`, a failed
non-test tool becomes `tool-failure`, `Edit`/`Write` with a file path becomes
`file-edit`, absence of a test command never becomes `0 tests run`, and results
are deduplicated and capped at five.

- [ ] **Step 2: Write failing roast/provider tests**

Verify evidence-aware templates mention only observed facts, empty evidence
makes no technical claim, repetition is avoided, providers receive only
`{ intensity, evidence }`, and timeout/rejection/blank output uses fallback.

Run all three tests. Expected: FAIL.

- [ ] **Step 3: Implement fact extraction**

```ts
export function extractEvidence(
  records: readonly NormalizedTranscriptRecord[],
): Evidence[];
```

Pair tool result/use records by ID. Recognize bounded test commands for npm,
pnpm, yarn, Vitest, pytest, Cargo, and Go. Emit only facts in parsed records.

- [ ] **Step 4: Implement the roast engine**

```ts
export class RoastEngine {
  create(input: { intensity: AngerIntensity; evidence: Evidence[] }): {
    roast: string;
    copyText: string;
    animation: AttackAnimation;
  };
}
```

Use curated Chinese pools keyed by evidence/intensity. Select `poke`,
`slap-combo`, or `token-explosion` from intensity. Avoid real-person targets.

- [ ] **Step 5: Implement the provider boundary**

```ts
export interface MouthpieceProvider {
  generate(input: { intensity: AngerIntensity; evidence: Evidence[] }): Promise<string>;
}
export async function createRoastWithFallback(
  provider: MouthpieceProvider | undefined,
  input: { intensity: AngerIntensity; evidence: Evidence[] },
  fallback: RoastEngine,
  timeoutMs = 1500,
): Promise<ReturnType<RoastEngine['create']>>;
```

Do not implement provider discovery, credentials, or network clients in V1.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- tests/electron/contextExtractor.test.ts tests/electron/roastEngine.test.ts tests/electron/pluginHost.test.ts
git add electron/services/contextExtractor.ts electron/services/roastEngine.ts electron/services/pluginHost.ts tests/electron/contextExtractor.test.ts tests/electron/roastEngine.test.ts tests/electron/pluginHost.test.ts
git commit -m "feat: generate evidence-aware roasts"
```

## Task 8: Privacy Settings and Process Hint

**Files:**
- Create: `electron/services/settingsStore.ts`
- Create: `electron/services/processWatcher.ts`
- Test: `tests/electron/settingsStore.test.ts`
- Test: `tests/electron/processWatcher.test.ts`

- [ ] **Step 1: Write failing settings tests**

Use a temporary user-data directory and assert only this shape persists:

```ts
{
  approvedClaudeRoot: '/approved/path',
  paused: false,
  muted: false,
}
```

Malformed settings return safe defaults. Transcript content, IDs, roasts,
anger scores, and evidence are never serialized.

- [ ] **Step 2: Write failing process tests**

Given synthetic `ps -axo pid=,command=` output, verify a Claude executable sets
presence true, unrelated processes do not, and raw command text is not retained.

- [ ] **Step 3: Implement local settings and process presence**

`SettingsStore` validates and atomically replaces one JSON file beneath
Electron user data. Export:

```ts
export function parseClaudeProcessPresence(output: string): boolean;
export async function hasClaudeProcess(): Promise<boolean>;
```

On macOS use `execFile('ps', ['-axo', 'pid=,command='])`; unsupported platforms
return false. Match an executable token, not an argument containing `claude`.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/electron/settingsStore.test.ts tests/electron/processWatcher.test.ts
git add electron/services/settingsStore.ts electron/services/processWatcher.ts tests/electron/settingsStore.test.ts tests/electron/processWatcher.test.ts
git commit -m "feat: add local privacy settings and process hint"
```

## Task 9: Runtime Orchestration and IPC

**Files:**
- Create: `electron/services/companionRuntime.ts`
- Modify: `electron/main.ts`
- Test: `tests/electron/companionRuntime.test.ts`

- [ ] **Step 1: Write the failing integration test**

With a temporary root and injected clock/event sink, verify:

1. `start()` primes existing transcripts at EOF.
2. Routine correction updates a session but emits no catharsis.
3. Failed test remains as recent evidence but emits nothing.
4. Angry owner text emits once for the same session.
5. Another session's evidence never leaks.
6. Pause suppresses automatic triggers while tailing continues.
7. `manualRoast(sessionId)` emits trigger `manual`.
8. A transcript removed from discovery is marked ended and its context is cleared.

- [ ] **Step 2: Implement injected orchestration**

```ts
export class CompanionRuntime {
  async start(root: string): Promise<void>;
  async tick(): Promise<void>;
  stop(): void;
  setPaused(paused: boolean): void;
  async manualRoast(sessionId: string): Promise<void>;
}
```

Inject all services and `onSnapshot`/`onCatharsis` callbacks. Production uses a
750 ms interval; tests call `tick()` directly. Serialize ticks to prevent overlap.

- [ ] **Step 3: Wire the main process**

In `electron/main.ts`:

- Load settings after ready.
- Do not observe until a root is approved.
- Approve roots through `dialog.showOpenDialog({ properties: ['openDirectory'] })`.
- Send snapshots/events with named IPC channels.
- Register only named handlers.
- Copy only on explicit renderer calls.
- Persist pause and mute preferences, but no session-derived data.
- Stop and clear runtime on shutdown.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/electron/companionRuntime.test.ts
npm run build
git add electron/main.ts electron/services/companionRuntime.ts tests/electron/companionRuntime.test.ts
git commit -m "feat: orchestrate local companion runtime"
```

## Task 10: Retro Pixel Window and Phaser Companion

**Files:**
- Modify: `index.html`
- Modify: `src/style.css`
- Modify: `src/main.ts`
- Create: `src/ui/sessionList.ts`
- Create: `src/scenes/CompanionScene.ts`
- Create: `src/scenes/renderCompanion.ts`
- Test: `tests/ui/sessionList.test.ts`

- [ ] **Step 1: Write failing session-list tests**

Verify one safe button per session, selected alert class, `textContent` use for
labels, callback with selected ID, and a path-free unavailable badge.

- [ ] **Step 2: Replace the single mount with semantic UI**

```html
<main id="app" class="retro-window">
  <header class="titlebar">
    <span class="titlebar__face" aria-hidden="true">ಠ‿ಠ</span>
    <span>AGENT WATCHER.EXE</span>
    <button id="close-button" class="pixel-button" aria-label="Close">×</button>
  </header>
  <section class="statusbar">
    <span id="connection-status">LOCAL ONLY</span>
    <button id="pause-button" class="text-button">PAUSE</button>
  </section>
  <nav id="session-list" class="session-list" aria-label="Active Agents"></nav>
  <section id="game" class="game-stage" aria-label="Agent catharsis stage"></section>
  <footer class="controls">
    <button id="roast-button" class="pixel-button">替我骂它</button>
    <button id="copy-button" class="pixel-button" disabled>复制</button>
    <button id="mute-button" class="text-button">MUTE</button>
  </footer>
</main>
```

- [ ] **Step 3: Implement safe cards and original pixel character**

`sessionList.ts` creates DOM nodes and assigns transcript values only through
`textContent`. `renderCompanion.ts` uses Phaser Graphics hard rectangles and the
mint/cream/tomato palette; no copied game assets.

- [ ] **Step 4: Implement `CompanionScene`**

Reuse existing hit physics. Listen for:

```ts
export const CATHARSIS_EVENT = 'companion:catharsis';
export const STOP_EVENT = 'companion:stop';
```

Display roast and first evidence, map animation to force/shake/particles, allow
pointer hits to extend combo, and clear velocity/captions/timers on stop.

- [ ] **Step 5: Wire renderer behavior**

Update `src/main.ts` to mount inside `#game`, subscribe to bridge events, render
cards, retain selected ID, route manual roast/copy/pause/mute/stop, close the
window only from the explicit close button, provide an
unprivileged demo mode for `dev:web`, and pause Phaser when hidden.

- [ ] **Step 6: Apply approved retro-window styling**

```css
:root {
  --ink: #263f39;
  --mint: #77a99c;
  --cream: #f4e7bd;
  --tomato: #e76f51;
  --field: #8dbab0;
  image-rendering: pixelated;
}
.titlebar {
  -webkit-app-region: drag;
  background: var(--mint);
  border-bottom: 4px solid var(--ink);
}
button { -webkit-app-region: no-drag; }
```

Complete a 420×560 shell with hard pixel shadows, focus states, compact cards,
scanlines, and reduced motion. Do not add cabinet hardware, coin slots, wood
enclosures, or copyrighted assets.

- [ ] **Step 7: Verify and commit**

```bash
npm test -- tests/ui/sessionList.test.ts
npm run build
git add index.html src/style.css src/main.ts src/ui/sessionList.ts src/scenes/CompanionScene.ts src/scenes/renderCompanion.ts tests/ui/sessionList.test.ts
git commit -m "feat: add retro agent companion window"
```

## Task 11: Read-Only End-to-End Verification and Documentation

**Files:**
- Create: `tests/electron/readOnlyFlow.test.ts`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Write the read-only integration test**

Run a full automatic/manual trigger sequence against a temporary transcript and
assert:

```ts
expect(await readFile(transcriptPath)).toEqual(originalBytes);
expect(networkCalls).toBe(0);
expect(catharsisEvents).toHaveLength(2);
```

Also verify `stop()` clears context and settings contain no transcript content.

- [ ] **Step 2: Update project hygiene**

Add only generated directories:

```gitignore
dist-electron/
graphify-out/
```

Do not remove or commit the user's two untracked PDFs.

- [ ] **Step 3: Document operation and privacy**

Update `README.md` with development commands, independent/no-Hook discovery,
folder approval, read-only and zero-network guarantees, disabled-persistence
limitation, Claude-only V1 scope, and deferred Steam/other adapters. Do not add a
screenshot placeholder before a real screenshot exists.

- [ ] **Step 4: Run final verification**

```bash
npm test
npm run build
git diff --check
git status --short
```

Expected: all tests and builds PASS; no whitespace errors; only intended files
are modified; user PDFs remain untracked and untouched.

- [ ] **Step 5: Commit and review branch**

```bash
git add .gitignore README.md tests/electron/readOnlyFlow.test.ts
git commit -m "docs: document local companion privacy model"
git log --oneline --decorate -12
git diff master...HEAD --stat
```

Expected: focused Task 1–11 commits and no unrelated user files in the diff.
