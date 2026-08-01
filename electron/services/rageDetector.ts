import type { AngerIntensity } from '../../src/shared/companion.js';
import type { NormalizedTranscriptRecord } from './transcriptParser.js';

export interface RageDetection {
  intensity: AngerIntensity;
  score: number;
}

export const DIRECT_ADDRESS_TERMS = ['你', 'claude', 'agent'] as const;

export const FRUSTRATION_TERMS = [
  ['没跑测试', 2],
  ['乱改', 4],
  ['删我代码', 4],
  ['擅自', 3],
  ['骗人', 3],
  ['搞坏', 2],
  ['弄坏', 2],
  ['胡说', 2],
  ['报错', 1],
  ['失败', 1],
] as const;

export const PROFANITY_TERMS = [
  ['傻逼', 4],
  ['他妈', 3],
  ['狗屁', 3],
  ['废物', 3],
  ['垃圾', 2],
  ['蠢', 2],
  ['stupid', 3],
] as const;

export const REPETITION_TERMS = ['又', '再一次', '反复', '每次', '一直'] as const;
export const THIRD_PARTY_TERMS = [
  '同事',
  '朋友',
  '老板',
  '客户',
  '队友',
  '他们',
  '她又',
] as const;

const REJECTED_REQUEST_MARKERS = [
  /(?:请|帮我)?(?:翻译|译成|translate)\s*[:：]?/i,
  /(?:代码示例|引用|引文|这个词|这句话|这段话)/i,
  /(?:分析|解释|判断).{0,12}(?:日志|措辞|内容)/i,
] as const;

function stripQuotedMaterial(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/```[\s\S]*$/g, ' ')
    .replace(/^\s*>.*$/gm, ' ')
    .replace(/“[^”\n]*”|‘[^’\n]*’|"[^"\n]*"|'[^'\n]*'/g, ' ');
}

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function scoreTerms(
  text: string,
  terms: ReadonlyArray<readonly [string, number]>,
): number {
  return terms.reduce(
    (score, [term, weight]) => score + (text.includes(term) ? weight : 0),
    0,
  );
}

function intensityForScore(score: number): AngerIntensity {
  if (score >= 10) return 'furious';
  if (score >= 6) return 'angry';
  return 'annoyed';
}

function hasUnambiguousAgentAccusation(text: string): boolean {
  const accusation = '(?:乱改|删|搞坏|弄坏|没跑|擅自|骗人|胡说|傻逼|废物|垃圾|蠢)';
  const namedAgent = new RegExp(`(?:claude|agent).{0,18}${accusation}`, 'i');
  const secondPerson = new RegExp(
    `(?:谁让你|你(?:他妈)?(?:又|怎么|为什么|凭什么|敢|还|真|太|乱|删|改|搞|弄|没|不)).{0,18}${accusation}?`,
    'i',
  );
  return namedAgent.test(text) || secondPerson.test(text);
}

export function detectOwnerAnger(text: string): RageDetection | null {
  if (REJECTED_REQUEST_MARKERS.some((pattern) => pattern.test(text))) return null;

  const normalized = stripQuotedMaterial(text).trim().toLocaleLowerCase();
  if (!normalized) return null;

  const directlyAddressesAgent = includesAny(normalized, DIRECT_ADDRESS_TERMS);
  if (
    includesAny(normalized, THIRD_PARTY_TERMS) &&
    !hasUnambiguousAgentAccusation(normalized)
  ) {
    return null;
  }

  let score = directlyAddressesAgent ? 2 : 0;
  score += scoreTerms(normalized, FRUSTRATION_TERMS);
  score += scoreTerms(normalized, PROFANITY_TERMS);
  if (includesAny(normalized, REPETITION_TERMS)) score += 1;
  if (/[!！?？]{2,}/.test(normalized)) score += 1;

  if (score < 4 || !directlyAddressesAgent) return null;
  return { intensity: intensityForScore(score), score };
}

export function detectAutomaticAnger(
  record: NormalizedTranscriptRecord,
): RageDetection | null {
  return record.kind === 'owner-message' ? detectOwnerAnger(record.text) : null;
}

export function manualAnger(
  intensity: AngerIntensity = 'angry',
): RageDetection {
  const score = intensity === 'furious' ? 10 : intensity === 'angry' ? 6 : 4;
  return { intensity, score };
}
