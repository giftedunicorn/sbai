import { describe, expect, it } from 'vitest';

import { RoastEngine } from '../../electron/services/roastEngine';
import type { Evidence } from '../../src/shared/companion';

const observed = (kind: Evidence['kind'], value: string): Evidence => ({
  kind,
  value,
  confidence: 'observed',
});

describe('RoastEngine', () => {
  it('mentions only the category supported by observed evidence', () => {
    const engine = new RoastEngine();
    const testRoast = engine.create({
      intensity: 'angry',
      evidence: [observed('test-failure', 'npm test - 2 tests failed')],
    }).roast;
    const fileRoast = engine.create({
      intensity: 'angry',
      evidence: [observed('file-edit', '/tmp/app.ts')],
    }).roast;

    expect(testRoast).toMatch(/测试/);
    expect(testRoast).not.toMatch(/文件|工具/);
    expect(fileRoast).toMatch(/文件/);
    expect(fileRoast).not.toMatch(/测试|工具报错/);
  });

  it('makes no technical claim when evidence is empty', () => {
    const result = new RoastEngine().create({ intensity: 'furious', evidence: [] });

    expect(result.roast).not.toMatch(/测试|文件|工具|命令|报错/);
    expect(result.copyText.length).toBeGreaterThan(0);
  });

  it('rotates templates instead of immediately repeating itself', () => {
    const engine = new RoastEngine();
    const input = { intensity: 'annoyed' as const, evidence: [] };

    expect(engine.create(input).roast).not.toBe(engine.create(input).roast);
  });

  it('maps intensity to the matching catharsis animation', () => {
    const engine = new RoastEngine();

    expect(engine.create({ intensity: 'annoyed', evidence: [] }).animation).toBe('poke');
    expect(engine.create({ intensity: 'angry', evidence: [] }).animation).toBe('slap-combo');
    expect(engine.create({ intensity: 'furious', evidence: [] }).animation).toBe(
      'token-explosion',
    );
  });
});
