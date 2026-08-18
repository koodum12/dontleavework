# Day 2 — 상호작용 · JSON 이벤트 시스템 · GameState

> gamd.md 대응: 5장(상호작용), 6장(JSON 이벤트), 7장(GameState), 21장(1차 개발 목표)

## 오늘의 목표

**게임의 심장을 만든다.**

```text
PlayerController → InteractionManager → EventManager → GameState → UI
```

하루가 끝나면 "책상의 커피에 E → 대화 → 선택지 → 상태 변화 → 다음 이벤트"가 JSON만으로 돌아간다.

---

## 1) 상호작용 시스템 (1.5h)

```text
플레이어 이동 → 오브젝트 접근 → 거리 검사 → E 입력 → Interaction → EventManager
```

- [ ] `Interactable` 인터페이스: `{ id, eventId, prompt, once }`
- [ ] `InteractionManager` — 매 프레임 가장 가까운 Interactable 1개만 선택 (여러 개 겹칠 때 애매함 제거)
- [ ] `InteractionObject` — 씬에 배치되는 실제 오브젝트 컴포넌트
- [ ] `InteractionPrompt` UI 연결 → "E - 조사하기" 표시
- [ ] 1회성(`once: true`) 상호작용은 완료 후 비활성
- [ ] 반복 상호작용은 재실행 가능

## 2) JsonLoader (0.5h)

```text
JSON → JsonLoader → EventManager → EventParser → EventExecutor → GameState / UI
```

- [ ] `public/data/**` 를 fetch 하고 캐싱 — 경로는 `/data/events/chapter01.json` (public이 루트)
- [ ] 로딩 실패 / 잘못된 id 참조 시 콘솔 경고 + 게임은 죽지 않기
- [ ] 앱 시작 시 events 전체를 `Map<string, GameEvent>` 로 평탄화
- [ ] **fetch는 클라이언트에서만** — `useEffect` 안에서 실행. 서버 컴포넌트에서 읽지 않는다
- [ ] JSON을 `import`로 번들에 넣지 않는다. 데이터를 코드에서 분리한 의미가 사라지고,
      Day 4의 검증 스크립트도 못 쓰게 된다

## 3) GameState (1.5h) — zustand 단일 스토어

```text
GameState
├── mental          (100)
├── inventory       (item id[])
├── evidence        (evidence id[] + category)
├── characterClues  (인물별 단서)
├── flags           (Record<string, boolean>)
├── notes           (fact / assumption / nextCheck)
├── currentChapter
└── currentEvent
```

- [ ] 상태 변경은 **액션 함수로만** (`addEvidence`, `changeMental`, `setFlag` …)
- [ ] 컴포넌트에서 직접 필드를 쓰지 못하게 셀렉터 훅 제공
- [ ] `resetGame()` — 새 게임 시작용
- [ ] 단위 테스트: 정신력 0/100 클램프, 중복 아이템 미획득
- [ ] 스토어 파일은 `'use client'`, 모듈 최상단에서 `window`/`localStorage` 접근 금지

## 4) EventManager / Parser / Executor (2.5h) — 오늘의 본체

**EventExecutor의 책임: 이벤트 하나를 받아 효과를 GameState에 적용하고 다음 이벤트 id를 반환.**

우선 구현할 타입 (나머지는 Day 3):

- [ ] `dialogue` — speaker + text 출력, 다음으로 진행
- [ ] `choice` — 선택지 렌더, 선택 시 `next`로 이동
- [ ] `mentalChange` — 정신력 증감
- [ ] `flagSet` — 플래그 설정
- [ ] `itemGet` / `evidenceGet` / `noteAdd` — 상태 배열에 추가

설계 규칙:

```text
EventManager  — 현재 이벤트 포인터 관리, start(eventId) / advance() / choose(index)
EventParser   — JSON → 타입 검증된 GameEvent (id 미존재 시 명시적 에러)
EventExecutor — effects 배열을 순회하며 GameState 액션 호출
```

- [ ] 이벤트 체인이 끝(`next` 없음)나면 플레이어 조작 복귀
- [ ] 이벤트 진행 중에는 이동 입력 차단

## 5) DialogBox 연결 (1h)

- [ ] `EventManager`의 현재 이벤트를 구독해 `DialogBox` / `ChoiceList` 렌더
- [ ] 클릭 또는 Space/Enter로 다음 대사
- [ ] 타이핑 효과는 **선택**이지만 스킵 가능해야 함 (Day 4 연출로 미뤄도 됨)

## 6) 첫 실제 JSON — 커피 이벤트 (1h)

`public/data/events/chapter01.json` 에 gamd.md 6장 예시를 확장해 작성.

```json
{
  "events": [
    {
      "id": "chapter1_coffee",
      "type": "dialogue",
      "speaker": "사랑",
      "text": "누가 주문했다고…?",
      "next": "chapter1_coffee_choice"
    },
    {
      "id": "chapter1_coffee_choice",
      "type": "choice",
      "choices": [
        { "text": "커피를 마신다", "next": "coffee_drink" },
        { "text": "커피를 보관한다", "next": "coffee_save" },
        { "text": "커피를 버린다", "next": "coffee_throw" }
      ]
    },
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
      ]
    }
  ]
}
```

- [ ] `items.json` / `evidence.json` 에 참조 id 실제 등록
- [ ] 세 선택지 모두 서로 다른 상태 결과를 갖도록 작성

---

## 완료 기준 (실제로 플레이해서 확인)

gamd.md 21장 "1차 개발 목표" 흐름을 끝까지 통과한다.

```text
게임 실행 → 회사 씬 → WASD 이동 → 책상 접근 → E로 커피 조사
→ 대화 출력 → 선택지 → 선택 → 정신력 변경 → 아이템 획득
→ 증거 획득 → 기록 노트 추가 → 다음 이벤트
```

- [ ] 위 13단계가 **코드 수정 없이 JSON 편집만으로** 내용이 바뀐다
- [ ] React DevTools 또는 디버그 패널에서 GameState 변화가 눈으로 보인다
- [ ] 이벤트 진행 중 플레이어가 움직이지 않는다
- [ ] `npm run test` — GameState 단위 테스트 통과
- [ ] `npm run build` 성공 후 배포 URL(Day 1에 뚫어둔 Vercel)에서도 커피 이벤트가 동작

## 반드시 확인할 함정

- 선택지를 두 번 클릭하면 이벤트가 두 번 진행되는가 (중복 입력 잠금)
- 같은 오브젝트를 다시 조사하면 아이템을 또 주는가 (`once` 처리)
- 존재하지 않는 `next` id를 넣었을 때 앱이 죽는가 (죽으면 안 됨, 경고 후 종료)

## 오늘 하지 말 것

- 휴대폰 / 인벤토리 내부 상세 기능 (Day 3)
- 엔딩, 저장 (Day 4)
- 디자인
