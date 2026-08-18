# Day 1 — 환경 설정 · 폴더 구조 · UI 스켈레톤 · 플레이어 이동 (2D 탑다운)

> gamd.md 대응: Phase 1, Phase 2, 4장(플레이어 이동), 19장(파일 구조)

## 오늘의 목표

브라우저에서 사무실을 **2D 탑다운 시점**으로 WASD 이동할 수 있고, 게임 UI가 껍데기로 전부 존재하는 상태.
**스토리는 한 줄도 넣지 않는다.**

```text
W → 위     (y 감소)
S → 아래   (y 증가)
A → 왼쪽   (x 감소)
D → 오른쪽 (x 증가)
```

시점 회전 없음. 마우스 조작 없음. 중력 없음.

---

## 0) 현재 상태 정리 — 3D 코드 걷어내기 (0.5h)

프로젝트가 이미 3D로 스캐폴딩되어 있다. **먼저 되돌린다.**

```bash
npm uninstall three @react-three/fiber @react-three/drei @react-three/rapier @types/three
rm src/game/player/CameraController.tsx
```

- [ ] `src/scenes/Office/Office.tsx` — three 메쉬 → 캔버스 드로잉으로 재작성
- [ ] `src/scenes/GameRoot.tsx` — `<Canvas>`(R3F) 제거, 일반 `<canvas>` + UI 오버레이로 재작성
- [ ] `src/game/player/PlayerController.tsx` — rapier RigidBody 제거, 좌표 + AABB로 재작성
- [ ] `next.config.ts` — `reactStrictMode: true` 로 되돌린다 (아래 참고)

**살려두는 것** (렌더러와 무관하게 그대로 쓴다):
`components/**` 전체 · `game/state/uiStore.ts` · `game/player/InputController.ts` · `data/types/**` · `public/data/**`

### next.config.ts

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',          // 순수 클라이언트 게임 → 정적 빌드
  images: { unoptimized: true },
  reactStrictMode: true,     // 2D는 물리 엔진이 없으므로 켜둔다
};

export default nextConfig;
```

> 3D 때는 rapier 이중 마운트 때문에 StrictMode를 껐지만, 2D 캔버스는 `useEffect` cleanup에서
> `cancelAnimationFrame`과 이벤트 리스너만 제대로 해제하면 이중 마운트가 문제되지 않는다.
> **오히려 StrictMode가 rAF 루프 누수를 잡아준다.** 켜고 가는 게 이득이다.

### `next/dynamic` + `ssr: false` 도 이제 불필요하다

`<canvas>`는 서버에서 빈 엘리먼트로 렌더되고 하이드레이션 불일치가 없다.
`'use client'` + `useEffect` 안에서만 `window`/`ctx`를 만지면 충분하다.
`src/app/page.tsx`의 dynamic import는 제거해도 된다.

## 1) 렌더링 방식 — Canvas 2D (결정 사항)

| 후보 | 판단 |
|------|------|
| **Canvas 2D + rAF 루프** | **채택.** 의존성 0, 충돌·카메라를 직접 통제, 300줄이면 끝난다 |
| DOM div 격자 | 오브젝트 수십 개부터 리렌더 비용이 생기고 카메라 스크롤이 번거롭다 |
| Phaser 등 게임엔진 | 이 게임의 이동 로직은 엔진을 쓸 만큼 복잡하지 않다. 번들만 커진다 |

```text
좌표계: 왼쪽 위 (0,0), x→오른쪽, y→아래   (화면 좌표와 동일하게 간다)
단위:   px
타일:   32px 기준 (맵 데이터를 격자로 쓰되 이동 자체는 자유 이동)
```

- [ ] 캔버스 논리 해상도 고정 (예: 960×640) 후 CSS로 확대 — 해상도별 분기 제거
- [ ] `devicePixelRatio` 적용해 선명하게 (`ctx.scale`)

## 2) 폴더 구조 생성 (0.5h)

```bash
mkdir -p public/data/events public/assets/{images,sounds,fonts}
mkdir -p src/components/{common,dialogue,phone,inventory,evidence,game}
mkdir -p src/game/{player,interaction,event,state,ending,render}
mkdir -p src/data/{types,loader} src/services src/scenes/{Home,Office,Lobby} db
```

```text
src/
├── app/                  ← Next.js 진입점
│   ├── layout.tsx
│   ├── page.tsx          ← 'use client', GameRoot 렌더
│   └── globals.css
├── game/
│   ├── render/           ← 2D 전환으로 새로 생기는 폴더
│   │   ├── Camera.ts     ← 플레이어 추적 오프셋 + 맵 경계 클램프
│   │   ├── Renderer.ts   ← 맵/오브젝트/플레이어 드로잉
│   │   └── GameLoop.ts   ← rAF 루프, delta time
│   ├── player/  interaction/  event/  state/  ending/
├── components/  data/  services/  scenes/
```

- [ ] 정적 데이터 파일: `characters.json` `items.json` `evidence.json` `locations.json`
- [ ] `public/data/events/prologue.json` — `{ "events": [] }` 로 시작

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

2D 전용으로 추가되는 타입:

```ts
// src/data/types/Location.ts
export interface Rect { x: number; y: number; w: number; h: number }

export interface MapObject extends Rect {
  id: string;
  label: string;        // "책상", "정수기"
  solid: boolean;       // 충돌 여부
  eventId?: string;     // E 상호작용 시 실행할 이벤트 (Day 2에서 연결)
  once?: boolean;
}

export interface GameMap {
  id: string;           // "office"
  width: number;        // 맵 전체 px
  height: number;
  spawn: { x: number; y: number };
  walls: Rect[];
  objects: MapObject[];
}
```

- [ ] `Event.ts` `Character.ts` `Evidence.ts` `Item.ts` `Note.ts` `Location.ts`
- [ ] `Condition` 타입 (gamd.md 11장: `evidence_count` / `character_clue_count` / `flag`)
- [ ] `EventEffect` 타입 (정신력 증감, 아이템, 증거, 노트, 플래그)

## 4) 입력 시스템 (0.5h)

```text
W → 위     A → 왼쪽
S → 아래   D → 오른쪽
E   → 상호작용
Tab → 휴대폰
I   → 인벤토리
ESC → 메뉴
```

- [ ] `InputController.ts` — 키 → 액션 매핑 (키코드를 컴포넌트에 흩지 않는다)
- [ ] **누르고 있는 키 집합(Set)을 유지**한다. `keydown` 1회성 처리로 이동을 구현하면
      OS 키 리피트 지연 때문에 첫 한 걸음 후 끊긴다
- [ ] 대각선 이동 시 속도 정규화 (안 하면 대각선이 √2배 빠르다)
- [ ] Tab 기본 동작 `preventDefault`
- [ ] 한글 입력 상태에서도 동작하도록 `e.code`(`KeyW`) 사용 — `e.key` 금지
- [ ] UI가 열려 있으면 이동 입력 차단하는 `inputMode`
- [ ] 창 포커스를 잃으면(`blur`) 눌린 키 집합 초기화 — 안 하면 무한 이동 버그

## 5) Office 씬 + 플레이어 이동 (2.5h)

### 맵 데이터

`public/data/locations.json` 에 사무실 배치를 **데이터로** 정의한다.
(하드코딩하면 Day 2에서 상호작용 오브젝트를 붙일 때 다시 뜯게 된다)

```json
{
  "office": {
    "id": "office",
    "width": 1280, "height": 960,
    "spawn": { "x": 160, "y": 480 },
    "walls": [
      { "x": 0, "y": 0, "w": 1280, "h": 32 },
      { "x": 0, "y": 928, "w": 1280, "h": 32 },
      { "x": 0, "y": 0, "w": 32, "h": 960 },
      { "x": 1248, "y": 0, "w": 32, "h": 960 }
    ],
    "objects": [
      { "id": "obj_desk_sarang", "label": "내 책상", "x": 320, "y": 400, "w": 96, "h": 64, "solid": true },
      { "id": "obj_coffee", "label": "의문의 커피", "x": 352, "y": 368, "w": 24, "h": 24, "solid": false }
    ]
  }
}
```

### 구현

- [ ] `PlayerController` — 좌표 `{x, y}` + 속도 상수 `SPEED = 140 (px/s)`, delta time 기반 이동
- [ ] `facing` 상태 저장 (`'up' | 'down' | 'left' | 'right'`) — Day 4 스프라이트에서 쓴다
- [ ] **AABB 충돌 — 축 분리 처리**
      `x 이동 → 충돌 검사 → 되돌림` 다음 `y 이동 → 충돌 검사 → 되돌림`.
      한 번에 처리하면 벽에 스치듯 붙을 때 이동이 완전히 멈춰버린다
- [ ] `Camera.ts` — 플레이어를 화면 중앙에 두되 맵 경계에서 클램프 (맵 밖 검은 여백 금지)
- [ ] `Renderer.ts` — 바닥 → 벽 → 오브젝트 → 플레이어 순서로 draw (색 사각형이면 충분)
- [ ] `GameLoop.ts` — `requestAnimationFrame`, delta time 상한 (탭 복귀 시 순간이동 방지)
- [ ] `useEffect` cleanup에서 `cancelAnimationFrame` + 리스너 해제
- [ ] 상호작용 거리 상수 `INTERACT_RANGE = 48` (px, 중심 간 거리 기준)
- [ ] 가장 가까운 오브젝트에 `InteractionPrompt` 표시 — "E - 조사하기" (실제 이벤트 연결은 Day 2)

> **중력은 구현하지 않는다.** gamd.md 4장의 "중력"은 3D 전제 항목이라 탑다운에서는 해당 없음.
> "바닥 아래로 떨어짐"이라는 실패 모드 자체가 사라진다.

## 6) UI 스켈레톤 (2h)

**디자인 금지. 테두리 있는 흰 박스면 된다.** 각 컴포넌트는 props만 받고 상태를 모른다.
캔버스 위에 **HTML 오버레이**로 얹는다 (UI를 캔버스에 그리지 않는다 — 접근성·수정 비용 모두 손해).

| 폴더 | 컴포넌트 |
|------|----------|
| common | `Button` `Modal` `Panel` |
| dialogue | `DialogBox` `ChoiceList` `SpeakerName` |
| phone | `Phone` `MessageList` `RecordNote` `VoiceMemo` |
| inventory | `Inventory` `Item` |
| evidence | `EvidenceList` `EvidenceDetail` |
| game | `MentalState` `InteractionPrompt` `GameMenu` |

- [ ] 모든 UI 컴포넌트 최상단에 `'use client'`
- [ ] 캔버스는 `position: relative` 컨테이너 안, UI는 `position: absolute` 오버레이
- [ ] 각 컴포넌트에 하드코딩 더미 데이터를 넣어 화면에 띄워본다
- [ ] Tab / I / ESC 로 Phone / Inventory / GameMenu 가 열리고 닫힌다
- [ ] 동시에 두 개가 열리지 않도록 `activeOverlay` 하나로 관리 (`uiStore.ts` 재사용)

## 7) 배포 파이프라인 확인 (0.5h)

리포는 이미 있다(`Initial commit from Create Next App`). 남은 건 연결과 확인.

```bash
npm run build          # out/ 생성 확인
git add -A && git commit -m "feat: 2D 탑다운 이동 + UI 스켈레톤"
gh repo create --private --source=. --push   # 아직 원격이 없다면
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

- [ ] W로 위, S로 아래, A/D로 좌우 이동한다
- [ ] 대각선 이동이 직선 이동보다 빠르지 않다
- [ ] 벽과 책상을 통과하지 못하고, 벽에 붙어서도 스치는 방향으로는 계속 움직인다
- [ ] 맵 끝으로 가도 카메라가 맵 밖 여백을 비추지 않는다
- [ ] 오브젝트에 다가가면 "E - 조사하기" 프롬프트가 뜨고 멀어지면 사라진다
- [ ] Tab → 휴대폰, I → 인벤토리, ESC → 메뉴가 열리고 닫힌다
- [ ] 오버레이가 열린 동안 플레이어가 움직이지 않는다
- [ ] 이동 중 다른 탭으로 갔다 돌아와도 순간이동하거나 계속 움직이지 않는다
- [ ] `npm run build` 성공, `three` 관련 의존성 0
- [ ] **배포 URL에서도 동일하게 동작한다**

## 오늘 하지 말 것

- 대사, 스토리, 챕터 데이터 작성
- 실제 이벤트 실행 (프롬프트 표시까지만 — 실행은 Day 2)
- 스프라이트, 애니메이션, 색상/폰트 디자인
- 저장 기능
- API Route, 서버 컴포넌트, 서버 액션 — 이 게임엔 서버가 없다

## 리스크

| 리스크 | 대응 |
|--------|------|
| 3D 코드 제거가 지저분해진다 | three를 쓰는 파일은 `GameRoot` / `Office` / `PlayerController` / `CameraController` 4개뿐(~350줄). 나머지는 그대로 산다. 부분 수정하지 말고 4개를 새로 쓰는 게 빠르다 |
| 벽에 붙으면 이동이 멈춘다 | AABB를 **축 분리**로 검사 (위 5번). 2D 이동 버그의 대부분이 여기서 나온다 |
| 키 리피트로 이동이 끊긴다 | `keydown` 이벤트가 아니라 **눌린 키 Set + rAF 루프**로 이동 |
| 타입 설계가 흔들린다 | Day 2 시작 전 `chapter1_coffee` 예시 JSON을 타입에 실제로 대입해서 검증 |
