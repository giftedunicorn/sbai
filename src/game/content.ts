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
