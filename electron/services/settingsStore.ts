import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

export interface CompanionSettings {
  approvedClaudeRoot: string | null;
  paused: boolean;
  muted: boolean;
}

export const DEFAULT_SETTINGS: Readonly<CompanionSettings> = Object.freeze({
  approvedClaudeRoot: null,
  paused: false,
  muted: false,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeSettings(value: unknown): CompanionSettings | null {
  if (!isRecord(value)) return null;
  const root = value.approvedClaudeRoot;
  const validRoot =
    root === null ||
    (typeof root === 'string' && root.trim().length > 0 && isAbsolute(root));
  if (!validRoot || typeof value.paused !== 'boolean' || typeof value.muted !== 'boolean') {
    return null;
  }
  return {
    approvedClaudeRoot: root as string | null,
    paused: value.paused,
    muted: value.muted,
  };
}

function defaults(): CompanionSettings {
  return { ...DEFAULT_SETTINGS };
}

export class SettingsStore {
  private readonly settingsPath: string;

  constructor(private readonly userDataDirectory: string) {
    this.settingsPath = join(userDataDirectory, 'companion-settings.json');
  }

  async load(): Promise<CompanionSettings> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.settingsPath, 'utf8'));
      return sanitizeSettings(parsed) ?? defaults();
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM'))
      ) {
        return defaults();
      }
      throw error;
    }
  }

  async save(settings: CompanionSettings): Promise<void> {
    const sanitized = sanitizeSettings(settings);
    if (!sanitized) throw new TypeError('Invalid companion settings');

    await mkdir(this.userDataDirectory, { recursive: true });
    const temporaryPath = `${this.settingsPath}.tmp-${process.pid}-${Date.now()}`;
    try {
      await writeFile(temporaryPath, `${JSON.stringify(sanitized, null, 2)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      });
      await rename(temporaryPath, this.settingsPath);
    } finally {
      try {
        await unlink(temporaryPath);
      } catch (error) {
        if (
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
          )
        ) {
          throw error;
        }
      }
    }
  }
}
