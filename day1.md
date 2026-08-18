# Day 1 — 환경 설정 · 폴더 구조 · UI 스켈레톤 · 플레이어 이동

> gamd.md 대응: Phase 1, Phase 2, 4장(플레이어 이동), 19장(파일 구조)

## 오늘의 목표

브라우저에서 사무실 공간을 WAS D로 걸어다닐 수 있고, 게임 UI가 껍데기로 전부 존재하는 상태.
**스토리는 한 줄도 넣지 않는다.**

---

## 1) Next.js 프로젝트 생성 (0.5h)

```bash
npx create-next-app@latest . \
  --typescript --app --src-dir --eslint \
  --no-tailwind --import-alias "@/*"

npm i three @react-three/fiber @react-three/drei @react-three/rapier zustand
npm i -D vitest @types/three
printf "node_modules\n.next\nout\ndb/*.db\n.DS_Store\n" > .gitignore
git init
```

- [ ] `npm run dev` → `localhost:3000` 기본 화면 확인
- [ ] `package.json` scripts에 `"test": "vitest"` 추가
- [ ] `vitest.config.ts` 에 `@/*` alias 등록 (`vite-tsconfig-paths` 플러그인이 가장 간단).
      테스트 대상은 GameState / ConditionManager 같은 **순수 로직**이라 Next 런타임은 필요 없다
- [ ] 첫 커밋: `chore: Next.js 프로젝트 초기 설정`

### next.config.ts — 정적 export 설정

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',          // 순수 클라이언트 게임 → 정적 빌드
  images: { unoptimized: true },
  reactStrictMode: false,    // R3F/rapier 이중 마운트로 물리가 튀는 것 방지
};

export default nextConfig;
```

> `reactStrictMode: false` 는 타협이다. StrictMode의 이중 마운트가 rapier 물리 바디와
> PointerLock을 중복 생성해 디버깅이 지옥이 된다. 게임 로직 테스트는 vitest로 따로 한다.

- [ ] `output: 'export'` 로 빌드 시 `out/` 생성 확인

## 2) 폴더 구조 생성 (0.5h)

gamd.md 19장 구조를 Next.js App Router에 맞춰 배치한다.

```bash
mkdir -p public/data/events public/assets/{images,sounds,fonts}
mkdir -p src/components/{common,dialogue,phone,inventory,evidence,game}
mkdir -p src/game/{player,interaction,event,state,ending}
mkdir -p src/data/{types,loader} src/services src/scenes/{Home,Office,Lobby} db
```

```text
src/
├── app/                 ← Next.js 진입점 (gamd.md의 App/main 역할)
│   ├── layout.tsx
│   ├── page.tsx         ← 'use client' + dynamic import로 GameRoot 로드
│   └── globals.css
├── components/          ← gamd.md 19장 그대로
├── game/                ← gamd.md 19장 그대로
├── data/  services/  scenes/
```

- [ ] 정적 데이터 빈 파일 생성: `characters.json` `items.json` `evidence.json` `locations.json`
- [ ] `public/data/events/prologue.json` — `{ "events": [] }` 로 시작

### 3D를 SSR에서 떼어내기 (이걸 안 하면 빌드가 죽는다)

```tsx
// src/app/page.tsx
'use client';
import dynamic from 'next/dynamic';

const GameRoot = dynamic(() => import('@/scenes/GameRoot'), {
  ssr: false,
  loading: () => <div>로딩 중…</div>,
});

export default function Page() {
  return <GameRoot />;
}
```

- [ ] `GameRoot` 아래의 모든 3D / 브라우저 API 코드는 서버에서 실행되지 않음을 확인
- [ ] `npm run build` 가 통과하는지 **오늘 반드시** 확인 (three.js의 `window` 참조 조기 검출)

## 3) 타입 정의 (1h) — 오늘의 핵심 설계 작업

`src/data/types/` 에 JSON 스키마를 TypeScript 타입으로 먼저 못박는다.
이걸 대충 하면 Day 2가 무너진다.

```ts
// src/data/types/Event.ts
export type EventType =
  | 'dialogue' | 'choice' | 'interaction' | 'mentalChange'
  | 'itemGet' | 'itemUse' | 'evidenceGet' | 'noteAdd'
  | 'flagSet' | 'condition' | 'branch' | 'ending';

export interface Choice {
  text: string;
  next: string;
  conditions?: Condition[];   // 조건 미충족 시 비활성/숨김
  effects?: EventEffect[];
}

export interface GameEvent {
  id: string;
  type: EventType;
  speaker?: string;
  text?: string;
  choices?: Choice[];
  effects?: EventEffect[];    // mental / item / evidence / note / flag
  next?: string;              // 선택지 없을 때 다음 이벤트
}
```

- [ ] `Event.ts` `Character.ts` `Evidence.ts` `Item.ts` `Note.ts`
- [ ] `Condition` 타입 (gamd.md 11장: `evidence_count` / `character_clue_count` / `flag`)
- [ ] `EventEffect` 타입 (정신력 증감, 아이템, 증거, 노트, 플래그)

## 4) 입력 시스템 (0.5h)

```text
W A S D → 이동
E       → 상호작용
Tab     → 휴대폰
I       → 인벤토리
ESC     → 메뉴
```

- [ ] `src/game/player/InputController.ts` — 키 → 액션 매핑 (키코드를 컴포넌트에 흩지 않는다)
- [ ] Tab 기본 동작 `preventDefault` 처리
- [ ] UI가 열려 있으면 이동 입력 차단하는 `inputMode` 개념
- [ ] `window` 접근은 전부 `useEffect` 안에서 (모듈 최상단 금지 — export 빌드가 죽는다)

## 5) Office 씬 + 플레이어 이동 (2.5h)

- [ ] `src/scenes/Office` — 바닥 + 벽 4면 + 책상 큐브 몇 개 (색만 다른 박스로 충분)
- [ ] `PlayerController` — 캡슐 콜라이더, 이동 속도 상수화
- [ ] `CameraController` — 1인칭, 마우스 룩 (`PointerLockControls`)
- [ ] 중력 / 충돌 (rapier `RigidBody`)
- [ ] 상호작용 거리 계산용 `interactRange = 2.0` 상수 정의
- [ ] ESC가 PointerLock 해제와 게임 메뉴 열기를 동시에 유발하지 않도록 정리

## 6) UI 스켈레톤 (2h)

**디자인 금지. 테두리 있는 흰 박스면 된다.** 각 컴포넌트는 props만 받고 상태를 모른다.

| 폴더 | 컴포넌트 |
|------|----------|
| common | `Button` `Modal` `Panel` |
| dialogue | `DialogBox` `ChoiceList` `SpeakerName` |
| phone | `Phone` `MessageList` `RecordNote` `VoiceMemo` |
| inventory | `Inventory` `Item` |
| evidence | `EvidenceList` `EvidenceDetail` |
| game | `MentalState` `InteractionPrompt` `GameMenu` |

- [ ] 모든 UI 컴포넌트 최상단에 `'use client'`
- [ ] 각 컴포넌트에 하드코딩 더미 데이터를 넣어 화면에 띄워본다
- [ ] Tab / I / ESC 로 Phone / Inventory / GameMenu 가 열리고 닫힌다
- [ ] 동시에 두 개가 열리지 않도록 `activeOverlay` 하나로 관리

## 7) 배포 파이프라인 미리 뚫기 (0.5h) — 오늘 하는 게 이득이다

마지막 날 배포에서 처음 터지면 손쓸 시간이 없다. **빈 게임 상태에서 미리 한 번 올린다.**

```bash
git add -A && git commit -m "feat: 플레이어 이동 + UI 스켈레톤"
gh repo create --private --source=. --push   # 또는 GitHub에서 수동 생성 후 push
```

- [ ] Vercel에 리포 연결 (Framework Preset: Next.js — 자동 감지)
- [ ] push → 자동 배포 → **배포 URL에서 실제로 WASD 이동이 되는지 확인**
- [ ] 이후 Day 2~4는 push할 때마다 프리뷰 URL이 생긴다

---

## 완료 기준 (실제로 실행해서 확인)

```bash
npm run dev     # localhost:3000
npm run build   # out/ 생성, 타입 에러 0
```

- [ ] 사무실을 WASD로 걸어다니고 마우스로 시점이 돌아간다
- [ ] 벽을 통과하지 못하고 바닥 아래로 떨어지지 않는다
- [ ] Tab → 휴대폰, I → 인벤토리, ESC → 메뉴가 열리고 닫힌다
- [ ] 오버레이가 열린 동안 플레이어가 움직이지 않는다
- [ ] `npm run build` 성공 (SSR/`window` 에러 0)
- [ ] **배포 URL에서도 동일하게 동작한다**

## 오늘 하지 말 것

- 대사, 스토리, 챕터 데이터 작성
- UI 색상 / 폰트 / 애니메이션
- 저장 기능
- API Route, 서버 컴포넌트, 서버 액션 — 이 게임엔 서버가 없다

## 리스크

| 리스크 | 대응 |
|--------|------|
| three.js가 SSR에서 깨진다 | `dynamic(..., { ssr: false })` 를 **처음부터** 적용. 나중에 붙이면 씬 전체를 다시 쪼개야 한다 |
| StrictMode 이중 마운트로 물리가 튄다 | `reactStrictMode: false` (위 config에 이미 반영) |
| 3D 물리에 하루를 다 쓴다 | 14시까지 이동이 안 되면 **2D 탑다운(캔버스 or DOM 격자)** 으로 즉시 전환. 이벤트 시스템이 본체지 3D가 본체가 아니다 |
| 타입 설계가 흔들린다 | Day 2 시작 전 `chapter1_coffee` 예시 JSON을 타입에 실제로 대입해서 검증 |
