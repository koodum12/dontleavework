/**
 * 스토리 데이터 검증 — 앱을 띄우지 않고 public/data/** 를 직접 읽는다.
 * npm run validate / prebuild 에 걸려 있어 깨진 JSON 은 배포되지 않는다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  EventEffect, EvidenceFile, GameEvent, ItemFile, LocationFile, MentalConfig, NoteFile, PhoneFile,
} from '../src/data/types';
import { parseEventFile, validateReferences } from '../src/game/event/EventParser';

const DATA = join(process.cwd(), 'public/data');
const read = <T>(p: string): T => JSON.parse(readFileSync(join(DATA, p), 'utf8')) as T;

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

/* ---- 파일 로드 ---- */
const items = read<ItemFile>('items.json');
const evidence = read<EvidenceFile>('evidence.json');
const notes = read<NoteFile>('notes.json');
const phone = read<PhoneFile>('phone.json');
const mental = read<MentalConfig>('mental.json');
const locations = read<LocationFile>('locations.json');
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

for (const { owner, effect } of collectEffects()) {
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
if (problems.length > 0) {
  console.error(`\n검증 실패 — 문제 ${problems.length}건`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('검증 통과 — 깨진 참조 0');
