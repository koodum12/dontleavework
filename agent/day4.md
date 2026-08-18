# Day 4 — 전체 스토리 JSON · 엔딩 · 저장 · 디자인/연출 · QA · 배포

> gamd.md 대응: 14~17장, 18장 16~24단계

## 오늘의 목표

3~최종장 스토리를 데이터로 채우고, 4개 엔딩과 저장을 붙이고, 디자인·사운드를 입혀 배포 가능한 빌드를 만든다.

> 오늘은 **시스템을 새로 만들지 않는다.** 새 시스템이 필요하다고 느끼면 그건 Day 3이 안 끝난 것이다.

---

## 1) 전체 스토리 JSON화 (3h) — 오늘 가장 큰 덩어리

`퇴근하지_마세요_최최종본.txt` 기준으로 옮긴다.

```text
3장. 회사에서도          → chapter03.json
4장. 선택에는 책임이 따른다 → chapter04.json
5장. 나를 보고 있는 사람   → chapter05.json
6장. 기록되지 않은 하루    → chapter06.json
7장. 삭제된 기록          → chapter07.json
최종장. 퇴근하지 마세요    → final.json
```

작성 규칙:

- [ ] 챕터 첫 이벤트 id는 `chapterNN_start` 로 고정 (진입점 명확화)
- [ ] 챕터 마지막은 다음 챕터 `_start`로 연결
- [ ] 모든 대사에 speaker 명시
- [ ] 정신력 변화·증거·플래그는 gamd.md 8·10·11장 수치를 그대로 사용
- [ ] **검증 스크립트 작성 (필수)** `scripts/validate-events.ts`
  - 모든 `next` / `choices[].next` 가 실존하는 id인가
  - 참조된 item / evidence / note id가 정의돼 있는가
  - 도달 불가능한(고아) 이벤트가 있는가
  - Node에서 `public/data/**` 를 직접 읽는다 (앱을 띄우지 않는다)
  - `"validate": "tsx scripts/validate-events.ts"` → `npm run validate`, 실패 시 exit 1
  - `"prebuild": "npm run validate"` 로 걸어두면 깨진 JSON은 배포 자체가 막힌다

## 2) 엔딩 시스템 — EndingManager (1.5h)

`public/data/events/endings.json`

| 엔딩 | 조건 |
|------|------|
| **BAD** — 기록이 없는 사람 | 의심 인물을 단둘이 추궁 `OR` 증거 정리 없이 단독 행동 |
| **NORMAL** — 새로운 출근 | MEMORY 삭제 + 회사를 떠남 |
| **TRUE** — 퇴근합니다 | MEMORY 증거 ≥2 + 서로 다른 인물 단서 ≥2 + 침입/열람/출력 기록 ≥1 + 특정 인물 미확정 + 공개된 장소에서 신고 |
| **HIDDEN** — 퇴근하지 마세요 | TRUE 조건 + CCTV + MEMORY_01 + 02:13 기록 + 사내망 접속 기록 + 삭제 기록 + 삭제 메모/음성 메모 복구 + 인물 단서 비교 + 단둘이 추궁 안 함 + Evidence_PreMemory 복구 |

- [ ] `EndingCondition` 은 Day 3의 `ConditionManager` 를 **재사용**한다 (새 평가기 만들지 말 것)
- [ ] 평가 순서: `HIDDEN → TRUE → NORMAL → BAD` (상위 조건 우선)
- [ ] 최종 선택지에서 조건 미충족 옵션은 잠금 표시
- [ ] 단위 테스트: 4개 엔딩 각각을 유발하는 GameState 픽스처 4개 + 경계 케이스(MEMORY 1개일 때 TRUE 아님)
- [ ] 엔딩 화면 — 엔딩명, 엔딩 텍스트, 수집률(증거 n/N, 인물 단서 n/5)

## 3) 저장 / 불러오기 + index.db (1.5h)

```text
public/data/**.json → 스토리 정의 (읽기 전용)
db/index.db         → 플레이어 진행 상태만
```

스키마:

```sql
player_state(chapter, current_event, mental, ending)
inventory(item_id)
evidence(evidence_id)
flags(flag_key, value)
notes(note_id)
```

- [ ] `sql-wasm.wasm` 을 `public/` 에 복사하고 `locateFile: () => '/sql-wasm.wasm'` 지정
      (Next 번들러는 node_modules의 wasm을 자동으로 서빙하지 않는다 — 여기서 자주 막힌다)
- [ ] `StorageService` — sql.js 인스턴스 + IndexedDB에 바이너리 영속화, 초기화는 `useEffect` 안에서
- [ ] `SaveService` — `save()` / `load()` / `hasSave()` / `deleteSave()`
- [ ] 저장 시점: 챕터 전환 + 주요 이벤트 종료 + ESC 메뉴 수동 저장
- [ ] Home 씬에 `이어하기` / `새 게임`
- [ ] **스토리 이벤트 자체는 DB에 넣지 않는다** (gamd.md 16장 원칙)
- [ ] 검증: 저장 → 새로고침 → 이어하기 시 정신력/증거/플래그/현재 이벤트 완전 복원
- [ ] 배포 URL에서도 저장/복원이 되는지 확인 (IndexedDB는 도메인별로 분리된다 —
      localhost에서 됐다고 배포본에서 되는 게 아니다)

## 4) 디자인 적용 (1.5h)

기능이 끝났으니 이제 입힌다.

- [ ] 색상 토큰: 어두운 사무실 톤 + 정신력 낮을 때 채도 저하
- [ ] 폰트: `next/font/local` 또는 `next/font/google` 로 로드 (FOUT 없이 셀프 호스팅됨).
      본문 산세리프, 기록 노트는 고정폭(사실/기록 느낌)
- [ ] `DialogBox` `Phone` `Inventory` `RecordNote` `EvidenceList` 순으로 스타일
- [ ] `MentalState` — 구간별 색상 변화
- [ ] 반응형은 최소한만 (데스크톱 우선)

## 5) 연출 + 사운드 (1h)

- [ ] 화면 전환 페이드 (챕터 전환)
- [ ] 정신력 구간별 화면 효과: 20~39 손 떨림(미세 shake), 0~19 글자 흐림/왜곡
- [ ] **기록 노트 증거 원문에는 왜곡 미적용** (재확인 가능해야 한다)
- [ ] BGM 1~2트랙, 효과음: 발걸음 / 키보드 / 휴대폰 알림 / 문 / 긴장음
- [ ] `AudioService` — 볼륨 설정, 음소거, ESC 메뉴에 노출

## 6) 전체 플레이 테스트 + 버그 수정 (1.5h)

4회 플레이스루, 각각 목표 엔딩을 노린다.

- [ ] 1회차: BAD (대리를 단둘이 추궁)
- [ ] 2회차: NORMAL (MEMORY 삭제 후 퇴사)
- [ ] 3회차: TRUE (증거 수집 후 공개 신고)
- [ ] 4회차: HIDDEN (전체 조사 루트)
- [ ] 각 회차에서 세이브/로드 1회씩 끼워 넣어 복원 검증
- [ ] 발견 버그를 심각도별로 기록하고 크래시·진행 불가부터 수정

## 7) 배포 (0.5h)

Day 1에 파이프라인을 뚫어놨으므로 오늘은 **최종 확인만** 한다.

```bash
npm run validate && npm run test && npm run build
npx serve out      # 정적 빌드 결과를 로컬에서 직접 확인
```

- [ ] `out/` 빌드본에서 프롤로그~엔딩 1회 관통 (dev에서만 되는 버그 차단)
- [ ] `git push` → Vercel 프로덕션 배포
- [ ] 배포 URL에서 **다른 브라우저/시크릿 창으로** 1회 플레이 (캐시된 상태에 속지 않기)
- [ ] JSON 파일이 실제로 서빙되는지 확인: `curl -I <배포URL>/data/events/prologue.json` → 200
- [ ] README: 조작법, 실행법, 데이터 구조 설명

---

## 완료 기준

- [ ] 프롤로그부터 최종장까지 끊김 없이 플레이된다
- [ ] **4개 엔딩에 모두 실제로 도달했다** (스크린샷 또는 로그로 기록)
- [ ] 새로고침 후 이어하기로 정확히 복원된다
- [ ] `npm run validate` — 깨진 이벤트 참조 0
- [ ] `npm run test` — 전체 통과
- [ ] `npm run build` — 정적 export 성공
- [ ] **배포 URL에서 플레이 가능** (localhost 아님)

## 시간이 부족하면 자르는 순서

```text
1순위로 버림 → 사운드
2순위       → 연출 효과 (정신력 화면 왜곡)
3순위       → 디자인 폴리시 (기능 동작 UI는 유지)
4순위       → 5~7장 세부 분기 (본선 루트만 남기고 사이드 분기 축소)
```

**절대 자르지 않는 것: 4개 엔딩 도달 가능성, 저장/불러오기, 이벤트 검증 스크립트.**
