'use client';

import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

/**
 * sql.js(브라우저 SQLite) + IndexedDB 영속화.
 * index.db 는 플레이어 진행 상태만 담는다. 스토리 이벤트는 여전히 public/data/**.json 이다.
 */
const DB_NAME = 'toegeun-db';
const STORE = 'files';
const KEY = 'index.db';

let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSql(): Promise<SqlJsStatic> {
  // Next 번들러는 node_modules 의 wasm 을 서빙하지 않는다 → public/sql-wasm.wasm 을 직접 가리킨다
  sqlPromise ??= initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  return sqlPromise;
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(): Promise<Uint8Array | null> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as Uint8Array | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(bytes: Uint8Array): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(bytes, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(): Promise<void> {
  const db = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS player_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  chapter TEXT, current_event TEXT, mental INTEGER, ending TEXT, saved_at TEXT
);
CREATE TABLE IF NOT EXISTS inventory (item_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS evidence (evidence_id TEXT PRIMARY KEY, category TEXT);
CREATE TABLE IF NOT EXISTS character_clues (character_id TEXT, clue TEXT);
CREATE TABLE IF NOT EXISTS flags (flag_key TEXT PRIMARY KEY, value INTEGER);
CREATE TABLE IF NOT EXISTS notes (note_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS messages (message_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS photos (photo_id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS completed_interactions (interactable_id TEXT PRIMARY KEY);
-- 회차 기록: 새 게임을 시작해도 지우지 않는다
CREATE TABLE IF NOT EXISTS unlocked_endings (ending_id TEXT PRIMARY KEY, reached_at TEXT);
`;

export class StorageService {
  private db: Database | null = null;

  /** 초기화는 반드시 브라우저(useEffect) 안에서 호출한다 */
  async init(): Promise<void> {
    if (this.db) return;
    const SQL = await getSql();
    const saved = await idbGet().catch(() => null);
    this.db = saved ? new SQL.Database(saved) : new SQL.Database();
    this.db.run(SCHEMA);
  }

  private require(): Database {
    if (!this.db) throw new Error('StorageService.init() 를 먼저 호출해야 합니다.');
    return this.db;
  }

  run(sql: string, params: (string | number | null)[] = []) {
    this.require().run(sql, params);
  }

  all(sql: string): unknown[][] {
    const result = this.require().exec(sql);
    return result[0]?.values ?? [];
  }

  /** 메모리 DB 를 IndexedDB 에 굽는다 */
  async persist(): Promise<void> {
    await idbPut(this.require().export());
  }

  async hasSave(): Promise<boolean> {
    const bytes = await idbGet().catch(() => null);
    if (!bytes) return false;
    await this.init();
    return this.all('SELECT chapter FROM player_state WHERE id = 1').length > 0;
  }

  /** 진행 상태만 지운다 — 회차 기록(unlocked_endings)은 남긴다 */
  async destroy(): Promise<void> {
    await this.init();
    this.db?.run('DELETE FROM player_state; DELETE FROM inventory; DELETE FROM evidence; DELETE FROM character_clues; DELETE FROM flags; DELETE FROM notes; DELETE FROM messages; DELETE FROM photos; DELETE FROM completed_interactions;');
    await this.persist();
  }
}

export const storage = new StorageService();
