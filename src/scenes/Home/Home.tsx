'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/common/Button';
import { hasSave, unlockedEndings } from '@/services/SaveService';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
  ready: boolean;
}

const ENDINGS = [
  { id: 'bad', number: '01', name: '기록이 없는 사람' },
  { id: 'normal', number: '02', name: '새로운 출근' },
  { id: 'true', number: '03', name: '퇴근합니다' },
  { id: 'hidden', number: '04', name: '퇴근하지 마세요' },
] as const;

/** 타이틀 화면 — 이어하기 / 새 게임 */
export default function Home({ onNewGame, onContinue, ready }: Props) {
  const [saveExists, setSaveExists] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    hasSave().then(setSaveExists);
    unlockedEndings().then(setUnlocked);
  }, []);

  return (
    <div className="home">
      <div className="home-inner">
        <h1 className="home-title">퇴근하지 마세요</h1>
        <p className="home-sub">기록은 남는다. 누가 남겼는지는 확인해야 한다.</p>
        <div className="home-menu">
          <Button onClick={onContinue} disabled={!ready || saveExists !== true}>
            {saveExists === null ? '저장 확인 중…' : saveExists ? '이어하기' : '이어하기 (저장 없음)'}
          </Button>
          <Button onClick={onNewGame} disabled={!ready}>
            {ready ? '새 게임' : '게임 준비 중…'}
          </Button>
        </div>
        <section className="home-ending-gallery" data-testid="home-archive" aria-label="엔딩 기록">
          <header>
            <h2>엔딩 기록</h2>
            <span>{unlocked.length} / {ENDINGS.length}</span>
          </header>
          <div className="home-ending-grid">
            {ENDINGS.map((ending) => {
              const found = unlocked.includes(ending.id);
              return (
                <div key={ending.id} className={found ? 'is-found' : 'is-locked'}>
                  <span>{ending.number}</span>
                  <strong>{found ? ending.name : '미확인'}</strong>
                </div>
              );
            })}
          </div>
        </section>
        <p className="home-help">WASD 이동 · E 조사 · Space 진행 · Tab 휴대폰 · I 인벤토리 · ESC 메뉴</p>
      </div>
    </div>
  );
}
