import { describe, expect, it } from 'vitest';

import {
  detectAutomaticAnger,
  detectOwnerAnger,
  manualAnger,
} from '../../electron/services/rageDetector';
import type { NormalizedTranscriptRecord } from '../../electron/services/transcriptParser';

describe('detectOwnerAnger', () => {
  const cases = [
    ['这里类型不对，请修改', null],
    ['代码示例里包含“傻逼”这个词', null],
    ['请翻译：why is this agent so stupid?', null],
    ['我同事怎么又把分支搞坏了', null],
    ['你看我同事这个傻逼又把分支搞坏了', null],
    ['你怎么评价我同事这个傻逼又把分支搞坏了', null],
    ['我同事说 Claude 是傻逼，你怎么看', null],
    ['你怎么又没跑测试？', 'annoyed'],
    ['谁让你乱改二十个文件的？', 'angry'],
    ['你他妈又删我代码，真是个傻逼', 'furious'],
  ] as const;

  it.each(cases)('%s => %s', (text, intensity) => {
    expect(detectOwnerAnger(text)?.intensity ?? null).toBe(intensity);
  });

  it('ignores fenced code and quoted lines', () => {
    expect(detectOwnerAnger('请检查：\n```txt\n你这个傻逼\n```')).toBeNull();
    expect(detectOwnerAnger('分析下面的日志：\n> 你他妈又删代码')).toBeNull();
  });
});

describe('rage trigger boundaries', () => {
  it('automatically evaluates only owner-message records', () => {
    const assistantRecord: NormalizedTranscriptRecord = {
      kind: 'assistant-message',
      sessionId: 's1',
      cwd: '/tmp/demo',
      timestamp: 1,
      text: '你他妈又删我代码，真是个傻逼',
    };

    expect(detectAutomaticAnger(assistantRecord)).toBeNull();
  });

  it('lets a manual trigger bypass text classification', () => {
    expect(detectOwnerAnger('请把类型改一下')).toBeNull();
    expect(manualAnger()).toEqual({ intensity: 'angry', score: 6 });
  });
});
