'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/common/Button';
import { hasSave } from '@/services/SaveService';

interface Props {
  onNewGame: () => void;
  onContinue: () => void;
}

/** 타이틀 화면 — 이어하기 / 새 게임 */
export default function Home({ onNewGame, onContinue }: Props) {
  const [saveExists, setSaveExists] = useState<boolean | null>(null);

  useEffect(() => {
    hasSave().then(setSaveExists);
  }, []);

  return (
    <div className="home">
      <div className="home-inner">
        <h1 className="home-title">퇴근하지 마세요</h1>
        <p className="home-sub">기록은 남는다. 누가 남겼는지는 확인해야 한다.</p>
        <div className="home-menu">
          <Button onClick={onContinue} disabled={saveExists !== true}>
            {saveExists === null ? '저장 확인 중…' : saveExists ? '이어하기' : '이어하기 (저장 없음)'}
          </Button>
          <Button onClick={onNewGame}>새 게임</Button>
        </div>
        <p className="home-help">WASD 이동 · E 조사 · Space 진행 · Tab 휴대폰 · I 인벤토리 · ESC 메뉴</p>
      </div>
    </div>
  );
}
