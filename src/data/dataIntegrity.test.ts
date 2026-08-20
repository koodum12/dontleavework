import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEventFile, validateReferences } from '@/game/event/EventParser';
import type {
  CharacterFile, EventEffect, EvidenceFile, GameEvent, ItemFile, LocationFile, MentalConfig, NoteFile,
  NpcFile, PaletteFile, PhoneFile, Rect,
} from '@/data/types';

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
const characters = read<CharacterFile>('characters.json');
const npcs = read<NpcFile>('npcs.json');
const palettes = read<PaletteFile>('palettes.json');

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
        case 'travel':
          if (!locations[effect.to]) missing.push(`location ${effect.to}`);
          else if (effect.spawn && !locations[effect.to].spawns?.[effect.spawn]) {
            missing.push(`spawn ${effect.to}/${effect.spawn}`);
          }
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

  it('맵 오브젝트 · NPC 의 eventId 가 전부 존재한다', () => {
    const missing = [
      ...Object.values(locations).flatMap((map) => map.objects),
      ...Object.values(npcs),
    ]
      .filter((o) => o.eventId && !events.has(o.eventId))
      .map((o) => `${o.id} → ${o.eventId}`);
    expect(missing).toEqual([]);
  });

  it('NPC 의 characterId 가 characters.json 에 있다', () => {
    const missing = Object.values(npcs)
      .filter((n) => !characters[n.characterId])
      .map((n) => `${n.id} → ${n.characterId}`);
    expect(missing).toEqual([]);
  });

  it('NPC 가 벽이나 solid 오브젝트에 끼어 있지 않다', () => {
    const overlaps = (a: Rect, b: Rect) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const stuck: string[] = [];
    for (const map of Object.values(locations)) {
      const solids: Rect[] = [...map.walls, ...map.objects.filter((o) => o.solid)];
      for (const n of Object.values(npcs).filter((npc) => npc.location === map.id)) {
        if (solids.some((s) => overlaps(n, s))) stuck.push(`${map.id}/${n.id}`);
      }
    }
    expect(stuck).toEqual([]);
  });

  it('NPC 위치와 맵 팔레트 참조가 유효하다', () => {
    const missingLocations = Object.values(npcs)
      .filter((npc) => !locations[npc.location])
      .map((npc) => `${npc.id} → ${npc.location}`);
    const missingPalettes = Object.values(locations).flatMap((map) => [
      ...(palettes[map.palette] ? [] : [`${map.id} → ${map.palette}`]),
      ...(map.variants ?? [])
        .filter((variant) => !palettes[variant.palette])
        .map((variant) => `${map.id}/${variant.id} → ${variant.palette}`),
    ]);
    expect(missingLocations).toEqual([]);
    expect(missingPalettes).toEqual([]);
  });

  it('문 이동 대상과 도착 스폰이 유효하고 모든 맵을 왕복할 수 있다', () => {
    const broken: string[] = [];
    for (const map of Object.values(locations)) {
      for (const object of map.objects) {
        if (!object.travel) continue;
        const target = locations[object.travel.to];
        if (!target) broken.push(`${map.id}/${object.id} → ${object.travel.to}`);
        else if (object.travel.spawn && !target.spawns?.[object.travel.spawn]) {
          broken.push(`${map.id}/${object.id} → ${object.travel.to}/${object.travel.spawn}`);
        }
      }
    }
    const reached = new Set<string>();
    const queue = ['office'];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reached.has(id) || !locations[id]) continue;
      reached.add(id);
      for (const object of locations[id].objects) if (object.travel) queue.push(object.travel.to);
    }
    for (const id of Object.keys(locations)) if (!reached.has(id)) broken.push(`unreachable ${id}`);
    expect(broken).toEqual([]);
  });

  it('필수 진행 잠금은 회사 경계와 집 현관에 모두 설정돼 있다', () => {
    const requiredCompanyChapters = ['chapter01', 'chapter03', 'chapter06'];
    const companyExitIds = [
      ['lobby', 'obj_lobby_front_door'],
      ['cafe', 'obj_cafe_street_door'],
    ] as const;

    for (const [mapId, objectId] of companyExitIds) {
      const door = locations[mapId].objects.find((object) => object.id === objectId);
      expect(door?.travel?.blocks?.length).toBeGreaterThan(0);
      for (const chapter of requiredCompanyChapters) {
        expect(door?.travel?.blocks?.some((block) =>
          block.conditions.some((condition) =>
            condition.type === 'current_chapter' && condition.value === chapter,
          )), `${mapId}/${objectId} ${chapter}`).toBe(true);
      }
    }

    const homeDoor = locations.home.objects.find((object) => object.id === 'obj_home_front_door');
    const homeChapters = new Set(
      homeDoor?.travel?.blocks?.flatMap((block) =>
        block.conditions.flatMap((condition) =>
          condition.type === 'current_chapter' ? [condition.value] : [],
        ),
      ),
    );
    expect([...homeChapters]).toEqual([
      'chapter01', 'chapter02', 'chapter03', 'chapter04', 'chapter05', 'chapter06', 'chapter07',
    ]);
  });

  it('characters.json 에 선언된 스프라이트와 초상이 실제로 있다', () => {
    const root = join(process.cwd(), 'public/assets/images');
    const missing = Object.values(characters).flatMap((character) => [
      ...(character.sprite && !existsSync(join(root, 'characters', character.sprite))
        ? [`${character.id} sprite ${character.sprite}`]
        : []),
      ...(character.portrait && !existsSync(join(root, 'portraits', character.portrait))
        ? [`${character.id} portrait ${character.portrait}`]
        : []),
    ]);
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
