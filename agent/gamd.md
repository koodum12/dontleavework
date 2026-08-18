# 퇴근하지 마세요 — 개발 진행 계획 및 프로젝트 구조

## 1. 프로젝트 개요

- 제목: 퇴근하지 마세요
- 장르: 미스터리 / 심리 스릴러 / 추리
- 핵심 게임플레이:
  - WASD 이동
  - E 조사 / 상호작용
  - Tab 휴대폰
  - I 인벤토리
  - ESC 메뉴
  - 이벤트/대화 기반 스토리 진행
  - 정신력 시스템
  - 기록 노트
  - 증거 수집
  - 선택에 따른 분기
  - 진/히든/노멀/배드 엔딩

---

# 2. 개발 기본 원칙

### 2.1 스토리와 코드 분리

스토리를 TypeScript/JavaScript 코드에 직접 작성하지 않는다.

```text
JSON
  ↓
EventManager
  ↓
EventExecutor
  ↓
GameState
  ↓
UI
```

스토리, 대화, 선택지, 증거, 정신력 변화 등의 데이터는 JSON으로 관리한다.

### 2.2 UI와 게임 로직 분리

UI는 디자인보다 기능을 먼저 구현한다.

예:

```text
DialogBox
ChoiceButton
Phone
Inventory
EvidenceList
RecordNote
MentalState
```

초기에는 기능 확인을 위한 최소한의 UI만 구현하고, 기능 완성 후 디자인을 적용한다.

### 2.3 GameState 중심으로 상태 관리

게임 진행에 필요한 상태를 여러 컴포넌트에 흩어놓지 않는다.

```text
GameState
├── mental
├── inventory
├── evidence
├── characterClues
├── flags
├── notes
├── currentChapter
└── currentEvent
```

---

# 3. 개발 진행 순서

## Phase 1 — 환경 설정

- [ ] 프로젝트 생성
- [ ] 개발 프레임워크 및 패키지 설정
- [ ] 기본 실행 환경 확인
- [ ] Git / .gitignore 설정
- [ ] 기본 폴더 구조 생성
- [ ] 입력 시스템 설정
- [ ] 기본 씬 구성

### 완료 기준

프로젝트를 실행했을 때 기본 화면이 정상적으로 출력되고 개발을 시작할 수 있어야 한다.

---

## Phase 2 — UI 컴포넌트화

디자인은 적용하지 않고 기능 단위로 UI를 분리한다.

### 공통 UI

- [ ] Button
- [ ] Modal
- [ ] Panel

### 대화 UI

- [ ] DialogBox
- [ ] ChoiceList
- [ ] SpeakerName

### 휴대폰 UI

- [ ] Phone
- [ ] MessageList
- [ ] RecordNote
- [ ] VoiceMemo

### 인벤토리 UI

- [ ] Inventory
- [ ] Item

### 증거 UI

- [ ] EvidenceList
- [ ] EvidenceDetail

### 게임 UI

- [ ] MentalState
- [ ] InteractionPrompt
- [ ] GameMenu

### 완료 기준

각 UI가 독립적인 컴포넌트로 동작하고, 이후 디자인을 변경해도 게임 로직을 크게 수정하지 않아야 한다.

---

# 4. 플레이어 이동

## 기본 조작

```text
W → 앞으로
S → 뒤로
A → 왼쪽
D → 오른쪽
```

추가 조작:

```text
E   → 조사 / 상호작용
Tab → 휴대폰
I   → 인벤토리
ESC → 메뉴
```

## 구현 항목

- [ ] WASD 이동
- [ ] 카메라
- [ ] 마우스 카메라 제어
- [ ] 충돌
- [ ] 중력
- [ ] 이동 속도
- [ ] 상호작용 거리
- [ ] E 입력 처리

### 완료 기준

플레이어가 공간을 자유롭게 이동하고 오브젝트에 접근할 수 있어야 한다.

---

# 5. 상호작용 시스템

게임의 기본적인 탐색 루프를 구현한다.

```text
플레이어 이동
    ↓
오브젝트 접근
    ↓
상호작용 가능 여부 확인
    ↓
E 입력
    ↓
Interaction 발생
    ↓
EventManager 호출
```

## 구현

- [ ] Interactable 인터페이스/구조
- [ ] InteractionManager
- [ ] InteractionObject
- [ ] 상호작용 거리 검사
- [ ] 상호작용 안내 UI
- [ ] 1회성 상호작용
- [ ] 반복 상호작용

---

# 6. JSON 이벤트 시스템

스토리의 핵심 시스템.

## 기본 구조

```text
JSON
 ↓
JsonLoader
 ↓
EventManager
 ↓
EventParser
 ↓
EventExecutor
 ↓
GameState / UI
```

## 이벤트 타입

초기에는 다음 타입을 기준으로 설계한다.

```text
Dialogue
Choice
Interaction
MentalChange
ItemGet
ItemUse
EvidenceGet
NoteAdd
FlagSet
Condition
Branch
Ending
```

## 예시

```json
{
  "id": "chapter1_coffee",
  "type": "dialogue",
  "speaker": "사랑",
  "text": "누가 주문했다고…?",
  "choices": [
    {
      "text": "커피를 마신다",
      "next": "coffee_drink"
    },
    {
      "text": "커피를 보관한다",
      "next": "coffee_save"
    },
    {
      "text": "커피를 버린다",
      "next": "coffee_throw"
    }
  ]
}
```

---

# 7. GameState

모든 게임 진행 상태를 관리한다.

```text
GameState
├── mental
├── inventory
├── evidence
├── characterClues
├── flags
├── notes
├── currentChapter
└── currentEvent
```

## 관리 대상

### 정신력

기본 정신력:

```text
100
```

### 인벤토리

예:

```text
의문의 커피
따뜻한 차
비상 안정제
음성 메모
CCTV 파일
사진
```

### 증거

```text
MEMORY
인물 관련 증거
사건 관련 증거
```

### 인물 단서

```text
대리
팀장
옆자리 직원
경비원
동기
```

### Flag

예:

```text
checked_cctv
checked_memory
checked_network_log
recovered_deleted_note
recovered_voice_memo
confronted_person
```

### 기록

```text
fact
assumption
nextCheck
```

---

# 8. 정신력 시스템

## 기본

```text
maxMental = 100
currentMental = 100
```

## 정신력 변화

기획서 기준:

```text
이상한 문자 확인       -5
CCTV 확인             -10
자신의 사진 발견       -10
밤에 회사에 남기       -15
자신을 합성한 사진 발견 -20
정체불명의 목소리      -10
```

회복 아이템:

```text
의문의 커피    +10
따뜻한 차      +8
비상 안정제    +20
음성 메모      +15
```

## 정신력 구간

```text
80~100 → 안정
60~79  → 불안
40~59  → 집중 저하
20~39  → 손 떨림 / 글자 흐림
0~19   → 판단 어려움
```

정신력이 낮아질수록 실제 정보와 주인공이 느끼는 불안을 구분하는 연출을 추가한다.

단, 핵심 증거는 기록 노트에서 다시 확인할 수 있도록 한다.

---

# 9. 기록 노트 시스템

사랑이 발견한 정보를 다음 형태로 기록한다.

```text
사실
추측
다음 확인
```

## 데이터 예시

```json
{
  "fact": "07:48에 내 이름으로 로비 커피 주문이 등록됐다.",
  "assumption": "누군가 내 계정으로 주문하고 내 자리에 두었다.",
  "nextCheck": "주문과 전달을 같은 사람이 했는가?"
}
```

## 목적

플레이어가:

```text
확인한 사실
    ↓
자신의 추측
    ↓
다음 조사 대상
```

을 구분할 수 있도록 한다.

---

# 10. 증거 시스템

증거는 3가지 카테고리로 관리한다.

```text
MEMORY
인물 관련
사건 관련
```

## MEMORY 증거

예:

```text
07:48 커피 알림
22:28 자동 문자
MEMORY_01
삭제된 메모
02:13 백업
과거 음성 메모
```

## 인물 관련 단서

```text
대리
팀장
옆자리 직원
경비원
동기
```

## 사건 관련 증거

```text
CCTV
사내망 접속 기록
사진 / 합성 사진 출력 기록
야간 출입 정보
손상된 백업 파일
```

---

# 11. 조건 / 분기 시스템

플레이어의 행동을 Flag와 증거로 기록하고, 이후 이벤트의 조건에 사용한다.

```text
CCTV 조사
    ↓
MEMORY_01 조사
    ↓
사내망 기록 조사
    ↓
삭제된 메모 복구
    ↓
인물 단서 확보
    ↓
최종 선택
    ↓
엔딩
```

## 조건 예시

```json
{
  "id": "ending_true",
  "conditions": [
    {
      "type": "evidence_count",
      "category": "MEMORY",
      "min": 2
    },
    {
      "type": "character_clue_count",
      "min": 2
    },
    {
      "type": "flag",
      "key": "intrusion_evidence",
      "value": true
    }
  ]
}
```

---

# 12. 휴대폰 시스템

Tab 키로 접근한다.

```text
Phone
├── 문자
├── 기록 노트
├── 사진
├── 음성 메모
└── 삭제된 항목
```

휴대폰은 스토리 진행에 중요한 정보를 확인하는 핵심 UI로 사용한다.

---

# 13. 인벤토리 시스템

I 키로 접근한다.

```text
Inventory
├── 아이템
├── 증거
└── 특수 자료
```

아이템 사용 시 이벤트가 발생할 수 있도록 한다.

예:

```text
비상 안정제 사용
    ↓
정신력 +20
    ↓
특정 흐린 파일 정보 확인 가능
```

---

# 14. 스토리 데이터 작성

기능 시스템이 완성되면 기존 기획서를 JSON으로 옮긴다.

스토리 순서:

```text
프롤로그
 ↓
1장. 평범한 월요일
 ↓
2장. 이상한 문자
 ↓
3장. 회사에서도
 ↓
4장. 선택에는 책임이 따른다
 ↓
5장. 나를 보고 있는 사람
 ↓
6장. 기록되지 않은 하루
 ↓
7장. 삭제된 기록
 ↓
최종장. 퇴근하지 마세요
 ↓
엔딩
```

처음부터 전체 스토리를 구현하지 않고 먼저 다음 정도의 작은 세로 슬라이스를 완성한다.

```text
프롤로그
 ↓
1장 커피 이벤트
 ↓
CCTV 조사
 ↓
2장 문자
```

이 구간에서:

```text
이동
→ 상호작용
→ 이벤트
→ 대화
→ 선택
→ 정신력
→ 증거
→ 기록
→ 분기
```

가 모두 정상적으로 동작하는지 확인한다.

---

# 15. 엔딩 시스템

엔딩은 EndingManager에서 관리한다.

## BAD ENDING

조건:

```text
의심되는 사람을 단둘이 추궁
또는
증거를 정리하지 않고 혼자 행동
```

## NORMAL ENDING

조건:

```text
MEMORY 삭제
회사를 떠남
```

## TRUE ENDING

필요 조건:

```text
MEMORY 증거 2개 이상
서로 다른 인물 단서 2개 이상
직접적인 침입 / 파일 열람 / 출력 등의 기록 1개 이상
특정 인물을 확정하지 않음
공개된 장소에서 경찰 신고
```

## HIDDEN ENDING

필요 조건:

```text
TRUE ENDING 조건
+
CCTV 확인
+
MEMORY_01 조사
+
02:13 기록 발견
+
사내망 접속 기록
+
삭제 기록 확인
+
삭제된 메모 / 과거 음성 메모 복구
+
여러 인물 단서 비교
+
특정 인물을 단둘이 추궁하지 않음
+
Evidence_PreMemory 복구
```

---

# 16. 저장 시스템

스토리 데이터와 플레이어 저장 데이터를 분리한다.

## 정적 데이터

```text
public/data/
```

여기에 게임의 고정 데이터를 저장한다.

```text
events/
characters.json
items.json
evidence.json
locations.json
```

## 플레이어 진행 데이터

배포 시 `index.db`를 사용한다.

```text
index.db
```

저장 대상:

```text
player_state
├── chapter
├── current_event
├── mental
└── ending

inventory
└── item_id

evidence
└── evidence_id

flags
└── flag_key / value

notes
└── note_id
```

### 중요한 원칙

```text
event.json
→ 게임의 스토리 / 이벤트 정의

index.db
→ 플레이어의 진행 상태
```

스토리 이벤트 자체를 매번 DB에 저장하기보다, 이벤트 데이터는 JSON에 두고 DB에는 플레이어의 진행 상황만 저장한다.

---

# 17. 디자인 / 연출

모든 기능이 완성된 후 디자인을 적용한다.

## UI

- [ ] 전체 UI 디자인
- [ ] 폰트
- [ ] 색상
- [ ] 버튼
- [ ] 대화창
- [ ] 휴대폰 UI
- [ ] 인벤토리
- [ ] 기록 노트
- [ ] 증거 화면

## 연출

- [ ] 화면 전환
- [ ] 카메라 연출
- [ ] 정신력에 따른 화면 효과
- [ ] 글자 흔들림
- [ ] 글자 왜곡
- [ ] 공포 연출

## 사운드

- [ ] BGM
- [ ] 효과음
- [ ] 발걸음
- [ ] 키보드/마우스
- [ ] 휴대폰 알림
- [ ] 문 여닫는 소리
- [ ] 긴장 효과음

---

# 18. 최종 개발 순서

```text
01. 환경 설정
        ↓
02. 폴더 구조
        ↓
03. UI 컴포넌트화
        ↓
04. WASD + 카메라
        ↓
05. E 상호작용
        ↓
06. EventManager
        ↓
07. JSON 이벤트 시스템
        ↓
08. GameState
        ↓
09. 정신력 시스템
        ↓
10. 인벤토리
        ↓
11. 증거 시스템
        ↓
12. 기록 노트
        ↓
13. 조건 / 분기 시스템
        ↓
14. 휴대폰
        ↓
15. 프롤로그 ~ 1장 세로 슬라이스
        ↓
16. 전체 스토리 JSON화
        ↓
17. 엔딩 분기
        ↓
18. 저장 / 불러오기
        ↓
19. index.db 연동
        ↓
20. UI 디자인
        ↓
21. 사운드 / 연출
        ↓
22. 전체 플레이 테스트
        ↓
23. 버그 수정
        ↓
24. 배포
```

---

# 19. 권장 파일 구조

```text
퇴근하지마세요/
│
├── public/
│   ├── assets/
│   │   ├── images/
│   │   ├── sounds/
│   │   └── fonts/
│   │
│   └── data/
│       ├── events/
│       │   ├── prologue.json
│       │   ├── chapter01.json
│       │   ├── chapter02.json
│       │   ├── chapter03.json
│       │   ├── chapter04.json
│       │   ├── chapter05.json
│       │   ├── chapter06.json
│       │   ├── chapter07.json
│       │   ├── final.json
│       │   └── endings.json
│       │
│       ├── characters.json
│       ├── items.json
│       ├── evidence.json
│       └── locations.json
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   └── Panel/
│   │   │
│   │   ├── dialogue/
│   │   │   ├── DialogBox/
│   │   │   ├── ChoiceList/
│   │   │   └── SpeakerName/
│   │   │
│   │   ├── phone/
│   │   │   ├── Phone/
│   │   │   ├── MessageList/
│   │   │   ├── RecordNote/
│   │   │   └── VoiceMemo/
│   │   │
│   │   ├── inventory/
│   │   │   ├── Inventory/
│   │   │   └── Item/
│   │   │
│   │   ├── evidence/
│   │   │   ├── EvidenceList/
│   │   │   └── EvidenceDetail/
│   │   │
│   │   └── game/
│   │       ├── MentalState/
│   │       ├── InteractionPrompt/
│   │       └── GameMenu/
│   │
│   ├── game/
│   │   ├── player/
│   │   │   ├── PlayerController
│   │   │   ├── CameraController
│   │   │   └── InputController
│   │   │
│   │   ├── interaction/
│   │   │   ├── Interactable
│   │   │   ├── InteractionManager
│   │   │   └── InteractionObject
│   │   │
│   │   ├── event/
│   │   │   ├── EventManager
│   │   │   ├── EventParser
│   │   │   ├── EventExecutor
│   │   │   └── ConditionManager
│   │   │
│   │   ├── state/
│   │   │   ├── GameState
│   │   │   ├── MentalState
│   │   │   ├── InventoryState
│   │   │   ├── EvidenceState
│   │   │   └── FlagState
│   │   │
│   │   └── ending/
│   │       ├── EndingManager
│   │       └── EndingCondition
│   │
│   ├── data/
│   │   ├── types/
│   │   │   ├── Event.ts
│   │   │   ├── Character.ts
│   │   │   ├── Evidence.ts
│   │   │   ├── Item.ts
│   │   │   └── Note.ts
│   │   │
│   │   └── loader/
│   │       └── JsonLoader
│   │
│   ├── services/
│   │   ├── SaveService
│   │   ├── AudioService
│   │   └── StorageService
│   │
│   ├── scenes/
│   │   ├── Home/
│   │   ├── Office/
│   │   └── Lobby/
│   │
│   ├── App
│   └── main
│
├── db/
│   └── index.db
│
├── package.json
└── README.md
```

---

# 20. 핵심 아키텍처

```text
                    ┌──────────────┐
                    │   JSON Data  │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ EventManager │
                    └──────┬───────┘
                           ↓
              ┌────────────┴────────────┐
              ↓                         ↓
       ┌─────────────┐           ┌─────────────┐
       │  GameState  │           │     UI      │
       └──────┬──────┘           └─────────────┘
              │
      ┌───────┼────────┬──────────┐
      ↓       ↓        ↓          ↓
    정신력   인벤토리   증거       기록
      │       │        │          │
      └───────┴────────┴──────────┘
                      ↓
              ┌──────────────┐
              │ Condition    │
              │   Manager    │
              └──────┬───────┘
                     ↓
                 엔딩 분기
```

## 가장 먼저 완성해야 하는 핵심

```text
PlayerController
        ↓
InteractionManager
        ↓
EventManager
        ↓
GameState
        ↓
ConditionManager
        ↓
EndingManager
```

이 핵심 흐름이 완성되면 커피, CCTV, MEMORY, 문자, 정신력, 증거, 인물 단서, 엔딩 등의 콘텐츠를 JSON 데이터로 확장할 수 있다.

---

# 21. 1차 개발 목표

첫 번째 마일스톤에서는 전체 게임을 만드는 것이 아니라 다음 기능을 하나의 플레이 가능한 흐름으로 완성한다.

```text
게임 실행
 ↓
회사 씬
 ↓
WASD 이동
 ↓
책상으로 이동
 ↓
E로 커피 조사
 ↓
대화 출력
 ↓
선택지 출력
 ↓
선택
 ↓
정신력 변경
 ↓
아이템 획득
 ↓
증거 획득
 ↓
기록 노트 추가
 ↓
다음 이벤트
```

이 흐름이 정상적으로 동작한 이후 나머지 스토리를 확장한다.
