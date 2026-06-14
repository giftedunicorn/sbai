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
