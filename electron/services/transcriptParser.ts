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

interface CodexTranscriptState {
  sessionId: string;
  cwd: string;
}

function codexTextFromContent(content: unknown, expectedType: string): string | null {
  if (!Array.isArray(content)) return null;
  const text = content
    .filter(
      (block): block is JsonRecord =>
        isRecord(block) &&
        block.type === expectedType &&
        typeof block.text === 'string',
    )
    .map((block) => block.text as string)
    .filter((part) => part.trim().length > 0)
    .join('\n');
  return text.length > 0 ? text : null;
}

function codexToolInput(value: unknown): Record<string, unknown> {
  let input: Record<string, unknown> = {};
  if (isRecord(value)) input = value;
  else if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isRecord(parsed)) input = parsed;
    } catch {
      return {};
    }
  }
  return typeof input.cmd === 'string' && typeof input.command !== 'string'
    ? { ...input, command: input.cmd }
    : input;
}

function codexToolOutput(value: unknown): { text: string; isError: boolean } | null {
  if (Array.isArray(value)) {
    const text = value
      .filter(
        (item): item is JsonRecord =>
          isRecord(item) &&
          (item.type === 'input_text' || item.type === 'output_text') &&
          typeof item.text === 'string',
      )
      .map((item) => item.text as string)
      .filter((part) => part.trim().length > 0)
      .join('\n');
    return codexToolOutput(text);
  }
  if (typeof value === 'string') {
    if (value.trim().length === 0) return null;
    const exitCode = value.match(/Process exited with code\s+(-?\d+)/i)?.[1];
    return {
      text: value,
      isError:
        (exitCode !== undefined && Number(exitCode) !== 0) ||
        /^(?:Error|Failed|Failure|Invalid|Unable|Could not)\b/im.test(value),
    };
  }
  if (!isRecord(value)) return null;
  const text = nonEmptyString(value.text) ?? nonEmptyString(value.output);
  if (!text) return null;
  return {
    text,
    isError:
      value.is_error === true ||
      value.isError === true ||
      value.success === false ||
      (typeof value.exit_code === 'number' && value.exit_code !== 0),
  };
}

export class CodexTranscriptParser {
  private readonly stateByPath = new Map<string, CodexTranscriptState>();

  parse(path: string, line: string): NormalizedTranscriptRecord | null {
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      return null;
    }
    if (!isRecord(record)) return null;

    const payload = isRecord(record.payload) ? record.payload : null;
    if (!payload) return null;

    if (record.type === 'session_meta') {
      const previous = this.stateByPath.get(path);
      this.stateByPath.set(path, {
        sessionId:
          nonEmptyString(payload.id) ??
          nonEmptyString(payload.session_id) ??
          previous?.sessionId ??
          path,
        cwd: nonEmptyString(payload.cwd) ?? previous?.cwd ?? 'Codex workspace',
      });
      return null;
    }

    if (record.type === 'turn_context') {
      const previous = this.stateByPath.get(path);
      this.stateByPath.set(path, {
        sessionId: previous?.sessionId ?? path,
        cwd: nonEmptyString(payload.cwd) ?? previous?.cwd ?? 'Codex workspace',
      });
      return null;
    }

    if (record.type !== 'response_item') return null;
    const timestamp = parseTimestamp(record.timestamp);
    if (timestamp === null) return null;
    const state = this.stateByPath.get(path) ?? {
      sessionId: path,
      cwd: 'Codex workspace',
    };

    if (payload.type === 'function_call') {
      const toolUseId = nonEmptyString(payload.call_id) ?? nonEmptyString(payload.id);
      const toolName = nonEmptyString(payload.name);
      if (!toolUseId || !toolName) return null;
      return {
        kind: 'tool-use',
        ...state,
        timestamp,
        toolUseId,
        toolName,
        input: codexToolInput(payload.arguments),
      };
    }

    if (payload.type === 'custom_tool_call') {
      const toolUseId = nonEmptyString(payload.call_id) ?? nonEmptyString(payload.id);
      const toolName = nonEmptyString(payload.name);
      if (!toolUseId || !toolName) return null;
      const input =
        typeof payload.input === 'string'
          ? { patch: payload.input }
          : codexToolInput(payload.input);
      return { kind: 'tool-use', ...state, timestamp, toolUseId, toolName, input };
    }

    if (
      payload.type === 'function_call_output' ||
      payload.type === 'custom_tool_call_output'
    ) {
      const toolUseId = nonEmptyString(payload.call_id) ?? nonEmptyString(payload.id);
      const output = codexToolOutput(payload.output);
      if (!toolUseId || !output) return null;
      return { kind: 'tool-result', ...state, timestamp, toolUseId, ...output };
    }

    if (payload.type !== 'message') return null;

    if (payload.role === 'user') {
      const text = codexTextFromContent(payload.content, 'input_text');
      return text ? { kind: 'owner-message', ...state, timestamp, text } : null;
    }
    if (payload.role === 'assistant') {
      const text = codexTextFromContent(payload.content, 'output_text');
      return text ? { kind: 'assistant-message', ...state, timestamp, text } : null;
    }
    return null;
  }

  forget(path: string): void {
    this.stateByPath.delete(path);
  }

  clear(): void {
    this.stateByPath.clear();
  }
}
