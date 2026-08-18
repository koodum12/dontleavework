import type { EventFile, GameEvent } from '@/data/types';

const EVENT_TYPES = new Set([
  'dialogue', 'choice', 'interaction', 'mentalChange',
  'itemGet', 'itemUse', 'evidenceGet', 'noteAdd',
  'flagSet', 'condition', 'branch', 'ending',
]);

export interface ParseResult {
  events: Map<string, GameEvent>;
  warnings: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * JSON → 타입 검증된 GameEvent Map.
 * 잘못된 이벤트는 버리고 경고만 남긴다. 게임은 죽지 않는다.
 */
export function parseEventFile(raw: unknown, source = '(unknown)'): ParseResult {
  const warnings: string[] = [];
  const events = new Map<string, GameEvent>();

  if (!isRecord(raw) || !Array.isArray((raw as Partial<EventFile>).events)) {
    warnings.push(`${source}: events 배열이 없습니다.`);
    return { events, warnings };
  }

  const list = (raw as unknown as EventFile).events;
  for (const [i, item] of list.entries()) {
    if (!isRecord(item)) {
      warnings.push(`${source}[${i}]: 이벤트가 객체가 아닙니다.`);
      continue;
    }
    const { id, type } = item as Partial<GameEvent>;
    if (typeof id !== 'string' || id.length === 0) {
      warnings.push(`${source}[${i}]: id 가 없습니다.`);
      continue;
    }
    if (typeof type !== 'string' || !EVENT_TYPES.has(type)) {
      warnings.push(`${source}[${i}] ${id}: 알 수 없는 type "${String(type)}".`);
      continue;
    }
    if (type === 'choice' && !Array.isArray((item as GameEvent).choices)) {
      warnings.push(`${source} ${id}: choice 인데 choices 가 없습니다.`);
      continue;
    }
    if (events.has(id)) {
      warnings.push(`${source} ${id}: 중복 id — 나중 것을 무시합니다.`);
      continue;
    }
    events.set(id, item as GameEvent);
  }

  return { events, warnings };
}

/** next / choice.next 가 실제로 존재하는 이벤트를 가리키는지 확인 (Day 4 검증 스크립트에서 재사용) */
export function validateReferences(events: Map<string, GameEvent>): string[] {
  const problems: string[] = [];
  for (const event of events.values()) {
    const targets = [event.next, ...(event.choices ?? []).map((c) => c.next), event.fallback];
    for (const t of targets) {
      if (t && !events.has(t)) problems.push(`${event.id} → 존재하지 않는 이벤트 "${t}"`);
    }
  }
  return problems;
}
