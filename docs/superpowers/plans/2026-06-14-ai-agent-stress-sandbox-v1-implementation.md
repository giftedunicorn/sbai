# AI Agent Stress Sandbox V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 instant-play web game: a street-arcade cartoon AI coding agent doll that users can immediately hit, with randomized apology captions, mistake labels, particles, and shareable visual moments.

**Architecture:** Use a Vite + TypeScript web app with Phaser as the canvas game engine. Keep deterministic, testable gameplay logic in plain TypeScript modules under `src/game/`, and keep Phaser rendering/input glue in `src/scenes/` and `src/main.ts`. The first implementation should favor a single polished stage over broad feature count.

**Tech Stack:** Vite, TypeScript, Phaser, Vitest, jsdom, npm scripts.

---

## File Structure

- `package.json`: project metadata, dependencies, and scripts.
- `package-lock.json`: npm lockfile created by `npm install`.
- `index.html`: Vite entry document with a single game mount.
- `tsconfig.json`: TypeScript compiler settings.
- `vite.config.ts`: Vite and Vitest configuration.
- `src/main.ts`: Phaser game bootstrap.
- `src/style.css`: full-screen page styling and non-canvas shell styles.
- `src/game/content.ts`: apology captions, mistake labels, impact words, and particles data.
- `src/game/random.ts`: seedable random helper.
- `src/game/eventGenerator.ts`: pure hit-event generator.
- `src/game/agentState.ts`: pure agent hit/combo/rage state updates.
- `src/game/types.ts`: shared type definitions.
- `src/scenes/StressSandboxScene.ts`: Phaser scene, input handling, doll drawing, hit effects.
- `src/scenes/renderAgent.ts`: helper functions for drawing the cartoon doll with Phaser graphics.
- `tests/content.test.ts`: content pool tests.
- `tests/eventGenerator.test.ts`: random event generation tests.
- `tests/agentState.test.ts`: hit/combo/rage state tests.

## Task 1: Project Scaffold and Test Runner

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.ts`
- Create: `src/style.css`

- [ ] **Step 1: Create the npm project metadata**

Create `package.json`:

```json
{
  "name": "ganagent",
  "version": "0.1.0",
  "private": true,
  "description": "A lightweight parody AI coding agent stress-relief web game.",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.2.4",
    "jsdom": "^26.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created, with no install errors.

- [ ] **Step 3: Add TypeScript and Vitest config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 4: Add the HTML entry point**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Agent Stress Sandbox</title>
  </head>
  <body>
    <main id="app" aria-label="AI Agent Stress Sandbox"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Add minimal style and bootstrap code**

Create `src/style.css`:

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #f8f4e8;
  background: #111318;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-width: 320px;
  height: 100%;
  min-height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  background: #111318;
}

canvas {
  display: block;
}
```

Create `src/main.ts`:

```ts
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node');
}

app.innerHTML = '<p style="padding: 24px">AI Agent Stress Sandbox</p>';
```

- [ ] **Step 6: Verify the scaffold builds**

Run:

```bash
npm run build
```

Expected: PASS. Vite produces `dist/`.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src/main.ts src/style.css
git commit -m "chore: scaffold web game project"
```

## Task 2: Content Pools

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/content.ts`
- Create: `tests/content.test.ts`

- [ ] **Step 1: Write failing content tests**

Create `tests/content.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  APOLOGY_CAPTIONS,
  IMPACT_WORDS,
  MISTAKE_LABELS,
  PARTICLE_KINDS,
} from '../src/game/content';

describe('content pools', () => {
  it('provides enough apology captions for repeat hits', () => {
    expect(APOLOGY_CAPTIONS.length).toBeGreaterThanOrEqual(8);
    expect(APOLOGY_CAPTIONS).toContain('你说得对，我刚才确实没有充分理解你的意图。');
  });

  it('provides short developer-specific mistake labels', () => {
    expect(MISTAKE_LABELS.length).toBeGreaterThanOrEqual(10);
    expect(MISTAKE_LABELS).toContain('0 tests run');
    expect(MISTAKE_LABELS).toContain('+2400 lines');
    expect(MISTAKE_LABELS.every((label) => label.length <= 28)).toBe(true);
  });

  it('provides arcade impact words and particle kinds', () => {
    expect(IMPACT_WORDS).toEqual(expect.arrayContaining(['BONK', 'SMASH']));
    expect(PARTICLE_KINDS).toEqual(expect.arrayContaining(['token', 'bug', 'diff']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/content.test.ts
```

Expected: FAIL because `src/game/content.ts` does not exist.

- [ ] **Step 3: Add shared types**

Create `src/game/types.ts`:

```ts
export type ParticleKind = 'token' | 'bug' | 'diff' | 'lint';

export type HitReaction = 'bounce' | 'squash' | 'spin' | 'slide' | 'wobble';

export type AgentExpression =
  | 'dazed'
  | 'spinner'
  | 'blank-confidence'
  | 'fake-smile'
  | 'panic';
```

- [ ] **Step 4: Add content pools**

Create `src/game/content.ts`:

```ts
import type { ParticleKind } from './types';

export const APOLOGY_CAPTIONS = [
  '你说得对，我刚才确实没有充分理解你的意图。',
  '抱歉，这里是我没有完整读取上下文导致的。',
  '我重新检查了一遍，这次会更严谨。',
  '确实，我刚才的修改范围有点超出预期。',
  '你提醒得很及时，我会避免再次出现类似问题。',
  '我已经修复了这个问题。',
  '这是我的疏忽，我应该先确认边界再动手。',
  '我理解你的愤怒，这次我会更仔细地处理。',
] as const;

export const MISTAKE_LABELS = [
  '0 tests run',
  'fake API',
  'ignored context',
  'same mistake again',
  '+2400 lines',
  'deleted user code',
  'broke imports',
  'scope creep',
  'package-lock changed',
  'sorry.md',
] as const;

export const IMPACT_WORDS = ['BONK', 'SMASH', 'NO TESTS', 'SLOP', 'WHY'] as const;

export const PARTICLE_KINDS: ParticleKind[] = ['token', 'bug', 'diff', 'lint'];
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm test -- tests/content.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit content pools**

Run:

```bash
git add src/game/types.ts src/game/content.ts tests/content.test.ts
git commit -m "feat: add stress sandbox content pools"
```

## Task 3: Seedable Random Helper

**Files:**
- Create: `src/game/random.ts`
- Create: `tests/random.test.ts`

- [ ] **Step 1: Write failing random tests**

Create `tests/random.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/game/random';

describe('createRandom', () => {
  it('returns deterministic choices for the same seed', () => {
    const a = createRandom(123);
    const b = createRandom(123);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('chooses an item from a non-empty list', () => {
    const random = createRandom(7);

    expect(['left', 'right', 'up']).toContain(random.pick(['left', 'right', 'up']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/random.test.ts
```

Expected: FAIL because `src/game/random.ts` does not exist.

- [ ] **Step 3: Implement the random helper**

Create `src/game/random.ts`:

```ts
export interface RandomSource {
  next(): number;
  integer(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRandom(seed = Date.now()): RandomSource {
  let state = seed >>> 0;

  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return {
    next,
    integer(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error('maxExclusive must be a positive integer');
      }

      return Math.floor(next() * maxExclusive);
    },
    pick<T>(items: readonly T[]) {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty list');
      }

      return items[this.integer(items.length)];
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/random.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit random helper**

Run:

```bash
git add src/game/random.ts tests/random.test.ts
git commit -m "feat: add seedable game random helper"
```

## Task 4: Hit Event Generator

**Files:**
- Modify: `src/game/types.ts`
- Create: `src/game/eventGenerator.ts`
- Create: `tests/eventGenerator.test.ts`

- [ ] **Step 1: Write failing event generator tests**

Create `tests/eventGenerator.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/game/random';
import { createHitEvent } from '../src/game/eventGenerator';
import {
  APOLOGY_CAPTIONS,
  IMPACT_WORDS,
  MISTAKE_LABELS,
  PARTICLE_KINDS,
} from '../src/game/content';

describe('createHitEvent', () => {
  it('creates a complete hit event from content pools', () => {
    const event = createHitEvent({ combo: 3, random: createRandom(42) });

    expect(APOLOGY_CAPTIONS).toContain(event.apology);
    expect(MISTAKE_LABELS).toContain(event.mistakeLabel);
    expect(IMPACT_WORDS).toContain(event.impactWord);
    expect(PARTICLE_KINDS).toContain(event.particleKind);
    expect(event.force.x).not.toBe(0);
    expect(event.force.y).toBeLessThan(0);
    expect(event.screenShake).toBeGreaterThan(0);
  });

  it('scales screen shake with combo without exceeding the cap', () => {
    const low = createHitEvent({ combo: 1, random: createRandom(1) });
    const high = createHitEvent({ combo: 20, random: createRandom(1) });

    expect(high.screenShake).toBeGreaterThan(low.screenShake);
    expect(high.screenShake).toBeLessThanOrEqual(22);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/eventGenerator.test.ts
```

Expected: FAIL because `src/game/eventGenerator.ts` does not exist.

- [ ] **Step 3: Extend shared types**

Modify `src/game/types.ts`:

```ts
export type ParticleKind = 'token' | 'bug' | 'diff' | 'lint';

export type HitReaction = 'bounce' | 'squash' | 'spin' | 'slide' | 'wobble';

export type AgentExpression =
  | 'dazed'
  | 'spinner'
  | 'blank-confidence'
  | 'fake-smile'
  | 'panic';

export interface Vector2 {
  x: number;
  y: number;
}

export interface HitEvent {
  reaction: HitReaction;
  expression: AgentExpression;
  apology: string;
  mistakeLabel: string;
  impactWord: string;
  particleKind: ParticleKind;
  force: Vector2;
  screenShake: number;
  rare: boolean;
}
```

- [ ] **Step 4: Implement event generator**

Create `src/game/eventGenerator.ts`:

```ts
import {
  APOLOGY_CAPTIONS,
  IMPACT_WORDS,
  MISTAKE_LABELS,
  PARTICLE_KINDS,
} from './content';
import type { AgentExpression, HitEvent, HitReaction } from './types';
import type { RandomSource } from './random';

const HIT_REACTIONS: HitReaction[] = ['bounce', 'squash', 'spin', 'slide', 'wobble'];
const EXPRESSIONS: AgentExpression[] = [
  'dazed',
  'spinner',
  'blank-confidence',
  'fake-smile',
  'panic',
];

interface CreateHitEventInput {
  combo: number;
  random: RandomSource;
}

export function createHitEvent({ combo, random }: CreateHitEventInput): HitEvent {
  const direction = random.next() < 0.5 ? -1 : 1;
  const comboBoost = Math.min(combo, 12);
  const horizontalForce = direction * (220 + comboBoost * 18 + random.integer(90));
  const verticalForce = -(260 + comboBoost * 12 + random.integer(80));

  return {
    reaction: random.pick(HIT_REACTIONS),
    expression: random.pick(EXPRESSIONS),
    apology: random.pick(APOLOGY_CAPTIONS),
    mistakeLabel: random.pick(MISTAKE_LABELS),
    impactWord: random.pick(IMPACT_WORDS),
    particleKind: random.pick(PARTICLE_KINDS),
    force: { x: horizontalForce, y: verticalForce },
    screenShake: Math.min(22, 6 + comboBoost),
    rare: random.next() > 0.92,
  };
}
```

- [ ] **Step 5: Run event generator tests**

Run:

```bash
npm test -- tests/eventGenerator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit event generator**

Run:

```bash
git add src/game/types.ts src/game/eventGenerator.ts tests/eventGenerator.test.ts
git commit -m "feat: generate randomized hit events"
```

## Task 5: Agent State

**Files:**
- Create: `src/game/agentState.ts`
- Create: `tests/agentState.test.ts`

- [ ] **Step 1: Write failing state tests**

Create `tests/agentState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialAgentState, registerHit } from '../src/game/agentState';

describe('agentState', () => {
  it('starts with zero hits and calm rage', () => {
    expect(createInitialAgentState()).toEqual({
      hitCount: 0,
      combo: 0,
      rage: 0,
    });
  });

  it('increments hit count, combo, and rage on hit', () => {
    const state = registerHit(createInitialAgentState());

    expect(state.hitCount).toBe(1);
    expect(state.combo).toBe(1);
    expect(state.rage).toBe(8);
  });

  it('caps rage at 100', () => {
    let state = createInitialAgentState();

    for (let i = 0; i < 20; i += 1) {
      state = registerHit(state);
    }

    expect(state.rage).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/agentState.test.ts
```

Expected: FAIL because `src/game/agentState.ts` does not exist.

- [ ] **Step 3: Implement agent state**

Create `src/game/agentState.ts`:

```ts
export interface AgentState {
  hitCount: number;
  combo: number;
  rage: number;
}

export function createInitialAgentState(): AgentState {
  return {
    hitCount: 0,
    combo: 0,
    rage: 0,
  };
}

export function registerHit(state: AgentState): AgentState {
  return {
    hitCount: state.hitCount + 1,
    combo: state.combo + 1,
    rage: Math.min(100, state.rage + 8),
  };
}
```

- [ ] **Step 4: Run state tests**

Run:

```bash
npm test -- tests/agentState.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit agent state**

Run:

```bash
git add src/game/agentState.ts tests/agentState.test.ts
git commit -m "feat: track agent hit state"
```

## Task 6: Phaser Stage and Doll Rendering

**Files:**
- Create: `src/scenes/renderAgent.ts`
- Create: `src/scenes/StressSandboxScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Replace temporary bootstrap with Phaser game**

Modify `src/main.ts`:

```ts
import Phaser from 'phaser';
import './style.css';
import { StressSandboxScene } from './scenes/StressSandboxScene';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node');
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: app,
  backgroundColor: '#15171d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 420 },
      debug: false,
    },
  },
  scene: [StressSandboxScene],
};

new Phaser.Game(config);
```

- [ ] **Step 2: Add the doll renderer helper**

Create `src/scenes/renderAgent.ts`:

```ts
import Phaser from 'phaser';
import type { AgentExpression } from '../game/types';

export interface AgentParts {
  root: Phaser.GameObjects.Container;
  faceText: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Graphics;
}

const FACE_BY_EXPRESSION: Record<AgentExpression, string> = {
  dazed: '@_@',
  spinner: '◌_◌',
  'blank-confidence': '0_0',
  'fake-smile': '^_^',
  panic: '!_!',
};

export function createAgentDoll(scene: Phaser.Scene, x: number, y: number): AgentParts {
  const root = scene.add.container(x, y);
  const body = scene.add.graphics();

  body.lineStyle(6, 0x08090d, 1);
  body.fillStyle(0x7c86ff, 1);
  body.fillRoundedRect(-58, -8, 116, 118, 28);
  body.strokeRoundedRect(-58, -8, 116, 118, 28);

  body.fillStyle(0x9aa4ff, 1);
  body.fillRoundedRect(-92, 0, 34, 92, 17);
  body.strokeRoundedRect(-92, 0, 34, 92, 17);
  body.fillRoundedRect(58, 0, 34, 92, 17);
  body.strokeRoundedRect(58, 0, 34, 92, 17);

  body.fillStyle(0x606cff, 1);
  body.fillRoundedRect(-44, 98, 36, 66, 18);
  body.strokeRoundedRect(-44, 98, 36, 66, 18);
  body.fillRoundedRect(8, 98, 36, 66, 18);
  body.strokeRoundedRect(8, 98, 36, 66, 18);

  body.fillStyle(0xf3f6ff, 1);
  body.fillRoundedRect(-55, -88, 110, 78, 22);
  body.strokeRoundedRect(-55, -88, 110, 78, 22);

  body.lineStyle(5, 0xe8edff, 1);
  body.strokeCircle(0, -122, 32);
  body.lineStyle(5, 0x7c86ff, 1);
  body.beginPath();
  body.arc(0, -122, 32, Phaser.Math.DegToRad(260), Phaser.Math.DegToRad(20));
  body.strokePath();

  const faceText = scene.add
    .text(0, -49, FACE_BY_EXPRESSION['blank-confidence'], {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '22px',
      color: '#08090d',
      fontStyle: '900',
    })
    .setOrigin(0.5);

  root.add([body, faceText]);
  root.setSize(190, 260);
  scene.physics.add.existing(root);

  const physicsBody = root.body as Phaser.Physics.Arcade.Body;
  physicsBody.setCollideWorldBounds(true, 0.8, 0.8);
  physicsBody.setSize(130, 220);
  physicsBody.setOffset(-65, -100);

  return { root, faceText, body };
}

export function setAgentExpression(parts: AgentParts, expression: AgentExpression): void {
  parts.faceText.setText(FACE_BY_EXPRESSION[expression]);
}
```

- [ ] **Step 3: Add the Phaser scene**

Create `src/scenes/StressSandboxScene.ts`:

```ts
import Phaser from 'phaser';
import { createInitialAgentState, registerHit } from '../game/agentState';
import { createHitEvent } from '../game/eventGenerator';
import { createRandom } from '../game/random';
import type { AgentState } from '../game/agentState';
import type { HitEvent } from '../game/types';
import { createAgentDoll, setAgentExpression, type AgentParts } from './renderAgent';

export class StressSandboxScene extends Phaser.Scene {
  private agent!: AgentParts;
  private state: AgentState = createInitialAgentState();
  private random = createRandom();
  private caption?: Phaser.GameObjects.Text;
  private rageText?: Phaser.GameObjects.Text;

  constructor() {
    super('stress-sandbox');
  }

  create(): void {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);

    this.addStage(width, height);
    this.agent = createAgentDoll(this, width / 2, height * 0.54);
    this.agent.root.setInteractive(
      new Phaser.Geom.Rectangle(-95, -130, 190, 260),
      Phaser.Geom.Rectangle.Contains,
    );

    this.agent.root.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.hitAgent(pointer.x, pointer.y);
    });

    this.rageText = this.add.text(24, 22, 'RAGE 0  COMBO 0', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '18px',
      color: '#f8f4e8',
      fontStyle: '900',
    });
  }

  private addStage(width: number, height: number): void {
    this.add.rectangle(width / 2, height / 2, width, height, 0x15171d);
    this.add.rectangle(width / 2, height - 44, width, 88, 0x222836);
    this.add.text(width / 2, height - 38, 'HIT THE AGENT', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '18px',
      color: '#8f98aa',
      fontStyle: '900',
    }).setOrigin(0.5);
  }

  private hitAgent(pointerX: number, pointerY: number): void {
    this.state = registerHit(this.state);
    const event = createHitEvent({ combo: this.state.combo, random: this.random });
    this.applyHitEvent(event, pointerX, pointerY);
  }

  private applyHitEvent(event: HitEvent, pointerX: number, pointerY: number): void {
    const body = this.agent.root.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(event.force.x, event.force.y);
    body.setAngularVelocity(event.force.x > 0 ? 220 : -220);

    setAgentExpression(this.agent, event.expression);
    this.cameras.main.shake(110, event.screenShake / 900);
    this.rageText?.setText(`RAGE ${this.state.rage}  COMBO ${this.state.combo}`);

    this.spawnImpact(pointerX, pointerY, event);
    this.spawnCaption(event.apology);
    this.spawnMistakeLabel(event.mistakeLabel);
    this.spawnParticles(event);

    this.tweens.add({
      targets: this.agent.root,
      scaleX: event.reaction === 'squash' ? 1.24 : 1.08,
      scaleY: event.reaction === 'squash' ? 0.78 : 0.92,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private spawnImpact(x: number, y: number, event: HitEvent): void {
    const text = this.add.text(x, y - 42, event.impactWord, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: event.rare ? '54px' : '42px',
      color: '#ffdf54',
      stroke: '#08090d',
      strokeThickness: 8,
    }).setOrigin(0.5).setAngle(Phaser.Math.Between(-14, 14));

    this.tweens.add({
      targets: text,
      y: y - 110,
      alpha: 0,
      scale: 1.22,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private spawnCaption(apology: string): void {
    this.caption?.destroy();
    const { width, height } = this.scale;
    this.caption = this.add.text(width - 32, height - 128, apology, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#08090d',
      backgroundColor: '#ffffff',
      padding: { x: 14, y: 10 },
      wordWrap: { width: 280 },
    }).setOrigin(1, 1);
  }

  private spawnMistakeLabel(label: string): void {
    const { width } = this.scale;
    const x = Phaser.Math.Between(90, Math.max(90, width - 90));
    const text = this.add.text(x, -30, label, {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '20px',
      color: '#08090d',
      backgroundColor: '#ff6b6b',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setAngle(Phaser.Math.Between(-10, 10));

    this.tweens.add({
      targets: text,
      y: Phaser.Math.Between(110, 230),
      duration: 420,
      ease: 'Bounce.easeOut',
    });

    this.time.delayedCall(1800, () => text.destroy());
  }

  private spawnParticles(event: HitEvent): void {
    const origin = this.agent.root;

    for (let i = 0; i < 14; i += 1) {
      const particle = this.add.circle(origin.x, origin.y - 24, 5, this.colorForParticle(event.particleKind));
      this.tweens.add({
        targets: particle,
        x: origin.x + Phaser.Math.Between(-180, 180),
        y: origin.y + Phaser.Math.Between(-170, 90),
        alpha: 0,
        duration: Phaser.Math.Between(520, 900),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private colorForParticle(kind: string): number {
    if (kind === 'token') return 0xffdf54;
    if (kind === 'bug') return 0xff6b6b;
    if (kind === 'diff') return 0x8fffd1;
    return 0xf8f4e8;
  }
}
```

- [ ] **Step 4: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit Phaser stage**

Run:

```bash
git add src/main.ts src/scenes/renderAgent.ts src/scenes/StressSandboxScene.ts
git commit -m "feat: render playable stress sandbox stage"
```

## Task 7: Browser Verification and Polish Pass

**Files:**
- Modify: `src/scenes/StressSandboxScene.ts`
- Modify: `src/style.css`
- Modify: `README.md`

- [ ] **Step 1: Start the development server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 2: Verify in browser**

Open the local URL in a browser and check:

- The page opens directly to the game, not a landing page.
- The doll is centered and visible on desktop.
- Clicking the doll causes immediate movement.
- Apology captions appear.
- Mistake labels appear.
- The screen shakes on hit.
- The page is visually readable in a short recording.

- [ ] **Step 3: Add README run instructions**

Modify `README.md`:

````md
# GAN Agent

A lightweight web game concept for AI coding users: a parody coding-agent stress-relief sandbox with dynamic hit reactions, apology captions, and shareable visual moments.

## V1

V1 is an instant-play arcade cartoon web game. Open the page, hit the AI coding agent doll, and watch randomized apology captions and coding-agent mistakes spill out.

## Development

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm test
```

## Product Direction

- [AI Coding Agent 解压小游戏方向 Summary](docs/2026-06-11-ai-coding-agent-stress-game-summary.md)
- [AI Agent Stress Sandbox V1 Design](docs/superpowers/specs/2026-06-14-ai-agent-stress-sandbox-v1-design.md)
````

- [ ] **Step 4: Run final checks**

Run:

```bash
npm run build
npm test
```

Expected: both PASS.

- [ ] **Step 5: Commit verification polish**

Run:

```bash
git add README.md src/scenes/StressSandboxScene.ts src/style.css
git commit -m "docs: add v1 development instructions"
```

## Self-Review

Spec coverage:

- Instant-play web game: Task 1 and Task 6.
- One central AI coding agent doll: Task 6.
- Arcade cartoon slapstick visual direction: Task 6.
- Random apology captions and mistake labels: Tasks 2 and 4.
- Screen shake and particles: Task 6.
- No login, no onboarding, no required input: Task 1 and Task 6.
- Shareable 30-second toy goal: Task 6 and Task 7.

Implementation deliberately leaves these as later product choices:

- Sound effects.
- Full drag/fling support.
- Rage report.
- Share button.
