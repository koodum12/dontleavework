# Day 5 — 컷씬 · 장소 이동 (JSON으로 편집한다)

> gamd.md 대응: 12~14장(무대 확장), 17장(연출), 19장(`src/scenes/`)
> 불변 원칙 1번의 확장: **스토리는 코드에 넣지 않는다 → 연출과 무대도 코드에 넣지 않는다.**

## 오늘의 목표

무대가 사무실 한 곳뿐이고, 프롤로그와 엔딩이 그냥 대화창이다.
장소와 컷씬을 추가하되, **둘 다 JSON만 고쳐서 수정할 수 있는 상태**로 만든다.

```text
목표 상태: 기획자가 TypeScript 를 한 줄도 열지 않고
          "관리실 맵을 추가하고, 문을 연결하고, 컷씬 한 장면을 끼워 넣는" 작업을 끝낼 수 있다
```

---

## 0) 계약 — JSON으로 되는 것과 안 되는 것 (0.2h)

이 경계를 먼저 못박는다. 흐려지면 Day 5는 실패한 것이다.

| 작업 | JSON만으로 | 코드 필요 |
|------|-----------|----------|
| 맵 추가 / 벽·오브젝트 배치 | ✅ `locations.json` | |
| 문 연결 · 도착 지점 · 문 잠금 조건 | ✅ `locations.json` | |
| 컷씬 추가 · 대사 · 프레임 순서 · 길이 | ✅ `events/*.json` | |
| 컷씬 화면 효과 선택 (fade/shake…) | ✅ 값 선택 | 새 효과 **종류**를 만들 때만 |
| 효과음 지정 | ✅ 값 선택 | 새 사운드 큐 추가 시 |
| 이벤트 파일 새로 추가 | ✅ `events/index.json` 에 한 줄 | (오늘 이걸 만든다) |
| 정신력 수치 · 엔딩 조건 · 안내 문구 | ✅ 각 JSON | |
| 새 **효과 타입**(`travel` 같은) · 새 조건 타입 | | ⚠️ 코드 |
| 새 UI 컴포넌트 | | ⚠️ 코드 |

**판단 기준: "이미 있는 부품을 조합하는 일"이면 JSON, "부품을 새로 만드는 일"이면 코드.**

---

## 1) 먼저 막힌 곳을 뚫는다 — 이벤트 파일 목록 (0.3h)

지금은 `src/data/loader/JsonLoader.ts` 에 파일 이름이 박혀 있다.
**JSON 파일을 새로 만들어도 게임이 읽지 않는다.** 오늘 작업의 전제이므로 먼저 고친다.

```ts
// 지금 — 파일을 추가하려면 코드를 고쳐야 한다
export const EVENT_FILES = ['prologue.json', 'office.json', 'chapter01.json', ...] as const;
```

`public/data/events/index.json` 을 만들고 로더가 이걸 읽게 바꾼다.

```json
{
  "files": [
    "prologue.json",
    "office.json",
    "chapter01.json", "chapter02.json", "chapter03.json", "chapter04.json",
    "chapter05.json", "chapter06.json", "chapter07.json",
    "final.json", "endings.json",
    "cutscenes.json"
  ]
}
```

- [ ] `loadEventFiles()` 가 `index.json` 을 먼저 읽고, 목록의 파일을 순회한다
- [ ] `index.json` 로드 실패 시 경고 후 빈 목록 — 게임은 뜨되 이벤트가 없다는 것이 즉시 보인다
- [ ] `scripts/validate-events.ts` 는 **디렉터리 전체를 스캔**하고 `index.json` 과 대조한다
      → 파일을 만들고 목록에 안 넣는 실수를 검증에서 잡는다

---

## 2) 장소 이동 — `locations.json` (3h)

### 스키마

```jsonc
{
  "office": {                      // 맵 id (파일의 키가 곧 id)
    "id": "office",
    "name": "사무실",              // HUD 에 표시되는 장소 이름
    "width": 1280, "height": 960,  // 맵 전체 크기 (px)
    "spawn": { "x": 160, "y": 480 },          // 기본 도착점
    "spawns": {                                // 문별 도착점
      "from_lobby":   { "x": 1120, "y": 496 },
      "from_corridor": { "x": 640, "y": 900 }
    },
    "walls": [ { "x": 0, "y": 0, "w": 1280, "h": 32 } ],
    "objects": [
      {
        "id": "obj_office_door",
        "label": "회사 현관",
        "x": 1152, "y": 448, "w": 64, "h": 96,
        "solid": false,                        // 문은 통과 가능하게 둔다
        "travel": {                            // ← 이 블록이 있으면 문이다
          "to": "lobby",                       // 갈 맵 id
          "spawn": "from_office",              // 도착 맵의 spawns 키
          "conditions": [                      // (선택) 없으면 항상 열림
            { "type": "flag", "key": "chapter1_done", "value": true }
          ],
          "lockedText": "아직 나갈 수 없다. 자리에서 확인할 것이 남았다."
        }
      }
    ]
  }
}
```

### 규칙

- `travel.spawn` 은 **도착 맵의** `spawns` 에 있어야 한다. 없으면 그 맵의 `spawn` 으로 떨어진다
- 문은 `solid: false` — 벽으로 막고 싶으면 문 옆에 벽 사각형을 따로 둔다
- 조건이 걸린 문은 프롬프트에 `lockedText` 를 띄운다 (Day 3 선택지 잠금과 같은 방식)
- 한 오브젝트에 `travel` 과 `eventId` 를 같이 쓰면 **이벤트가 먼저** 실행되고, 끝난 뒤 이동한다

### 구현 체크리스트

- [ ] `MapObject.travel` / `GameMap.name` / `GameMap.spawns` 타입 추가
- [ ] `gameStore` 에 `currentLocation` · `pendingSpawn` + `travelTo(to, spawn?)`
- [ ] `EventEffect` 에 `{ "type": "travel", "to": "home", "spawn": "front_door" }` 추가
      → 이벤트 끝에서 장소를 옮길 수 있어야 컷씬과 붙는다
- [ ] `src/scenes/Office/Office.tsx` → `src/scenes/MapScene.tsx` 로 일반화 (맵 id를 받는다)
- [ ] 맵 전환 시 rAF 루프 재시작 + `interactionTarget` 초기화 + 카메라 첫 프레임 클램프
- [ ] 맵 5개 작성: `office`(기존) `home` `lobby` `control_room` `corridor`

---

## 3) 컷씬 — `events/*.json` (3h)

컷씬은 **이벤트의 한 종류**다. 별도 파일 형식을 만들지 않는다 → 기존 `next` / `effects` / `branch` 가 그대로 쓰인다.

```jsonc
{
  "id": "prologue_cutscene",
  "type": "cutscene",
  "skippable": true,               // 기본 true. false 면 엔딩 등에서 끝까지 보게 한다
  "frames": [
    {
      "text": "검은 화면. 휴대폰 메모를 넘기는 소리.",
      "duration": 2200,            // ms. 없으면 Space 를 누를 때까지 대기
      "effect": "fadeIn",          // (선택)
      "sfx": "phone",              // (선택)
      "image": "prologue_note.png" // (선택) public/assets/images/ 기준
    },
    { "speaker": "과거의 사랑", "text": "혹시 내가 이걸 잊어버리면, 기록을 봐.", "duration": 3000 },
    { "speaker": "과거의 사랑", "text": "그래도 기록만 믿지는 마.", "duration": 3000, "sfx": "tension" }
  ],
  "effects": [                     // 컷씬 전체에 한 번 적용 (프레임 단위 아님)
    { "type": "flagSet", "key": "prologue_done", "value": true }
  ],
  "next": "chapter1_open"
}
```

**`effects` 를 프레임이 아니라 이벤트에 두는 이유**: 스킵했을 때 상태가 반만 적용되는 사고를 막는다.
스킵은 "연출을 건너뛰는 것"이지 "결과를 건너뛰는 것"이 아니다.

### 구현 체크리스트

- [ ] `EventType` 에 `cutscene` 추가, `EventParser` 는 `frames` 비어 있으면 경고 후 버린다
- [ ] `CutsceneLayer` — 프레임 순회, `duration` 있으면 타이머 / 없으면 Space 대기
- [ ] Space = 다음 프레임, `ESC` 또는 `건너뛰기` 버튼 = 컷씬 전체 스킵 → 바로 `next`
- [ ] 컷씬 중 이동·조사·휴대폰·인벤토리 차단 (오버레이 잠금과 별개 잠금)
- [ ] `useEffect` cleanup 에서 타이머 해제 (스킵·언마운트 누수 금지)
- [ ] 본 컷씬은 `seen_cutscenes` 에 기록 → 두 번째부터 건너뛰기 버튼을 기본 노출
- [ ] 정신력 왜곡 연출은 컷씬에 적용하지 않는다 (컷씬은 사실 전달 구간)

---

## 4) 값 치트시트 — JSON 작성자가 쓸 수 있는 값 (0.2h)

이 목록을 벗어난 값을 쓰면 `npm run validate` 가 잡는다. **코드를 열지 않아도 되도록 문서에 박아 둔다.**

```text
event.type       dialogue · choice · cutscene · branch · condition · ending
                 mentalChange · itemGet · itemUse · evidenceGet · noteAdd · flagSet · interaction

effects[].type   mentalChange { amount | delta }   itemGet { id }      itemRemove { id }
                 evidenceGet { id, category }      noteAdd { id }      flagSet { key, value }
                 characterClue { characterId, clue }
                 messageReceive { id }             photoGet { id }     chapterSet { chapter }
                 travel { to, spawn }              ← Day 5에서 추가

conditions[].type  flag { key, value }             evidence_count { category?, min }
                   character_clue_count { min }    has_item { itemId }
                   has_evidence { evidenceId }     mental_below { value }  mental_above { value }

category         MEMORY · character · case

frame.effect     fadeIn · fadeOut · shake · letterbox · flash
frame.sfx        step · keyboard · phone · door · tension · ending
mentalChange.delta  strange_message · check_cctv · found_own_photo
                    stay_at_night · found_composite_photo · unknown_voice
```

- [ ] 이 표를 `README.md` 의 "데이터 구조" 절에도 옮겨 둔다 (문서 두 곳이 갈라지지 않게 링크로 연결)

---

## 5) 편집 시나리오 — 이렇게 하면 된다 (따라 하기)

### ① 새 장소를 추가한다

1. `public/data/locations.json` 에 맵 하나를 추가한다 (`id` · `name` · `width/height` · `spawn` · `walls` · `objects`)
2. 기존 맵의 오브젝트 하나에 `travel: { "to": "새맵id", "spawn": "..." }` 를 붙인다
3. 새 맵에도 돌아오는 문을 만든다 (`travel.to` 를 원래 맵으로)
4. `npm run validate` → 스폰이 벽 안인지, 도달 불가 맵인지 확인
5. `npm run dev` 로 실제로 왕복해 본다

### ② 컷씬을 추가한다

1. `public/data/events/cutscenes.json` (없으면 만들고 `events/index.json` 에 한 줄 추가)
2. `type: "cutscene"` 이벤트를 쓰고 `frames` 를 채운다
3. 어디서 재생할지 연결한다 — 맵 오브젝트의 `eventId`, 또는 다른 이벤트의 `next`
4. `npm run validate` → 프레임 필수 필드·`sfx`·`image` 존재 확인

### ③ 컷씬 한 장면만 고친다

`frames` 배열에서 해당 원소의 `text` / `duration` 만 바꾼다. **다른 파일은 건드리지 않는다.**

### ④ 문을 조건부로 잠근다

`travel.conditions` 에 조건을 넣고 `lockedText` 를 쓴다. 조건 형식은 §4 치트시트 참고.

### ⑤ 새 챕터 파일을 만든다

`public/data/events/chapter08.json` 을 만들고 → `events/index.json` 의 `files` 에 이름을 추가한다. 끝.

---

## 6) 검증 — 잘못 쓰면 여기서 걸린다 (0.5h)

`scripts/validate-events.ts` 에 규칙을 추가한다. 진행 불가로 직결되는 것부터.

- [ ] `travel.to` 가 존재하는 맵인가
- [ ] `travel.spawn` 이 도착 맵의 `spawns` 에 있는가
- [ ] **스폰 좌표가 벽·solid 오브젝트 안에 있지 않은가** (끼면 영구 진행 불가, 눈으로 못 잡는다)
- [ ] 문 그래프를 BFS 해서 도달할 수 없는 맵이 있는가
- [ ] 컷씬 프레임에 `text` 나 `image` 중 하나는 있는가
- [ ] `frame.effect` / `frame.sfx` 가 허용 값인가
- [ ] `image` 파일이 `public/assets/images/` 에 실제로 있는가
- [ ] `events/` 디렉터리의 파일과 `events/index.json` 목록이 일치하는가

에러는 **파일과 id를 찍어서** 낸다. 편집자가 바로 찾을 수 있어야 한다.

```text
[이동] office/obj_office_door → 존재하지 않는 맵 "lobbby"
[스폰] home/from_office (240, 128) 이 벽 안에 있다
[컷씬] cutscenes.json prologue_cutscene frames[2]: text 도 image 도 없다
[목록] chapter08.json 이 events/index.json 에 없다 (게임이 읽지 않는다)
```

---

## 7) 저장 마이그레이션 (0.5h)

Day 4 세이브에는 장소 컬럼이 없다. **기존 세이브를 깨지 않는다.**

```sql
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER);
ALTER TABLE player_state ADD COLUMN location TEXT;   -- 없으면 'office'
ALTER TABLE player_state ADD COLUMN spawn TEXT;
CREATE TABLE IF NOT EXISTS seen_cutscenes (event_id TEXT PRIMARY KEY);
```

- [ ] `schema_version` 없으면 v1으로 간주하고 순서대로 올린다
- [ ] `location` 이 비면 `office` + 기본 spawn 으로 복원
- [ ] `unlocked_endings` 는 절대 건드리지 않는다 (회차 기록 유실 금지)
- [ ] 검증: Day 4 세이브로 이어하기 → 진행 → 다시 저장 → 장소까지 복원

---

## 8) 데이터 이관 (1.5h)

**대사를 새로 쓰지 않는다. 배치만 옮긴다.**

| 장면 | 지금 | Day 5 |
|------|------|-------|
| 프롤로그 | 대화창 4개 | `prologue_cutscene` |
| 2장 집 | 엘리베이터에서 대사 | `home` 맵으로 이동 후 진행 |
| 4장 로비 루트 | 대사 | `lobby` 맵 |
| 4장 사내망 · CCTV | 대사 | `control_room` 맵 |
| 6장 야간 복도 | 대사 | `corridor` 맵 + 컷씬 |
| 엔딩 4개 | 긴 대사 1개 | 엔딩별 컷씬 → 엔딩 화면 |

- [ ] `day_gate` 재편 — 엘리베이터는 **이동 수단**, 하루를 넘기는 건 집의 침대
- [ ] 맵마다 상호작용 오브젝트 최소 1개 (빈 방을 만들지 않는다)
- [ ] `objectives.json` 안내 문구를 새 동선에 맞게 수정 (안내의 본체는 여전히 노트의 `다음 확인`)

---

## 완료 기준 (실제로 실행해서 확인)

```bash
npm run validate   # 이동·컷씬·목록 규칙 포함, 문제 0
npm run test       # 전체 통과
npm run build      # 정적 export 성공
```

- [ ] **JSON만 고쳐서** 맵 하나와 컷씬 하나를 새로 추가할 수 있다 (직접 해 보고 확인)
- [ ] **JSON만 고쳐서** 컷씬 대사 한 줄과 문 잠금 조건을 바꿀 수 있다
- [ ] 맵 5개를 문으로 오가고, 들어온 문 앞에서 시작한다
- [ ] 잠긴 문은 `lockedText` 를 띄운다
- [ ] 프롤로그·엔딩이 컷씬으로 재생되고, 스킵해도 상태가 정확히 적용된다
- [ ] 컷씬 중 조작이 차단된다
- [ ] Day 4 세이브로 이어하기가 된다
- [ ] 4개 엔딩 전부 다시 도달했다
- [ ] 배포 URL에서도 동일하게 동작한다

## 오늘 하지 말 것

- 새 스토리 분기 추가 (배치만 바꾼다)
- 컷씬용 일러스트 제작 — 이미지 없으면 검은 화면 + 텍스트로 충분하다
- 스프라이트·캐릭터 애니메이션
- 맵 6개 이상
- **JSON 스키마에 특수 케이스 늘리기** — 값 하나를 추가할 때마다 치트시트(§4)와 검증(§6)을 같이 고친다.
  둘 중 하나라도 빠지면 "JSON으로 편집 가능"이라는 계약이 깨진다

## 리스크

| 리스크 | 대응 |
|--------|------|
| JSON에 새 필드가 생겼는데 문서·검증이 안 따라간다 | 필드 추가 = 치트시트(§4) + 검증(§6) + README 동시 수정. PR 체크리스트로 |
| 스폰이 벽 안이라 플레이어가 낀다 | 검증에서 스폰 충돌 검사 (§6). 좌표 테스트로는 안 잡히는 종류다 |
| 맵 전환에서 rAF 루프가 중복 실행된다 | `MapScene` 의 effect 의존성은 맵 id 하나, cleanup 에서 반드시 `cancelAnimationFrame` |
| 컷씬 스킵 시 상태가 반만 적용된다 | `effects` 는 프레임이 아니라 이벤트 단위 (§3) |
| 기존 세이브가 깨진다 | `schema_version` 마이그레이션, `unlocked_endings` 보존 (§7) |
| 파일을 만들고 `index.json` 에 안 넣어서 조용히 무시된다 | 디렉터리 스캔과 목록 대조를 검증에 넣는다 (§6) |

## 시간이 부족하면 자르는 순서

```text
1순위로 버림 → 컷씬 이미지 · letterbox/flash 부가 효과
2순위       → corridor(복도) 맵 — 6장은 사무실 야간으로 처리
3순위       → 엔딩 컷씬 (엔딩 화면은 이미 있으므로 대사창 유지)
4순위       → lobby 맵 — 4장 검증 루트는 대사로 유지
```

**절대 자르지 않는 것: `events/index.json`(파일 추가가 JSON만으로 되는 것), 스폰 충돌 검사,
문 왕복 정확성, 기존 세이브 호환.**
