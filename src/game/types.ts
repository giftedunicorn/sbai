export type ParticleKind = 'token' | 'bug' | 'diff' | 'lint';

export type HitReaction = 'bounce' | 'squash' | 'spin' | 'slide' | 'wobble';

export type AgentExpression =
  | 'dazed'
  | 'spinner'
  | 'blank-confidence'
  | 'fake-smile'
  | 'panic';
