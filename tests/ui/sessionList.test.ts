import { describe, expect, it, vi } from 'vitest';

import { renderSessionList } from '../../src/ui/sessionList';
import type { SessionSummary } from '../../src/shared/companion';

const sessions: SessionSummary[] = [
  {
    id: 's1',
    label: '<img src=x onerror=alert(1)>',
    projectLabel: 'sbai',
    status: 'active',
    lastActivityAt: 2,
  },
  {
    id: 's2',
    label: 'Claude s2',
    projectLabel: '/private/transcript/location',
    status: 'content-unavailable',
    lastActivityAt: 1,
  },
];

describe('renderSessionList', () => {
  it('renders one safe button per session using text content', () => {
    const container = document.createElement('nav');

    renderSessionList(container, {
      sessions,
      selectedId: 's1',
      alertSessionId: null,
      onSelect: () => undefined,
    });

    expect(container.querySelectorAll('button')).toHaveLength(2);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('marks selected and alerting sessions independently', () => {
    const container = document.createElement('nav');
    renderSessionList(container, {
      sessions,
      selectedId: 's1',
      alertSessionId: 's2',
      onSelect: () => undefined,
    });

    expect(container.querySelector('[data-session-id="s1"]')?.classList).toContain(
      'is-selected',
    );
    expect(container.querySelector('[data-session-id="s2"]')?.classList).toContain(
      'is-alerting',
    );
  });

  it('calls back with the selected transcript session id', () => {
    const container = document.createElement('nav');
    const onSelect = vi.fn();
    renderSessionList(container, {
      sessions,
      selectedId: null,
      alertSessionId: null,
      onSelect,
    });

    container.querySelector<HTMLButtonElement>('[data-session-id="s2"]')?.click();
    expect(onSelect).toHaveBeenCalledWith('s2');
  });

  it('uses a path-free unavailable badge', () => {
    const container = document.createElement('nav');
    renderSessionList(container, {
      sessions,
      selectedId: null,
      alertSessionId: null,
      onSelect: () => undefined,
    });

    const unavailable = container.querySelector('[data-session-id="s2"]');
    expect(unavailable?.textContent).toContain('内容不可用');
    expect(unavailable?.textContent).not.toContain('/private/transcript/location');
  });
});
