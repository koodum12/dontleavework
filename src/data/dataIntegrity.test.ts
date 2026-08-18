import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEventFile, validateReferences } from '@/game/event/EventParser';
import type { EventEffect, EvidenceFile, GameEvent, ItemFile, LocationFile, MentalConfig, NoteFile, PhoneFile } from '@/data/types';

const read = <T>(p: string): T => JSON.parse(readFileSync(join(process.cwd(), 'public/data', p), 'utf8')) as T;

const EVENT_FILES = readdirSync(join(process.cwd(), 'public/data/events'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => `events/${f}`);

const items = read<ItemFile>('items.json');
const evidence = read<EvidenceFile>('evidence.json');
const notes = read<NoteFile>('notes.json');
const phone = read<PhoneFile>('phone.json');
const mental = read<MentalConfig>('mental.json');
const locations = read<LocationFile>('locations.json');

const events = new Map<string, GameEvent>();
const parseWarnings: string[] = [];
for (const file of EVENT_FILES) {
  const parsed = parseEventFile(read<unknown>(file), file);
  parseWarnings.push(...parsed.warnings);
  for (const [id, e] of parsed.events) events.set(id, e);
}

const allEffects = (): EventEffect[] => {
  const out: EventEffect[] = [];
  for (const e of events.values()) {
    out.push(...(e.effects ?? []));
    for (const c of e.choices ?? []) out.push(...(c.effects ?? []));
  }
  for (const item of Object.values(items)) out.push(...(item.onUseEffects ?? []));
  return out;
};

describe('스토리 데이터 정합성', () => {
  it('이벤트 파싱 경고가 없다', () => {
    expect(parseWarnings).toEqual([]);
  });

  it('next / choice.next / fallback 이 전부 존재하는 이벤트를 가리킨다', () => {
    expect(validateReferences(events)).toEqual([]);
  });

  it('branch 의 분기 대상도 전부 존재한다', () => {
    const missing: string[] = [];
    for (const e of events.values()) {
      for (const b of e.branches ?? []) {
        if (!events.has(b.next)) missing.push(`${e.id} → ${b.next}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('effects 가 참조하는 아이템/증거/노트/문자/사진 id 가 데이터에 있다', () => {
    const missing: string[] = [];
    for (const effect of allEffects()) {
      switch (effect.type) {
        case 'itemGet':
        case 'itemRemove':
          if (!items[effect.id]) missing.push(`item ${effect.id}`);
          break;
        case 'evidenceGet':
          if (!evidence[effect.id]) missing.push(`evidence ${effect.id}`);
          break;
        case 'noteAdd':
          if (!notes[effect.id]) missing.push(`note ${effect.id}`);
          break;
        case 'messageReceive':
          if (!phone.messages[effect.id]) missing.push(`message ${effect.id}`);
          break;
        case 'photoGet':
          if (!phone.photos[effect.id]) missing.push(`photo ${effect.id}`);
          break;
        case 'mentalChange':
          if (effect.delta && mental.deltas[effect.delta] === undefined) missing.push(`delta ${effect.delta}`);
          break;
      }
    }
    expect(missing).toEqual([]);
  });

  it('증거 카테고리가 evidence.json 정의와 일치한다', () => {
    const mismatched: string[] = [];
    for (const e of events.values()) {
      for (const effect of e.effects ?? []) {
        if (effect.type !== 'evidenceGet' || !effect.category) continue;
        const def = evidence[effect.id];
        if (def && def.category !== effect.category) mismatched.push(`${effect.id}: ${effect.category} ≠ ${def.category}`);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it('맵 오브젝트의 eventId 가 전부 존재한다', () => {
    const missing = Object.values(locations)
      .flatMap((map) => map.objects)
      .filter((o) => o.eventId && !events.has(o.eventId))
      .map((o) => `${o.id} → ${o.eventId}`);
    expect(missing).toEqual([]);
  });

  it('phone.onOpen 이벤트와 아이템 onUseEvent 도 존재한다', () => {
    const missing: string[] = [];
    for (const entry of phone.onOpen ?? []) {
      if (!events.has(entry.eventId)) missing.push(`phone.onOpen ${entry.eventId}`);
    }
    for (const item of Object.values(items)) {
      if (item.onUseEvent && !events.has(item.onUseEvent)) missing.push(`item ${item.id} → ${item.onUseEvent}`);
    }
    expect(missing).toEqual([]);
  });

  it('정신력 구간이 0~100 을 빈틈없이 덮는다', () => {
    const sorted = [...mental.bands].sort((a, b) => a.min - b.min);
    expect(sorted[0].min).toBe(0);
    expect(sorted[sorted.length - 1].max).toBe(mental.max);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].min).toBe(sorted[i - 1].max + 1);
    }
  });
});
