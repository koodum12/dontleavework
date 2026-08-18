'use client';

import type {
  CharacterFile, EndingFile, EvidenceFile, ItemFile, LocationFile, MentalConfig, NoteFile, PhoneFile,
} from '@/data/types';

export const DATA_BASE = '/data';

const cache = new Map<string, Promise<unknown>>();

/** public/data/** 정적 JSON 로더 (경로별 1회만 fetch). API Route 는 만들지 않는다. */
export function loadJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) return cached as Promise<T>;

  const promise = fetch(path, { cache: 'no-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`${path} (${res.status})`);
      return res.json() as Promise<T>;
    })
    .catch((e: unknown) => {
      cache.delete(path); // 실패는 캐싱하지 않는다 — 다음에 다시 시도할 수 있게
      throw e instanceof Error ? new Error(`JSON 로드 실패: ${e.message}`) : e;
    });

  cache.set(path, promise);
  return promise;
}

export const loadLocations = () => loadJson<LocationFile>(`${DATA_BASE}/locations.json`);
export const loadItems = () => loadJson<ItemFile>(`${DATA_BASE}/items.json`);
export const loadEvidence = () => loadJson<EvidenceFile>(`${DATA_BASE}/evidence.json`);
export const loadNotes = () => loadJson<NoteFile>(`${DATA_BASE}/notes.json`);
export const loadMental = () => loadJson<MentalConfig>(`${DATA_BASE}/mental.json`);
export const loadPhone = () => loadJson<PhoneFile>(`${DATA_BASE}/phone.json`);
export const loadCharacters = () => loadJson<CharacterFile>(`${DATA_BASE}/characters.json`);
export const loadEndings = () => loadJson<EndingFile>(`${DATA_BASE}/endings.json`);

/** 챕터별 이벤트 파일 목록 — 파일이 늘어나면 여기에 추가한다 */
export const EVENT_FILES = [
  'prologue.json', 'office.json',
  'chapter01.json', 'chapter02.json', 'chapter03.json', 'chapter04.json',
  'chapter05.json', 'chapter06.json', 'chapter07.json',
  'final.json', 'endings.json',
] as const;

/**
 * 이벤트 파일들을 읽어 원본 그대로 돌려준다.
 * 한 파일이 실패해도 나머지는 살린다 (게임은 죽지 않는다).
 */
export async function loadEventFiles(): Promise<{ source: string; raw: unknown }[]> {
  const results = await Promise.all(
    EVENT_FILES.map(async (file): Promise<{ source: string; raw: unknown } | null> => {
      try {
        const raw = await loadJson<unknown>(`${DATA_BASE}/events/${file}`);
        return { source: file, raw };
      } catch (e) {
        console.warn(`[JsonLoader] ${file} 로드 실패:`, e);
        return null;
      }
    }),
  );
  return results.filter((r): r is { source: string; raw: unknown } => r !== null);
}
