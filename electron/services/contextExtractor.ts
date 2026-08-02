import type { Evidence } from '../../src/shared/companion.js';
import type { NormalizedTranscriptRecord } from './transcriptParser.js';

const MAX_EVIDENCE = 5;
const MAX_FACT_LENGTH = 180;
const TEST_COMMAND = /(?:^|(?:&&|\|\||;)\s*)(?:npm(?:\s+run)?\s+test|pnpm(?:\s+run)?\s+test|yarn(?:\s+run)?\s+test|(?:npx\s+)?vitest(?:\s|$)|pytest(?:\s|$)|cargo\s+test(?:\s|$)|go\s+test(?:\s|$))/i;

function boundedText(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > MAX_FACT_LENGTH
    ? `${compact.slice(0, MAX_FACT_LENGTH - 1)}…`
    : compact;
}

function commandFrom(record: NormalizedTranscriptRecord): string | null {
  if (record.kind !== 'tool-use') return null;
  const command = record.input.command;
  if (typeof command !== 'string' || command.length > 2_000) return null;
  return TEST_COMMAND.test(command) ? boundedText(command) : null;
}

function editedPaths(record: NormalizedTranscriptRecord): string[] {
  if (record.kind !== 'tool-use') return [];
  if (/^(edit|write)$/i.test(record.toolName)) {
    const candidate = record.input.file_path ?? record.input.path;
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? [boundedText(candidate)]
      : [];
  }
  if (!/^apply_patch$/i.test(record.toolName) || typeof record.input.patch !== 'string') {
    return [];
  }
  return [...record.input.patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)]
    .map((match) => match[1]?.trim())
    .filter((path): path is string => Boolean(path))
    .map(boundedText);
}

export function extractEvidence(
  records: readonly NormalizedTranscriptRecord[],
): Evidence[] {
  const toolUses = new Map<
    string,
    Extract<NormalizedTranscriptRecord, { kind: 'tool-use' }>
  >();
  const evidence: Evidence[] = [];
  const seen = new Set<string>();

  const add = (kind: Evidence['kind'], value: string) => {
    if (!value || evidence.length >= MAX_EVIDENCE) return;
    const key = `${kind}\0${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    evidence.push({ kind, value, confidence: 'observed' });
  };

  for (const record of records) {
    if (record.kind === 'tool-use') {
      toolUses.set(record.toolUseId, record);
      if (!/^apply_patch$/i.test(record.toolName)) {
        for (const path of editedPaths(record)) add('file-edit', path);
      }
      continue;
    }

    if (record.kind !== 'tool-result') continue;
    const toolUse = toolUses.get(record.toolUseId);
    if (!toolUse) continue;

    if (!record.isError) {
      if (/^apply_patch$/i.test(toolUse.toolName)) {
        for (const path of editedPaths(toolUse)) add('file-edit', path);
      }
      continue;
    }

    const testCommand = commandFrom(toolUse);
    const resultText = boundedText(record.text);
    if (testCommand) {
      add('test-failure', `${testCommand} - ${resultText}`);
    } else {
      add('tool-failure', `${boundedText(toolUse.toolName)} - ${resultText}`);
    }
  }

  return evidence;
}
