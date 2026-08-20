# 퇴근하지 마세요

미스터리 / 심리 스릴러 추리 게임. 2D 탑다운 사무실을 돌아다니며 조사하고, 기록과 추측을 구분해
4개의 엔딩 중 하나에 도달한다.

```
Next.js 15 (App Router, 정적 export) · React 19 · TypeScript
Canvas 2D + requestAnimationFrame   — 씬 렌더 / 카메라 (게임 엔진 의존성 없음)
zustand                             — GameState 단일 스토어
sql.js + IndexedDB                  — index.db (브라우저 SQLite 저장)
vitest                              — 로직 단위 테스트
```

서버는 없다. 스토리는 `public/data/**.json` 에서 fetch 하고, 진행 상태는 브라우저에 저장된다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000

npm run validate   # 스토리 데이터 검증 (빌드 전에 자동 실행)
npm run test       # 단위 테스트
npm run build      # 정적 export → out/
npx serve out      # 빌드 결과를 그대로 확인
```

## 조작

| 키 | 동작 |
|----|------|
| `W` `A` `S` `D` | 이동 |
| `E` | 조사 / 상호작용 |
| `Space` `Enter` | 대사 진행 |
| `Tab` | 휴대폰 (문자 · 기록 노트 · 사진 · 음성 메모 · 삭제된 항목) |
| `I` | 인벤토리 (아이템 · 증거 · 특수 자료) |
| `ESC` | 메뉴 (저장 / 불러오기 / 타이틀) |

엘리베이터에서 하루가 넘어간다. 사람과 사물은 조사 순서에 따라 다른 내용을 준다.

## 데이터 구조

스토리는 코드에 들어가지 않는다. 대사 · 선택지 · 수치 · 조건은 전부 JSON이다.

```
public/data/
├── events/          # 이벤트 정의 (프롤로그 ~ 최종장 + 엔딩)
│   ├── prologue.json  office.json      # 사무실 게이트/분기
│   ├── chapter01~07.json               # 각 장
│   ├── final.json                      # 최종 선택
│   └── endings.json                    # 4개 엔딩 서술
├── endings.json     # 엔딩 조건 (평가 순서: HIDDEN → TRUE → NORMAL → BAD)
├── locations.json   # 7개 맵 · 문 연결 · 도착 스폰 · 조건부 오브젝트
├── npcs.json        # 인물 배치 · 위치 · 조건 · 대화 eventId
├── palettes.json    # 사무실/집/로비/카페/거리/관리실/복도 색상
├── characters.json  items.json  evidence.json  notes.json  phone.json
└── mental.json      # 정신력 구간과 사건별 변화량
```

이벤트 하나의 형태:

```json
{
  "id": "coffee_save",
  "type": "dialogue",
  "speaker": "사랑",
  "text": "일단… 그대로 둬야겠다.",
  "effects": [
    { "type": "itemGet", "id": "item_strange_coffee" },
    { "type": "evidenceGet", "id": "ev_0748_coffee", "category": "MEMORY" },
    { "type": "noteAdd", "id": "note_coffee_order" },
    { "type": "flagSet", "key": "kept_coffee", "value": true }
  ],
  "next": "chapter1_note"
}
```

`type: "branch"` 이벤트는 화면에 뜨지 않고 조건을 판정해 다음 이벤트로 넘긴다.
선택지에 `conditions` 를 달면 조건 미충족 시 사유와 함께 잠긴다.

## 아키텍처

```
JSON → JsonLoader → EventParser → EventManager → EventExecutor → GameState → UI
                                        ↑
InteractionManager ← PlayerController    └→ ConditionManager → EndingManager
```

- `src/game/event/` — 이벤트 파싱 / 실행 / 포인터 관리 / 조건 판정
- `src/game/state/` — zustand GameState (정신력 · 인벤토리 · 증거 · 인물 단서 · 플래그 · 노트)
- `src/game/render/` — Camera · Renderer · GameLoop (Canvas 2D)
- `src/game/interaction/` — 최근접 대상 1개 선택, `once` / 반복 처리
- `src/game/ending/` — 엔딩 판정 (ConditionManager 재사용)
- `src/services/` — StorageService(sql.js + IndexedDB) · SaveService

## 저장

`public/data/**.json` 은 읽기 전용 스토리 정의, `index.db`(IndexedDB) 는 플레이어 진행 상태만 담는다.
챕터 전환과 이벤트 종료 시 자동 저장되고, ESC 메뉴에서 수동 저장할 수 있다.

## 엔딩

| 엔딩 | 조건 |
|------|------|
| BAD — 기록이 없는 사람 | 증거를 정리하지 않고 혼자 추궁 |
| NORMAL — 새로운 출근 | MEMORY 삭제 후 회사를 떠남 |
| TRUE — 퇴근합니다 | MEMORY 증거 2 + 서로 다른 인물 단서 2 + 침입/열람 기록 1, 특정 인물 미확정 |
| HIDDEN — 퇴근하지 마세요 | TRUE 조건 + CCTV · MEMORY_01 · 02:13 · 사내망 기록 · 삭제 메모/음성 메모 복구 · 인물 단서 비교 |

인물 단서는 단서 개수가 아니라 **서로 다른 인물 수**로 센다.

## 캐릭터와 맵

NPC는 가구와 분리되어 `npcs.json`에 배치된다. 같은 인물의 조건별 위치를 여러 개 선언할 수 있고,
조건이 겹치면 파일에서 먼저 선언된 위치 하나만 사용한다. `locations.json`의 오브젝트와 맵 변형도
같은 조건식을 사용하므로 6장 야간 사무실은 맵을 복제하지 않고 팔레트와 배치만 바뀐다.

현재 장소는 저장 데이터에 포함된다. 사무실·로비·카페·거리·집·관리실·복도는 `travel` 오브젝트로
왕복하며, 이벤트의 `travel` 효과는 챕터 장면과 실제 배경을 함께 전환한다.

필수 조사가 남아 있을 때는 회사 내부 이동을 막지 않고 로비·카페의 외부 출구만 잠근다.
집에서는 하루 기록을 마친 뒤 현관 대신 침대에서 다음 장을 시작해야 한다. 잠긴 출구는
현재 장과 완료 플래그를 함께 검사해, 남은 행동을 구체적인 문장으로 알려 준다.

캐릭터 스프라이트는 4방향 2프레임 시트다. 이미지가 없거나 로드에 실패하면 `characters.json`의
인물 색으로 만든 실루엣이 대신 표시된다. 대화창은 `portraits/hd/`의 768px 투명 초상을 사용한다.
