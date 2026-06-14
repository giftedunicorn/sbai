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
