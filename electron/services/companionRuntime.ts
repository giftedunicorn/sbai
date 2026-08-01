import type {
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
import { parseTranscriptLine } from './transcriptParser.js';
import { TranscriptTailer } from './transcriptTailer.js';

export interface CompanionRuntimeOptions {
  intervalMs?: number;
  now?: () => number;
  discover?: typeof discoverTranscriptFiles;
  processPresent?: () => Promise<boolean>;
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
  private readonly processPresent: () => Promise<boolean>;
  private readonly tailer: TranscriptTailer;
  private readonly registry: SessionRegistry;
  private readonly roastEngine: RoastEngine;
  private readonly provider?: MouthpieceProvider;
  private readonly onSnapshot: (snapshot: CompanionSnapshot) => void;
  private readonly onCatharsis: (event: CatharsisEvent) => void;

  private root: string | null = null;
  private knownPaths = new Set<string>();
  private paused = false;
  private lastProcessPresent = false;
  private interval: ReturnType<typeof setInterval> | undefined;
  private activeTick: Promise<void> | null = null;
  private generation = 0;

  constructor(options: CompanionRuntimeOptions) {
    this.intervalMs = options.intervalMs ?? 750;
    this.discover = options.discover ?? discoverTranscriptFiles;
    this.processPresent = options.processPresent ?? (async () => false);
    this.tailer = options.tailer ?? new TranscriptTailer();
    this.registry = options.registry ?? new SessionRegistry(options.now);
    this.roastEngine = options.roastEngine ?? new RoastEngine();
    this.provider = options.provider;
    this.onSnapshot = options.onSnapshot;
    this.onCatharsis = options.onCatharsis;
  }

  async start(root: string): Promise<void> {
    this.stop();
    const generation = this.generation;
    this.root = root;
    const paths = await this.discover(root);
    if (generation !== this.generation || this.root !== root) return;

    await this.tailer.prime(paths);
    if (generation !== this.generation || this.root !== root) return;
    this.knownPaths = new Set(paths);
    this.lastProcessPresent = await this.processPresent();
    if (generation !== this.generation || this.root !== root) return;
    this.emitSnapshot();

    if (this.intervalMs > 0) {
      this.interval = setInterval(() => void this.tick(), this.intervalMs);
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
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    this.root = null;
    this.knownPaths.clear();
    this.tailer.clear();
    this.registry.clear();
    this.lastProcessPresent = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
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
    const root = this.root;
    if (!root) return;
    const generation = this.generation;
    const paths = await this.discover(root);
    if (generation !== this.generation || root !== this.root) return;

    const pathSet = new Set(paths);
    for (const previousPath of this.knownPaths) {
      if (pathSet.has(previousPath)) continue;
      this.registry.markEndedByPath(previousPath);
      this.tailer.forget(previousPath);
    }

    const appended = await this.tailer.poll(paths);
    if (generation !== this.generation || root !== this.root) return;
    this.knownPaths = pathSet;

    for (const item of appended) {
      const record = parseTranscriptLine(item.line);
      if (!record) continue;
      this.registry.ingest(item.path, record);
      if (this.paused) continue;
      const detection = detectAutomaticAnger(record);
      if (detection) {
        await this.emitCatharsis(record.sessionId, 'owner-anger', detection.intensity);
      }
    }

    this.lastProcessPresent = await this.processPresent();
    if (generation !== this.generation || root !== this.root) return;
    this.emitSnapshot();
  }

  private async emitCatharsis(
    sessionId: string,
    trigger: TriggerKind,
    intensity: CatharsisEvent['intensity'],
  ): Promise<void> {
    const evidence = extractEvidence(this.registry.getRecent(sessionId));
    const generated = await createRoastWithFallback(
      this.provider,
      { intensity, evidence },
      this.roastEngine,
    );
    this.onCatharsis({ sessionId, trigger, intensity, evidence, ...generated });
  }

  private emitSnapshot(): void {
    this.onSnapshot(this.registry.snapshot(this.paused, this.lastProcessPresent));
  }
}
