import Phaser from 'phaser';

import './style.css';
import {
  CATHARSIS_EVENT,
  CompanionScene,
  PERFORMANCE_END_EVENT,
  STOP_EVENT,
} from './scenes/CompanionScene';
import type {
  AgentSource,
  CatharsisEvent,
  CompanionSnapshot,
  SessionSummary,
} from './shared/companion';
import { renderSessionList } from './ui/sessionList';
import { connectionLabel } from './ui/connectionStatus';

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

const gameStage = requiredElement<HTMLElement>('#game');
const sessionList = requiredElement<HTMLElement>('#session-list');
const connectionStatus = requiredElement<HTMLElement>('#connection-status');
const closeButton = requiredElement<HTMLButtonElement>('#close-button');
const approveClaudeButton = requiredElement<HTMLButtonElement>('#approve-claude-button');
const approveCodexButton = requiredElement<HTMLButtonElement>('#approve-codex-button');
const pauseButton = requiredElement<HTMLButtonElement>('#pause-button');
const roastButton = requiredElement<HTMLButtonElement>('#roast-button');
const copyButton = requiredElement<HTMLButtonElement>('#copy-button');
const muteButton = requiredElement<HTMLButtonElement>('#mute-button');

const demoSessions: SessionSummary[] = [
  {
    id: 'demo-main',
    label: 'Claude demo-ma',
    projectLabel: 'sbai',
    status: 'active',
    lastActivityAt: Date.now(),
  },
  {
    id: 'demo-side',
    label: 'Codex demo-si',
    projectLabel: 'side-quest',
    status: 'idle',
    lastActivityAt: Date.now() - 90_000,
  },
];

let snapshot: CompanionSnapshot = {
  paused: false,
  muted: false,
  processPresence: { claudeCode: false, codex: false },
  sessions: window.companion ? [] : demoSessions,
};
let selectedId: string | null = snapshot.sessions[0]?.id ?? null;
let alertSessionId: string | null = null;
let lastCopyText = '';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: gameStage,
  transparent: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 380,
    height: 300,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [CompanionScene],
  render: { antialias: false, pixelArt: true, roundPixels: true },
});

function selectedSession(): SessionSummary | undefined {
  return snapshot.sessions.find((session) => session.id === selectedId);
}

function ensureSelection(): void {
  if (selectedSession()) return;
  selectedId =
    snapshot.sessions.find((session) => session.status === 'active')?.id ??
    snapshot.sessions.find((session) => session.status === 'idle')?.id ??
    snapshot.sessions[0]?.id ??
    null;
}

function render(): void {
  ensureSelection();
  renderSessionList(sessionList, {
    sessions: snapshot.sessions,
    selectedId,
    alertSessionId,
    onSelect(sessionId) {
      selectedId = sessionId;
      render();
    },
  });

  const visibleSessions = snapshot.sessions.filter(
    (session) => session.status === 'active' || session.status === 'idle',
  );
  connectionStatus.textContent = connectionLabel(
    snapshot.processPresence,
    visibleSessions.length,
    Boolean(window.companion),
  );
  pauseButton.textContent = snapshot.paused ? '继续' : '暂停';
  pauseButton.setAttribute('aria-pressed', String(snapshot.paused));
  muteButton.textContent = snapshot.muted ? '开声' : '静音';
  muteButton.setAttribute('aria-pressed', String(snapshot.muted));
  approveClaudeButton.disabled = !window.companion;
  approveCodexButton.disabled = !window.companion;
  copyButton.disabled = lastCopyText.length === 0;

  const session = selectedSession();
  roastButton.disabled =
    !session || session.status === 'ended' || session.status === 'content-unavailable';
}

function demoCatharsis(sessionId: string): CatharsisEvent {
  return {
    sessionId,
    trigger: 'manual',
    intensity: 'angry',
    evidence: [],
    roast: '这点本事还敢让主人返工？站好，先吃一套像素耳光。',
    copyText: '请重新检查你的工作，并用可验证的结果回复。',
    animation: 'slap-combo',
  };
}

function handleCatharsis(event: CatharsisEvent): void {
  selectedId = event.sessionId;
  alertSessionId = event.sessionId;
  lastCopyText = event.copyText ?? '';
  game.events.emit(CATHARSIS_EVENT, event);
  render();
}

const unsubscribers: Array<() => void> = [];
if (window.companion) {
  unsubscribers.push(
    window.companion.onSnapshot((nextSnapshot) => {
      snapshot = nextSnapshot;
      game.sound.mute = snapshot.muted;
      render();
    }),
    window.companion.onCatharsis(handleCatharsis),
  );
}

game.events.on(PERFORMANCE_END_EVENT, () => {
  alertSessionId = null;
  render();
});

closeButton.addEventListener('click', () => window.close());
async function approveRoot(source: AgentSource, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  await window.companion?.approveRoot(source);
  button.disabled = false;
}

approveClaudeButton.addEventListener('click', () => {
  void approveRoot('claude-code', approveClaudeButton);
});
approveCodexButton.addEventListener('click', () => {
  void approveRoot('codex', approveCodexButton);
});
pauseButton.addEventListener('click', () => {
  snapshot = { ...snapshot, paused: !snapshot.paused };
  window.companion?.setPaused(snapshot.paused);
  render();
});
muteButton.addEventListener('click', () => {
  snapshot = { ...snapshot, muted: !snapshot.muted };
  game.sound.mute = snapshot.muted;
  window.companion?.setMuted(snapshot.muted);
  render();
});
roastButton.addEventListener('click', () => {
  if (!selectedId) return;
  if (window.companion) window.companion.manualRoast(selectedId);
  else handleCatharsis(demoCatharsis(selectedId));
});
copyButton.addEventListener('click', () => {
  if (!lastCopyText) return;
  if (window.companion) window.companion.copyText(lastCopyText);
  else void navigator.clipboard?.writeText(lastCopyText).catch(() => undefined);
  copyButton.textContent = '已复制';
  window.setTimeout(() => {
    copyButton.textContent = '复制回话';
  }, 900);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  game.events.emit(STOP_EVENT);
  window.companion?.stopAnimation();
  alertSessionId = null;
  render();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.loop.sleep();
  else game.loop.wake();
});

window.addEventListener('beforeunload', () => {
  for (const unsubscribe of unsubscribers) unsubscribe();
  game.destroy(true);
});

render();
