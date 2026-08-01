import type { SessionStatus, SessionSummary } from '../shared/companion';

export interface SessionListOptions {
  sessions: SessionSummary[];
  selectedId: string | null;
  alertSessionId: string | null;
  onSelect: (sessionId: string) => void;
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  active: '在线',
  idle: '空闲',
  ended: '结束',
  'content-unavailable': '内容不可用',
};

function textElement(className: string, text: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
}

export function renderSessionList(
  container: HTMLElement,
  options: SessionListOptions,
): void {
  container.replaceChildren();

  if (options.sessions.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'session-list__empty';
    empty.textContent = '等待 Agent 上线';
    container.append(empty);
    return;
  }

  for (const session of options.sessions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'session-chip';
    button.dataset.sessionId = session.id;
    button.setAttribute('aria-pressed', String(session.id === options.selectedId));
    button.setAttribute('aria-label', `选择 ${session.label}`);
    if (session.id === options.selectedId) button.classList.add('is-selected');
    if (session.id === options.alertSessionId) button.classList.add('is-alerting');
    if (session.status === 'ended') button.disabled = true;

    const label = textElement('session-chip__label', session.label);
    const meta = document.createElement('span');
    meta.className = 'session-chip__meta';
    const project =
      session.status === 'content-unavailable' ? '' : session.projectLabel;
    if (project) meta.append(textElement('session-chip__project', project));
    meta.append(
      textElement(
        `session-chip__status session-chip__status--${session.status}`,
        STATUS_LABEL[session.status],
      ),
    );
    button.append(label, meta);
    button.addEventListener('click', () => options.onSelect(session.id));
    container.append(button);
  }
}
