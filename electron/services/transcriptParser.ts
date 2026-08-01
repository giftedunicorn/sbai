export type NormalizedTranscriptRecord =
  | {
      kind: 'owner-message';
      sessionId: string;
      cwd: string;
      timestamp: number;
      text: string;
    }
  | {
      kind: 'assistant-message';
      sessionId: string;
      cwd: string;
      timestamp: number;
      text: string;
    }
  | {
      kind: 'tool-use';
      sessionId: string;
      cwd: string;
      timestamp: number;
      toolUseId: string;
      toolName: string;
      input: Record<string, unknown>;
    }
  | {
      kind: 'tool-result';
      sessionId: string;
      cwd: string;
      timestamp: number;
      toolUseId: string;
      isError: boolean;
      text: string;
    };

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return value;
}

function parseTimestamp(value: unknown): number | null {
  const timestamp =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Date.parse(value)
        : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function textFromContent(content: unknown): string | null {
  if (typeof content === 'string') {
    return content.trim().length > 0 ? content : null;
  }
  if (!Array.isArray(content)) return null;

  const text = content
    .filter(
      (block): block is JsonRecord =>
        isRecord(block) && block.type === 'text' && typeof block.text === 'string',
    )
    .map((block) => block.text as string)
    .filter((part) => part.trim().length > 0)
    .join('\n');

  return text.length > 0 ? text : null;
}

function baseFields(record: JsonRecord) {
  const sessionId = nonEmptyString(record.sessionId);
  const cwd = nonEmptyString(record.cwd);
  const timestamp = parseTimestamp(record.timestamp);
  if (!sessionId || !cwd || timestamp === null) return null;
  return { sessionId, cwd, timestamp };
}

export function parseTranscriptLine(
  line: string,
): NormalizedTranscriptRecord | null {
  let record: unknown;
  try {
    record = JSON.parse(line);
  } catch {
    return null;
  }

  if (!isRecord(record) || (record.type !== 'user' && record.type !== 'assistant')) {
    return null;
  }

  const base = baseFields(record);
  if (!base || !isRecord(record.message)) return null;

  const content = record.message.content;
  if (Array.isArray(content)) {
    const toolResult = content.find(
      (block): block is JsonRecord =>
        isRecord(block) && block.type === 'tool_result',
    );
    if (toolResult) {
      const toolUseId = nonEmptyString(toolResult.tool_use_id);
      const text = textFromContent(toolResult.content);
      if (!toolUseId || text === null) return null;
      return {
        kind: 'tool-result',
        ...base,
        toolUseId,
        isError: toolResult.is_error === true,
        text,
      };
    }

    const toolUse = content.find(
      (block): block is JsonRecord => isRecord(block) && block.type === 'tool_use',
    );
    if (toolUse) {
      const toolUseId = nonEmptyString(toolUse.id);
      const toolName = nonEmptyString(toolUse.name);
      if (!toolUseId || !toolName || !isRecord(toolUse.input)) return null;
      return {
        kind: 'tool-use',
        ...base,
        toolUseId,
        toolName,
        input: toolUse.input,
      };
    }
  }

  const text = textFromContent(content);
  if (text === null) return null;

  if (record.message.role === 'user' && record.type === 'user') {
    return { kind: 'owner-message', ...base, text };
  }
  if (record.message.role === 'assistant' && record.type === 'assistant') {
    return { kind: 'assistant-message', ...base, text };
  }
  return null;
}
