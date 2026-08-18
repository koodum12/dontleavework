'use client';

import type { EvidenceCategory } from '@/data/types';
import { useGameStore, type GameStateData } from '@/game/state/gameStore';
import { storage } from './StorageService';

const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

/** 저장 대상은 플레이어 진행 상태뿐이다 (gamd.md 16장) */
export async function save(): Promise<void> {
  await storage.init();
  const s = useGameStore.getState();

  storage.run('DELETE FROM player_state');
  storage.run(
    'INSERT INTO player_state (id, chapter, current_event, mental, ending, saved_at) VALUES (1, ?, ?, ?, ?, ?)',
    [s.currentChapter, s.currentEvent, s.mental, s.ending, new Date().toISOString()],
  );

  storage.run('DELETE FROM inventory');
  for (const id of s.inventory) storage.run('INSERT INTO inventory VALUES (?)', [id]);

  storage.run('DELETE FROM evidence');
  for (const e of s.evidence) storage.run('INSERT INTO evidence VALUES (?, ?)', [e.id, e.category]);

  storage.run('DELETE FROM character_clues');
  for (const [characterId, clues] of Object.entries(s.characterClues)) {
    for (const clue of clues) storage.run('INSERT INTO character_clues VALUES (?, ?)', [characterId, clue]);
  }

  storage.run('DELETE FROM flags');
  for (const [key, value] of Object.entries(s.flags)) {
    storage.run('INSERT INTO flags VALUES (?, ?)', [key, value ? 1 : 0]);
  }

  storage.run('DELETE FROM notes');
  for (const id of s.notes) storage.run('INSERT INTO notes VALUES (?)', [id]);

  storage.run('DELETE FROM messages');
  for (const id of s.messages) storage.run('INSERT INTO messages VALUES (?)', [id]);

  storage.run('DELETE FROM photos');
  for (const id of s.photos) storage.run('INSERT INTO photos VALUES (?)', [id]);

  storage.run('DELETE FROM completed_interactions');
  for (const id of s.completedInteractions) storage.run('INSERT INTO completed_interactions VALUES (?)', [id]);

  await storage.persist();
}

export async function hasSave(): Promise<boolean> {
  try {
    return await storage.hasSave();
  } catch (e) {
    console.warn('[SaveService] 저장 확인 실패:', e);
    return false;
  }
}

export async function load(): Promise<boolean> {
  await storage.init();
  const rows = storage.all('SELECT chapter, current_event, mental, ending FROM player_state WHERE id = 1');
  if (rows.length === 0) return false;

  const [chapter, currentEvent, mental, ending] = rows[0];
  const clues: Record<string, string[]> = {};
  for (const [characterId, clue] of storage.all('SELECT character_id, clue FROM character_clues')) {
    const id = String(characterId);
    (clues[id] ??= []).push(String(clue));
  }
  const flags: Record<string, boolean> = {};
  for (const [key, value] of storage.all('SELECT flag_key, value FROM flags')) {
    flags[String(key)] = Number(value) === 1;
  }

  const state: Partial<GameStateData> = {
    currentChapter: str(chapter),
    currentEvent: str(currentEvent),
    mental: Number(mental),
    ending: str(ending) as GameStateData['ending'],
    inventory: storage.all('SELECT item_id FROM inventory').map(([v]) => String(v)),
    evidence: storage.all('SELECT evidence_id, category FROM evidence').map(([id, category]) => ({
      id: String(id),
      category: String(category) as EvidenceCategory,
    })),
    characterClues: clues,
    flags,
    notes: storage.all('SELECT note_id FROM notes').map(([v]) => String(v)),
    messages: storage.all('SELECT message_id FROM messages').map(([v]) => String(v)),
    photos: storage.all('SELECT photo_id FROM photos').map(([v]) => String(v)),
    completedInteractions: storage.all('SELECT interactable_id FROM completed_interactions').map(([v]) => String(v)),
    unreadMessages: 0,
  };

  useGameStore.setState(state);
  return true;
}

export async function deleteSave(): Promise<void> {
  await storage.destroy();
}
