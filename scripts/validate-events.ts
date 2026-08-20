/**
 * 스토리 데이터 검증 — 앱을 띄우지 않고 public/data/** 를 직접 읽는다.
 * npm run validate / prebuild 에 걸려 있어 깨진 JSON 은 배포되지 않는다.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CharacterFile, Condition, EventEffect, EvidenceFile, GameEvent, ItemFile, LocationFile, MentalConfig,
  NoteFile, NpcFile, PaletteFile, PhoneFile, Rect,
} from '../src/data/types';
import { parseEventFile, validateReferences } from '../src/game/event/EventParser';

const DATA = join(process.cwd(), 'public/data');
const read = <T>(p: string): T => JSON.parse(readFileSync(join(DATA, p), 'utf8')) as T;

const problems: string[] = [];
const warnings: string[] = [];
const fail = (msg: string) => problems.push(msg);
const warn = (msg: string) => warnings.push(msg);

/* ---- 파일 로드 ---- */
const items = read<ItemFile>('items.json');
const evidence = read<EvidenceFile>('evidence.json');
const notes = read<NoteFile>('notes.json');
const phone = read<PhoneFile>('phone.json');
const mental = read<MentalConfig>('mental.json');
const locations = read<LocationFile>('locations.json');
const npcs = read<NpcFile>('npcs.json');
const palettes = read<PaletteFile>('palettes.json');
const characters = read<CharacterFile>('characters.json');
const endings = read<{ endings: { id: string; name: string; conditions: unknown[] }[] }>('endings.json');

const eventFiles = readdirSync(join(DATA, 'events')).filter((f) => f.endsWith('.json')).sort();
const events = new Map<string, GameEvent>();
const eventSource = new Map<string, string>();

for (const file of eventFiles) {
  const parsed = parseEventFile(read<unknown>(`events/${file}`), file);
  parsed.warnings.forEach((w) => fail(`[파싱] ${w}`));
  for (const [id, event] of parsed.events) {
    if (events.has(id)) {
      fail(`[중복] ${id} — ${eventSource.get(id)} 와 ${file}`);
      continue;
    }
    events.set(id, event);
    eventSource.set(id, file);
  }
}

/* ---- 1. 참조 무결성 ---- */
validateReferences(events).forEach((p) => fail(`[참조] ${p}`));
for (const event of events.values()) {
  for (const branch of event.branches ?? []) {
    if (!events.has(branch.next)) fail(`[참조] ${event.id} → 분기 대상 "${branch.next}" 없음`);
  }
}

/* ---- 2. 참조된 데이터 id ---- */
const collectEffects = (): { owner: string; effect: EventEffect }[] => {
  const out: { owner: string; effect: EventEffect }[] = [];
  for (const e of events.values()) {
    for (const effect of e.effects ?? []) out.push({ owner: e.id, effect });
    for (const c of e.choices ?? []) for (const effect of c.effects ?? []) out.push({ owner: `${e.id}(choice)`, effect });
  }
  for (const item of Object.values(items)) {
    for (const effect of item.onUseEffects ?? []) out.push({ owner: `item:${item.id}`, effect });
  }
  return out;
};

const effects = collectEffects();
for (const { owner, effect } of effects) {
  switch (effect.type) {
    case 'itemGet':
    case 'itemRemove':
      if (!items[effect.id]) fail(`[데이터] ${owner}: 아이템 "${effect.id}" 미정의`);
      break;
    case 'evidenceGet':
      if (!evidence[effect.id]) fail(`[데이터] ${owner}: 증거 "${effect.id}" 미정의`);
      else if (effect.category && evidence[effect.id].category !== effect.category)
        fail(`[데이터] ${owner}: 증거 "${effect.id}" 카테고리 불일치 (${effect.category} ≠ ${evidence[effect.id].category})`);
      break;
    case 'noteAdd':
      if (!notes[effect.id]) fail(`[데이터] ${owner}: 노트 "${effect.id}" 미정의`);
      break;
    case 'messageReceive':
      if (!phone.messages[effect.id]) fail(`[데이터] ${owner}: 문자 "${effect.id}" 미정의`);
      break;
    case 'photoGet':
      if (!phone.photos[effect.id]) fail(`[데이터] ${owner}: 사진 "${effect.id}" 미정의`);
      break;
    case 'mentalChange':
      if (effect.delta && mental.deltas[effect.delta] === undefined)
        fail(`[데이터] ${owner}: 정신력 변화 "${effect.delta}" 미정의`);
      if (effect.amount === undefined && !effect.delta)
        fail(`[데이터] ${owner}: mentalChange 에 amount 도 delta 도 없음`);
      break;
    case 'travel': {
      const target = locations[effect.to];
      if (!target) fail(`[이동] ${owner}: 존재하지 않는 맵 "${effect.to}"`);
      else if (effect.spawn && !target.spawns?.[effect.spawn]) {
        fail(`[이동] ${owner}: ${effect.to} 에 spawn "${effect.spawn}" 없음`);
      }
      break;
    }
  }
}

/* ---- 2-1. Day 6 맵/NPC/팔레트 무결성 ---- */
const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (rect: Rect, map: { width: number; height: number }) =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= map.width && rect.y + rect.h <= map.height;
const definedFlagKeys = new Set(
  effects
    .map(({ effect }) => effect)
    .filter((effect): effect is Extract<EventEffect, { type: 'flagSet' }> => effect.type === 'flagSet')
    .map((effect) => effect.key),
);

const checkConditions = (owner: string, conditions: Condition[] | undefined) => {
  for (const condition of conditions ?? []) {
    if (condition.type === 'flag' && condition.value && !definedFlagKeys.has(condition.key)) {
      fail(`[조건] ${owner}: true 로 설정되는 곳이 없는 플래그 "${condition.key}"`);
    }
  }
};

for (const map of Object.values(locations)) {
  if (!palettes[map.palette]) fail(`[팔레트] ${map.id}: 기본 팔레트 "${map.palette}" 없음`);
  for (const variant of map.variants ?? []) {
    if (!palettes[variant.palette]) fail(`[팔레트] ${map.id}/${variant.id}: "${variant.palette}" 없음`);
    checkConditions(`${map.id}/${variant.id}`, variant.conditions);
  }
  for (const object of map.objects) {
    if (!inside(object, map)) fail(`[맵] ${map.id}/${object.id}: 맵 경계 밖`);
    checkConditions(`${map.id}/${object.id}`, object.conditions);
    if (object.eventId && object.travel) fail(`[이동] ${map.id}/${object.id}: eventId 와 travel 을 동시에 쓸 수 없음`);
    if (object.travel) {
      const target = locations[object.travel.to];
      if (!target) fail(`[이동] ${map.id}/${object.id}: 존재하지 않는 맵 "${object.travel.to}"`);
      else if (object.travel.spawn && !target.spawns?.[object.travel.spawn]) {
        fail(`[이동] ${map.id}/${object.id}: ${object.travel.to} 에 spawn "${object.travel.spawn}" 없음`);
      }
      checkConditions(`${map.id}/${object.id}/travel`, object.travel.conditions);
      for (const [index, block] of (object.travel.blocks ?? []).entries()) {
        checkConditions(`${map.id}/${object.id}/travel/blocks/${index}`, block.conditions);
        if (!block.lockedText.trim()) {
          fail(`[이동] ${map.id}/${object.id}: blocks/${index} lockedText 가 비어 있음`);
        }
      }
    }
  }
  for (const [spawnId, spawn] of Object.entries({ default: map.spawn, ...(map.spawns ?? {}) })) {
    const spawnRect = { x: spawn.x - 12, y: spawn.y - 12, w: 24, h: 24 };
    if (!inside(spawnRect, map)) fail(`[맵] ${map.id}/${spawnId}: 스폰 지점이 맵 경계 밖`);
    if ([...map.walls, ...map.objects.filter((object) => object.solid)].some((solid) => overlaps(spawnRect, solid))) {
      fail(`[맵] ${map.id}/${spawnId}: 스폰 지점이 벽 또는 가구와 겹침`);
    }
  }
  if (!map.objects.some((object) => object.eventId) && !Object.values(npcs).some((npc) => npc.location === map.id && npc.eventId)) {
    fail(`[맵] ${map.id}: 상호작용 대상이 하나도 없음`);
  }
}

const reachableMaps = new Set<string>();
const mapQueue = ['office'];
while (mapQueue.length > 0) {
  const id = mapQueue.shift()!;
  if (reachableMaps.has(id) || !locations[id]) continue;
  reachableMaps.add(id);
  for (const object of locations[id].objects) {
    if (object.travel && !reachableMaps.has(object.travel.to)) mapQueue.push(object.travel.to);
  }
}
for (const id of Object.keys(locations)) {
  if (!reachableMaps.has(id)) fail(`[이동] office 에서 도달할 수 없는 맵 "${id}"`);
}

for (const npc of Object.values(npcs)) {
  const map = locations[npc.location];
  if (!characters[npc.characterId]) fail(`[NPC] ${npc.id}: characterId "${npc.characterId}" 없음`);
  if (!map) {
    fail(`[NPC] ${npc.id}: location "${npc.location}" 없음`);
    continue;
  }
  if (!inside(npc, map)) fail(`[NPC] ${npc.id}: ${map.id} 경계 밖`);
  const solids: Rect[] = [...map.walls, ...map.objects.filter((object) => object.solid)];
  if (solids.some((solid) => overlaps(npc, solid))) fail(`[NPC] ${npc.id}: 벽 또는 가구 안에 배치됨`);
  checkConditions(npc.id, npc.conditions);
}

const imageRoot = join(process.cwd(), 'public/assets/images');
for (const character of Object.values(characters)) {
  if (character.sprite && !existsSync(join(imageRoot, 'characters', character.sprite))) {
    warn(`[에셋] ${character.id}: sprite "${character.sprite}" 없음 (색 폴백 사용)`);
  }
  if (character.portrait && !existsSync(join(imageRoot, 'portraits', character.portrait))) {
    warn(`[에셋] ${character.id}: portrait "${character.portrait}" 없음`);
  }
}

/* ---- 3. 진입점 / 도달 가능성 ---- */
const entryPoints = new Set<string>();
for (const map of Object.values(locations)) {
  for (const o of map.objects) {
    if (!o.eventId) continue;
    if (!events.has(o.eventId)) fail(`[맵] ${o.id} → 이벤트 "${o.eventId}" 없음`);
    else entryPoints.add(o.eventId);
  }
}
for (const npc of Object.values(npcs)) {
  if (!npc.eventId) continue;
  if (!events.has(npc.eventId)) fail(`[NPC] ${npc.id} → 이벤트 "${npc.eventId}" 없음`);
  else entryPoints.add(npc.eventId);
}
for (const entry of phone.onOpen ?? []) {
  if (!events.has(entry.eventId)) fail(`[휴대폰] onOpen "${entry.eventId}" 없음`);
  else entryPoints.add(entry.eventId);
}
for (const item of Object.values(items)) {
  if (!item.onUseEvent) continue;
  if (!events.has(item.onUseEvent)) fail(`[아이템] ${item.id} → "${item.onUseEvent}" 없음`);
  else entryPoints.add(item.onUseEvent);
}
entryPoints.add('prologue_start'); // 게임 시작점

const reachable = new Set<string>();
const queue = [...entryPoints];
while (queue.length > 0) {
  const id = queue.shift()!;
  if (reachable.has(id)) continue;
  reachable.add(id);
  const e = events.get(id);
  if (!e) continue;
  const targets = [
    e.next,
    e.fallback,
    ...(e.choices ?? []).map((c) => c.next),
    ...(e.branches ?? []).map((b) => b.next),
  ].filter((t): t is string => Boolean(t));
  queue.push(...targets);
}
for (const id of events.keys()) {
  if (!reachable.has(id)) fail(`[고아] 도달할 수 없는 이벤트: ${id} (${eventSource.get(id)})`);
}

/* ---- 4. 엔딩 ---- */
const endingEvents = [...events.values()].filter((e) => e.type === 'ending');
const declaredEndings = new Set(endings.endings.map((e) => e.id));
for (const e of endingEvents) {
  if (!e.ending) fail(`[엔딩] ${e.id}: ending 필드 없음`);
  else if (!declaredEndings.has(e.ending)) fail(`[엔딩] ${e.id}: endings.json 에 "${e.ending}" 정의 없음`);
}
for (const meta of endings.endings) {
  if (!endingEvents.some((e) => e.ending === meta.id)) fail(`[엔딩] "${meta.id}" 에 도달하는 이벤트가 없음`);
}

/* ---- 5. 작성 규칙 ---- */
for (const e of events.values()) {
  if ((e.type === 'dialogue' || e.type === 'ending') && !e.text) fail(`[규칙] ${e.id}: text 없음`);
  if (e.type === 'choice' && !e.choices?.length) fail(`[규칙] ${e.id}: 선택지 없음`);
}

/* ---- 결과 ---- */
console.log(`이벤트 ${events.size}개 / 파일 ${eventFiles.length}개 검사`);
warnings.forEach((message) => console.warn(`  경고 ${message}`));
if (problems.length > 0) {
  console.error(`\n검증 실패 — 문제 ${problems.length}건`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('검증 통과 — 깨진 참조 0');
