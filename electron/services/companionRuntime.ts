import type {
  AgentSource,
  AgentProcessPresence,
  CatharsisEvent,
  CompanionSnapshot,
  TriggerKind,
} from '../../src/shared/companion.js';
import { extractEvidence } from './contextExtractor.js';
import { createRoastWithFallback, type MouthpieceProvider } from './pluginHost.js';
import { detectAutomaticAnger, manualAnger } from './rageDetector.js';
import { RoastEngine } from './roastEngine.js';
import { discoverTranscriptFiles } from './sessionDiscovery.js';
import { SessionRegistry } from './sessionRegistry.js';
import {
  CodexTranscriptParser,
  parseTranscriptLine,
} from './transcriptParser.js';
import { TranscriptTailer } from './transcriptTailer.js';

export type ApprovedTranscriptRoots = Partial<Record<AgentSource, string | null>>;

interface SourceState {
  source: AgentSource;
  root: string;
  tailer: TranscriptTailer;
  knownPaths: Set<string>;
  rootAvailable: boolean;
}

export interface CompanionRuntimeOptions {
  intervalMs?: number;
  now?: () => number;
  discover?: typeof discoverTranscriptFiles;
  processPresent?: () => Promise<boolean | AgentProcessPresence>;
  tailer?: TranscriptTailer;
  registry?: SessionRegistry;
  roastEngine?: RoastEngine;
  provider?: MouthpieceProvider;
  onSnapshot: (snapshot: CompanionSnapshot) => void;
  onCatharsis: (event: CatharsisEvent) => void;
}

export class CompanionRuntime {
  private readonly intervalMs: number;
  private readonly discover: typeof discoverTranscriptFiles;
  private readonly processPresent: () => Promise<boolean | AgentProcessPresence>;
  private readonly initialClaudeTailer?: TranscriptTailer;
  private readonly registry: SessionRegistry;
  private readonly roastEngine: RoastEngine;
  private readonly provider?: MouthpieceProvider;
  private readonly onSnapshot: (snapshot: CompanionSnapshot) => void;
  private readonly onCatharsis: (event: CatharsisEvent) => void;

  private readonly sources = new Map<AgentSource, SourceState>();
  private readonly codexParser = new CodexTranscriptParser();
  private paused = false;
  private muted = false;
  private lastProcessPresent: AgentProcessPresence = {
    claudeCode: false,
    codex: false,
  };
  private interval: ReturnType<typeof setInterval> | undefined;
  private activeTick: Promise<void> | null = null;
  private generation = 0;
  private readonly pendingCatharsis = new Set<AbortController>();

  constructor(options: CompanionRuntimeOptions) {
    this.intervalMs = options.intervalMs ?? 750;
    this.discover = options.discover ?? discoverTranscriptFiles;
    this.processPresent = options.processPresent ?? (async () => false);
    this.initialClaudeTailer = options.tailer;
    this.registry = options.registry ?? new SessionRegistry(options.now);
    this.roastEngine = options.roastEngine ?? new RoastEngine();
    this.provider = options.provider;
    this.onSnapshot = options.onSnapshot;
    this.onCatharsis = options.onCatharsis;
  }

  async start(rootOrRoots: string | ApprovedTranscriptRoots): Promise<void> {
    this.stop();
    const generation = this.generation;
    const roots: ApprovedTranscriptRoots =
      typeof rootOrRoots === 'string'
        ? { 'claude-code': rootOrRoots }
        : rootOrRoots;

    for (const source of ['claude-code', 'codex'] as const) {
      const root = roots[source];
      if (!root) continue;
      const state: SourceState = {
        source,
        root,
        tailer:
          source === 'claude-code' && this.initialClaudeTailer
            ? this.initialClaudeTailer
            : new TranscriptTailer(),
        knownPaths: new Set(),
        rootAvailable: false,
      };
      this.sources.set(source, state);
      await this.initializeSource(state, generation);
      if (generation !== this.generation) return;
    }

    this.lastProcessPresent = this.normalizeProcessPresence(await this.processPresent());
    if (generation !== this.generation) return;
    this.emitSnapshot();

    if (this.intervalMs > 0) {
      this.interval = setInterval(() => {
        void this.tick().catch(() => undefined);
      }, this.intervalMs);
    }
  }

  async tick(): Promise<void> {
    if (this.activeTick) return this.activeTick;
    const operation = this.tickOnce();
    this.activeTick = operation;
    try {
      await operation;
    } finally {
      if (this.activeTick === operation) this.activeTick = null;
    }
  }

  stop(): void {
    this.generation += 1;
    for (const controller of this.pendingCatharsis) controller.abort();
    this.pendingCatharsis.clear();
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    for (const state of this.sources.values()) state.tailer.clear();
    this.sources.clear();
    this.codexParser.clear();
    this.registry.clear();
    this.lastProcessPresent = { claudeCode: false, codex: false };
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.emitSnapshot();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.emitSnapshot();
  }

  async manualRoast(sessionId: string): Promise<void> {
    const session = this.registry.getSession(sessionId);
    if (!session || session.status === 'ended' || session.status === 'content-unavailable') {
      return;
    }
    await this.emitCatharsis(sessionId, 'manual', manualAnger().intensity);
  }

  private async tickOnce(): Promise<void> {
    if (this.sources.size === 0) return;
    const generation = this.generation;
    for (const state of this.sources.values()) {
      await this.tickSource(state, generation);
      if (generation !== this.generation) return;
    }

    this.lastProcessPresent = this.normalizeProcessPresence(await this.processPresent());
    if (generation !== this.generation) return;
    this.emitSnapshot();
  }

  private async initializeSource(state: SourceState, generation: number): Promise<void> {
    const rootAvailable = await state.tailer.setApprovedRoot(state.root);
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    state.rootAvailable = rootAvailable;
    const paths = rootAvailable ? await this.discover(state.root) : [];
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    await state.tailer.prime(paths);
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    state.knownPaths = new Set(paths);
  }

  private async tickSource(state: SourceState, generation: number): Promise<void> {
    const wasRootAvailable = state.rootAvailable;
    const rootAvailable = await state.tailer.setApprovedRoot(state.root);
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    state.rootAvailable = rootAvailable;
    const paths = rootAvailable ? await this.discover(state.root) : [];
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    const pathSet = new Set(paths);

    if (rootAvailable && !wasRootAvailable) {
      await state.tailer.prime(paths);
      if (generation !== this.generation || this.sources.get(state.source) !== state) return;
      state.knownPaths = pathSet;
      return;
    }

    for (const previousPath of state.knownPaths) {
      if (pathSet.has(previousPath)) continue;
      this.registry.markEndedByPath(previousPath, state.source);
      state.tailer.forget(previousPath);
      if (state.source === 'codex') this.codexParser.forget(previousPath);
    }

    const appended = await state.tailer.poll(paths);
    if (generation !== this.generation || this.sources.get(state.source) !== state) return;
    for (const resetPath of state.tailer.takeResetPaths()) {
      this.registry.markEndedByPath(resetPath, state.source);
      if (state.source === 'codex') this.codexParser.forget(resetPath);
    }
    state.knownPaths = pathSet;

    for (const item of appended) {
      const record =
        state.source === 'codex'
          ? this.codexParser.parse(item.path, item.line)
          : parseTranscriptLine(item.line);
      if (!record) continue;
      const targetId = this.registry.ingest(item.path, state.source, record);
      if (this.paused) continue;
      const detection = detectAutomaticAnger(record);
      if (detection) {
        await this.emitCatharsis(targetId, 'owner-anger', detection.intensity);
      }
    }
  }

  private async emitCatharsis(
    sessionId: string,
    trigger: TriggerKind,
    intensity: CatharsisEvent['intensity'],
  ): Promise<void> {
    const generation = this.generation;
    const controller = new AbortController();
    this.pendingCatharsis.add(controller);
    const evidence = extractEvidence(this.registry.getRecent(sessionId));
    let generated;
    try {
      generated = await createRoastWithFallback(
        this.provider,
        { intensity, evidence },
        this.roastEngine,
        1_500,
        controller.signal,
      );
    } finally {
      this.pendingCatharsis.delete(controller);
    }
    const session = this.registry.getSession(sessionId);
    if (
      controller.signal.aborted ||
      generation !== this.generation ||
      !session ||
      session.status === 'ended' ||
      session.status === 'content-unavailable'
    ) {
      return;
    }
    this.onCatharsis({ sessionId, trigger, intensity, evidence, ...generated });
  }

  private emitSnapshot(): void {
    this.onSnapshot(
      this.registry.snapshot(this.paused, this.lastProcessPresent, this.muted),
    );
  }

  private normalizeProcessPresence(
    presence: boolean | AgentProcessPresence,
  ): AgentProcessPresence {
    return typeof presence === 'boolean'
      ? { claudeCode: presence, codex: false }
      : presence;
  }
}
