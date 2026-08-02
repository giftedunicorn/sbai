import type { AgentProcessPresence } from '../shared/companion';

export function connectionLabel(
  presence: AgentProcessPresence,
  visibleAgentCount: number,
  nativeCompanion: boolean,
): string {
  if (!nativeCompanion) return 'WEB DEMO / OFFLINE';
  const count = `${visibleAgentCount} AGENT${visibleAgentCount === 1 ? '' : 'S'}`;
  if (presence.claudeCode && presence.codex) return `CLAUDE + CODEX / ${count}`;
  if (presence.claudeCode) return `CLAUDE ONLINE / ${count}`;
  if (presence.codex) return `CODEX ONLINE / ${count}`;
  return 'LOCAL ONLY';
}
