import type { ParticleKind } from './types';

export const APOLOGY_CAPTIONS = [
  'You are right. I misunderstood the task.',
  'Sorry, I edited before reading the full context.',
  'I checked again. This pass will be stricter.',
  'You caught it. My change went outside the scope.',
  'That was my miss. I should have confirmed the boundary first.',
  'I fixed the issue and ran the checks this time.',
  'I understand the frustration. I will handle this carefully.',
  'I should not have touched your existing work without verifying it.',
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
