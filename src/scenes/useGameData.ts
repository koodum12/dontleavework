'use client';

import { useEffect, useState } from 'react';
import {
  loadCharacters, loadEndings, loadEventFiles, loadObjectives, loadEvidence, loadItems, loadLocations,
  loadMental, loadNotes, loadNpcs, loadPalettes, loadPhone,
} from '@/data/loader/JsonLoader';
import type {
  CharacterFile, EndingFile, EvidenceFile, ItemFile, LocationFile, MentalConfig, NoteFile, NpcFile,
  PaletteFile, PhoneFile,
} from '@/data/types';
import type { ObjectiveFile } from '@/game/state/objectives';
import { useEventStore } from '@/game/event/EventManager';
import { useGameStore } from '@/game/state/gameStore';

export interface GameData {
  items: ItemFile;
  evidence: EvidenceFile;
  notes: NoteFile;
  phone: PhoneFile;
  characters: CharacterFile;
  locations: LocationFile;
  npcs: NpcFile;
  palettes: PaletteFile;
  mental: MentalConfig | null;
  endings: EndingFile | null;
  objectives: ObjectiveFile | null;
  ready: boolean;
}

const EMPTY: GameData = {
  items: {}, evidence: {}, notes: {}, characters: {},
  locations: {}, npcs: {}, palettes: {},
  phone: { messages: {}, photos: {}, memos: {} },
  mental: null, endings: null, objectives: null, ready: false,
};

/** 정적 데이터는 클라이언트에서 한 번만 읽는다. 실패해도 게임은 계속 뜬다. */
export function useGameData(): GameData {
  const [data, setData] = useState<GameData>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const warn = (name: string) => (e: unknown) => {
      console.warn(`[useGameData] ${name} 로드 실패:`, e);
      return null;
    };

    Promise.all([
      loadItems().catch(warn('items.json')),
      loadEvidence().catch(warn('evidence.json')),
      loadNotes().catch(warn('notes.json')),
      loadPhone().catch(warn('phone.json')),
      loadCharacters().catch(warn('characters.json')),
      loadLocations().catch(warn('locations.json')),
      loadNpcs().catch(warn('npcs.json')),
      loadPalettes().catch(warn('palettes.json')),
      loadMental().catch(warn('mental.json')),
      loadEndings().catch(warn('endings.json')),
      loadObjectives().catch(warn('objectives.json')),
      loadEventFiles(),
    ]).then(([
      items, evidence, notes, phone, characters, locations, npcs, palettes,
      mental, endings, objectives, eventFiles,
    ]) => {
      if (cancelled) return;
      useEventStore.getState().loadFromRaw(eventFiles);
      if (mental) useGameStore.getState().setMentalConfig(mental);
      setData({
        items: items ?? {},
        evidence: evidence ?? {},
        notes: notes ?? {},
        phone: phone ?? EMPTY.phone,
        characters: characters ?? {},
        locations: locations ?? {},
        npcs: npcs ?? {},
        palettes: palettes ?? {},
        mental,
        endings,
        objectives,
        ready: true,
      });
    });

    return () => { cancelled = true; };
  }, []);

  return data;
}
