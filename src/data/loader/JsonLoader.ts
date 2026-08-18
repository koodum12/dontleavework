'use client';

/** public/data/** 정적 JSON 로더. API Route 는 만들지 않는다. */
export async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`JSON 로드 실패: ${path} (${res.status})`);
  return (await res.json()) as T;
}

export const DATA_BASE = '/data';

export const loadLocations = <T>() => loadJson<T>(`${DATA_BASE}/locations.json`);
