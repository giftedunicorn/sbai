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
